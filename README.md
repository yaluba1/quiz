# Open Quiz Platform

An open-source, containerized, multiplayer quiz platform designed for schools, academies, and educational environments. Built as a self-hostable alternative to platforms like Kahoot, Blooket, and Gimkit, it maximizes pupil engagement through fast-paced, gamified competitions while maintaining strict student privacy and high visual customizability.

---

## Architecture Overview

The system is engineered as a cloud-native, microservice-based architecture deployed across a multi-node **Docker Swarm** cluster. It consists of four distinct containerized tiers:

```
                            PUBLIC INTERNET
                                   │
                                   ▼
             ┌───────────────────────────────────────────┐
             │       Traefik v3 Ingress Reverse Proxy    │
             │       Ports 80/443 (Let's Encrypt TLS)    │
             └─────────────────────┬─────────────────────┘
                                   │
              ENCRYPTED OVERLAY NETWORK (quiz_overlay)
        ┌──────────────────────────┼──────────────────────────┐
        ▼                          ▼                          ▼
┌──────────────┐          ┌───────────────────┐      ┌─────────────────┐
│ Pupil WebApp │          │ Professor WebApp  │      │ Backend API &   │
│ (Next.js)    │          │ (Next.js)         │      │ Game Engine     │
│ Mobile-First │          │ Desktop / Tablet  │      │ (Node / Fastify)│
└──────────────┘          └───────────────────┘      └────────┬────────┘
                                                              │
                                            ┌─────────────────┼─────────────────┐
                                            ▼                 ▼                 ▼
                                ┌──────────────────────┐ ┌───────────────┐ ┌─────────────────────┐
                                │     Redis 7.x        │ │ Garage S3 Tier│ │   PostgreSQL 16+    │
                                │  In-Memory Game State│ │ Media Storage │ │ Durable Persistence │
                                │ & Socket.io Pub/Sub  │ │ (Img/Aud/Vid) │ │ Quizzes, Users, Data│
                                └──────────────────────┘ └───────────────┘ └─────────────────────┘
```

### 1. Reverse Proxy & Gateway (Traefik v3)
- **Single Domain & Path-Based Routing**: Exposes only ports `80` (HTTP with automatic HTTPS redirect) and `443` (HTTPS) under a unified domain:
  - `/` (Base URL): Engaging Landing Page with direct PIN Game Join and link to Teacher Portal.
  - `/play`: Focused mobile gameplay client for active quiz sessions.
  - `/teacher`: Professor Dashboard, Quiz Studio, and Classroom Projector Host.
  - `/media`: Direct, secure public streaming for quiz images, audio tracks, and short video clips.
  - `/api` & `/socket.io`: High-throughput REST endpoints and bidirectional WebSocket streams.
- **Automated TLS**: Auto-provisions and renews Let's Encrypt certificates.
- **Dynamic Routing**: Discovers Swarm service replicas and health states dynamically without reload downtime.
- **Security Middlewares**: Enforces HTTP Strict Transport Security (HSTS), XSS protection, anti-clickjacking frame options, rate limiting, and gzip/brotli compression.

### 2. Frontend Applications (Split Architecture)
Divided into two specialized Next.js applications in `frontends/`:
- **Pupil & Landing Client (`frontends/pupil`)**:
  - **Landing Page (`/`)**: Welcomes visitors, explains the platform, provides immediate 6-digit PIN input for pupils, and links to the `/teacher` portal.
  - **Gameplay (`/play`)**: Mobile-first design optimized for smartphone touchscreens. Large color-coded touch targets minimize misclicks during high-stress speed rounds.
  - **Gamification**: Built with Framer Motion for screen shakes on wrong answers, particle/confetti explosions on correct answers, streak multipliers, sound effects, and celebratory animations.
  - **Privacy**: Zero student accounts or tracking; students join anonymously with a 6-digit game PIN and nickname.
- **Professor Dashboard (`frontends/professor` at `/teacher`)**:
  - **Quiz Library & Reusability**: Comprehensive catalog where teachers can maintain a library of quizzes, track play counts, duplicate templates, and reuse a quiz across multiple classes and school terms.
  - **Logical Classification**: Organize quizzes by academic level, subject, virtual folders/units, and multi-tag search filters.
  - **Session Naming & Classroom Launch**: Name specific quiz sessions upon activation (e.g. "Class 4B - Midterm") and track cohort performance over time.
  - **Projector Mode**: Host lobby and in-game presentation screen designed for classroom projectors with live response charts and animated top-ranking podium ceremonies.
  - **Granular Metrics & Analytics**: Permanent logging and visualization of student response times (ms), accuracy percentages, and question difficulty breakdown.
  - **Theme Studio**: Customizes quiz visual appearance (custom colors, fonts, presets, custom logo).

### 3. Backend (API & Real-Time Game Engine)
- **Runtime**: Node.js 20+ with Fastify for high-speed REST operations (`/api`).
- **Pluggable Authentication**: 100% self-hosted engine by default (Argon2id + JWT + password reset), abstracted behind an `IAuthService` interface so forked projects can swap in Hanko (passkeys/WebAuthn), Auth0, or Supabase Auth simply via environment variables.
- **Quiz Library & Classification API**: Full CRUD with search, tag filtering, level/subject/folder filters, and play count tracking.
- **WebSocket Engine**: Socket.io 4+ (`/socket.io`) handling live room state machines (Lobby -> Question Countdown -> Answer Collection -> Round Results -> Final Podium).
- **Redis Adapter**: Utilizes `@socket.io/redis-adapter` so backend replicas distributed across Swarm nodes can communicate seamlessly. Events published on one node are broadcast across all nodes.
- **Millisecond Scoring & Metrics Logging**: High-resolution timestamps determine speed-based bonus scoring and streak calculations, logged in PostgreSQL for comprehensive session analytics.

### 4. Data Layer (State & Persistence)
- **In-Memory Store (Redis)**: Holds ephemeral real-time game state (room participants, answer timestamps, live scores). Absorbs massive concurrent bursts when dozens of students answer within a 2-second window.
- **Durable Database (PostgreSQL)**: Stores user credentials, quiz definitions, question banks, themes, and game summary records flushed from Redis upon game completion.

### 5. Multimedia Object Storage (Garage S3 Tier)
- **Ultra-Lightweight S3-Compatible Object Store (Garage S3)**: Engineered in Rust, Garage operates with an ultra-minimal footprint (~4.5 MiB RAM idle, < 25 MiB under load), making it exceptionally well-suited for budget VPS infrastructure (e.g. 1 vCPU / 1GB RAM instances).
- **Direct Edge Streaming**: Browsers stream media directly through Traefik (`/media/*`), preserving Node.js backend CPU and memory.
- **Range Request Buffering**: Native HTTP 206 Partial Content support allows students and classroom screens to seek and buffer audio and video without latency.
- **S3 Standard Compliance**: The backend communicates using `@aws-sdk/client-s3`, allowing seamless swap with Cloudflare R2, AWS S3, or distributed storage clusters.

---

## Multi-Node Swarm & Security Hardening

- **Encrypted Overlay Network**: All internal services communicate exclusively over an encrypted Docker Swarm overlay network (`driver: overlay`). Database and Redis are never exposed to the host or internet.
- **Docker Secrets**: All sensitive credentials (`POSTGRES_USER`, `POSTGRES_PASSWORD`, `REDIS_PASSWORD`, `JWT_SECRET`) are managed using Docker Secrets mounted into `/run/secrets/`. No plaintext passwords exist in source control or environment variables.
- **Container Hardening**:
  - Non-root user execution in all custom application containers.
  - Read-only root filesystems where applicable, using ephemeral `tmpfs` mounts for temporary files.
  - Strict resource constraints (CPU and memory reservations and limits) prevent noisy-neighbor denial-of-service issues.
  - Least privilege node placement constraints (e.g., PostgreSQL pinned to a persistent storage node; Traefik pinned to a manager node).

---

## Multimedia Storage Architecture (Images, Audio, Video)

OpenQuiz provides native support for multimedia attachments in quiz questions, enabling interactive experiences such as European flag visual recognition, musical ear training (hymns, instruments), and scientific experiment video analysis.

### Media Formats & Size Constraints
| Media Type | Allowed MIME Types | Allowed Extensions | Max File Size | Target Playback Experience |
|:---|:---|:---|:---|:---|
| **`IMAGE`** | `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/svg+xml` | `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`, `.svg` | **5 MB** | High-resolution diagrams, flags, photos |
| **`AUDIO`** | `audio/mpeg`, `audio/wav`, `audio/ogg`, `audio/aac` | `.mp3`, `.wav`, `.ogg`, `.aac` | **20 MB** | Hymns, pronunciation, sound effects, ear training |
| **`VIDEO`** | `video/mp4`, `video/webm`, `video/ogg` | `.mp4`, `.webm`, `.ogv` | **50 MB** | Short clips, physics experiments, loops |

### Direct Edge Streaming Architecture
- **Bypassing the Application Server**: Uploaded media is served directly by Traefik from Garage S3 Web engine via `/media/*`. Student devices and classroom projectors stream audio/video directly from storage without loading the Fastify backend or Node.js event loop.
- **Single-Domain Path-Style Routing**: Rather than requiring a dedicated subdomain (e.g. `media.example.com`) or wildcard TLS certificates, OpenQuiz leverages Traefik v3 middlewares (`garage-strip` and `garage-host`) to rewrite incoming requests on `https://<domain>/media/<file>` into Garage's native S3 Web endpoint (port 3902) with `Host: media`.
- **Byte-Range Requests (`HTTP 206 Partial Content`)**: Garage natively handles HTTP `Range` headers, allowing video and audio players to buffer efficiently, start instantly, and seek freely without downloading the entire file first.
- **Portability & S3 SDK**: The backend interacts with storage purely through standard `@aws-sdk/client-s3` APIs using path-style addressing (`http://garage:3900/media/...`). The database stores canonical public URLs or keys, meaning zero application code or schema changes are required when changing storage backends.
- **Fallback Type Inference**: For questions migrated from external URLs or created without an explicit `media_type`, client applications automatically infer the media category from the file extension (`.mp3` -> audio, `.mp4` -> video), defaulting safely to `IMAGE`.

---

## Deployment Strategies: Approach A vs. Approach B

When deploying OpenQuiz to Docker Swarm, institutions can choose between single-node lightweight storage or a multi-node distributed storage cluster:

```
+-----------------------------------------------------------------------------------------+
|                                    STORAGE STRATEGIES                                    |
+------------------------------------+----------------------------------------------------+
|  APPROACH A: Single-Node Garage    |  APPROACH B: 3-Node Distributed Garage Cluster     |
|  (Default for 1-node or low-RAM)   |  (High Availability & 3-Node VPS Pooling)         |
|                                    |                                                    |
|   +--------------------------+     |   +------------+ +------------+ +------------+     |
|   |  Garage Single Replica   |     |   | VPS Node 1 | | VPS Node 2 | | VPS Node 3 |     |
|   |  (~4.5 MiB RAM idle)     |     |   |   Garage   | |   Garage   | |   Garage   |     |
|   +--------------------------+     |   +------------+ +------------+ +------------+     |
|                 |                  |         \              |              /            |
|         [ Dedicated Node ]         |          \             |             /             |
|                 |                  |           [ 3-Way Replication (CRDT / Raft) ]      |
|     (Local NVMe / SAN Block)       |                        |                           |
|                                    |          (Direct Local SSD on each VPS)            |
|  * 0 egress bandwidth cost         |  * 0 egress bandwidth cost                         |
|  * Ultra-low RAM (~4.5 MiB)        |  * Survives 1 VPS node failure with 0 downtime     |
|  * Auto-initialized at launch      |  * Aggregate storage pooled across all 3 nodes     |
+------------------------------------+----------------------------------------------------+
```

### Approach A: Single-Node Garage S3 (Default)
- **Design**: A single Garage container (`dxflrs/garage:v2.4.1`) running with `--single-node --default-bucket`, pinned via Docker Swarm placement constraints (`node.role == manager`).
- **Automated Initialization**: A lightweight companion service (`garage_init` running `alpine:3.20`) polls the Garage Admin API and automatically enables public website access (`websiteAccess: true`) on the `media` bucket.
- **Resource Footprint**: Consumes only **~4.5 MiB RAM idle** (under 25 MiB under load), saving over 150 MB compared to MinIO or SeaweedFS. On budget servers like Aruba Cloud 1 vCPU / 1GB RAM instances (at ~2.49 €/month), this preserves over 950 MB of RAM for PostgreSQL, Redis, and Next.js.
- **Recommended For**: Standalone VPS deployments, development environments, and small to medium schools.

### Approach B: 3-Node Distributed Garage Cluster (High Availability)
- **Design**: Garage running as a decentralized cluster across 3 nodes (e.g. 3x 1-vCPU / 1GB RAM Aruba Cloud VPS instances).
- **Cluster Architecture & Resilience**:
  - **Replication Factor**: `replication_factor = 3` (every piece of data is mirrored across all 3 nodes).
  - **Fault Tolerance**: The cluster survives any 1 node going completely offline with zero downtime and zero data loss.
  - **Direct Drive Pooling**: Garage directly aggregates local storage on `/var/lib/garage/data` across all 3 VPS instances. No complex network filesystems (NFS, GlusterFS) are needed.
  - **Gossip & Consensus RPC**: Nodes communicate peer-to-peer over internal port `3901` using Garage's native encrypted protocol.
- **Recommended For**: Production multi-node Swarm clusters seeking zero single point of failure (SPOF) on budget VPS hardware.

#### Step-by-Step 3-Node Cluster Deployment Guide

1. **Configure Swarm Overlay Network for Garage RPC**:
   Ensure Docker Swarm overlay network spans all 3 manager/worker nodes and allows internal communication on ports `3900` (S3 API), `3901` (RPC), `3902` (S3 Web), and `3903` (Admin API).

2. **Deploy Garage on all 3 Nodes**:
   In `docker-compose.yml`, change `garage` mode to `global` (or set `replicas: 3` with placement preferences across distinct hosts):
   ```yaml
   garage:
     image: dxflrs/garage:v2.4.1
     command: /garage server
     deploy:
       mode: global
     volumes:
       - ./garage/garage.toml:/etc/garage.toml:ro
       - garage_meta:/var/lib/garage/meta
       - garage_data:/var/lib/garage/data
   ```

3. **Get Node IDs**:
   Obtain the unique node ID from each running Garage container:
   ```bash
   docker exec <container_node_1> /garage node id
   docker exec <container_node_2> /garage node id
   docker exec <container_node_3> /garage node id
   ```

4. **Connect Nodes via RPC Gossip**:
   From Node 1, join Node 2 and Node 3:
   ```bash
   docker exec <container_node_1> /garage node join <NODE_2_ID>@<NODE_2_IP>:3901
   docker exec <container_node_1> /garage node join <NODE_3_ID>@<NODE_3_IP>:3901
   ```
   Check cluster network status:
   ```bash
   docker exec <container_node_1> /garage status
   ```

5. **Assign Layout & Apply 3-Way Replication**:
   Assign capacity and tags to each node (e.g., zone `dc1`, capacity `20G`):
   ```bash
   docker exec <container_node_1> /garage layout assign -z dc1 -c 20G <NODE_1_ID>
   docker exec <container_node_1> /garage layout assign -z dc1 -c 20G <NODE_2_ID>
   docker exec <container_node_1> /garage layout assign -z dc1 -c 20G <NODE_3_ID>
   
   # Apply the layout configuration
   docker exec <container_node_1> /garage layout apply --version 1
   ```

6. **Create Bucket & Enable Public Website Access**:
   ```bash
   # Create media bucket with global alias
   docker exec <container_node_1> /garage bucket create media
   docker exec <container_node_1> /garage bucket alias --global media media
   
   # Enable public web streaming
   docker exec <container_node_1> /garage bucket website --allow media
   ```

---

## Migration Guide: Moving from Single-Node to 3-Node Cluster (Zero Downtime)

Because OpenQuiz stores canonical object URLs (`https://<domain>/media/<file>`) and S3 paths rather than internal node identifiers, migrating from Single-Node (Approach A) to 3-Node Distributed Garage (Approach B) requires **zero database schema migrations and zero data updates in PostgreSQL**.

### Step 1: Add Nodes to the Cluster
Start the Garage daemon on Node 2 and Node 3 using the shared `garage_rpc_secret.txt`. Join them to Node 1 via `garage node join`.

### Step 2: Update Layout
Assign storage capacity on Node 2 and Node 3 in the cluster layout. Once applied with `garage layout apply`, Garage will automatically rebalance partitions and replicate existing objects to all 3 nodes in the background.

### Step 3: Verify Zero-Downtime Resilience
Test edge delivery through Traefik:
```bash
curl -k -I https://<domain>/media/questions/test-audio.mp3
```
Take one of the nodes down (`docker stop ...`) and confirm that media requests continue to be served with `HTTP 200 OK` and `HTTP 206 Partial Content` without interruption.

---

## Visual Theming, Dark/Light Mode & Classroom Experience

- **Default School Palette**: Pistachio Green (`#93C572`) and Pumpkin Orange (`#FF7518`) provide an energetic, high-contrast educational environment.
- **Light & Dark Mode**:
  - Full native support across the Landing Page, Pupil gameplay, and Professor Dashboard.
  - Defaults automatically to the user's browser/system preference (`prefers-color-scheme`).
  - Accessible theme toggle button (Sun/Moon icon) available in the header of all pages.
  - User preference persisted in `localStorage` / cookie (`theme=dark|light`).
- **Custom Quiz Themes & Logo Customization**:
  - **Dynamic Theme Logo (Professors)**: Teachers can upload an institution/school logo or provide an image URL in the Theme Studio (`/teacher/themes` or quiz editor). During live sessions, this logo is broadcast via WebSocket metadata and presented in the lobby, question screens, and podium on both the classroom projector and student devices.
  - **Static Brand Logo Replacement (Site Admins)**: Deployers can replace the default platform logos directly (`public/logo.svg` or `public/logo-light.svg` for light mode and `public/logo-dark.svg` for dark mode) or mount custom images in Docker Swarm (`./branding/logo.svg:/app/public/logo.svg:ro` and `./branding/logo-dark.svg:/app/public/logo-dark.svg:ro`).
  - **Logo Guidelines & Constraints**:
    - **Recommended Format**: **SVG** (Scalable Vector Graphics) for crisp rendering on high-density mobile screens and 4K classroom projectors. Transparent PNG / WebP are also supported.
    - **Dimensions & Ratio**: Recommended 4:1 horizontal banner (`400 x 100 px`) or 1:1 square badge (`512 x 512 px`).
    - **File Size**: Max static size < 500 KB; max uploaded file in Theme Studio < 2 MB.
    - **Theme Contrast**: Transparent backgrounds are recommended. Two dedicated versions (`logo-light.svg` for white/light surfaces and `logo-dark.svg` for dark `#0F172A` surfaces) ensure optimal contrast and readability across themes.
- **Dynamic Propagation**: The Pupil client dynamically applies the active quiz theme and custom logo received via the WebSocket room metadata during live rounds.

---

## Multilingual Support & Privacy Compliance

- **Internationalization (i18n)**:
  - Supported languages: Spanish, English, German, French, Italian, Portuguese, Catalan, and Japanese.
  - Architecture ready for RTL (Right-to-Left) languages (Arabic, Hebrew).
  - Language selector dropdown available across all pages (Landing, Pupil game, and Teacher dashboard).
  - Defaults to the user's browser language, with immediate language switcher options and preference persistence.
- **GDPR & EU Cookie Compliance**:
  - Strict data minimization: Pupils do not register accounts or submit personal data.
  - Interactive cookie consent banner for essential cookies and local preferences.

---

## Recommended Implementation Sequence

To construct the platform reliably with testable milestones, the following phase sequence is recommended:

1. **Phase 1: Database Foundation & Schema Migration (`database/`)**
   - Setup PostgreSQL models (Professors, Quizzes, Questions, Answers, Themes, GameSessions, Results).
   - Setup migration scripts and default seed data (Pistachio/Pumpkin theme presets).
   - Verify secrets loading and database connectivity.
2. **Phase 2: Backend API & Pluggable Authentication (`backend/`)**
   - Implement `IAuthService` with `SelfHostedAuthService` (Argon2id + JWT + reset tokens) and Hanko-ready interface.
   - Implement Quiz & Question CRUD REST endpoints with OpenAPI schemas.
   - Implement unit and integration tests for authentication and CRUD.
3. **Phase 3: Real-Time Game Engine & Redis State (`backend/`)**
   - Implement Socket.io server with Redis adapter and room state machine (Lobby, Countdown, Question, Result, Leaderboard, Podium).
   - Implement millisecond speed scoring and streak multipliers.
   - Test multi-client socket concurrency and session wrap-up persistence to PostgreSQL.
4. **Phase 4: Pupil Frontend & Landing Page (`frontends/pupil/`)**
   - Implement Base Landing Page (`/`) with Hero, feature showcase, and instant PIN join box.
   - Implement live game client (`/play`) with mobile-first thumb controls, Framer Motion animations (screen shake, confetti, streak badges), audio cues, dynamic theme injection, Light/Dark mode, and global language selector (8 languages + RTL).
5. **Phase 5: Professor Frontend (`frontends/professor/` at `/teacher`)**
   - Implement auth screens (login, register, forgot-password) and dashboard.
   - Implement Quiz Creator & Theme Studio (color pickers, font selector, preset manager).
   - Implement live classroom Projector Host screen (lobby PIN/QR code, countdown, real-time response distribution chart, podium celebration) and analytics export.
   - Integrate Light/Dark mode and global language selector.
6. **Phase 6: End-to-End Swarm Integration, Hardening & Testing**
   - End-to-end integration across all containers in Docker Swarm.
   - Verify Let's Encrypt TLS issuance, security headers, rate limiting, and cookie consent banners.

---

## Directory Structure

```
quiz/
├── README.md                  # Overall project architecture & deployment guide
├── docker-compose.yml         # Docker Swarm stack definition
├── .env.example               # Example domain and configuration variables
├── .gitignore                 # Excludes secrets, build outputs, and node_modules
├── secrets/                   # Docker secret templates (.txt.example)
│   ├── db_user.txt.example
│   ├── db_password.txt.example
│   ├── redis_password.txt.example
│   ├── jwt_secret.txt.example
│   ├── garage_rpc_secret.txt.example
│   ├── garage_admin_token.txt.example
│   ├── garage_s3_key_id.txt.example
│   └── garage_s3_secret_key.txt.example
├── garage/                    # Garage S3 storage configuration
│   ├── garage.toml            # Engine configuration (S3 API, S3 Web, RPC)
│   └── init-garage.sh         # Media bucket website access initialization script
├── traefik/                   # Traefik v3 proxy configuration
│   ├── traefik.yml            # Static configuration (ports, TLS, swarm mode)
│   ├── dynamic/               # Middlewares (security headers, rate limits)
│   └── README.md
├── backend/                   # Node.js + Fastify + Socket.io backend
│   ├── src/
│   ├── Dockerfile
│   └── README.md
├── frontends/                 # User interfaces
│   ├── pupil/                 # Mobile-first student app (Next.js)
│   │   ├── Dockerfile
│   │   └── README.md
│   ├── professor/             # Teacher dashboard & projector app (Next.js)
│   │   ├── Dockerfile
│   │   └── README.md
│   └── README.md
├── database/                  # PostgreSQL initialization & migrations
│   └── README.md
└── prompts/                   # Detailed architectural prompts for each tier
    ├── initial.md             # Project requirements and specification
    ├── backend.md             # Prompt for Backend API & Engine
    ├── frontend-pupil.md      # Prompt for Pupil Mobile WebApp
    ├── frontend-professor.md  # Prompt for Professor Dashboard WebApp
    ├── database.md            # Prompt for Database & Persistence
    └── swarm-integration.md   # Prompt for Docker Swarm E2E Integration & TLS
```

---

## Deployment Guide (Docker Swarm)

### 1. Initialize Docker Swarm (if not already initialized)
```bash
docker swarm init
```

### 2. Configure Environment & Secrets
Create actual secret files from the provided templates:
```bash
# On Linux/macOS:
echo "postgres_admin" > secrets/db_user.txt
openssl rand -base64 24 > secrets/db_password.txt
openssl rand -base64 24 > secrets/redis_password.txt
openssl rand -base64 32 > secrets/jwt_secret.txt
openssl rand -hex 32 > secrets/garage_rpc_secret.txt
openssl rand -hex 32 > secrets/garage_admin_token.txt
echo "GKopenquizkey01" > secrets/garage_s3_key_id.txt
echo "default_dev_secret_key_2026!" > secrets/garage_s3_secret_key.txt

# Copy environment template
cp .env.example .env
# Edit .env with your domain names and Let's Encrypt email
```

### 3. Create Swarm Overlay Networks
Both compose files define external overlay networks to enforce strict tier isolation and allow Traefik routing without risking network tear-down during stack updates. Run this once on a Swarm manager node:
```bash
# Ingress network: connects Traefik, Cloudflare tunnel, and exposed web/API services
docker network create --driver overlay --attachable quiz_public

# Back-tier network: isolated and encrypted data-plane between Swarm nodes
docker network create --driver overlay --attachable --opt encrypted quiz_internal
```

### 4. Build Container Images
Build the application container images locally (or in your CI/CD pipeline):
```bash
docker compose build
```

### 5. Deploy the Stack to Swarm
Deploy the stack using your chosen compose file:

**Standard Swarm deployment:**
```bash
docker stack deploy -c docker-compose.yml quiz
```

**Raspberry Pi Cluster + Cloudflare Zero Trust deployment:**
```bash
docker stack deploy -c docker-compose-rpi-CfZeroTrust.yml quiz
```

### 6. Verify Running Services
```bash
docker stack services quiz
docker service ls
```

### 7. Scaling Services
Scale backend or frontend services dynamically across nodes:
```bash
docker service scale quiz_backend=4
docker service scale quiz_frontend_pupil=3
```
Traefik automatically registers new replicas and balances traffic. Redis synchronizes WebSocket game events across all backend replicas.

### 7. Multi-Node Swarm Deployment (Without Public Registries)

When deploying to a multi-node Swarm cluster (e.g. Raspberry Pi cluster) **without** pushing images to public registries like Docker Hub or GitHub Container Registry (GHCR), keep in mind three critical Swarm mechanics:

#### A. Internal Image Distribution via Local Swarm Registry
In a multi-node Swarm, worker nodes cannot pull images that only exist on the manager's local Docker daemon. Attempting to deploy `quiz-backend:latest` without a registry prefix will cause worker nodes to query public Docker Hub and fail with `pull access denied`.

To share locally built images across nodes securely and privately:
1. **Launch a Swarm-wide local registry service**:
   ```bash
   docker service create --name registry --publish published=5000,target=5000 registry:2
   ```
   > **Note**: Because this service uses the Swarm routing mesh, port 5000 is accessible on `127.0.0.1:5000` from **all** nodes in the cluster. Docker treats `127.0.0.1` as loopback, so no `--insecure-registry` configuration or custom TLS certificates are needed on your nodes.

2. **Build, tag, and push images into the local registry**:
   ```bash
   # Build ARM64/local images
   docker compose build

   # Tag for local registry
   docker tag quiz-backend:latest 127.0.0.1:5000/quiz-backend:latest
   docker tag quiz-frontend-professor:latest 127.0.0.1:5000/quiz-frontend-professor:latest
   docker tag quiz-frontend-pupil:latest 127.0.0.1:5000/quiz-frontend-pupil:latest

   # Push to local registry
   docker push 127.0.0.1:5000/quiz-backend:latest
   docker push 127.0.0.1:5000/quiz-frontend-professor:latest
   docker push 127.0.0.1:5000/quiz-frontend-pupil:latest
   ```

#### B. Environment Variables & `.env` in `docker stack deploy`
Unlike `docker compose up`, `docker stack deploy` **does not automatically load `.env` files**. Any variable not exported in your current shell (e.g. `CLOUDFLARE_TUNNEL_TOKEN`) will default to empty, causing services like `cloudflared` to exit with error code 255.

Always export `.env` before deploying:
```bash
set -a; source .env; set +a
docker stack deploy -c docker-compose-rpi-CfZeroTrust.yml quiz
```

#### C. Host Bind Mounts vs. Placement Constraints
In a multi-node cluster, relative host bind mounts (such as `./traefik/traefik.yml` or `./database/init`) refer to filesystem paths on the *target node* where the container runs, not where the stack command was executed.

If a service uses host bind mounts, ensure it is pinned to the node where the repository files exist:
- **Traefik**: Pinned with `node.role == manager` AND `node.labels.storage == true` (so it runs on the primary node holding `./traefik` and the Docker socket).
- **Postgres & Garage**: Pinned with `node.labels.storage == true`.

#### D. Automated Multi-Node Deployment Script
A helper script is provided at [`scripts/deploy-rpi.sh`](file:///home/juan/repos/quiz/scripts/deploy-rpi.sh) that automates this entire workflow:
```bash
# Deploy with existing images
./scripts/deploy-rpi.sh

# Or rebuild images, push to registry, and deploy
./scripts/deploy-rpi.sh --build
```
This script automatically:
1. Validates and exports all `.env` variables and secret files.
2. Ensures the encrypted Swarm overlay networks exist.
3. Creates and waits for the local Swarm `registry:2` service if not running.
4. Builds, tags, and pushes `127.0.0.1:5000/*` images.
5. Deploys the stack with `docker stack deploy`.

---

### 8. Rebuilding and Updating Services in Swarm

#### A. Automatic Image Rollout (No Manual Node Cleanup Needed)
You **do not need to manually delete or clean up old images on worker nodes**. 
When you rebuild an image on `swarm-1` and push it to the local registry:
1. The local registry computes a new SHA256 digest for `:latest`.
2. When [`deploy-rpi.sh`](file:///home/juan/repos/quiz/scripts/deploy-rpi.sh) runs `docker stack deploy`, Swarm automatically resolves the new image digest (`--resolve-image always`).
3. Swarm automatically triggers a **rolling update** across all nodes (`swarm-2`, `swarm-3`, `swarm-4`, `swarm-5`). Worker nodes download only the newly changed layers and replace old containers with zero downtime.

#### B. Full Cluster Rebuild & Redeploy
To rebuild all three custom images (`quiz-backend`, `quiz-frontend-professor`, `quiz-frontend-pupil`), push to the local registry, and trigger a cluster-wide rolling update in one step:
```bash
./scripts/deploy-rpi.sh --build
```

#### C. Updating a Single Service Rapidly
If you only changed code in one service (e.g. `quiz-frontend-pupil`), you can update just that service without touching the rest of the stack:
```bash
# 1. Rebuild only that service's image
docker compose build frontend_pupil

# 2. Tag and push to the local registry
docker tag quiz-frontend-pupil:latest 127.0.0.1:5000/quiz-frontend-pupil:latest
docker push 127.0.0.1:5000/quiz-frontend-pupil:latest

# 3. Tell Swarm to pull the new digest and perform a rolling update
docker service update --image 127.0.0.1:5000/quiz-frontend-pupil:latest quiz_frontend_pupil

# 4. Verify the updated replicas are running
docker service ps quiz_frontend_pupil
```
*(The same steps apply to `quiz-frontend-professor` / `quiz_frontend_professor` and `quiz-backend` / `quiz_backend`)*.

#### D. SD Card Storage Housekeeping
While old images will never interfere with running services, Docker caches older unreferenced layers on each node's SD card / drive. If you rebuild frequently and want to reclaim disk space across your nodes:
```bash
# On any manager or worker node:
docker image prune -f
```

---

## Testing & Coverage Standards (>= 80% Coverage)
- **Minimum 80% Code Coverage**: All services (Backend API, Game Engine, Pupil Frontend, and Professor Frontend) MUST achieve and maintain at least **80% test coverage** across statements, branches, functions, and lines.
- **Coverage Enforcement**: Configured in test runners (Vitest / Jest) with hard threshold enforcement.
- **Test Layers**:
  - Unit tests for algorithms, services, scoring formulas, validators, and theme compilers.
  - Integration tests for Fastify REST endpoints and database repositories.
  - Component and hook tests for React components, state machines, and Socket.io clients.

---

## Documentation Standards
- **TypeScript / Node.js**: Use TypeDoc / JSDoc conventions for all exported functions, event handlers, and data structures.
- **Python Utilities** (if added): Manage dependencies with `uv`, document with Python docstrings, and compile documentation using Sphinx (`sphinx-build -b html docs/source docs/build`).
