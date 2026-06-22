# UniHub Mobile

Expo-based React Native front end for the UniHub backend.

## Run locally

1. Install dependencies in this folder.
```bash
npm install
```
2. Set the API URL if needed:

```bash
EXPO_PUBLIC_API_URL=https://try-unihub-production-8a88.up.railway.app
```

3. Start the app:

```bash
npm start
```

This starts Expo in **dev-client** mode. It is not meant for Expo Go.

## Android without Android Studio

If you do not want Android Studio, use an EAS Android development build:

```bash
npx eas-cli@latest login
npx eas-cli@latest build -p android --profile development
```

After the build finishes, download the APK to your Android phone and install it.
Then run:

```bash
npm start
```

Open the installed dev build on your phone and connect it to the Metro server URL Expo shows.

## Backend connection

The app reads its backend base URL from `Constants.expoConfig.extra.API_URL`, which is set in `app.config.js`.
By default it points at the existing UniHub Railway backend:

`https://try-unihub-production-8a88.up.railway.app`

## Auth

This mobile scaffold stores JWTs in `expo-secure-store` instead of cookies.
The login flow still talks to the same auth endpoints used by the web app:

- `POST /auth/check-user`
- `POST /auth/signin/password`
- `POST /auth/signin/otp`
- `POST /auth/signin/verify`
- `POST /auth/refresh-token`

## Notes

- Expo Router is configured for file-based navigation.
- NativeWind v4 is enabled for Tailwind-style `className` usage.
- Some non-auth screens are scaffolded as route placeholders and are ready to be ported from the Next.js UI.
