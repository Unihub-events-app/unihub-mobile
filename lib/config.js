import Constants from "expo-constants";

export const API_URL =
  Constants.expoConfig?.extra?.API_URL ||
  Constants.manifest?.extra?.API_URL ||
  "https://try-unihub-production-8a88.up.railway.app";
