import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY_PREFIX = "unihub_reminder_";

export async function requestPermission() {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

export async function scheduleReminder(eventId, eventName, eventDate, eventTime, minutesBefore) {
  const granted = await requestPermission();
  if (!granted) return { ok: false, reason: "permission_denied" };

  // Parse event date/time into JS Date
  const dateParts = (eventDate || "").split("/");
  if (dateParts.length < 3) return { ok: false, reason: "invalid_date" };
  const [day, month, year] = dateParts;
  let hours = 0, minutes = 0;
  if (eventTime) {
    const timeStr = eventTime.trim();
    if (timeStr.includes("AM") || timeStr.includes("PM")) {
      const [timePart, period] = timeStr.split(" ");
      const [h, m] = timePart.split(":").map(Number);
      hours = period === "PM" && h !== 12 ? h + 12 : period === "AM" && h === 12 ? 0 : h;
      minutes = m || 0;
    } else {
      const [h, m] = timeStr.split(":").map(Number);
      hours = h;
      minutes = m || 0;
    }
  }
  const eventDateTime = new Date(Number(year), Number(month) - 1, Number(day), hours, minutes);
  const triggerDate = new Date(eventDateTime.getTime() - minutesBefore * 60 * 1000);

  if (triggerDate <= new Date()) return { ok: false, reason: "past" };

  // Cancel any existing reminder for this event
  await cancelReminder(eventId);

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: `🎉 ${eventName}`,
      body: minutesBefore < 60
        ? `Your event starts in ${minutesBefore} minutes!`
        : minutesBefore < 1440
        ? `Your event starts in ${minutesBefore / 60} hour${minutesBefore / 60 > 1 ? "s" : ""}!`
        : `Your event is tomorrow!`,
      data: { eventId },
    },
    trigger: { date: triggerDate },
  });

  await AsyncStorage.setItem(`${KEY_PREFIX}${eventId}`, JSON.stringify({ id, minutesBefore }));
  return { ok: true, id };
}

export async function cancelReminder(eventId) {
  try {
    const raw = await AsyncStorage.getItem(`${KEY_PREFIX}${eventId}`);
    if (raw) {
      const { id } = JSON.parse(raw);
      await Notifications.cancelScheduledNotificationAsync(id);
      await AsyncStorage.removeItem(`${KEY_PREFIX}${eventId}`);
    }
  } catch {}
}

export async function getReminderInfo(eventId) {
  try {
    const raw = await AsyncStorage.getItem(`${KEY_PREFIX}${eventId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
