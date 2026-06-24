import { useEffect, useMemo, useState } from "react";
import { View, Text, Pressable, StyleSheet, Platform, Image, Modal, TouchableOpacity, TouchableWithoutFeedback } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { usePathname, router } from "expo-router";
import { Home, Users, FolderOpen, Wallet, Bell, User, Calendar, Settings, LogOut } from "lucide-react-native";
import { NeuCard } from "./index.js";
import { useSessionStore } from "../lib/auth.js";
import { API_URL } from "../lib/config.js";
import { useTheme } from "../theme/ThemeProvider.js";

const NAV_ITEMS = [
  { icon: Home, label: "Home", path: "/(app)/dashboard", match: "/dashboard" },
  { icon: Users, label: "Discover", path: "/(app)/community", match: "/community" },
  { icon: FolderOpen, label: "Library", path: "/(app)/event-library", match: "/event-library" },
  { icon: Wallet, label: "Wallet", path: "/(app)/wallet", match: "/wallet" },
];

export function UserNavBar() {
  const pathname = usePathname();
  const token = useSessionStore((state) => state.userToken);
  const { theme } = useTheme();
  const [userData, setUserData] = useState({});
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;

      try {
        const userRes = await fetch(`${API_URL}/user/details`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({}),
        });
        if (userRes.ok) {
          const data = await userRes.json();
          setUserData(data);
        }
      } catch {}

      try {
        const notifRes = await fetch(`${API_URL}/notifications/user`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({}),
        });
        if (notifRes.ok) {
          const data = await notifRes.json();
          setUnreadCount(data.unreadCount || 0);
        }
      } catch {}
    };

    fetchData();
  }, [token, pathname]);

  const totalBadge = unreadCount;
  const displayName = useMemo(
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
      <View style={[styles.topNav, { backgroundColor: theme.colors.background }]}>
        <Pressable onPress={() => { if (!pathname.includes("/dashboard")) router.push("/(app)/dashboard"); }} style={{ marginLeft: -12 }}>
          <Image
            source={theme.colors.mode === "dark" ? require("../assets/images/unihub-logo.png") : require("../assets/images/unihub-logo-blue.png")}
            style={{ height: 28, width: 100 }}
            resizeMode="contain"
          />
        </Pressable>
        <View style={styles.topNavRight}>
          <Pressable
            style={styles.iconBtn}
            onPress={() => router.push("/(app)/notifications")}
          >
            <Bell size={22} color={theme.colors.textMuted} />
            {totalBadge > 0 && (
              <View style={[styles.badge, { backgroundColor: theme.colors.error, borderColor: theme.colors.background }]}>
                <Text style={styles.badgeText}>{totalBadge > 9 ? "9+" : totalBadge}</Text>
              </View>
            )}
          </Pressable>
          <Pressable
            style={styles.userBtn}
            onPress={() => setShowDropdown(true)}
          >
            <View style={[styles.avatarPlaceholder, { backgroundColor: theme.colors.surfaceMuted }]}>
              {userData?.avatar ? (
                 <Image source={{ uri: userData.avatar }} style={styles.avatarImage} />
              ) : (
                <Text style={[styles.avatarText, { color: theme.colors.brand }]}>{userInitials}</Text>
              )}
            </View>
          </Pressable>
        </View>
      </View>

      {/* Profile Dropdown Modal */}
      <Modal visible={showDropdown} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setShowDropdown(false)}>
          <View style={styles.dropdownOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.dropdownMenu, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <View style={[styles.dropdownHeader, { borderBottomColor: theme.colors.border }]}>
                  <View style={[styles.dropdownAvatar, { backgroundColor: theme.colors.surfaceMuted }]}>
                    {userData?.avatar ? (
                      <Image source={{ uri: userData.avatar }} style={styles.avatarImage} />
                    ) : (
                      <Text style={[styles.avatarText, { color: theme.colors.brand }]}>{userInitials}</Text>
                    )}
                  </View>
                  <View style={styles.dropdownUserInfo}>
                    <Text style={[styles.dropdownName, { color: theme.colors.text }]} numberOfLines={1}>{displayName}</Text>
                    <Text style={[styles.dropdownEmail, { color: theme.colors.textSubtle }]} numberOfLines={1}>{userData?.email}</Text>
                  </View>
                </View>

                <TouchableOpacity style={styles.dropdownItem} onPress={() => { setShowDropdown(false); router.push("/(app)/profile"); }}>
                  <User size={18} color={theme.colors.text} />
                  <Text style={[styles.dropdownItemText, { color: theme.colors.text }]}>My Profile</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.dropdownItem} onPress={() => { setShowDropdown(false); router.push("/(app)/eventform"); }}>
                  <Calendar size={18} color={theme.colors.text} />
                  <Text style={[styles.dropdownItemText, { color: theme.colors.text }]}>Create Event</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.dropdownItem} onPress={() => { setShowDropdown(false); router.push("/(app)/settings"); }}>
                  <Settings size={18} color={theme.colors.text} />
                  <Text style={[styles.dropdownItemText, { color: theme.colors.text }]}>Settings</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.dropdownItem, { marginTop: 8, borderTopWidth: 1, borderTopColor: theme.colors.border }]} onPress={() => { setShowDropdown(false); setShowLogoutModal(true); }}>
                  <LogOut size={18} color={theme.colors.error} />
                  <Text style={[styles.dropdownItemText, { color: theme.colors.error }]}>Logout</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Logout Confirmation Modal */}
      <Modal visible={showLogoutModal} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setShowLogoutModal(false)}>
          <View style={[styles.modalOverlay, { backgroundColor: theme.colors.overlay }]}>
            <TouchableWithoutFeedback>
            <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
                <View style={[styles.logoutIconContainer, { backgroundColor: theme.mode === "dark" ? "rgba(248, 113, 113, 0.12)" : "#fef2f2" }]}>
                  <LogOut size={32} color="#ef4444" />
                </View>
                <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Logout</Text>
                <Text style={[styles.modalMessage, { color: theme.colors.textSubtle }]}>
                  Are you sure you want to logout? You'll need to sign in again to access your account.
                </Text>
                <View style={styles.modalButtons}>
                  <TouchableOpacity style={[styles.modalButton, { backgroundColor: theme.colors.surfaceMuted }]} onPress={() => setShowLogoutModal(false)}>
                    <Text style={[styles.modalButtonText, { color: theme.colors.text }]}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.modalButton, { backgroundColor: "#ef4444" }]} onPress={handleLogout}>
                    <Text style={[styles.modalButtonText, { color: "#fff" }]}>Logout</Text>
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

export function UserBottomNav() {
  const pathname = usePathname();
  const { theme } = useTheme();

  const isActive = (match) => pathname.includes(match);

  return (
    <SafeAreaView style={styles.bottomNavContainer} edges={["bottom"]}>
      <NeuCard
        style={[
          styles.bottomNav,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
        ]}
      >
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.match);
          return (
            <Pressable
              key={item.label}
              style={[styles.navItem, active && { backgroundColor: theme.colors.surfaceElevated }]}
              onPress={() => { if (!active) router.push(item.path); }}
            >
              <item.icon size={20} color={active ? theme.colors.brand : theme.colors.textSubtle} />
              <Text style={[styles.navLabel, { color: active ? theme.colors.brand : theme.colors.textSubtle }]}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </NeuCard>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  topNav: {
    width: "100%",
    minHeight: 70,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingTop: Platform.OS === "ios" ? 10 : 0,
  },
  topNavRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconBtn: {
    position: "relative",
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: 4,
    right: 4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: "white",
  },
  userBtn: {
    width: 36,
    height: 36,
  },
  avatarPlaceholder: {
    width: "100%",
    height: "100%",
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  avatarText: {
    fontSize: 14,
    fontWeight: "700",
  },
  dropdownOverlay: {
    flex: 1,
    backgroundColor: "transparent",
  },
  dropdownMenu: {
    position: "absolute",
    top: Platform.OS === "ios" ? 100 : 70,
    right: 16,
    width: 240,
    borderRadius: 20,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
  },
  dropdownHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    marginBottom: 8,
  },
  dropdownAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginRight: 12,
  },
  dropdownUserInfo: {
    flex: 1,
  },
  dropdownName: {
    fontSize: 14,
    fontWeight: "700",
  },
  dropdownEmail: {
    fontSize: 12,
    marginTop: 2,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  dropdownItemText: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalContent: {
    width: "100%",
    maxWidth: 320,
    borderRadius: 28,
    padding: 24,
    alignItems: "center",
  },
  logoutIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#fef2f2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    fontFamily: "SpaceGrotesk_700Bold",
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: "700",
  },
  bottomNavContainer: {
    paddingHorizontal: 18,
    paddingBottom: 18,
    width: "100%",
  },
  bottomNav: {
    paddingVertical: 10,
    paddingHorizontal: 6,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    borderRadius: 26,
  },
  navItem: {
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 18,
  },
  navLabel: {
    fontSize: 10,
    fontWeight: "700",
    marginTop: 4,
  },
});
