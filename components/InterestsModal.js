import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Check } from "lucide-react-native";
import { getUserToken } from "../lib/auth";
import { postJson } from "../lib/api";
import { ModalShell } from "./ModalShell";
import { PrimaryButton } from "./PrimaryButton";
import { useTheme } from "../theme/ThemeProvider";

const EVENT_CATEGORIES = [
  "Tech",
  "Music",
  "Sports",
  "Workshops",
  "Meetups",
  "Festivals",
  "Conferences",
  "Competitions",
  "Hackathon",
  "Webinar",
  "Party",
  "Seminar",
  "Startup",
  "Art",
  "Gaming",
];

export default function InterestsModal({
  isOpen,
  onClose,
  currentInterests = [],
  onSave,
}) {
  const { theme } = useTheme();
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedInterests(currentInterests);
    }
  }, [isOpen, currentInterests]);

  const toggleInterest = (category) => {
    setSelectedInterests((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category],
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = await getUserToken();
      const response = await postJson("/user/update", {
        user_token: token,
        profile: { interests: selectedInterests },
      });

      if (response.ok) {
        onSave(selectedInterests);
        onClose();
      } else {
        alert("Failed to save interests. Please try again.");
      }
    } catch (error) {
      console.error("Error saving interests:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell
      visible={isOpen}
      title="Select Your Interests"
      subtitle="Choose categories to personalize your event feed."
      onClose={onClose}
      maxWidth={520}
      footer={
        <View style={styles.footer}>
          <PrimaryButton
            label="Cancel"
            variant="subtle"
            onPress={onClose}
            style={styles.footerButton}
            fullWidth={false}
          />
          <PrimaryButton
            label={saving ? "Saving..." : "Save Changes"}
            onPress={handleSave}
            loading={saving}
            style={styles.footerButton}
            fullWidth={false}
          />
        </View>
      }
    >
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.grid}>
          {EVENT_CATEGORIES.map((category) => {
            const isSelected = selectedInterests.includes(category);
            return (
              <Pressable
                key={category}
                onPress={() => toggleInterest(category)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: isSelected
                      ? theme.colors.brand
                      : theme.colors.surfaceMuted,
                    borderColor: isSelected
                      ? theme.colors.brand
                      : theme.colors.border,
                  },
                ]}
              >
                {isSelected ? <Check size={14} color="#fff" /> : null}
                <Text
                  style={[
                    styles.chipText,
                    { color: isSelected ? "#fff" : theme.colors.textMuted },
                  ]}
                >
                  {category}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View
          style={[
            styles.summary,
            {
              backgroundColor:
                theme.mode === "dark"
                  ? "rgba(37, 99, 235, 0.14)"
                  : "rgba(219, 234, 254, 0.9)",
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Text style={[styles.summaryText, { color: theme.colors.text }]}>
            {selectedInterests.length}{" "}
            {selectedInterests.length === 1 ? "interest" : "interests"} selected
          </Text>
        </View>
        {saving ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={theme.colors.brand} />
            <Text style={{ color: theme.colors.textSubtle, fontSize: 12 }}>Saving preferences...</Text>
          </View>
        ) : null}
      </ScrollView>
    </ModalShell>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 16,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "700",
  },
  summary: {
    marginTop: 4,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderRadius: 18,
  },
  summaryText: {
    fontSize: 14,
    fontWeight: "700",
  },
  footer: {
    flexDirection: "row",
    gap: 12,
  },
  footerButton: {
    flex: 1,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingTop: 4,
  },
});
