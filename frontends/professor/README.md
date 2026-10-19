# Professor Frontend (Dashboard & Quiz Creator)

## Overview
The Professor Frontend is a responsive web application optimized for desktop and tablet screens. It provides teachers with an intuitive suite of tools to create and manage quizzes, customize quiz visual themes, host live gamified sessions with a classroom projector view, and analyze pupil results.

## Key Features
- **Quiz Library & Reusability**:
  - Reusable quiz templates that can be played an unlimited number of times across classes and school years.
  - Interactive question builder (Multiple Choice, True/False, Time limits, Points multiplier).
  - Media asset support (diagrams, images).
  - Quiz duplication and clone workflow.
- **Logical Classification & Tag Filtering**:
  - Academic level classification (e.g. Grade 10, A1, University).
  - Subject grouping (e.g. Mathematics, Science, Literature).
  - Virtual folder / unit hierarchy (e.g. "Term 1 / Unit 2") with breadcrumb and tree navigation.
  - Multi-tag search and filter chips for rapid discovery in large libraries.
- **Session Activation with Custom Naming**:
  - When hosting a quiz, teachers can name the session (e.g. "Class 4B - Midterm Exam") and record the class/cohort.
  - PIN and QR codes generated with session metadata.
- **Theme & Style Customizer**:
  - Color palette editor with default Green Pistachio (`#93C572`) and Orange Pumpkin (`#FF7518`).
  - Font family and typography selection.
  - **Custom Logo Upload / URL**: Teachers can upload an institution/school logo or provide an image URL as part of each theme. This custom logo is dynamically projected during the live lobby, active quiz rounds, and leaderboard screens.
  - Reusable theme presets that can be applied to individual quizzes.
- **Default Logo Replacement**:
  - Deployers can statically replace the global brand logo by substituting `frontends/professor/public/logo.svg` or mounting a custom SVG/PNG file via Docker Swarm (`./branding/logo.svg:/app/public/logo.svg:ro`).
  - Logo constraints: SVG format strongly recommended (or transparent PNG/WebP), aspect ratio 4:1 (e.g. 400x100 px), max upload size 2 MB, contrast-optimized for light and dark modes.
- **Live Classroom Host & Projector View**:
  - High-visibility Lobby screen showing large room PIN, session title, QR code, and connected students.
  - Question presentation view with synchronous countdown timer.
  - Live animated response distribution charts and instantaneous top-5 leaderboard.
  - Final 3D/animated Podium ceremony celebrating top performers.
- **Analytics & Granular Metrics Logging**:
  - All student response times (ms), choices, and correctness are permanently logged in the database.
  - Per-quiz metrics (average score, overall accuracy).
  - Per-question breakdown (average response time in ms, percentage correct vs wrong, option pick distribution).
  - Export capabilities (CSV / PDF report).
- **Authentication & Security**:
  - Secure professor sign-up, sign-in, and password recovery workflows.
  - Role-based authorization and session token handling.
- **Multilingual (i18n)**:
  - English, Spanish, German, French, Italian, Portuguese, Catalan, and Japanese with RTL capability.
  - Browser locale auto-detection with persistent language selection.
- **EU Cookie Compliance**:
  - Interactive cookie consent management.

## Technology Stack
- **Framework**: Next.js 14+ (App Router)
- **Styling**: Tailwind CSS & Headless UI / Radix UI primitives
- **Data Visualization**: Recharts or Chart.js
- **Real-Time Client**: Socket.io-client
- **Localization**: next-intl or i18next
- **Package Manager**: npm

## Directory Structure
```
frontends/professor/
├── public/                  # Static assets (logos, illustrations)
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── [locale]/
│   │   │   ├── auth/        # Login, Register, Forgot Password
│   │   │   ├── dashboard/   # Quiz list & quick actions
│   │   │   ├── quizzes/     # Quiz authoring & theme editor
│   │   │   ├── host/        # Live projector session control
│   │   │   └── analytics/   # Historical session reports
│   ├── components/          # Reusable UI widgets, modals, charts, theme editor
│   ├── hooks/               # Auth, API queries, and WebSocket host hooks
│   ├── i18n/                # Translation dictionary files
│   └── styles/              # Global styles and Tailwind configuration
├── Dockerfile               # Multi-stage production container build
├── package.json
└── README.md
```

## Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

