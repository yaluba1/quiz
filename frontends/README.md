# Frontend Applications

## Overview
The Quiz platform user interface is organized into two specialized frontends, each tailored to its specific user experience, viewport constraints, and functional requirements:

1. **Pupil Frontend (`frontends/pupil`)**:
   - **Target**: Mobile devices / smartphones (touchscreens, portrait mode, thumb reachability).
   - **Purpose**: Student game client. Pupils enter a room PIN, choose a nickname, answer questions at high speed, receive real-time feedback, and watch live score changes.
   - **Design**: High-contrast, large touch targets, gamified animations (Framer Motion: screen shakes, streak multipliers, confetti), sound effects, zero personal data required.

2. **Professor Frontend (`frontends/professor`)**:
   - **Target**: Desktop & tablet viewports.
   - **Purpose**: Teacher control center. Quiz authoring (questions, timers, media, custom themes), hosting live game sessions (lobby projector, starting rounds, displaying live podium), reviewing historical student analytics, and managing account settings.
   - **Design**: Rich desktop dashboard, drag-and-drop question ordering, theme style builder (pistachio & pumpkin color customization, typography), and projector-optimized display mode.

## Shared Capabilities
- **Styling**: Tailwind CSS with custom CSS variables for runtime theming.
- **Light & Dark Mode**: Native support across all pages, defaulting to browser/system preference (`prefers-color-scheme`) with a manual header toggle.
- **Multilanguage (i18n)**: Out-of-the-box support for 8 languages (Spanish, English, German, French, Italian, Portuguese, Catalan, Japanese) with RTL support (Arabic, Hebrew). Default language automatically detects browser locale, with user override persistence.
- **Global Branding & Logo Customization**:
  - **Default Logo**: Shipped with an optimized SVG brand logo at `public/logo.svg` featuring Pistachio Green (`#93C572`) and Pumpkin Orange (`#FF7518`), with adaptive light/dark fill styles.
  - **Method 1 - Static Logo Replacement (Admins/Deployers)**: Replace `public/logo.svg` directly or mount a custom file via Docker volumes (`./branding/logo.svg:/app/public/logo.svg:ro`).
  - **Method 2 - Dynamic Theme Studio Logo (Professors)**: Teachers can specify a custom logo URL / file in the Theme Studio for any quiz. The active logo is broadcast in the room metadata and displayed across the lobby, projector, and pupil game screens.
- **Privacy & EU Compliance**: Cookie consent management banner. Pupils require zero persistent tracking cookies or personal data.
- **Framework**: Next.js (React) with modern App Router and optimized production builds.

## Logo Guidelines & Constraints
- **Format**: **SVG strongly recommended** for sharp scaling on high-DPI retina displays and 4K classroom projectors. PNG and WebP are supported with alpha transparency.
- **Recommended Dimensions**:
  - Horizontal Banner / Navbar: `400 x 100 px` (aspect ratio 4:1).
  - Square Icon / Avatar: `512 x 512 px` (aspect ratio 1:1).
- **Max File Size**: Static files < 500 KB; dynamic upload via Theme Studio < 2 MB.
- **Visual Contrast**: Ensure graphics are visible on both dark (`#0F172A`) and light (`#FFFFFF`) backgrounds. Transparent backgrounds are strongly recommended.

## Directory Structure
```
frontends/
├── pupil/                   # Mobile-first student game application & Landing Page
│   └── public/logo.svg      # Default pupil brand logo
├── professor/               # Desktop/tablet dashboard and quiz creator
│   └── public/logo.svg      # Default teacher brand logo
└── README.md                # Frontends overview
```

