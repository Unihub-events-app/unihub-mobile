import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Lock } from "lucide-react-native";
import { useTheme } from "../theme/ThemeProvider";

const BADGES = [
  { id: "first_event", emoji: "🎉", label: "First Event", desc: "Attended your first event", check: (u) => (u.eventsAttended || 0) >= 1 },
  { id: "power_host", emoji: "🏆", label: "Power Host", desc: "Hosted 5+ events", check: (u) => (u.eventsHosted || 0) >= 5 },
  { id: "social_butterfly", emoji: "🦋", label: "Social Butterfly", desc: "10+ followers", check: (u) => (u.followersCount || 0) >= 10 },
  { id: "regular", emoji: "⭐", label: "Regular", desc: "Attended 5+ events", check: (u) => (u.eventsAttended || 0) >= 5 },
  { id: "community_leader", emoji: "👑", label: "Community Leader", desc: "Created a community", check: (u) => (u.communitiesCreated || 0) >= 1 },
  { id: "early_adopter", emoji: "🚀", label: "Early Adopter", desc: "Joined UniHub early", check: (u) => {
    if (!u.createdAt) return false;
    return new Date(u.createdAt) < new Date("2025-01-01");
  }},
];

export function BadgeRow({ user }) {
  const { theme } = useTheme();

  if (!user) return null;

  const earned = BADGES.filter((b) => b.check(user));
  const locked = BADGES.filter((b) => !b.check(user));

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: theme.colors.textSubtle }]}>ACHIEVEMENTS</Text>
      <View style={styles.grid}>
        {earned.map((badge) => (
          <View key={badge.id} style={[styles.badge, { backgroundColor: theme.colors.surface, borderColor: theme.colors.brand }]}>
            <Text style={styles.badgeEmoji}>{badge.emoji}</Text>
            <Text style={[styles.badgeLabel, { color: theme.colors.text }]} numberOfLines={1}>{badge.label}</Text>
            <Text style={[styles.badgeDesc, { color: theme.colors.textSubtle }]} numberOfLines={2}>{badge.desc}</Text>
          </View>
        ))}
        {locked.map((badge) => (
          <View key={badge.id} style={[styles.badge, styles.badgeLocked, { backgroundColor: theme.colors.surfaceMuted, borderColor: theme.colors.border, opacity: 0.45 }]}>
            <Lock size={18} color={theme.colors.textSubtle} style={{ marginBottom: 4 }} />
            <Text style={[styles.badgeLabel, { color: theme.colors.textSubtle }]} numberOfLines={1}>{badge.label}</Text>
          </View>
        ))}
      </View>
      {earned.length === 0 && (
        <Text style={[styles.emptyNote, { color: theme.colors.textSubtle }]}>Attend events to earn your first badge!</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 8 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    fontFamily: "PlusJakartaSans_700Bold",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 10,
    marginLeft: 2,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  badge: {
    width: "30%",
    flexGrow: 1,
    maxWidth: "32%",
    alignItems: "center",
    padding: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 4,
  },
  badgeLocked: {},
  badgeEmoji: {
    fontSize: 26,
    marginBottom: 4,
  },
  badgeLabel: {
    fontSize: 12,
    fontWeight: "700",
    fontFamily: "PlusJakartaSans_700Bold",
    textAlign: "center",
  },
  badgeDesc: {
    fontSize: 10,
    fontFamily: "PlusJakartaSans_400Regular",
    textAlign: "center",
    lineHeight: 13,
  },
  emptyNote: {
    fontSize: 12,
    fontFamily: "PlusJakartaSans_400Regular",
    textAlign: "center",
    marginTop: 8,
  },
});
