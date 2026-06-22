# Migration Notes

- The web app uses JWT bearer tokens stored in cookies; this mobile app uses `expo-secure-store` for the same tokens.
- `app.config.js` owns the API base URL through `extra.API_URL`.
- Tailwind was detected in the web project, so NativeWind v4 is set up for the Expo app.
- The Next.js Pages Router routes are mirrored under Expo Router, with `users/` aliases for the familiar paths.
- A number of screens are still route placeholders because the original web app has a large surface area and they need to be ported route by route.
- Install native dependencies with Expo tooling after creating the project scaffold.
- Set up an EAS development build before relying on device-only modules such as SecureStore in a production-like environment.
- Android testing on a physical phone can be done entirely through EAS without installing Android Studio locally.
- Rotate any credentials that were exposed in chat and keep secrets out of the mobile app bundle.
