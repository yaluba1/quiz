# Traefik Ingress & Reverse Proxy

## Overview
Traefik acts as the single edge entry point and Layer 7 reverse proxy for the entire quiz platform running on Docker Swarm. It routes external HTTP/HTTPS traffic to the Pupil and Professor frontends and routes API / WebSocket traffic to the backend, while dynamically managing Let's Encrypt TLS/SSL certificates and enforcing security headers.

## Responsibilities
- **Ingress Entrypoint**: Only Traefik exposes public host ports (`80` and `443`).
- **Dynamic Swarm Discovery**: Reads Docker Swarm service labels without requiring manual proxy restarts or configuration reloads.
- **WebSocket Routing**: Transparently handles WebSocket connection upgrades (`Upgrade: websocket`) for real-time game traffic to the backend replicas.
- **TLS Automation**: Automatic provisioning and renewal of Let's Encrypt SSL certificates via HTTP-01 challenge.
- **Security Middlewares**: Enforces HTTP-to-HTTPS redirect, HSTS, XSS protection, anti-clickjacking frame options, rate limiting, and compression.

## Directory Structure
```
traefik/
├── traefik.yml              # Static configuration (entrypoints, swarm provider, cert resolvers)
├── dynamic/
│   └── middleware.yml       # Dynamic configuration (security headers, rate limiting, gzip)
└── README.md                # Component documentation
```

## Prerequisites & Permissions
- In Docker Swarm, Traefik must be scheduled on a Swarm **manager node** because it needs access to `/var/run/docker.sock` to inspect Swarm tasks and service labels.
- A persistent volume or shared storage is mounted at `/etc/traefik/acme/` to store `acme.json` with `600` file permissions.

## Health Check
Traefik provides a native ping health check endpoint on internal port `8080`:
```bash
wget --quiet --tries=1 --spider http://127.0.0.1:8080/ping || exit 1
```

