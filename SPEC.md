# UniHub Mobile App Redesign Specification

## Overview

This document specifies the complete redesign of the UniHub mobile app to match the web app's UI exactly.

## Design System

The web app uses two primary design systems:

1. **Neumorphic Light Mode**: Soft shadows, light gray background (#e8ecf1)
2. **Deep Navy Dark Mode**: Dark navy blue background (#0b0e14)

For mobile, we will implement the neumorphic light style as primary, matching the web app's current auth pages.

---

## 1. Global Styles & Configuration

### 1.1 Color Palette

Add these colors to `tailwind.config.js`:

```javascript
// From web app's globals.css
neuBg: '#e8ecf1',
neuShadowDark: '#c5cad4',
neuShadowLight: '#ffffff',

// Web auth neumorphic theme
dkBg: '#0b0e14',
dkSurface: '#121620',
dkSurface2: '#1a202c',
dkSurface3: '#2d3748',
dkBorder: 'rgba(226, 232, 240, 0.07)',
dkBorder2: 'rgba(226, 232, 240, 0.15)',
dkAccent: '#4b72ff',
dkAccent2: '#7090ff',
dkAccentGlow: 'rgba(75, 114, 255, 0.28)',
dkAccentDim: 'rgba(75, 114, 255, 0.12)',
dkText: '#f1f5f9',
dkText2: '#94a3b8',
dkText3: '#64748b',
dkRed: '#ff6b6b',
dkGreen: '#4ade80',
dkAmber: '#fca035'
```

### 1.2 Fonts

- **Body**: Plus Jakarta Sans (already configured)
- **Headings**: Space Grotesk (already configured)

### 1.3 Neumorphic Shadow Styles

Create component styles for:

- neu-card: Elevated neumorphic card
- neu-inset: Inset/pressed neumorphic surface
- neu-btn: Neumorphic button
- auth-neu-btn: Primary blue gradient button
- auth-neu-input: Inset input field

---

## 2. Component Redesigns

### 2.1 Screen.js

- Update to use neumorphic background (#e8ecf1)
- Safe area handling

### 2.2 TextField.js

- Redesign to match web's `auth-neu-input` style:
  - Inset neumorphic shadow
  - Rounded corners (14px)
  - Correct padding and typography
  - Focus state with blue ring

### 2.3 PrimaryButton.js

- Redesign to match web's `auth-neu-btn` style:
  - Blue gradient background: linear-gradient(160deg, #60a5fa 0%, #3b82f6 100%)
  - Soft shadow
  - Rounded full corners (50px)
  - Hover/press states

### 2.4 New Components

Create new components matching web app:

- `NeuCard.js`: Neumorphic card container
- `NeuInset.js`: Inset neumorphic surface
- `NeuTab.js`: Tab button component
- `NeuStat.js`: Stat badge
- `BackButton.js`: Auth step navigation button

---

## 3. Screen Redesigns

### 3.1 Auth Screens (signin.js, signup.js, etc.)

- Match exactly the web app's auth flow:
  - Left/top feature slide (mobile: top section)
  - Right/bottom form section
  - Step indicators
  - Same animations (fade-in-up, stagger)

Key auth pages:

- `(auth)/signin.js`
- `(auth)/signup.js`
- `(auth)/forgot-password.js`
- `(auth)/setup-password.js`

### 3.2 App Screens

All app screens to use neumorphic design:

- `(app)/dashboard.js`
- `(app)/event-library.js`
- `(app)/notifications.js`
- `(app)/profile.js`
- `(app)/settings.js`

---

## 4. Animation System

Match web app's Emil Kowalski style animations:

- Staggered entry animations for form fields
- Fade-in-up for cards
- Smooth easing curves (cubic-bezier(0.23, 1, 0.32, 1))

Use `react-native-reanimated` for animations.

---

## 5. Implementation Plan

1. Update tailwind.config.js with full color palette
2. Redesign core components (TextField, PrimaryButton, Screen)
3. Create new neumorphic components
4. Redesign auth screens first
5. Redesign app screens
6. Test and verify all UI matches web
