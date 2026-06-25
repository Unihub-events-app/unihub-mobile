import { useEffect, useMemo, useState } from "react";
import {
  Image, Modal, Platform, Pressable, StyleSheet,
  Text, TouchableOpacity, TouchableWithoutFeedback, View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { usePathname, router } from "expo-router";
import { Home, Users, BookOpen, Wallet, Bell, User, Calendar, Settings, LogOut } from "lucide-react-native";
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from "react-native-reanimated";
import { useSessionStore } from "../lib/auth.js";
import { API_URL } from "../lib/config.js";
import { useTheme } from "../theme/ThemeProvider.js";
import { springs, radius, spacing } from "../theme/tokens.js";

const NAV_ITEMS = [
  { icon: Home,     label: "Home",     path: "/(app)/dashboard",    match: "/dashboard"    },
  { icon: Users,    label: "Community", path: "/(app)/community",   match: "/community"    },
  { icon: BookOpen, label: "Library",  path: "/(app)/event-library", match: "/event-library" },
  { icon: Wallet,   label: "Wallet",   path: "/(app)/wallet",       match: "/wallet"       },
];

export function UserNavBar() {
  const pathname  = usePathname();
  const token     = useSessionStore((state) => state.userToken);
  const { theme } = useTheme();
  const [userData,    setUserData]    = useState({});
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown,    setShowDropdown]    = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    if (!token) return;
    const fetchData = async () => {
      try {
        const res = await fetch(`${API_URL}/user/details`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({}),
        });
        if (res.ok) setUserData(await res.json());
      } catch {}

      try {
        const res = await fetch(`${API_URL}/notifications/user`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({}),
        });
        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.unreadCount || 0);
        }
      } catch {}
    };
    fetchData();
  }, [token, pathname]);

  const displayName  = useMemo(
    () => userData?.fullname || userData?.name || userData?.username || "User",
    [userData]
  );
  const userInitials = userData?.username
    ? userData.username.charAt(0).toUpperCase()
    : displayName.charAt(0).toUpperCase();

  const handleLogout = async () => {
    setShowLogoutModal(false);
    await useSessionStore.getState().clearSession();
    router.replace("/(auth)/signin");
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={["top"]}>
      {/* Top bar */}
      <View style={[styles.topNav, { backgroundColor: theme.colors.background }]}>
        <Pressable
          onPress={() => { if (!pathname.includes("/dashboard")) router.push("/(app)/dashboard"); }}
          accessibilityLabel="UniHub home"
        >
          <Image
            source={
              theme.mode === "dark"
                ? require("../assets/images/unihub-logo.png")
                : require("../assets/images/unihub-logo-blue.png")
            }
            style={styles.logo}
            resizeMode="contain"
          />
        </Pressable>

        <View style={styles.topRight}>
          <Pressable
            style={[styles.iconCircle, { backgroundColor: theme.colors.surfaceMuted }]}
            onPress={() => router.push("/(app)/notifications")}
            accessibilityLabel="Notifications"
          >
            <Bell size={20} color={theme.colors.textMuted} />
            {unreadCount > 0 && (
              <View style={[styles.badge, { backgroundColor: theme.colors.error }]}>
                <Text style={styles.badgeText}>{unreadCount > 9 ? "9+" : unreadCount}</Text>
              </View>
            )}
          </Pressable>

          <Pressable
            style={[styles.avatarWrap, { backgroundColor: theme.colors.brandTint }]}
            onPress={() => setShowDropdown(true)}
            accessibilityLabel="Profile menu"
          >
            {userData?.avatar ? (
              <Image source={{ uri: userData.avatar }} style={styles.avatarImage} />
            ) : (
              <Text style={[styles.avatarText, { color: theme.colors.brand }]}>{userInitials}</Text>
            )}
          </Pressable>
        </View>
      </View>

      {/* Profile dropdown */}
      <Modal visible={showDropdown} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setShowDropdown(false)}>
          <View style={styles.dropdownOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.dropdownMenu, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <View style={[styles.dropdownHeader, { borderBottomColor: theme.colors.border }]}>
                  <View style={[styles.dropdownAvatar, { backgroundColor: theme.colors.brandTint }]}>
                    {userData?.avatar
                      ? <Image source={{ uri: userData.avatar }} style={styles.avatarImage} />
                      : <Text style={[styles.avatarText, { color: theme.colors.brand }]}>{userInitials}</Text>
                    }
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.dropdownName,  { color: theme.colors.text }]}     numberOfLines={1}>{displayName}</Text>
                    <Text style={[styles.dropdownEmail, { color: theme.colors.textSubtle }]} numberOfLines={1}>{userData?.email}</Text>
                  </View>
                </View>

                {[
                  { icon: User,     label: "My Profile",    path: "/(app)/profile"    },
                  { icon: Calendar, label: "Create Event",   path: "/(app)/eventform"  },
                  { icon: Settings, label: "Settings",       path: "/(app)/settings"   },
                ].map(({ icon: Icon, label, path }) => (
                  <TouchableOpacity
                    key={label}
                    style={styles.dropdownItem}
                    onPress={() => { setShowDropdown(false); router.push(path); }}
                  >
                    <Icon size={18} color={theme.colors.text} />
                    <Text style={[styles.dropdownItemText, { color: theme.colors.text }]}>{label}</Text>
                  </TouchableOpacity>
                ))}

                <TouchableOpacity
                  style={[styles.dropdownItem, styles.dropdownDanger, { borderTopColor: theme.colors.border }]}
                  onPress={() => { setShowDropdown(false); setShowLogoutModal(true); }}
                >
                  <LogOut size={18} color={theme.colors.error} />
                  <Text style={[styles.dropdownItemText, { color: theme.colors.error }]}>Logout</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Logout confirm */}
      <Modal visible={showLogoutModal} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setShowLogoutModal(false)}>
          <View style={[styles.modalOverlay, { backgroundColor: theme.colors.overlay }]}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
                <View style={[styles.logoutIcon, { backgroundColor: theme.colors.errorTint }]}>
                  <LogOut size={28} color={theme.colors.error} />
                </View>
                <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Log out?</Text>
                <Text style={[styles.modalMsg, { color: theme.colors.textSubtle }]}>
                  You'll need to sign in again to access your account.
                </Text>
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalBtn, { backgroundColor: theme.colors.surfaceMuted }]}
                    onPress={() => setShowLogoutModal(false)}
                  >
                    <Text style={[styles.modalBtnText, { color: theme.colors.text }]}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalBtn, { backgroundColor: theme.colors.error }]}
                    onPress={handleLogout}
                  >
                    <Text style={[styles.modalBtnText, { color: "#fff" }]}>Log out</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}

function NavItem({ item, active, theme }) {
  const scale = useSharedValue(1);
  const Icon  = item.icon;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn  = () => { scale.value = withSpring(0.82, springs.bouncy); };
  const handlePressOut = () => { scale.value = withSpring(1.00, springs.bouncy); };

  const iconColor  = active ? theme.colors.navActive      : theme.colors.navText;
  const labelColor = active ? theme.colors.navActive      : theme.colors.navText;
  const iconWeight = active ? 2.5 : 1.8;

  return (
    <Pressable
      onPress={() => { if (!active) router.push(item.path); }}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityLabel={item.label}
      accessibilityRole="button"
      style={styles.navItem}
    >
      <Animated.View style={[styles.navItemInner, animatedStyle]}>
        <Icon size={24} color={iconColor} strokeWidth={iconWeight} />
        <Text style={[styles.navLabel, { color: labelColor }]}>{item.label}</Text>
      </Animated.View>
    </Pressable>
  );
}

export function UserBottomNav() {
  const pathname  = usePathname();
  const { theme } = useTheme();
  const insets    = useSafeAreaInsets();
  const isActive  = (match) => pathname.includes(match);

  return (
    <View style={[styles.bottomNavOuter, { paddingBottom: insets.bottom + 8 }]}>
      <View style={[styles.bottomNav, { backgroundColor: theme.colors.navSurface }]}>
        {NAV_ITEMS.map((item) => (
          <NavItem key={item.label} item={item} active={isActive(item.match)} theme={theme} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Top bar
  container: { width: "100%" },
  topNav: {
    minHeight: 64,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.page,
    paddingTop: Platform.OS === "ios" ? 6 : 0,
  },
  logo: { height: 26, width: 96 },
  topRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconCircle: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: "center", justifyContent: "center",
  },
  badge: {
    position: "absolute", top: 4, right: 4,
    minWidth: 17, height: 17, borderRadius: 9,
    paddingHorizontal: 3,
    alignItems: "center", justifyContent: "center",
  },
  badgeText: { fontSize: 9, fontWeight: "800", color: "#fff" },
  avatarWrap: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: "center", justifyContent: "center", overflow: "hidden",
  },
  avatarImage: { width: "100%", height: "100%", resizeMode: "cover" },
  avatarText: { fontSize: 15, fontWeight: "700" },

  // Dropdown
  dropdownOverlay: { flex: 1, backgroundColor: "transparent" },
  dropdownMenu: {
    position: "absolute",
    top: Platform.OS === "ios" ? 96 : 68,
    right: 16,
    width: 240,
    borderRadius: radius.lg,
    padding: 8,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 10,
  },
  dropdownHeader: {
    flexDirection: "row", alignItems: "center",
    padding: 12, borderBottomWidth: 1, marginBottom: 6,
  },
  dropdownAvatar: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: "center", justifyContent: "center",
    overflow: "hidden", marginRight: 12,
  },
  dropdownName:  { fontSize: 14, fontWeight: "700", lineHeight: 20 },
  dropdownEmail: { fontSize: 12, marginTop: 1, lineHeight: 17 },
  dropdownItem:  {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingVertical: 11, paddingHorizontal: 12, borderRadius: radius.sm,
  },
  dropdownDanger: { marginTop: 4, borderTopWidth: 1 },
  dropdownItemText: { fontSize: 14, fontWeight: "600", lineHeight: 20 },

  // Logout modal
  modalOverlay: {
    flex: 1, alignItems: "center", justifyContent: "center", padding: 24,
  },
  modalContent: {
    width: "100%", maxWidth: 320, borderRadius: radius.xl,
    padding: 24, alignItems: "center",
  },
  logoutIcon: {
    width: 60, height: 60, borderRadius: 30,
    alignItems: "center", justifyContent: "center", marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20, fontWeight: "700", fontFamily: "SpaceGrotesk_700Bold",
    marginBottom: 8, lineHeight: 26,
  },
  modalMsg: {
    fontSize: 14, textAlign: "center", lineHeight: 21, marginBottom: 24,
    fontFamily: "PlusJakartaSans_400Regular",
  },
  modalButtons: { flexDirection: "row", gap: 12, width: "100%" },
  modalBtn: {
    flex: 1, paddingVertical: 14, borderRadius: radius.xxl,
    alignItems: "center", justifyContent: "center",
  },
  modalBtnText: { fontSize: 14, fontWeight: "700", fontFamily: "PlusJakartaSans_700Bold" },

  // Bottom nav
  bottomNavOuter: {
    paddingHorizontal: 16,
    width: "100%",
  },
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    borderRadius: radius.xxl,
    paddingVertical: 10,
    paddingHorizontal: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.24,
    shadowRadius: 24,
    elevation: 14,
  },
  navItem: {
    flex: 1,
    alignItems: "center",
  },
  navItemInner: {
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  navLabel: {
    fontSize: 11,
    fontWeight: "600",
    fontFamily: "PlusJakartaSans_600SemiBold",
    lineHeight: 14,
    letterSpacing: 0.1,
  },
});
