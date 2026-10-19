# Pupil Frontend (Mobile-First Web App)

## Overview
The Pupil Frontend is a lightweight, mobile-first web application designed for students playing live quizzes on their phones or tablets. It focuses on maximum responsiveness, thumb-friendly navigation, low input latency, and gamified visual and audio feedback.

## Key Features
- **Mobile-First Touch Ergonomics**:
  - Full-width, high-contrast answer buttons with generous tap targets to eliminate misclicks under time pressure.
  - Bottom-anchored controls for single-hand thumb navigation.
- **Gamified Feedback & Animations**:
  - Powered by Framer Motion: screen shake upon incorrect answers, particle bursts / confetti on correct streaks and podium placements, animated streak multipliers.
  - Auditory cues and optional haptic feedback for mobile devices.
- **Dynamic Theming & Custom Logo**:
  - Default school theme: Green Pistachio (`#93C572`) and Orange Pumpkin (`#FF7518`).
  - Adapts in real time to the quiz theme selected by the professor (colors, fonts, accent styles, and custom school logo) sent via room metadata.
  - Falls back to `public/logo.svg` when no custom quiz logo is defined.
- **Logo Replacement Instructions**:
  - **Static Replacement**: Replace `frontends/pupil/public/logo.svg` with your organization's logo file. In Docker, mount your file over `/app/public/logo.svg`.
  - **Constraints**:
    - Recommended format: SVG (vector) for razor-sharp rendering on mobile screens and retina displays. Alternatively PNG / WebP with transparent background.
    - Dimensions: Ideal 4:1 aspect ratio (e.g., 400x100 px) for header brand display.
    - Max static size: < 500 KB.
    - Theme contrast: Designed to look great on both light and dark backgrounds.
- **Zero-Friction & Privacy-Compliant**:
  - No user registration, passwords, or emails needed.
  - Pupils enter a 6-digit game PIN and a temporary nickname.
  - EU Cookie Consent dialog for session storage / necessary cookies only.
- **Multilingual Support (i18n)**:
  - Supports English (en), Spanish (es), German (de), French (fr), Italian (it), Portuguese (pt), Catalan (ca), and Japanese (ja).
  - RTL-ready architecture (Arabic, Hebrew).
  - Defaults to the student's browser language, with instant language switcher.

## Technology Stack
- **Framework**: Next.js 14+ (App Router)
- **Styling**: Tailwind CSS
- **Animation**: Framer Motion & canvas-confetti
- **Real-Time Client**: Socket.io-client
- **Localization**: next-intl or i18next
- **Package Manager**: npm

## Directory Structure
```
frontends/pupil/
├── public/                  # Static assets (sounds, icons, default avatar SVGs)
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── [locale]/        # Localized route segments
│   │   │   ├── page.tsx     # PIN entry & nickname screen
│   │   │   └── play/        # Live gameplay view
│   ├── components/          # UI components (AnswerGrid, TimerBar, StreakBadge, Confetti)
│   ├── hooks/               # WebSocket game hooks (useGameRoom, useSoundEffects)
│   ├── i18n/                # Translation dictionary files (json)
│   └── styles/              # Tailwind configuration and theme variables
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

