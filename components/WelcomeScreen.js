import { useMemo } from "react";
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Sparkles, LogIn, UserPlus, CalendarDays, MapPinned, BellRing, ChevronRight } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useTheme } from "../theme/ThemeProvider";

const HIGHLIGHTS = [
  { icon: CalendarDays, label: "Events that fit your campus rhythm" },
  { icon: MapPinned, label: "Browse nearby and private event access" },
  { icon: BellRing, label: "Stay synced with updates and reminders" },
];

export function WelcomeScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { width, height } = useWindowDimensions();
  const landscape = width > height;

  const palette = useMemo(
    () =>
      theme.mode === "dark"
        ? ["#07101b", "#0d1724", "#111f31"]
        : ["#f7fbff", "#edf5ff", "#e3efff"],
    [theme.mode],
  );

  return (
    <LinearGradient colors={palette} style={styles.wrap}>
      <View style={styles.orbTop} />
      <View style={styles.orbBottom} />

      <View style={[styles.shell, landscape && styles.shellLandscape]}>
        <View style={styles.heroColumn}>
          <View style={styles.brandRow}>
            <View
              style={[
                styles.logoMark,
                {
                  backgroundColor:
                    theme.mode === "dark"
                      ? "rgba(96,165,250,0.14)"
                      : "rgba(219,234,254,0.92)",
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <Sparkles size={28} color={theme.colors.brand} />
            </View>
            <Text style={[styles.eyebrow, { color: theme.colors.textSubtle }]}>
              UniHub
            </Text>
          </View>

          <View style={styles.headlineBlock}>
            <Text style={[styles.title, { color: theme.colors.text }]}>Discover events.</Text>
            <View style={[styles.titlePillWrap, { backgroundColor: theme.colors.brand }]}>
              <Text style={styles.titlePillText}>Meet people.</Text>
            </View>
            <Text style={[styles.title, { color: theme.colors.text }]}>Move faster.</Text>
          </View>

          <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
            Join UniHub to browse campus events, save your feed, and manage your next move from one place.
          </Text>

          <View style={styles.ctaStack}>
            <Pressable
              onPress={() => router.push("/(auth)/signup")}
              style={({ pressed }) => [
                styles.primaryCta,
                {
                  backgroundColor: theme.colors.brand,
                  shadowColor: theme.colors.brand,
                  opacity: pressed ? 0.96 : 1,
                },
              ]}
            >
              <UserPlus size={18} color="#fff" />
              <Text style={styles.primaryText}>Create Account</Text>
              <ChevronRight size={16} color="#fff" />
            </Pressable>
            <Pressable
              onPress={() => router.push("/(auth)/signin")}
              style={({ pressed }) => [
                styles.secondaryCta,
                {
                  backgroundColor:
                    theme.mode === "dark"
                      ? "rgba(255,255,255,0.04)"
                      : "rgba(255,255,255,0.84)",
                  borderColor: theme.colors.border,
                  opacity: pressed ? 0.92 : 1,
                },
              ]}
            >
              <LogIn size={18} color={theme.colors.brand} />
              <Text style={[styles.secondaryText, { color: theme.colors.text }]}>
                Log In
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.posterColumn}>
          <View
            style={[
              styles.poster,
              {
                backgroundColor:
                  theme.mode === "dark"
                    ? "rgba(15,24,38,0.94)"
                    : "rgba(255,255,255,0.88)",
                borderColor: theme.colors.border,
              },
            ]}
          >
            <View style={styles.posterTop}>
              <View style={[styles.posterBadge, { backgroundColor: theme.colors.brandTint }]}>
                <Text style={{ color: theme.colors.brand, fontSize: 12, fontWeight: "800" }}>
                  Personalized
                </Text>
              </View>
              <View style={styles.posterDots}>
                <View style={[styles.posterDot, { backgroundColor: theme.colors.brand }]} />
                <View style={[styles.posterDot, { backgroundColor: theme.colors.border }]} />
                <View style={[styles.posterDot, { backgroundColor: theme.colors.border }]} />
              </View>
            </View>

            <View style={styles.heroVisual}>
              <View style={styles.cardCluster}>
                <View style={[styles.clusterCard, styles.cardA]} />
                <View style={[styles.clusterCard, styles.cardB]} />
                <View style={[styles.clusterCard, styles.cardC]} />
              </View>
            </View>

            <View style={styles.previewList}>
              {HIGHLIGHTS.map(({ icon: Icon, label }) => (
                <View
                  key={label}
                  style={[
                    styles.highlightRow,
                    { borderBottomColor: theme.colors.border },
                  ]}
                >
                  <View
                    style={[
                      styles.highlightIcon,
                      { backgroundColor: theme.colors.brandTint },
                    ]}
                  >
                    <Icon size={16} color={theme.colors.brand} />
                  </View>
                  <Text style={[styles.highlightText, { color: theme.colors.textMuted }]}>
                    {label}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    padding: 18,
    overflow: "hidden",
  },
  shell: {
    flex: 1,
    justifyContent: "center",
    gap: 24,
  },
  shellLandscape: {
    flexDirection: "row",
    alignItems: "center",
  },
  heroColumn: {
    flex: 1,
    justifyContent: "center",
    gap: 18,
    paddingTop: 24,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.8,
    textTransform: "uppercase",
  },
  logoMark: {
    width: 66,
    height: 66,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 40,
    lineHeight: 44,
    fontWeight: "800",
    letterSpacing: -1.6,
    maxWidth: 360,
  },
  headlineBlock: {
    gap: 8,
    maxWidth: 380,
  },
  titlePillWrap: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  titlePillText: {
    color: "#fff",
    fontSize: 32,
    lineHeight: 34,
    fontWeight: "800",
    letterSpacing: -1.6,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
    maxWidth: 360,
  },
  ctaStack: {
    gap: 12,
    marginTop: 10,
  },
  primaryCta: {
    minHeight: 54,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.22,
    shadowRadius: 24,
    elevation: 6,
  },
  primaryText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
  secondaryCta: {
    minHeight: 54,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
    borderWidth: 1,
  },
  secondaryText: {
    fontSize: 16,
    fontWeight: "800",
  },
  posterColumn: {
    flex: 1,
    justifyContent: "center",
  },
  poster: {
    borderRadius: 34,
    borderWidth: 1,
    padding: 18,
    gap: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.16,
    shadowRadius: 30,
    elevation: 8,
  },
  posterTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  posterBadge: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  posterDots: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  posterDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
  },
  heroVisual: {
    marginTop: 4,
    marginBottom: 2,
  },
  cardCluster: {
    height: 184,
    borderRadius: 26,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "rgba(96,165,250,0.08)",
  },
  clusterCard: {
    position: "absolute",
    borderRadius: 24,
    borderWidth: 1,
  },
  cardA: {
    top: 14,
    left: 14,
    width: "58%",
    height: 100,
    backgroundColor: "rgba(96,165,250,0.24)",
  },
  cardB: {
    top: 28,
    right: 14,
    width: "34%",
    height: 80,
    backgroundColor: "rgba(37,99,235,0.22)",
  },
  cardC: {
    bottom: 18,
    left: 28,
    right: 28,
    height: 74,
    backgroundColor: "rgba(255,255,255,0.22)",
  },
  previewList: {
    gap: 12,
    marginTop: 4,
  },
  highlightRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  highlightIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  highlightText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
  },
  orbTop: {
    position: "absolute",
    top: -110,
    right: -70,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(96,165,250,0.14)",
  },
  orbBottom: {
    position: "absolute",
    bottom: -110,
    left: -90,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "rgba(37,99,235,0.12)",
  },
});
