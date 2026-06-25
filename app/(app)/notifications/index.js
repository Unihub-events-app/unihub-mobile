import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Animated,
} from "react-native";
import {
  Bell, Ticket, Users, Megaphone, ShieldAlert,
  Wallet, CalendarX, Star, UserPlus, CheckCheck,
} from "lucide-react-native";
import { Screen, NeuInset, PageLoader } from "../../../components/index.js";
import { API_URL } from "../../../lib/config.js";
import { getUserToken } from "../../../lib/auth.js";
import { useRouter } from "expo-router";
import { useTheme } from "../../../theme/ThemeProvider.js";

function getNotificationMeta(type) {
  switch (type) {
    case "ticket_purchase":
      return { icon: Ticket, color: "#3D9E4A", label: "Ticket" };
    case "ticket_sale":
      return { icon: Ticket, color: "#C8E630", label: "Sale" };
    case "community_tag":
      return { icon: Users, color: "#6366f1", label: "Community" };
    case "community_event":
      return { icon: CalendarX, color: "#f59e0b", label: "Event" };
    case "follow":
      return { icon: UserPlus, color: "#06b6d4", label: "Follow" };
    case "payout_approved":
    case "payout_completed":
      return { icon: Wallet, color: "#3D9E4A", label: "Payout" };
    case "payout_rejected":
    case "payout_failed":
      return { icon: Wallet, color: "#DC2626", label: "Payout" };
    case "report_reviewed":
    case "account_suspended":
    case "account_deleted":
      return { icon: ShieldAlert, color: "#DC2626", label: "Account" };
    case "premium_upgrade":
    case "premium_expired":
    case "premium_expiring":
      return { icon: Star, color: "#f59e0b", label: "Premium" };
    case "announcement":
      return { icon: Megaphone, color: "#C8E630", label: "Announcement" };
    default:
      return { icon: Bell, color: "#7A7A65", label: "General" };
  }
}

function timeAgo(date) {
  const now = new Date();
  const then = new Date(date);
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return then.toLocaleDateString([], { month: "short", day: "numeric" });
}

function NotificationCard({ notification, onPress, theme }) {
  const { icon: Icon, color, label } = getNotificationMeta(notification.type);
  const isUnread = !notification.read;
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = () =>
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 40 }).start();
  const pressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 25 }).start();

  return (
    <TouchableOpacity onPress={onPress} onPressIn={pressIn} onPressOut={pressOut} activeOpacity={1}>
      <Animated.View
        style={[
          styles.card,
          {
            backgroundColor: isUnread
              ? theme.colors.mode === "dark"
                ? "rgba(200,230,48,0.07)"
                : "rgba(200,230,48,0.06)"
              : theme.colors.surface,
            borderColor: isUnread ? `${color}30` : theme.colors.border,
            transform: [{ scale }],
          },
        ]}
      >
        {/* Banner image */}
        {notification.banner ? (
          <Image source={{ uri: notification.banner }} style={styles.banner} resizeMode="cover" />
        ) : null}

        <View style={styles.cardInner}>
          {/* Unread left stripe */}
          {isUnread && <View style={[styles.unreadStripe, { backgroundColor: color }]} />}

          {/* Icon */}
          <View style={[styles.iconWrap, { backgroundColor: `${color}18` }]}>
            <Icon size={20} color={color} />
          </View>

          {/* Content */}
          <View style={styles.contentWrap}>
            <View style={styles.topRow}>
              <Text style={[styles.typeLabel, { color }]}>{label}</Text>
              {isUnread && <View style={[styles.unreadDot, { backgroundColor: color }]} />}
              <Text style={[styles.timeText, { color: theme.colors.textSubtle }]}>
                {timeAgo(notification.createdAt)}
              </Text>
            </View>
            <Text style={[styles.titleText, { color: theme.colors.text }]} numberOfLines={2}>
              {notification.title}
            </Text>
            <Text style={[styles.messageText, { color: theme.colors.textMuted }]} numberOfLines={2}>
              {notification.message}
            </Text>

            {/* Show preview of first text section */}
            {notification.sections?.length > 0 && (
              <Text style={[styles.sectionPreview, { color: theme.colors.textSubtle }]} numberOfLines={1}>
                {notification.sections.find((s) => s.type !== "image" && s.type !== "button")?.content || ""}
              </Text>
            )}

            <Text style={[styles.readMore, { color }]}>Read full message →</Text>
          </View>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  // Navigation lock prevents double-tap from opening the same detail twice
  const navigatingRef = useRef(false);

  const loadNotifications = useCallback(async () => {
    try {
      const token = await getUserToken();
      if (!token) { router.push("/(auth)/signin"); return; }

      const res = await fetch(`${API_URL}/notifications/user`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ user_token: token }),
      });

      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (e) {
      console.error("Failed to load notifications", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadNotifications(); }, []);

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      const token = await getUserToken();
      await fetch(`${API_URL}/notifications/mark-all-read`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch { /* silent */ } finally {
      setMarkingAll(false);
    }
  };

  const handlePress = (notification) => {
    // Debounce: ignore rapid double-taps
    if (navigatingRef.current) return;
    navigatingRef.current = true;
    setTimeout(() => { navigatingRef.current = false; }, 800);

    // Always navigate to the detail page — it marks as read and renders sections
    router.push(`/(app)/notifications/${notification._id}`);
  };

  if (loading) return <PageLoader />;

  const unread = notifications.filter((n) => !n.read);
  const read = notifications.filter((n) => n.read);

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Notifications</Text>
            {unreadCount > 0 && (
              <Text style={[styles.headerSub, { color: theme.colors.textSubtle }]}>
                {unreadCount} unread
              </Text>
            )}
          </View>
          {unreadCount > 0 && (
            <TouchableOpacity
              style={[styles.markAllBtn, { backgroundColor: theme.colors.surfaceMuted, borderColor: theme.colors.border }]}
              onPress={handleMarkAllRead}
              disabled={markingAll}
              activeOpacity={0.7}
            >
              <CheckCheck size={14} color={theme.colors.brand} />
              <Text style={[styles.markAllText, { color: theme.colors.brand }]}>
                {markingAll ? "Marking…" : "Mark all read"}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {notifications.length === 0 ? (
          <NeuInset style={styles.emptyState}>
            <Bell size={44} color={theme.colors.textSubtle} />
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>All caught up!</Text>
            <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>
              You'll see updates about events, tickets, community activity, and more here.
            </Text>
          </NeuInset>
        ) : (
          <View style={styles.list}>
            {/* Unread section */}
            {unread.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: theme.colors.textSubtle }]}>NEW</Text>
                <View style={styles.sectionCards}>
                  {unread.map((n) => (
                    <NotificationCard
                      key={n._id}
                      notification={n}
                      theme={theme}
                      onPress={() => handlePress(n)}
                    />
                  ))}
                </View>
              </View>
            )}

            {/* Read section */}
            {read.length > 0 && (
              <View style={styles.section}>
                {unread.length > 0 && (
                  <Text style={[styles.sectionLabel, { color: theme.colors.textSubtle }]}>EARLIER</Text>
                )}
                <View style={styles.sectionCards}>
                  {read.map((n) => (
                    <NotificationCard
                      key={n._id}
                      notification={n}
                      theme={theme}
                      onPress={() => handlePress(n)}
                    />
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    paddingTop: 24,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    fontFamily: "SpaceGrotesk_700Bold",
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: 13,
    fontFamily: "PlusJakartaSans_400Regular",
    marginTop: 2,
  },
  markAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  markAllText: {
    fontSize: 12,
    fontWeight: "700",
    fontFamily: "PlusJakartaSans_700Bold",
  },
  list: {
    gap: 20,
  },
  section: {
    gap: 10,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
    fontFamily: "PlusJakartaSans_700Bold",
    marginBottom: 4,
  },
  sectionCards: {
    gap: 10,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
  },
  banner: {
    width: "100%",
    height: 140,
  },
  cardInner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 16,
  },
  unreadStripe: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  contentWrap: {
    flex: 1,
    gap: 3,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  typeLabel: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
    fontFamily: "PlusJakartaSans_700Bold",
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  timeText: {
    fontSize: 11,
    fontFamily: "PlusJakartaSans_400Regular",
    marginLeft: "auto",
  },
  titleText: {
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "PlusJakartaSans_700Bold",
    lineHeight: 20,
  },
  messageText: {
    fontSize: 13,
    fontFamily: "PlusJakartaSans_400Regular",
    lineHeight: 19,
  },
  sectionPreview: {
    fontSize: 12,
    fontFamily: "PlusJakartaSans_400Regular",
    fontStyle: "italic",
    lineHeight: 17,
    marginTop: 1,
  },
  readMore: {
    fontSize: 12,
    fontWeight: "700",
    fontFamily: "PlusJakartaSans_700Bold",
    marginTop: 6,
  },
  emptyState: {
    padding: 40,
    alignItems: "center",
    borderRadius: 24,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    fontFamily: "SpaceGrotesk_700Bold",
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    fontFamily: "PlusJakartaSans_400Regular",
    lineHeight: 21,
  },
});
