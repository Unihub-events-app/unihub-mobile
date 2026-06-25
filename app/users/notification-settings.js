import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  ActivityIndicator,
  Platform,
  StatusBar,
  Animated,
} from "react-native";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  Bell,
  BellOff,
  Megaphone,
  Ticket,
  Users,
  Wallet,
  Star,
  UserPlus,
  CheckCircle,
  AlertCircle,
} from "lucide-react-native";
import { useTheme } from "../../theme/ThemeProvider.js";
import { API_URL } from "../../lib/config.js";
import { getUserToken } from "../../lib/auth.js";
import { registerForPushNotifications } from "../../lib/pushNotifications.js";

const STATUS_BAR_HEIGHT = Platform.OS === "android" ? StatusBar.currentHeight || 24 : 44;

const NOTIF_CATEGORIES = [
  {
    id: "announcements",
    icon: Megaphone,
    color: "#C8E630",
    label: "Announcements",
    desc: "Platform-wide news from UniHub",
  },
  {
    id: "events",
    icon: Ticket,
    color: "#3D9E4A",
    label: "Events",
    desc: "Ticket purchases, event updates",
  },
  {
    id: "community",
    icon: Users,
    color: "#6366f1",
    label: "Community",
    desc: "Tags, new events in your communities",
  },
  {
    id: "wallet",
    icon: Wallet,
    color: "#f59e0b",
    label: "Wallet & Payouts",
    desc: "Earnings, payout approvals",
  },
  {
    id: "social",
    icon: UserPlus,
    color: "#06b6d4",
    label: "Social",
    desc: "New followers and mentions",
  },
  {
    id: "premium",
    icon: Star,
    color: "#DC2626",
    label: "Premium",
    desc: "Subscription updates and renewals",
  },
];

function NotifRow({ category, enabled, onToggle }) {
  const { theme } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;
  const pressIn = () =>
    Animated.spring(scale, { toValue: 0.98, useNativeDriver: true, speed: 40 }).start();
  const pressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 25 }).start();

  return (
    <Pressable onPress={() => onToggle(category.id)} onPressIn={pressIn} onPressOut={pressOut}>
      <Animated.View
        style={[
          styles.notifRow,
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, transform: [{ scale }] },
        ]}
      >
        <View style={[styles.notifIcon, { backgroundColor: category.color + "18" }]}>
          <category.icon size={20} color={category.color} />
        </View>
        <View style={styles.notifMeta}>
          <Text style={[styles.notifLabel, { color: theme.colors.text }]}>{category.label}</Text>
          <Text style={[styles.notifDesc, { color: theme.colors.textMuted }]}>{category.desc}</Text>
        </View>
        <Switch
          value={enabled}
          onValueChange={() => onToggle(category.id)}
          trackColor={{ false: theme.colors.border, true: category.color }}
          thumbColor="#fff"
        />
      </Animated.View>
    </Pressable>
  );
}

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const { theme } = useTheme();

  const [loading, setLoading] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [prefs, setPrefs] = useState({
    announcements: true,
    events: true,
    community: true,
    wallet: true,
    social: true,
    premium: true,
  });

  const showMsg = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: "", text: "" }), 3000);
  };

  useEffect(() => {
    const loadPrefs = async () => {
      try {
        const token = await getUserToken();
        if (!token) return;
        const res = await fetch(`${API_URL}/notifications/preferences`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.preferences) setPrefs((prev) => ({ ...prev, ...data.preferences }));
        }
      } catch {}
    };
    loadPrefs();
  }, []);

  const handleEnablePush = async () => {
    setRegistering(true);
    try {
      const token = await registerForPushNotifications();
      if (token) {
        setPushEnabled(true);
        showMsg("success", "Push notifications enabled!");
      } else {
        showMsg("error", "Could not enable notifications. Check permissions in Settings.");
      }
    } catch {
      showMsg("error", "Failed to register for notifications.");
    } finally {
      setRegistering(false);
    }
  };

  const toggleCategory = async (id) => {
    const next = { ...prefs, [id]: !prefs[id] };
    setPrefs(next);
    // Debounced save — save immediately on each toggle
    try {
      const token = await getUserToken();
      await fetch(`${API_URL}/notifications/preferences`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ preferences: next, user_token: token }),
      });
    } catch {}
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: STATUS_BAR_HEIGHT + 12, backgroundColor: theme.colors.background, borderBottomColor: theme.colors.border }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: theme.colors.surfaceMuted }]} hitSlop={8}>
          <ArrowLeft size={18} color={theme.colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Notifications</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Toast */}
      {msg.text ? (
        <View style={[styles.toast, {
          backgroundColor: msg.type === "error" ? "rgba(220,38,38,0.1)" : "rgba(61,158,74,0.1)",
          borderColor: msg.type === "error" ? theme.colors.error : "#3D9E4A",
        }]}>
          {msg.type === "error"
            ? <AlertCircle size={14} color={theme.colors.error} />
            : <CheckCircle size={14} color="#3D9E4A" />}
          <Text style={[styles.toastText, { color: msg.type === "error" ? theme.colors.error : "#3D9E4A" }]}>{msg.text}</Text>
        </View>
      ) : null}

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Push notification banner */}
        <View style={[
          styles.pushCard,
          {
            backgroundColor: pushEnabled ? theme.colors.brandTint : theme.colors.surface,
            borderColor: pushEnabled ? theme.colors.brand : theme.colors.border,
          },
        ]}>
          <View style={styles.pushCardTop}>
            <View style={[styles.pushIconWrap, { backgroundColor: pushEnabled ? theme.colors.brand : theme.colors.surfaceMuted }]}>
              {pushEnabled ? <Bell size={22} color="#1A1A14" /> : <BellOff size={22} color={theme.colors.textSubtle} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.pushCardTitle, { color: theme.colors.text }]}>
                {pushEnabled ? "Push notifications on 🔔" : "Enable push notifications"}
              </Text>
              <Text style={[styles.pushCardSub, { color: theme.colors.textMuted }]}>
                {pushEnabled
                  ? "You'll get notified about announcements and updates."
                  : "Get alerts even when the app is closed."}
              </Text>
            </View>
          </View>
          {!pushEnabled && (
            <Pressable
              style={({ pressed }) => [
                styles.pushEnableBtn,
                { backgroundColor: theme.colors.brand, opacity: pressed ? 0.85 : 1 },
              ]}
              onPress={handleEnablePush}
              disabled={registering}
            >
              {registering
                ? <ActivityIndicator size="small" color="#1A1A14" />
                : <Text style={styles.pushEnableBtnText}>Turn On Notifications</Text>}
            </Pressable>
          )}
        </View>

        <Text style={[styles.sectionLabel, { color: theme.colors.textSubtle }]}>NOTIFICATION TYPES</Text>
        <Text style={[styles.sectionHint, { color: theme.colors.textMuted }]}>
          Choose which in-app and push notifications you want to receive.
        </Text>

        <View style={styles.categories}>
          {NOTIF_CATEGORIES.map((cat) => (
            <NotifRow
              key={cat.id}
              category={cat}
              enabled={prefs[cat.id]}
              onToggle={toggleCategory}
            />
          ))}
        </View>

        <View style={[styles.infoBox, { backgroundColor: theme.colors.surfaceMuted, borderColor: theme.colors.border }]}>
          <Text style={[styles.infoBoxText, { color: theme.colors.textMuted }]}>
            📣 Announcement notifications always send a system push — even if you turn them off here.
            You can disable all push notifications from your phone's system settings.
          </Text>
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    fontFamily: "PlusJakartaSans_700Bold",
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    marginTop: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  toastText: {
    fontSize: 13,
    fontFamily: "PlusJakartaSans_500Medium",
    flex: 1,
  },
  scroll: {
    padding: 16,
    gap: 16,
  },
  pushCard: {
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 18,
    gap: 14,
  },
  pushCardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
  },
  pushIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  pushCardTitle: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "PlusJakartaSans_700Bold",
    marginBottom: 4,
  },
  pushCardSub: {
    fontSize: 13,
    fontFamily: "PlusJakartaSans_400Regular",
    lineHeight: 18,
  },
  pushEnableBtn: {
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: "center",
  },
  pushEnableBtnText: {
    fontSize: 14,
    fontWeight: "800",
    fontFamily: "PlusJakartaSans_700Bold",
    color: "#1A1A14",
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "800",
    fontFamily: "PlusJakartaSans_700Bold",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: -8,
  },
  sectionHint: {
    fontSize: 13,
    fontFamily: "PlusJakartaSans_400Regular",
    lineHeight: 18,
  },
  categories: {
    gap: 10,
  },
  notifRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  notifIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  notifMeta: { flex: 1 },
  notifLabel: {
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "PlusJakartaSans_700Bold",
    marginBottom: 2,
  },
  notifDesc: {
    fontSize: 12,
    fontFamily: "PlusJakartaSans_400Regular",
  },
  infoBox: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  infoBoxText: {
    fontSize: 13,
    fontFamily: "PlusJakartaSans_400Regular",
    lineHeight: 19,
  },
});
