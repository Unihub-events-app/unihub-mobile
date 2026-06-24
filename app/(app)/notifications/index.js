import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { Bell } from "lucide-react-native";
import { Screen, NeuCard, NeuInset, PageLoader } from "../../../components/index.js";
import { API_URL } from "../../../lib/config.js";
import { getUserToken } from "../../../lib/auth.js";
import { useRouter } from "expo-router";
import { useTheme } from "../../../theme/ThemeProvider.js";

function NotificationItem({ notification, onPress }) {
  const { theme } = useTheme();

  const timeAgo = (date) => {
    const now = new Date();
    const then = new Date(date);
    const diff = Math.floor((now - then) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const isUnread = !notification.read;

  return (
    <NeuCard
      style={[
        styles.notificationItem,
        isUnread && {
          backgroundColor:
            theme.colors.mode === "dark"
              ? "rgba(59, 130, 246, 0.12)"
              : "rgba(59, 130, 246, 0.06)",
        },
      ]}
      onPress={onPress}
    >
      <View style={[styles.notificationIconContainer, { backgroundColor: theme.colors.surfaceMuted }]}>
        <Bell size={20} color={isUnread ? theme.colors.brand : theme.colors.textSubtle} />
      </View>
      <View style={styles.notificationContent}>
        <Text style={[styles.notificationTitle, { color: theme.colors.text }]}>
          {notification.title}
        </Text>
        <Text style={[styles.notificationMessage, { color: theme.colors.textMuted }]} numberOfLines={2}>
          {notification.message}
        </Text>
        <Text style={[styles.notificationTime, { color: theme.colors.textSubtle }]}>
          {timeAgo(notification.createdAt)}
        </Text>
      </View>
    </NeuCard>
  );
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const token = await getUserToken();
        if (!token) {
          router.push("/(auth)/signin");
          return;
        }

        const res = await fetch(`${API_URL}/notifications/user`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ user_token: token }),
        });

        if (res.ok) {
          const data = await res.json();
          setNotifications(data.notifications || []);
        }
      } catch (e) {
        console.error("Failed to load notifications", e);
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();
  }, []);

  if (loading) {
    return <PageLoader />;
  }

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Notifications</Text>

        {notifications.length > 0 ? (
          <View style={styles.notificationsList}>
            {notifications.map((notification) => (
              <NotificationItem
                key={notification._id}
                notification={notification}
                onPress={() => router.push(`/(app)/notifications/${notification._id}`)}
              />
            ))}
          </View>
        ) : (
          <NeuInset style={styles.emptyState}>
            <Bell size={48} color={theme.colors.textSubtle} />
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>No Notifications Yet</Text>
            <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>
              You'll see updates about events, friends, and more here.
            </Text>
          </NeuInset>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    paddingTop: 24,
    paddingBottom: 24,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    fontFamily: "SpaceGrotesk_700Bold",
    marginBottom: 20,
  },
  notificationsList: {
    gap: 12,
  },
  notificationItem: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
  },
  notificationIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 13,
    marginBottom: 6,
  },
  notificationTime: {
    fontSize: 12,
  },
  emptyState: {
    padding: 40,
    alignItems: "center",
    borderRadius: 24,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
  },
});
