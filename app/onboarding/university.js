import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Platform,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import { GraduationCap, ChevronRight, Search, Check } from "lucide-react-native";
import { useTheme } from "../../theme/ThemeProvider.js";
import { getUserToken } from "../../lib/auth.js";
import { API_URL } from "../../lib/config.js";

const STATUS_BAR_HEIGHT = Platform.OS === "android" ? StatusBar.currentHeight || 24 : 44;

export default function OnboardingUniversity() {
  const router = useRouter();
  const { theme } = useTheme();
  const [query, setQuery] = useState("");
  const [universities, setUniversities] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API_URL}/universities/all`)
      .then((r) => r.json())
      .then((data) => {
        let list = [];
        if (Array.isArray(data)) {
          list = data;
        } else if (data && typeof data === "object") {
          // server returns { Nigeria: [...], Ghana: [...], ... }
          list = Object.values(data).flat();
        }
        list = list.map((u) => (typeof u === "string" ? u : u.name || u.university || "")).filter(Boolean);
        setUniversities(list);
        setFiltered(list.slice(0, 30));
      })
      .catch(() => setError("Could not load universities."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!query.trim()) { setFiltered(universities.slice(0, 30)); return; }
    const q = query.toLowerCase();
    setFiltered(universities.filter((u) => {
      const name = typeof u === "string" ? u : u.name || u.university || "";
      return name.toLowerCase().includes(q);
    }).slice(0, 40));
  }, [query, universities]);

  const getName = (u) => (typeof u === "string" ? u : u.name || u.university || "");

  const handleContinue = async () => {
    if (!selected) { setError("Please select your university."); return; }
    setError("");
    setSaving(true);
    try {
      const token = await getUserToken();
      await fetch(`${API_URL}/user/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ university: getName(selected), user_token: token }),
      });
      router.replace("/onboarding/photo");
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { paddingTop: STATUS_BAR_HEIGHT + 20 }]}>
        <View style={[styles.iconWrap, { backgroundColor: theme.colors.brandTint }]}>
          <GraduationCap size={24} color={theme.colors.brand} />
        </View>
        <Text style={[styles.title, { color: theme.colors.text }]}>Your University</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
          Find events and communities at your school.
        </Text>
        <View style={[styles.progressBar, { backgroundColor: theme.colors.surfaceMuted }]}>
          <View style={[styles.progressFill, { backgroundColor: theme.colors.brand, width: "66%" }]} />
        </View>
        <Text style={[styles.stepLabel, { color: theme.colors.textSubtle }]}>Step 2 of 3</Text>
      </View>

      {/* Search box */}
      <View style={[styles.searchWrap, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <Search size={16} color={theme.colors.textSubtle} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search your university..."
          placeholderTextColor={theme.colors.textSubtle}
          style={[styles.searchInput, { color: theme.colors.text }]}
          autoCapitalize="words"
        />
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={theme.colors.brand} /></View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" style={{ flex: 1 }}>
          {filtered.map((u, i) => {
            const name = getName(u);
            const isSelected = getName(selected) === name;
            return (
              <Pressable
                key={i}
                onPress={() => { setSelected(u); setError(""); }}
                style={[styles.uniRow, {
                  backgroundColor: isSelected ? theme.colors.brandTint : theme.colors.surface,
                  borderColor: isSelected ? theme.colors.brand : theme.colors.border,
                }]}
              >
                <Text style={[styles.uniName, { color: theme.colors.text, flex: 1 }]} numberOfLines={2}>{name}</Text>
                {isSelected && <Check size={18} color={theme.colors.brand} strokeWidth={2.5} />}
              </Pressable>
            );
          })}
          {filtered.length === 0 && !loading && (
            <Text style={[styles.noResults, { color: theme.colors.textSubtle }]}>No universities found</Text>
          )}
        </ScrollView>
      )}

      <View style={[styles.footer, { paddingBottom: Platform.OS === "ios" ? 40 : 24, borderTopColor: theme.colors.border }]}>
        {error ? <Text style={[styles.error, { color: "#DC2626" }]}>{error}</Text> : null}
        {selected && (
          <Text style={[styles.selectedNote, { color: theme.colors.brand }]}>Selected: {getName(selected)}</Text>
        )}
        <View style={styles.footerBtns}>
          <Pressable onPress={() => router.replace("/onboarding/photo")} style={[styles.skipBtn, { borderColor: theme.colors.border }]}>
            <Text style={[styles.skipBtnText, { color: theme.colors.textMuted }]}>Skip</Text>
          </Pressable>
          <Pressable
            onPress={handleContinue}
            disabled={saving}
            style={[styles.continueBtn, {
              backgroundColor: selected ? theme.colors.brand : theme.colors.surfaceMuted,
              opacity: saving ? 0.8 : 1,
              flex: 1,
            }]}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#1A1A14" />
            ) : (
              <>
                <Text style={[styles.continueBtnText, { color: selected ? "#1A1A14" : theme.colors.textSubtle }]}>Continue</Text>
                <ChevronRight size={18} color={selected ? "#1A1A14" : theme.colors.textSubtle} />
              </>
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 12,
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
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginHorizontal: 20,
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: "PlusJakartaSans_400Regular",
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  uniRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderLeftWidth: 3,
    gap: 12,
  },
  uniName: {
    fontSize: 14,
    fontFamily: "PlusJakartaSans_500Medium",
    lineHeight: 20,
  },
  noResults: {
    textAlign: "center",
    paddingVertical: 40,
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 14,
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
  selectedNote: {
    fontSize: 13,
    fontFamily: "PlusJakartaSans_600SemiBold",
    textAlign: "center",
  },
  footerBtns: {
    flexDirection: "row",
    gap: 12,
  },
  skipBtn: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  skipBtnText: {
    fontSize: 14,
    fontFamily: "PlusJakartaSans_600SemiBold",
  },
  continueBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 15,
    borderRadius: 18,
  },
  continueBtnText: {
    fontSize: 15,
    fontWeight: "700",
    fontFamily: "PlusJakartaSans_700Bold",
  },
});
