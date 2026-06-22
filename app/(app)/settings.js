import { useTheme } from "../../theme/ThemeProvider.js";
import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import {
  User,
  Bell,
  Lock,
  LogOut,
  ChevronRight,
  RefreshCw,
} from "lucide-react-native";
import { Screen, NeuCard, PrimaryButton } from "../../components/index.js";
import { useSessionStore } from "../../lib/auth.js";

function SettingsItem({ icon: Icon, title, onPress, subtitle }) {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  return (
    <TouchableOpacity style={styles.settingsItem} onPress={onPress}>
      <View style={styles.settingsIconContainer}>
        <Icon size={20} color={theme.colors.brand} />
      </View>
      <View style={styles.settingsTextContainer}>
        <Text style={styles.settingsTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingsSubtitle}>{subtitle}</Text>}
      </View>
      <ChevronRight size={20} color={theme.colors.textSubtle} />
    </TouchableOpacity>
  );
}

function SettingsSection({ title, children }) {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <NeuCard style={styles.sectionCard}>{children}</NeuCard>
    </View>
  );
}

export default function SettingsScreen() {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const clearSession = useSessionStore((state) => state.clearSession);

  const handleSignOut = () => {
    clearSession();
    router.replace("/");
  };

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.headerTitle}>Settings</Text>

        <SettingsSection title="Account">
          <SettingsItem
            icon={User}
            title="Edit Profile"
            subtitle="Update your name, bio, and photo"
          />
          <View style={styles.divider} />
          <SettingsItem
            icon={Bell}
            title="Notifications"
            subtitle="Manage your notification preferences"
          />
        </SettingsSection>

        <SettingsSection title="Security">
          <SettingsItem
            icon={Lock}
            title="Privacy & Security"
            subtitle="Password, two-factor, and more"
          />
          <View style={styles.divider} />
          <SettingsItem
            icon={RefreshCw}
            title="App Updates"
            subtitle="Check GitHub Releases for the latest APK"
            onPress={() => router.push("/(app)/updates")}
          />
        </SettingsSection>

        <View style={styles.signOutContainer}>
          <PrimaryButton
            label="Sign Out"
            variant="secondary"
            icon={<LogOut size={16} color={theme.colors.textMuted} />}
            onPress={handleSignOut}
          />
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>
    </Screen>
  );
}

const getStyles = (theme) => StyleSheet.create({
  scrollContainer: {
    paddingTop: 24,
    paddingBottom: 24,
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    fontFamily: "SpaceGrotesk_700Bold",
    color: theme.colors.text,
    marginBottom: 24,
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color: theme.colors.textSubtle,
    marginBottom: 8,
  },
  sectionCard: {
    paddingVertical: 4,
  },
  settingsItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  settingsIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  settingsTextContainer: {
    flex: 1,
  },
  settingsTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.colors.text,
  },
  settingsSubtitle: {
    fontSize: 13,
    color: theme.colors.textSubtle,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginLeft: 16,
  },
  signOutContainer: {
    marginTop: 24,
  },
});
