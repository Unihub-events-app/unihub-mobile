import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "unihub_bookmarks";

export async function getBookmarks() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function isBookmarked(eventId) {
  const list = await getBookmarks();
  return list.includes(eventId);
}

export async function addBookmark(eventId) {
  const list = await getBookmarks();
  if (!list.includes(eventId)) {
    await AsyncStorage.setItem(KEY, JSON.stringify([...list, eventId]));
  }
}

export async function removeBookmark(eventId) {
  const list = await getBookmarks();
  await AsyncStorage.setItem(KEY, JSON.stringify(list.filter((id) => id !== eventId)));
}

export async function toggleBookmark(eventId) {
  const saved = await isBookmarked(eventId);
  if (saved) {
    await removeBookmark(eventId);
    return false;
  } else {
    await addBookmark(eventId);
    return true;
  }
}
