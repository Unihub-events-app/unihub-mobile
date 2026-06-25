import { Platform } from "react-native";
import { API_URL } from "./config.js";
import { getUserToken } from "./auth.js";

// Lazy-load native modules so the app doesn't crash if expo-notifications
// is not yet compiled into the dev client build.
let Notifications = null;
let Device = null;
try { Notifications = require("expo-notifications"); } catch {}
try { Device = require("expo-device"); } catch {}

export async function registerForPushNotifications() {
  if (!Notifications || !Device) {
    console.warn("[push] expo-notifications or expo-device not available — rebuild dev client.");
    return null;
  }

  if (!Device.isDevice) {
    console.warn("[push] Push notifications only work on physical devices.");
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.warn("[push] Permission denied.");
    return null;
  }

  // Android requires a notification channel
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "UniHub",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#C8E630",
    });
    await Notifications.setNotificationChannelAsync("announcements", {
      name: "Announcements",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#C8E630",
    });
  }

  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId: undefined, // will be read from app.json / app.config.js
  });

  const pushToken = tokenData.data;

  // Save token to server
  try {
    const userToken = await getUserToken();
    if (userToken) {
      await fetch(`${API_URL}/user/push-token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({ user_token: userToken, pushToken }),
      });
    }
  } catch (e) {
    console.warn("[push] Failed to save push token:", e);
  }

  return pushToken;
}

export function setupNotificationHandlers() {
  if (!Notifications) return () => {};

  // Show notifications while the app is in the foreground
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });

  // Handle notification taps (foreground)
  const sub = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data || {};
    // Navigate to notification detail if we have an ID
    if (data.notificationId) {
      // We can't call router here directly since this is outside React;
      // use expo-router's imperative API or post an event
      try {
        const { router } = require("expo-router");
        router.push(`/(app)/notifications/${data.notificationId}`);
      } catch {}
    }
  });

  return () => sub.remove();
}
