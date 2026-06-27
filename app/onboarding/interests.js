import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Platform,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import { Sparkles, ChevronRight } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../theme/ThemeProvider.js";
import { getUserToken } from "../../lib/auth.js";
import { API_URL } from "../../lib/config.js";

const STATUS_BAR_HEIGHT = Platform.OS === "android" ? StatusBar.currentHeight || 24 : 44;

const INTERESTS = [
  "Music", "Tech", "Sports", "Art", "Food", "Travel",
  "Gaming", "Fashion", "Health", "Business", "Education",
  "Photography", "Film", "Comedy", "Politics", "Science",
  "Literature", "Networking",
];

export default function OnboardingInterests() {
  const router = useRouter();
  const { theme } = useTheme();
  const [selected, setSelected] = useState([]);
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const toggle = (interest) => {
    setSelected((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  };

  const handleContinue = async () => {
    if (selected.length < 3) { setError("Please select at least 3 interests."); return; }
    setError("");
    setLoading(true);
    try {
      const token = await getUserToken();
      await fetch(`${API_URL}/user/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ interests: selected, user_token: token }),
      });
      router.replace("/onboarding/university");
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { paddingTop: STATUS_BAR_HEIGHT + 20 }]}>
        <View style={[styles.iconWrap, { backgroundColor: theme.colors.brandTint }]}>
          <Sparkles size={24} color={theme.colors.brand} />
        </View>
        <Text style={[styles.title, { color: theme.colors.text }]}>What are you into?</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
          Pick at least 3 interests to personalize your UniHub experience.
        </Text>
        <View style={[styles.progressBar, { backgroundColor: theme.colors.surfaceMuted }]}>
          <View style={[styles.progressFill, { backgroundColor: theme.colors.brand, width: "33%" }]} />
        </View>
        <Text style={[styles.stepLabel, { color: theme.colors.textSubtle }]}>Step 1 of 3</Text>
      </View>

      <ScrollView contentContainerStyle={styles.pillsContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.pillsWrap}>
          {INTERESTS.map((interest) => {
            const active = selected.includes(interest);
            return (
              <Pressable
                key={interest}
                onPress={() => toggle(interest)}
                style={[styles.pill, {
                  backgroundColor: active ? theme.colors.brand : theme.colors.surface,
                  borderColor: active ? theme.colors.brand : theme.colors.border,
                }]}
              >
                <Text style={[styles.pillText, { color: active ? "#1A1A14" : theme.colors.textMuted }]}>
                  {interest}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) + 8, borderTopColor: theme.colors.border }]}>
        {error ? <Text style={[styles.error, { color: "#DC2626" }]}>{error}</Text> : null}
        <Text style={[styles.countNote, { color: theme.colors.textSubtle }]}>
          {selected.length} selected{selected.length < 3 ? ` — ${3 - selected.length} more required` : " ✓"}
        </Text>
        <Pressable
          onPress={handleContinue}
          disabled={loading}
          style={[styles.continueBtn, {
            backgroundColor: selected.length >= 3 ? theme.colors.brand : theme.colors.surfaceMuted,
            opacity: loading ? 0.8 : 1,
          }]}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#1A1A14" />
          ) : (
            <>
              <Text style={[styles.continueBtnText, { color: selected.length >= 3 ? "#1A1A14" : theme.colors.textSubtle }]}>Continue</Text>
              <ChevronRight size={18} color={selected.length >= 3 ? "#1A1A14" : theme.colors.textSubtle} />
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    alignItems: "flex-start",
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    fontFamily: "SpaceGrotesk_700Bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: "PlusJakartaSans_400Regular",
    lineHeight: 22,
    marginBottom: 20,
  },
  progressBar: {
    width: "100%",
    height: 4,
    borderRadius: 2,
    marginBottom: 6,
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  stepLabel: {
    fontSize: 12,
    fontFamily: "PlusJakartaSans_500Medium",
  },
  pillsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  pillsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  pill: {
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 100,
    borderWidth: 1.5,
  },
  pillText: {
    fontSize: 14,
    fontFamily: "PlusJakartaSans_500Medium",
    fontWeight: "500",
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    gap: 10,
  },
  error: {
    fontSize: 13,
    fontFamily: "PlusJakartaSans_500Medium",
    textAlign: "center",
  },
  countNote: {
    fontSize: 13,
    fontFamily: "PlusJakartaSans_400Regular",
    textAlign: "center",
  },
  continueBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 18,
  },
  continueBtnText: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "PlusJakartaSans_700Bold",
  },
});
