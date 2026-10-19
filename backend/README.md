# Backend API & Real-Time Game Engine

## Overview
The Backend is a high-performance Node.js service written in TypeScript. It integrates two primary subsystems:
1. **REST API**: Handles CRUD operations for quizzes, questions, themes, user accounts/authentication, and session history summaries.
2. **WebSocket Game Engine**: Powered by Socket.io with the Redis adapter to handle high-concurrency, real-time multiplayer quiz sessions across Docker Swarm nodes.

## Technology Stack
- **Runtime**: Node.js 20+ (LTS)
- **Framework**: Fastify (high-throughput, low-overhead HTTP framework)
- **Real-Time Engine**: Socket.io 4+ with `@socket.io/redis-adapter`
- **In-Memory Store**: Redis (for live room state, millisecond answer latency tracking, and inter-node event pub/sub)
- **Database Access / ORM**: Drizzle ORM or Prisma (PostgreSQL)
- **Authentication**: JWT / Argon2id password hashing or external Hanko integration
- **Documentation**: TypeDoc / Sphinx-js for API schemas and WebSocket event documentation

## Architecture & Real-Time Flow
```
        +-------------------------------------------------------------+
        |                 Docker Swarm Replicas                       |
        |                                                             |
Pupil --+--> [ Backend Replica 1 ] <--+           +--> [ PostgreSQL ] |
        |                              |-- Redis -|                   |
Prof  --+--> [ Backend Replica 2 ] <--+ (Pub/Sub) +--> [ Redis State ]|
        +-------------------------------------------------------------+
```
- **Redis Adapter**: When a pupil connects to Replica 1 and submits an answer, and the professor is connected to Replica 2, Redis instantly synchronizes room events across all nodes without race conditions.
- **Speed-Weighted Scoring**: Answers submitted with earlier millisecond timestamps receive higher score multipliers. Answer submissions are recorded directly in Redis to avoid database bottlenecks during the burst window.

## Directory Structure
```
backend/
├── src/
│   ├── api/                 # REST API routes, controllers, and schemas
│   │   ├── auth/            # Authentication & password reset
│   │   ├── quizzes/         # Quiz & question authoring CRUD
│   │   ├── sessions/        # Session analytics and history
│   │   └── themes/          # Custom color palettes & fonts
│   ├── engine/              # WebSocket game room state machine
│   │   ├── events/          # Socket.io event emitters and listeners
│   │   ├── handlers/        # Join, answer submission, next question, podium
│   │   ├── state/           # Redis-backed live room state manager
│   │   └── scoring/         # Millisecond speed & streak calculation logic
│   ├── config/              # Environment, Docker secrets reader, database clients
│   ├── db/                  # Database schema definitions and migrations
│   └── index.ts             # Application entry point
├── tests/                   # Unit, integration, and load tests
├── Dockerfile               # Multi-stage hardened container build
├── package.json
├── tsconfig.json
└── README.md                # Component documentation
```

## Running & Developing
```bash
# Install dependencies
npm install

# Run in development mode with hot reload
npm run dev

# Run unit and integration tests
npm test

# Run tests with coverage threshold check (>= 80%)
npm run test:coverage

# Build for production
npm run build
```

## OpenAPI / Swagger Documentation
Interactive Swagger UI is available out-of-the-box at:
- **`http://localhost:3000/api/docs`** (or configured `PORT`)
- JSON specification at `http://localhost:3000/api/docs/json`

Each route is typed with JSON schemas (`TypeBox`) including request body, query parameters, path parameters, and status responses.

## REST API Endpoints

### Health & Metrics
- `GET /healthz` - Liveness probe (HTTP 200 `{ status: "ok" }`)
- `GET /api/health/ready` - Readiness probe verifying PostgreSQL pool and Redis ping

### Authentication (`/api/auth`)
Pluggable via `AUTH_PROVIDER` (`self-hosted`, `hanko`, `supabase`):
- `POST /api/auth/register` - Register a professor account (`self-hosted`)
- `POST /api/auth/login` - Authenticate professor with email & password (`self-hosted`)
- `POST /api/auth/refresh` - Refresh access token using refresh token
- `GET /api/auth/me` - Retrieve authenticated professor profile
- `POST /api/auth/forgot-password` - Request a password reset token
- `POST /api/auth/reset-password` - Reset password with token

### Quizzes (`/api/quizzes`)
- `GET /api/quizzes` - List professor's quizzes (supports filters: `search`, `tag`, `level`, `subject`, `folder`, plus pagination and computed `playCount`)
- `POST /api/quizzes` - Create a new quiz (supports `level`, `subject`, `folder`, `tags`, `sessionDurationMinutes`)
- `GET /api/quizzes/:id` - Retrieve quiz details with questions, options, classification metadata, and `playCount`
- `PUT /api/quizzes/:id` - Update quiz metadata (title, description, cover image, visibility, duration, level, subject, folder, tags)
- `DELETE /api/quizzes/:id` - Delete a quiz
- `POST /api/quizzes/:id/duplicate` - Duplicate quiz with all questions and options (retaining level, subject, folder, tags)
- `POST /api/quizzes/:id/activate` - Activate quiz with 6-digit PIN, expiration window, and optional session naming (`title`, `classGroup`)

### Questions (`/api/questions`)
- `POST /api/quizzes/:quizId/questions` - Create question with answer options
- `PUT /api/questions/:id` - Update question content, time limits, multipliers, and options
- `DELETE /api/questions/:id` - Delete question
- `POST /api/quizzes/:quizId/questions/reorder` - Reorder questions sequentially

### Themes (`/api/themes`)
- `GET /api/themes` - List custom themes and system presets
- `POST /api/themes` - Create custom theme palette and typography
- `GET /api/themes/:id` - Get theme by ID
- `PUT /api/themes/:id` - Update theme
- `DELETE /api/themes/:id` - Delete theme

### Sessions (`/api/sessions`)
- `GET /api/sessions` - List historical and active sessions with `title` and `classGroup`
- `GET /api/sessions/:id` - Get session summary, participant scores, and individual answer breakdown
- `GET /api/sessions/:id/metrics` - Aggregated session metrics (average score, response time, accuracy) and per-question distribution
- `POST /api/sessions/:id/close` - Manually close active session and mark as FINISHED

## Real-Time Game Engine (Socket.io)

### Connection
- Namespace: `/`
- Path: `/socket.io`
- Transport: WebSocket with polling fallback
- Cross-node scaling: `@socket.io/redis-adapter` pub/sub

### Client -> Server Events
| Event | Role | Payload | Description |
|---|---|---|---|
| `room:create` | Professor | `{ quizId, themeId?, durationMinutes? }` | Allocates 6-digit PIN, starts room in LOBBY state |
| `room:join` | Pupil | `{ pin, nickname }` | Joins room lobby anonymously (GDPR compliant) |
| `room:kick_player` | Professor | `{ pin, playerId }` | Removes pupil from the room |
| `room:close` | Professor | `{ pin }` | Manually terminates session early and flushes results |
| `game:start` | Professor | `{ pin }` | Transitions to COUNTDOWN for question 0 |
| `question:submit_answer` | Pupil | `{ pin, questionId, optionId }` | Submits answer; scored atomically with speed & streak |
| `question:show_result` | Professor | `{ pin }` | Reveals correct answer distribution |
| `game:show_leaderboard` | Professor | `{ pin }` | Displays top 5 and rankings |
| `game:next_question` | Professor | `{ pin }` | Advances to next question or PODIUM if last question |
| `game:end` | Professor | `{ pin }` | Concludes game, displays podium, flushes to PostgreSQL |

### Server -> Client Events
| Event | Recipient | Payload | Description |
|---|---|---|---|
| `room:created` | Host | `{ pin, sessionId, expiresAt, theme }` | Room initialized |
| `room:joined` | Pupil | `{ pin, playerId, nickname }` | Confirms join |
| `room:player_list` | Room | `{ players: [...] }` | Broadcasts active participant list |
| `room:player_kicked`| Player | `{ reason }` | Notification of removal |
| `room:closed` | Room | `{ pin, reason }` | Room closed by professor |
| `room:expired` | Room | `{ pin, reason }` | Room auto-expired after timer elapsed |
| `room:error` | Socket | `{ code, message }` | Validation or state machine error |
| `game:countdown` | Room | `{ questionIndex, durationSeconds }` | 5-second question countdown |
| `question:active` | Room | `{ question, expiresAt }` | Active question (answers hidden from options) |
| `question:result_pupil`| Pupil | `{ isCorrect, pointsEarned, streak, rank }` | Individual pupil answer outcome |
| `question:results` | Room | `{ stats, correctOptionId }` | Answer distribution for host screen |
| `game:leaderboard` | Room | `{ topPlayers }` | Current top scores |
| `game:podium` | Room | `{ podium, totalPlayers }` | Final top 3 and completion stats |
| `game:ended` | Room | `{ pin, status }` | Game ended confirmation |

## Docker Secrets & Environment Configuration
The backend reads credentials from `/run/secrets/` in production:
- `/run/secrets/db_password`
- `/run/secrets/db_user`
- `/run/secrets/redis_password`
- `/run/secrets/jwt_secret`

Fallback to environment variables is supported for local development:
- `PORT` (default: 3000)
- `DATABASE_URL` (default: `postgresql://postgres:postgres@localhost:5432/openquiz`)
- `REDIS_URL` (default: `redis://localhost:6379`)
- `AUTH_PROVIDER` (`self-hosted` \| `hanko` \| `supabase`, default: `self-hosted`)
- `JWT_SECRET`
- `CORS_ORIGIN` (default: `http://localhost:5173`)


