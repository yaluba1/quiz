#!/usr/bin/env bash
# ==============================================================================
# Open Quiz Platform - Raspberry Pi Multi-Node Swarm Deployment Script
# ==============================================================================
# Usage:
#   ./scripts/deploy-rpi.sh [--build]
#
# Flags:
#   --build, -b   Rebuild container images locally before pushing and deploying
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${ROOT_DIR}"

BUILD=false
for arg in "$@"; do
  case $arg in
    --build|-b)
      BUILD=true
      shift
      ;;
  esac
done

echo "=== [1/5] Checking environment & secrets ==="
if [ ! -f .env ]; then
  echo "Error: .env file not found in ${ROOT_DIR}. Please copy .env.example to .env and configure it."
  exit 1
fi

# Export all variables from .env for docker stack deploy interpolation
set -a
# shellcheck source=/dev/null
source .env
set +a

if [ -z "${CLOUDFLARE_TUNNEL_TOKEN:-}" ]; then
  echo "Warning: CLOUDFLARE_TUNNEL_TOKEN is not set in .env. Cloudflare tunnel service may fail."
fi

# Ensure mandatory secret files exist
SECRETS=(db_user db_password redis_password jwt_secret garage_rpc_secret garage_admin_token garage_s3_key_id garage_s3_secret_key)
for sec in "${SECRETS[@]}"; do
  if [ ! -f "secrets/${sec}.txt" ]; then
    echo "Error: secrets/${sec}.txt not found. Please create it before deploying."
    exit 1
  fi
done

echo "=== [2/5] Ensuring Overlay Networks exist ==="
if ! docker network inspect quiz_public >/dev/null 2>&1; then
  echo "Creating overlay network 'quiz_public'..."
  docker network create --driver overlay --attachable quiz_public
fi

if ! docker network inspect quiz_internal >/dev/null 2>&1; then
  echo "Creating overlay network 'quiz_internal'..."
  docker network create --driver overlay --attachable --opt encrypted quiz_internal
fi

echo "=== [3/5] Ensuring Local Registry service is running ==="
if ! docker service inspect registry >/dev/null 2>&1; then
  echo "Creating local registry service on port 5000..."
  docker service create --name registry --publish published=5000,target=5000 registry:2
  echo "Waiting for registry service to stabilize..."
  sleep 5
fi

# Check registry connectivity
REGISTRY_URL="http://127.0.0.1:5000/v2/"
if ! curl -s -f "${REGISTRY_URL}" >/dev/null 2>&1; then
  echo "Waiting for local registry at ${REGISTRY_URL}..."
  for i in {1..10}; do
    if curl -s -f "${REGISTRY_URL}" >/dev/null 2>&1; then
      break
    fi
    sleep 2
  done
fi

echo "=== [4/5] Preparing Images for Multi-Node Swarm ==="
IMAGES=(quiz-backend quiz-frontend-professor quiz-frontend-pupil)

if [ "$BUILD" = true ]; then
  echo "Building images locally with docker compose..."
  docker compose build
fi

# Ensure images exist locally
for img in "${IMAGES[@]}"; do
  if ! docker image inspect "${img}:latest" >/dev/null 2>&1; then
    echo "Image ${img}:latest not found locally. Building..."
    docker compose build
    break
  fi
done

# Tag and push to local registry
for img in "${IMAGES[@]}"; do
  echo "Tagging and pushing ${img}:latest -> 127.0.0.1:5000/${img}:latest..."
  docker tag "${img}:latest" "127.0.0.1:5000/${img}:latest"
  docker push "127.0.0.1:5000/${img}:latest"
done

echo "=== [5/5] Deploying Stack 'quiz' ==="
docker stack deploy -c docker-compose-rpi-CfZeroTrust.yml quiz

echo ""
echo "Deployment initiated successfully!"
echo "Check progress with:"
echo "  docker stack ps quiz"
echo "  docker stack services quiz"
