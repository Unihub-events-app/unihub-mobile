module.exports = ({ config }) => ({
  ...config,
  name: "UniHub",
  slug: "unihub-mobile",
  scheme: "UniHub Events",
  version: "0.1.0",
  orientation: "default",
  userInterfaceStyle: "automatic",
  android: {
    package: "click.tryunihub.mobile",
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
  plugins: ["expo-router", "expo-image", "expo-status-bar", "expo-font"],
});
