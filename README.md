# UniHub Mobile

The official Android application for UniHub — a platform for university students to discover, create, and attend campus events.

---

## Overview

UniHub Mobile brings the full UniHub experience to Android. Students can explore events at their university, register and pay, scan QR codes at the door, engage in real-time community chats, manage their earnings wallet, and receive instant notifications — all from their phone.

---

## Features

- **Event Discovery** — Browse and filter events by university, category, and location
- **Registration & Payments** — Register for paid and free events with Paystack integration
- **QR Code Check-in** — Scan attendee QR codes for fast, contactless event entry
- **Community Chat** — Real-time event chat with @mention support and file sharing
- **Wallet** — Track earnings, available balance, and request payouts
- **Notifications** — Push and in-app notifications for registrations, announcements, and mentions
- **Event Management** — Create, edit, and manage events including premium listings
- **Onboarding** — University selection, interest preferences, and profile photo setup
- **Admin Panel** — In-app admin dashboard for platform-level management
- **OTA Updates** — JavaScript-layer updates delivered silently without a new install

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native 0.85 + Expo SDK 56 |
| Navigation | Expo Router (file-based routing) |
| Styling | NativeWind (Tailwind CSS for React Native) |
| Animations | React Native Reanimated |
| Real-time | Socket.io Client |
| State Management | Zustand |
| Payments | Paystack |
| Local Storage | Expo SecureStore + AsyncStorage |
| OTA Updates | EAS Update (expo-updates) |
| Build Pipeline | GitHub Actions + Gradle |

---

## Requirements

- Node.js 22+
- npm
- Java 17 (for local Android builds)
- Android Studio or Android SDK (for local builds)
- An [Expo account](https://expo.dev) for OTA update publishing
- EAS CLI: `npm install -g eas-cli`

---

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/Unihub-events-app/unihub-mobile.git
cd unihub-mobile
npm install
```

### 2. Configure environment

Create a `.env` file in the project root:

```env
EXPO_PUBLIC_API_URL=your_backend_api_url
```

> Do not commit this file. It is listed in `.gitignore`.

### 3. Start in development

```bash
npx expo start --dev-client
```

### 4. Build for Android locally

```bash
npx expo prebuild --platform android
cd android && ./gradlew assembleRelease
```

---

## Build & Release

Production APK builds are automated via GitHub Actions. Push a version tag to trigger a release build:

```bash
git tag v1.x.x
git push origin v1.x.x
```

The CI pipeline will:
1. Run `npx expo prebuild` to generate the native Android project
2. Build a signed release APK via Gradle
3. Publish the APK as a GitHub Release with release notes

---

## OTA Updates

For JavaScript-only changes — UI fixes, API call updates, layout changes — no new build or tag is needed:

```bash
eas update --branch production --message "brief description of change"
```

A full rebuild (new tag) is only required when:
- Adding or removing a package with native Android code
- Modifying `app.config.js` permissions or native plugin config
- Upgrading the Expo SDK version

---

## Project Structure

```
app/
├── (app)/           # Authenticated user screens
├── (auth)/          # Sign in, sign up, password reset
├── admin/           # Admin dashboard screens
├── event/           # Event detail, registration, payment, check-in
├── onboarding/      # University, interests, photo setup
└── _layout.js       # Root layout and navigation config

components/          # Shared UI components
hooks/               # Custom React hooks
utils/               # Helpers and API clients
assets/              # Images and fonts
```

---

## Environment Variables

| Variable | Description |
|---|---|
| `EXPO_PUBLIC_API_URL` | Base URL of the UniHub backend API |
| `APP_VARIANT` | Set to `dev` to activate development mode |
| `EXPO_UPDATES_CHANNEL` | OTA channel (`production` or `preview`) — injected during CI build, do not set manually |

---

## License

Copyright © 2026 UniHub. All rights reserved.

Unauthorized use, reproduction, modification, or distribution of this software or any portion of it is strictly prohibited and may result in civil and criminal penalties. See [LICENSE](./LICENSE) for full terms.
