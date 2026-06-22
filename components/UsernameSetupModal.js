import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { User, CheckCircle2, AlertCircle } from "lucide-react-native";
import { API_URL } from "../lib/config";
import { getUserToken } from "../lib/auth";
import { postJson } from "../lib/api";
import { ModalShell } from "./ModalShell";
import { PrimaryButton } from "./PrimaryButton";
import { useTheme } from "../theme/ThemeProvider";

export default function UsernameSetupModal({
  isOpen,
  currentUsername,
  onComplete,
}) {
  const { theme } = useTheme();
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState(null);
  const [error, setError] = useState("");

  const generateSuggestions = (name) => {
    if (!name) return [];

    const cleaned = name.trim().toLowerCase().replace(/[^a-z0-9\s]/g, "");
    const parts = cleaned.split(/\s+/).filter(Boolean);

    if (parts.length === 0) return [];

    const newSuggestions = [];

    if (currentUsername) {
      newSuggestions.push(currentUsername);
    }

    if (parts.length > 0) {
      newSuggestions.push(parts.join(""));
    }

    if (parts.length >= 2) {
      newSuggestions.push(parts[0] + parts[parts.length - 1][0]);
      newSuggestions.push(parts[0][0] + parts[parts.length - 1]);
    }

    return [...new Set(newSuggestions)].slice(0, 3);
  };

  useEffect(() => {
    if (isOpen) {
      setError("");
      setSuggestions([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (fullName) {
      setSuggestions(generateSuggestions(fullName));
    } else {
      setSuggestions([]);
    }
  }, [fullName]);

  useEffect(() => {
    if (!username || username.length < 3) {
      setAvailable(null);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setChecking(true);
      try {
        await getUserToken();
        const res = await fetch(`${API_URL}/auth/check-username`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, currentUsername }),
        });
        const data = await res.json();
        setAvailable(data.available);
      } catch (err) {
        console.error("Error checking username:", err);
      } finally {
        setChecking(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [username, currentUsername]);

  const handleSubmit = async () => {
    if (!fullName.trim()) {
      setError("Please enter your full name");
      return;
    }
    if (!username.trim() || username.length < 3) {
      setError("Username must be at least 3 characters");
      return;
    }
    if (!available) {
      setError("Please choose an available username");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const token = await getUserToken();
      const res = await postJson("/auth/setup-username", {
        user_token: token,
        fullName: fullName.trim(),
        username: username.trim(),
      });

      if (res.ok) {
        onComplete();
      } else {
        const data = await res.json();
        setError(data.msg || "Failed to update username");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalShell
      visible={isOpen}
      title="Set Up Your Profile"
      subtitle="Choose a unique username for your account and profile URL."
      onClose={onComplete}
      maxWidth={460}
      footer={
        <PrimaryButton
          label={loading ? "Saving..." : "Continue"}
          onPress={handleSubmit}
          loading={loading}
          disabled={loading || !available || !fullName.trim() || username.length < 3}
        />
      }
    >
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: theme.colors.brandTint }]}>
          <User size={34} color={theme.colors.brand} />
        </View>

        <View style={styles.group}>
          <Text style={[styles.label, { color: theme.colors.text }]}>Full Name</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.colors.surfaceMuted,
                borderColor: theme.colors.border,
                color: theme.colors.text,
              },
            ]}
            value={fullName}
            onChangeText={setFullName}
            placeholder="John Doe"
            placeholderTextColor={theme.colors.textSubtle}
            autoCapitalize="words"
          />
        </View>

        <View style={styles.group}>
          <Text style={[styles.label, { color: theme.colors.text }]}>Username</Text>
          <View style={styles.usernameWrap}>
            <TextInput
              style={[
                styles.input,
                { paddingRight: 44, backgroundColor: theme.colors.surfaceMuted, borderColor: theme.colors.border, color: theme.colors.text },
              ]}
              value={username}
              onChangeText={(text) =>
                setUsername(text.toLowerCase().replace(/[^a-z0-9_]/g, ""))
              }
              placeholder="johndoe"
              placeholderTextColor={theme.colors.textSubtle}
              autoCapitalize="none"
            />
            {checking ? (
              <View style={styles.suffix}>
                <ActivityIndicator size="small" color={theme.colors.brand} />
              </View>
            ) : available === true && username.length >= 3 ? (
              <View style={styles.suffix}>
                <CheckCircle2 size={18} color={theme.colors.success} />
              </View>
            ) : available === false && username.length >= 3 ? (
              <View style={styles.suffix}>
                <AlertCircle size={18} color={theme.colors.error} />
              </View>
            ) : null}
          </View>

          {!checking && username.length >= 3 ? (
            <Text
              style={[
                styles.availabilityText,
                { color: available ? theme.colors.success : theme.colors.error },
              ]}
            >
              {available ? "Username is available" : "Username is already taken"}
            </Text>
          ) : null}

          {suggestions.length > 0 ? (
            <View style={styles.suggestions}>
              <Text style={[styles.suggestionsLabel, { color: theme.colors.textSubtle }]}>
                Suggestions
              </Text>
              <View style={styles.suggestionsList}>
                {suggestions.map((suggestion) => (
                  <Pressable
                    key={suggestion}
                    onPress={() => setUsername(suggestion)}
                    style={[
                      styles.suggestion,
                      {
                        backgroundColor: theme.colors.surfaceMuted,
                        borderColor: theme.colors.border,
                      },
                    ]}
                  >
                    <Text style={{ color: theme.colors.brand, fontWeight: "700" }}>
                      {suggestion}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}
        </View>

        {error ? (
          <View
            style={[
              styles.error,
              {
                backgroundColor:
                  theme.mode === "dark"
                    ? "rgba(248, 113, 113, 0.12)"
                    : "rgba(254, 242, 242, 0.96)",
                borderColor: theme.colors.error,
              },
            ]}
          >
            <AlertCircle size={18} color={theme.colors.error} />
            <Text style={{ flex: 1, color: theme.colors.error, fontSize: 13, lineHeight: 18 }}>
              {error}
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </ModalShell>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 18,
  },
  iconContainer: {
    width: 68,
    height: 68,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 2,
  },
  group: {
    gap: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
  },
  input: {
    width: "100%",
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderWidth: 1,
    borderRadius: 18,
    fontSize: 16,
  },
  usernameWrap: {
    position: "relative",
  },
  suffix: {
    position: "absolute",
    right: 14,
    top: 16,
  },
  availabilityText: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  suggestions: {
    gap: 8,
    marginTop: 4,
  },
  suggestionsLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  suggestionsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  suggestion: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 999,
  },
  error: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 14,
    borderWidth: 1,
    borderRadius: 18,
  },
});
