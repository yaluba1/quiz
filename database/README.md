# Database & Persistence Layer (PostgreSQL 16+)

## 1. Overview
The database component provides durable, relational persistence for the Open Quiz platform using **PostgreSQL 16+** and **Drizzle ORM**.

While high-frequency, millisecond-critical live gameplay state (active rooms, participant presence, real-time leaderboard sorted sets) is handled in-memory by **Redis**, PostgreSQL serves as the definitive source of truth for:
- Professor accounts and authentication credentials.
- Quiz catalog, questions, answer options, and points configuration.
- Visual theme presets and custom institution branding (colors, logos, fonts).
- Historical game sessions and finalized pupil performance archives.

---

## 2. Technology Stack & Design Decisions

- **RDBMS**: PostgreSQL 16+ (Alpine container on Docker Swarm internal network).
- **ORM / Query Builder**: [Drizzle ORM](https://orm.drizzle.team/) (`drizzle-orm` + `drizzle-kit`).
  - *Rationale*: Zero runtime binary overhead (unlike Prisma's ~40MB Rust engine), instant startup, native TypeScript type inference, and deterministic SQL migration generation.
- **Connection Driver**: `pg` (node-postgres connection pool).
- **Credentials & Security**: Supports Docker Swarm Secrets (`/run/secrets/db_user`, `/run/secrets/db_password`) with automatic fallback to standard environment variables (`DB_USER`, `DB_PASSWORD`) for local development.

---

## 3. Directory Layout

```
database/
├── init/
│   ├── 01-init.sql                  # PostgreSQL extensions (uuid-ossp, pgcrypto, pg_trgm)
│   ├── 02-schema.sql                # Complete relational schema (tables, enums, FKs, indexes)
│   ├── 03-gdpr-procedures.sql       # Anonymization & retention maintenance functions
│   └── 04-default-presets.sql       # System default theme presets (idempotent seed)
├── migrations/
│   ├── 0000_*.sql                   # Drizzle-generated initial baseline schema migration
│   └── meta/                        # Drizzle snapshot and journal files
├── seeds/
│   ├── 01-default-presets.sql       # Standalone SQL seed script for system themes
│   └── seed.ts                      # Full TypeScript seeder (themes, demo prof)
├── src/
│   ├── schema/                      # Drizzle table schemas and relation models
│   │   ├── professors.ts            # Professor accounts & credentials
│   │   ├── themes.ts                # Visual branding & CSS customizations
│   │   ├── quizzes.ts               # Quiz metadata & public catalog flags
│   │   ├── questions.ts             # Multiple choice & True/False questions
│   │   ├── answer-options.ts        # Kahoot-style colored shape answer options
│   │   ├── game-sessions.ts         # Room lifecycle history & PINs
│   │   ├── game-session-results.ts  # Pupil scores, placements & latency details
│   │   ├── relations.ts             # Drizzle relations definitions
│   │   └── index.ts                 # Schema barrel export
│   ├── db.ts                        # Connection pool reader with Docker Secrets fallback
│   ├── migrate.ts                   # Programmatic migration runner
│   ├── prune-gdpr.ts                # Scheduled GDPR data retention and anonymization job
│   └── index.ts                     # Database library entry point
├── drizzle.config.ts                # Drizzle Kit configuration
├── package.json                     # Database workspace dependencies and npm scripts
├── tsconfig.json                    # TypeScript compiler configuration
└── README.md                        # Documentation
```

---

## 4. Core Entities & Schema Reference

### A. Professors (`professors`)
| Column | Type | Constraints / Defaults | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | Primary Key, `gen_random_uuid()` | Professor identifier |
| `email` | `VARCHAR(255)` | Unique, Indexed, Not Null | Login email address |
| `password_hash` | `VARCHAR(255)` | Not Null | Argon2id password hash |
| `display_name` | `VARCHAR(100)` | Not Null | Screen / public educator name |
| `locale` | `VARCHAR(10)` | Default `'en'`, Not Null | Preferred UI language |
| `reset_token` | `VARCHAR(255)` | Nullable, Indexed (Partial) | Password recovery token |
| `reset_token_expires_at` | `TIMESTAMPTZ`| Nullable | Expiration timestamp |
| `created_at` | `TIMESTAMPTZ`| Default `NOW()`, Not Null | Registration timestamp |
| `updated_at` | `TIMESTAMPTZ`| Default `NOW()`, Not Null | Modification timestamp |

### B. Visual Themes (`themes`)
| Column | Type | Constraints / Defaults | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | Primary Key, `gen_random_uuid()` | Theme identifier |
| `professor_id` | `UUID` | Foreign Key (`professors.id`), On Delete Cascade, Nullable | Creator (`NULL` = system preset) |
| `name` | `VARCHAR(100)` | Not Null | Theme title (e.g. "Pistachio & Pumpkin") |
| `is_system_preset`| `BOOLEAN` | Default `false`, Not Null | Available platform-wide |
| `logo_url` | `VARCHAR(500)` | Nullable | Custom institution logo path |
| `primary_color` | `VARCHAR(20)` | Default `'#93C572'`, Not Null | Pistachio Green brand primary |
| `secondary_color`| `VARCHAR(20)` | Default `'#FF7518'`, Not Null | Pumpkin Orange secondary |
| `background_color`| `VARCHAR(20)` | Default `'#F7F9F6'`, Not Null | Canvas background |
| `font_family` | `VARCHAR(100)` | Default `'Inter'`, Not Null | Typography font family |
| `custom_css_vars` | `JSONB` | Default `'{}'` | Custom CSS variables map |
| `created_at` | `TIMESTAMPTZ`| Default `NOW()`, Not Null | Creation timestamp |

### C. Quizzes (`quizzes`)
| Column | Type | Constraints / Defaults | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | Primary Key, `gen_random_uuid()` | Quiz identifier |
| `professor_id` | `UUID` | Foreign Key (`professors.id`), On Delete Cascade, Not Null | Author |
| `theme_id` | `UUID` | Foreign Key (`themes.id`), On Delete Set Null, Nullable | Applied visual theme |
| `title` | `VARCHAR(255)` | Indexed, Not Null | Quiz title |
| `description` | `TEXT` | Nullable | Markdown or plain description |
| `cover_image_url`| `VARCHAR(500)` | Nullable | Optional banner image |
| `is_public` | `BOOLEAN` | Default `false`, Not Null | Public catalog visibility |
| `session_duration_minutes` | `INTEGER` | Default `60`, Not Null | Configurable session lifetime (minutes) |
| `level` | `VARCHAR(100)` | Nullable, Indexed | Grade/difficulty level (e.g., "Introductory") |
| `subject` | `VARCHAR(100)` | Nullable, Indexed | Academic domain/subject (e.g., "Math") |
| `folder` | `VARCHAR(150)` | Nullable, Indexed | Folder or category hierarchy path |
| `tags` | `TEXT[]` | Default `'{}'`, Not Null, GIN Indexed | Search and classification tags |
| `created_at` | `TIMESTAMPTZ`| Default `NOW()`, Not Null | Creation timestamp |
| `updated_at` | `TIMESTAMPTZ`| Default `NOW()`, Not Null | Last update timestamp |

### D. Questions (`questions`)
| Column | Type | Constraints / Defaults | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | Primary Key, `gen_random_uuid()` | Question identifier |
| `quiz_id` | `UUID` | Foreign Key (`quizzes.id`), On Delete Cascade, Not Null | Parent quiz |
| `order_index` | `INTEGER` | Not Null | Sequence order in quiz |
| `question_text` | `TEXT` | Not Null | Prompt display text |
| `question_type` | `ENUM` | `'MULTIPLE_CHOICE'`, `'TRUE_FALSE'` | Question format |
| `time_limit_seconds`| `INTEGER` | Default `20`, Not Null | Countdown duration |
| `points_multiplier`| `NUMERIC(3, 2)`| Default `1.00`, Not Null | Score multiplier (0.00, 1.00, 2.00) |
| `media_url` | `VARCHAR(500)` | Nullable | Image / diagram URL |
| `show_answers_on_device` | `BOOLEAN` | Default `false`, Not Null | Show option text on pupil screens |

*Constraints*: `UNIQUE(quiz_id, order_index)`

### E. Answer Options (`answer_options`)
| Column | Type | Constraints / Defaults | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | Primary Key, `gen_random_uuid()` | Option identifier |
| `question_id` | `UUID` | Foreign Key (`questions.id`), On Delete Cascade, Not Null | Parent question |
| `order_index` | `INTEGER` | Not Null | Display sequence |
| `option_text` | `TEXT` | Not Null | Option content |
| `is_correct` | `BOOLEAN` | Default `false`, Not Null | Correctness flag |
| `color_shape_index`| `INTEGER` | Not Null | 0=Red Triangle, 1=Blue Diamond, 2=Yellow Circle, 3=Green Square |

*Constraints*: `UNIQUE(question_id, order_index)`

### F. Game Sessions (`game_sessions`)
| Column | Type | Constraints / Defaults | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | Primary Key, `gen_random_uuid()` | Session identifier |
| `quiz_id` | `UUID` | Foreign Key (`quizzes.id`), On Delete Restrict, Not Null | Played quiz |
| `professor_id` | `UUID` | Foreign Key (`professors.id`), On Delete Cascade, Not Null | Host educator |
| `title` | `VARCHAR(255)` | Nullable | Custom session title (e.g. "Class 4B - Midterm") |
| `class_group` | `VARCHAR(100)` | Nullable, Indexed | Cohort or class identifier (e.g. "Class 4B") |
| `pin` | `VARCHAR(6)` | Indexed, Not Null | 6-digit game PIN |
| `status` | `ENUM` | `'LOBBY'`, `'IN_PROGRESS'`, `'FINISHED'`, `'ABORTED'`, `'EXPIRED'` | Game lifecycle status |
| `total_participants`| `INTEGER`| Default `0`, Not Null | Participant count |
| `started_at` | `TIMESTAMPTZ`| Default `NOW()`, Not Null | Room creation timestamp |
| `ended_at` | `TIMESTAMPTZ`| Nullable | Session conclusion timestamp |
| `expires_at` | `TIMESTAMPTZ`| Nullable | Timestamp when session will auto-expire |

### G. Session Results (`game_session_results`)
| Column | Type | Constraints / Defaults | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | Primary Key, `gen_random_uuid()` | Result record identifier |
| `session_id` | `UUID` | Foreign Key (`game_sessions.id`), On Delete Cascade, Not Null | Game session |
| `nickname` | `VARCHAR(50)` | Not Null | Pupil screen nickname |
| `final_score` | `INTEGER` | Default `0`, Not Null | Total earned points |
| `final_rank` | `INTEGER` | Not Null | Final podium ranking |
| `correct_answers_count`| `INTEGER` | Default `0`, Not Null | Correct questions count |
| `total_questions_count`| `INTEGER` | Default `0`, Not Null | Total questions count |
| `answer_details`| `JSONB` | Default `'[]'`, Not Null | Detailed response array (latency, chosen option) |

---

## 5. Indexing Strategy

- **`idx_professors_email`**: Unique B-tree on `professors(email)` for instantaneous login lookups.
- **`idx_professors_reset_token`**: Partial index on `professors(reset_token) WHERE reset_token IS NOT NULL`.
- **`idx_game_sessions_active_pin`**: Partial index on `game_sessions(pin) WHERE status IN ('LOBBY', 'IN_PROGRESS')` for instantaneous room join validation.
- **`idx_game_sessions_professor`**: B-tree on `game_sessions(professor_id, started_at DESC)` for professor session history dashboards.
- **`idx_game_sessions_status_expires`**: Composite index on `game_sessions(status, expires_at)` to support background queries and cleanup of expired sessions.
- **`idx_game_sessions_class_group`**: B-tree on `game_sessions(class_group)` for cohort session filtering.
- **`idx_quizzes_title`**: B-tree on `quizzes(title)` for catalog sorting and queries.
- **`idx_quizzes_level`**: B-tree on `quizzes(level)` for level-based filtering.
- **`idx_quizzes_subject`**: B-tree on `quizzes(subject)` for subject-based filtering.
- **`idx_quizzes_folder`**: B-tree on `quizzes(folder)` for folder navigation.
- **`idx_quizzes_tags`**: GIN index on `quizzes(tags)` for tag containment searching (`@>`).
- **`idx_questions_quiz_order`**: Unique composite index on `questions(quiz_id, order_index)` ensuring ordered retrieval.
- **`idx_answer_options_question_order`**: Unique composite index on `answer_options(question_id, order_index)`.
- **`idx_game_session_results_rank`**: Composite index on `game_session_results(session_id, final_rank)` for rapid podium and export generation.
- **`idx_game_sessions_ended_at`**: Partial index on `game_sessions(ended_at) WHERE status = 'FINISHED'` optimizing scheduled GDPR scans.

---

## 6. Privacy & GDPR Retention Policy

Pupils do not register or provide emails, but session nicknames and response details are considered personal data. The platform implements a two-stage retention policy:

1. **Stage 1 (Anonymization after 30 days - default)**:
   - Pupil nicknames in `game_session_results` are sanitized to `'Anonymous Pupil'`.
   - Granular response timings in `answer_details` are stripped, preserving only correctness and aggregated points for long-term historical analytics.
2. **Stage 2 (Purge after 180 days - default)**:
   - Completed game sessions older than 180 days and their corresponding results are hard-deleted.

### Running Maintenance:
```bash
# Direct CLI run (honors GDPR_RETENTION_DAYS and GDPR_PURGE_DAYS env vars)
npm run db:prune-gdpr
```

The database container also automatically registers the stored procedure `anonymize_expired_game_sessions(retention_days, purge_days)` via `init/02-gdpr-procedures.sql`.

---

## 7. Migration & Seeding CLI Commands

### Install Dependencies
```bash
cd database
npm install
```

### Generate Migration from Schema
```bash
npm run db:generate
```

### Execute Migrations
```bash
npm run db:migrate
```

### Seed Initial Presets & Demo Professor
```bash
npm run db:seed
```

### Launch Drizzle Studio (Visual Schema GUI)
```bash
npm run db:studio
```

---

## 8. Docker Secrets & Environment Configuration

| Variable | Default | Description |
| :--- | :--- | :--- |
| `DB_HOST` | `localhost` | PostgreSQL host (`postgres` inside Swarm) |
| `DB_PORT` | `5432` | PostgreSQL port |
| `DB_NAME` / `POSTGRES_DB` | `quiz_db` | Database name |
| `DB_USER_FILE` | `/run/secrets/db_user` | Path to Docker secret file for user |
| `DB_PASSWORD_FILE` | `/run/secrets/db_password` | Path to Docker secret file for password |
| `DB_USER` | `quiz_admin` | Fallback user if secret file not present |
| `DB_PASSWORD` | `quiz_secure_password_123` | Fallback password if secret file not present |
| `GDPR_RETENTION_DAYS` | `30` | Days before pupil nickname anonymization |
| `GDPR_PURGE_DAYS` | `180` | Days before full historical session purge |
