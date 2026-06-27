const IS_DEV = process.env.APP_VARIANT === "dev";

module.exports = ({ config }) => ({
  ...config,
  name: IS_DEV ? "UniHub Dev" : "UniHub",
  slug: "unihub-mobile",
  scheme: "UniHub Events",
  version: "1.4.0",
  icon: "./assets/images/mobile-logo.png",
  orientation: "default",
  userInterfaceStyle: "automatic",
  android: {
    package: IS_DEV ? "click.tryunihub.mobile.dev" : "click.tryunihub.mobile",
    adaptiveIcon: {
      foregroundImage: "./assets/images/mobile-logo.png",
      backgroundColor: "#ffffff",
    },
    softwareKeyboardLayoutMode: "resize",
  },
  extra: {
    githubRepo: "Unihub-events-app/unihub-mobile",
    eas: {
      projectId: "5e978b89-736e-45ec-89d6-f42b3c53b922",
    },
    API_URL:
      process.env.EXPO_PUBLIC_API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "https://try-unihub-server.pxxl.click",
  },
  plugins: [
    "expo-router",
    "expo-image",
    "expo-status-bar",
    "expo-font",
    "expo-sharing",
    "expo-calendar",
    "@react-native-community/datetimepicker",
    [
      "expo-camera",
      {
        cameraPermission:
          "Allow UniHub to access your camera for event check-in.",
      },
    ],
    [
      "expo-location",
      {
        locationAlwaysAndWhenInUsePermission:
          "Allow UniHub to show nearby events.",
      },
    ],
    [
      "expo-build-properties",
      {
        android: {
          kotlinVersion: "1.9.25",
        },
      },
    ],
  ],
});
