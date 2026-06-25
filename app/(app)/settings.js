import { useTheme } from "../../theme/ThemeProvider.js";
import React, { useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Animated,
  Linking,
} from "react-native";
import { router } from "expo-router";
import {
  User,
  Bell,
  Lock,
  LogOut,
  ChevronRight,
  RefreshCw,
  FileText,
  Shield,
  Info,
} from "lucide-react-native";
import { Screen, NeuCard, PrimaryButton } from "../../components/index.js";
import { radius, spacing } from "../../theme/tokens.js";
import { useSessionStore } from "../../lib/auth.js";
import Constants from "expo-constants";

function SettingsItem({ icon: Icon, title, onPress, subtitle, iconColor }) {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const pressIn = () => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 40 }),
      Animated.timing(opacity, { toValue: 0.7, duration: 80, useNativeDriver: true }),
    ]).start();
  };
  const pressOut = () => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 25 }),
      Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();
  };

  return (
    <Pressable onPress={onPress} onPressIn={pressIn} onPressOut={pressOut} disabled={!onPress}>
      <Animated.View
        style={[
          styles.settingsItem,
          { transform: [{ scale }], opacity },
        ]}
      >
        <View style={[styles.settingsIconContainer, iconColor && { backgroundColor: iconColor + "18" }]}>
          <Icon size={20} color={iconColor || theme.colors.brand} />
        </View>
        <View style={styles.settingsTextContainer}>
          <Text style={styles.settingsTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingsSubtitle}>{subtitle}</Text>}
        </View>
        {onPress && <ChevronRight size={20} color={theme.colors.textSubtle} />}
      </Animated.View>
    </Pressable>
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
        <Text style={styles.headerEyebrow}>Preferences</Text>
        <Text style={styles.headerTitle}>Settings</Text>

        <SettingsSection title="Account">
          <SettingsItem
            icon={User}
            title="Edit Profile"
            subtitle="Update your name, bio, and photo"
            onPress={() => router.push("/users/profile-edit")}
          />
          <View style={styles.divider} />
          <SettingsItem
            icon={Bell}
            title="Notifications"
            subtitle="Manage notification preferences"
            onPress={() => router.push("/users/notification-settings")}
          />
        </SettingsSection>

        <SettingsSection title="Security">
          <SettingsItem
            icon={Lock}
            title="Privacy & Security"
            subtitle="Password, two-factor, and more"
            onPress={() => router.push("/users/privacy-settings")}
            iconColor="#6366f1"
          />
          <View style={styles.divider} />
          <SettingsItem
            icon={RefreshCw}
            title="App Updates"
            subtitle="Check GitHub Releases for the latest APK"
            onPress={() => router.push("/(app)/updates")}
          />
        </SettingsSection>

        <SettingsSection title="Legal">
          <SettingsItem
            icon={FileText}
            title="Terms of Service"
            subtitle="Read our terms and conditions"
            onPress={() => Linking.openURL("https://tryunihub.click/terms")}
            iconColor="#0ea5e9"
          />
          <View style={styles.divider} />
          <SettingsItem
            icon={Shield}
            title="Privacy Policy"
            subtitle="How we handle your data"
            onPress={() => Linking.openURL("https://tryunihub.click/privacy")}
            iconColor="#10b981"
          />
        </SettingsSection>

        <SettingsSection title="About">
          <SettingsItem
            icon={Info}
            title="App Version"
            subtitle={`v${Constants.expoConfig?.version || Constants.manifest?.version || "1.0.0"}`}
            iconColor={theme.colors.textSubtle}
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
    paddingHorizontal: spacing.page,
  },
  headerEyebrow: {
    fontSize: 11,
    fontWeight: "700",
    fontFamily: "PlusJakartaSans_700Bold",
    color: theme.colors.textSubtle,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 4,
    lineHeight: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "700",
    fontFamily: "SpaceGrotesk_700Bold",
    color: theme.colors.text,
    letterSpacing: -0.5,
    marginBottom: 28,
    lineHeight: 38,
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    fontFamily: "PlusJakartaSans_700Bold",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    color: theme.colors.textSubtle,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sectionCard: {
    paddingVertical: 4,
    borderRadius: radius.xl,
  },
  settingsItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 14,
    borderRadius: radius.lg,
  },
  settingsIconContainer: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: theme.colors.brandTint,
    alignItems: "center",
    justifyContent: "center",
  },
  settingsTextContainer: {
    flex: 1,
  },
  settingsTitle: {
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: theme.colors.text,
  },
  settingsSubtitle: {
    fontSize: 12,
    fontFamily: "PlusJakartaSans_400Regular",
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
