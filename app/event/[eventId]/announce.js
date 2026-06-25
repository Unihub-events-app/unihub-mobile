import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Platform,
  StatusBar,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Send, Megaphone } from "lucide-react-native";
import { useTheme } from "../../../theme/ThemeProvider.js";
import { API_URL } from "../../../lib/config.js";
import { getUserToken } from "../../../lib/auth.js";

const STATUS_BAR_HEIGHT = Platform.OS === "android" ? StatusBar.currentHeight || 24 : 44;

export default function AnnounceScreen() {
  const { eventId } = useLocalSearchParams();
  const router = useRouter();
  const { theme } = useTheme();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!title.trim()) { Alert.alert("Missing Title", "Please add a title for your announcement."); return; }
    if (!body.trim()) { Alert.alert("Missing Message", "Please write your announcement message."); return; }

    Alert.alert(
      "Send Announcement",
      `This will notify all attendees of "${title}". Continue?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Send",
          onPress: async () => {
            setLoading(true);
            try {
              const token = await getUserToken();
              const res = await fetch(`${API_URL}/event/announce`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ event_id: eventId, title: title.trim(), message: body.trim(), user_token: token }),
              });
              const data = await res.json();
              if (res.ok) {
                Alert.alert("Sent!", "Your announcement has been sent to all attendees.", [
                  { text: "OK", onPress: () => router.back() },
                ]);
              } else {
                Alert.alert("Error", data.msg || "Failed to send announcement. Try again.");
              }
            } catch {
              Alert.alert("Error", "Network error. Please try again.");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: STATUS_BAR_HEIGHT + 12, borderBottomColor: theme.colors.border }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: theme.colors.surfaceMuted }]} hitSlop={8}>
          <ArrowLeft size={18} color={theme.colors.text} />
        </Pressable>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>New Announcement</Text>
          <Text style={[styles.headerSub, { color: theme.colors.textSubtle }]}>Notify all attendees</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Info card */}
        <View style={[styles.infoCard, { backgroundColor: theme.colors.brandTint, borderColor: theme.colors.brand }]}>
          <Megaphone size={18} color={theme.colors.brand} />
          <Text style={[styles.infoText, { color: theme.colors.text }]}>
            This announcement will be sent as a push notification to all registered attendees of this event.
          </Text>
        </View>

        {/* Title */}
        <Text style={[styles.label, { color: theme.colors.textSubtle }]}>TITLE</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="e.g. Event Update, New Venue, Change of Plans"
          placeholderTextColor={theme.colors.textSubtle}
          maxLength={80}
          style={[styles.titleInput, {
            backgroundColor: theme.colors.surface,
            color: theme.colors.text,
            borderColor: theme.colors.border,
          }]}
        />
        <Text style={[styles.charCount, { color: theme.colors.textSubtle }]}>{title.length}/80</Text>

        {/* Body */}
        <Text style={[styles.label, { color: theme.colors.textSubtle }]}>MESSAGE</Text>
        <TextInput
          value={body}
          onChangeText={setBody}
          placeholder="Write your announcement here..."
          placeholderTextColor={theme.colors.textSubtle}
          multiline
          numberOfLines={6}
          maxLength={500}
          style={[styles.bodyInput, {
            backgroundColor: theme.colors.surface,
            color: theme.colors.text,
            borderColor: theme.colors.border,
          }]}
        />
        <Text style={[styles.charCount, { color: theme.colors.textSubtle }]}>{body.length}/500</Text>

        {/* Send button */}
        <Pressable
          onPress={handleSend}
          disabled={loading}
          style={[styles.sendBtn, { backgroundColor: theme.colors.brand, opacity: loading ? 0.7 : 1 }]}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#1A1A14" />
          ) : (
            <>
              <Send size={18} color="#1A1A14" />
              <Text style={styles.sendBtnText}>Send to All Attendees</Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "SpaceGrotesk_700Bold",
  },
  headerSub: {
    fontSize: 12,
    fontFamily: "PlusJakartaSans_400Regular",
    marginTop: 1,
  },
  scroll: {
    padding: 20,
    gap: 12,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 4,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "PlusJakartaSans_400Regular",
    lineHeight: 19,
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    fontFamily: "PlusJakartaSans_700Bold",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  titleInput: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    fontFamily: "PlusJakartaSans_500Medium",
  },
  bodyInput: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 14,
    fontFamily: "PlusJakartaSans_400Regular",
    textAlignVertical: "top",
    minHeight: 140,
    lineHeight: 21,
  },
  charCount: {
    fontSize: 11,
    fontFamily: "PlusJakartaSans_400Regular",
    textAlign: "right",
    marginTop: -6,
  },
  sendBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 18,
    marginTop: 8,
  },
  sendBtnText: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "PlusJakartaSans_700Bold",
    color: "#1A1A14",
  },
});
