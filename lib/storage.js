import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const secureKeys = {
  userToken: "user_token",
  adminToken: "admin_token"
};

export async function setSecureToken(key, value) {
  if (!value || value === "undefined" || value === "null") {
    await SecureStore.deleteItemAsync(key);
    return;
  }
  await SecureStore.setItemAsync(key, String(value));
}

export async function getSecureToken(key) {
  const value = await SecureStore.getItemAsync(key);
  return value && value !== "undefined" && value !== "null" ? value : null;
}

export async function removeSecureToken(key) {
  await SecureStore.deleteItemAsync(key);
}

export async function getFlag(key) {
  return AsyncStorage.getItem(key);
}

export async function setFlag(key, value) {
  return AsyncStorage.setItem(key, value);
}

export async function removeFlag(key) {
  return AsyncStorage.removeItem(key);
}
