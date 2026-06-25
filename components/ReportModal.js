import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { X, AlertTriangle, Check } from "lucide-react-native";
import { useTheme } from "../theme/ThemeProvider";
import { API_URL } from "../lib/config";
import { getUserToken } from "../lib/auth";

const REPORT_CATEGORIES = [
  { key: "spam", label: "Spam" },
  { key: "harassment", label: "Harassment" },
  { key: "fake", label: "Fake Account" },
  { key: "inappropriate", label: "Inappropriate Content" },
  { key: "other", label: "Other" },
];

export function ReportModal({ visible, onClose, targetId, targetType = "user", targetName }) {
  const { theme } = useTheme();
  const [category, setCategory] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!category) { setError("Please select a reason."); return; }
    setError("");
    setLoading(true);
    try {
      const token = await getUserToken();
      const res = await fetch(`${API_URL}/reports/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          target_id: targetId,
          target_type: targetType,
          category,
          note: note.trim(),
          user_token: token,
        }),
      });
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          setCategory("");
          setNote("");
          onClose();
        }, 1800);
      } else {
        const data = await res.json();
        setError(data.msg || "Report failed. Try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCategory("");
    setNote("");
    setError("");
    setSuccess(false);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView style={styles.backdrop} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={handleClose} />
        <View style={[styles.sheet, { backgroundColor: theme.colors.surface }]}>
          <View style={[styles.handle, { backgroundColor: theme.colors.border }]} />

          <View style={styles.header}>
            <View style={[styles.iconWrap, { backgroundColor: "rgba(220,38,38,0.1)" }]}>
              <AlertTriangle size={20} color="#DC2626" />
            </View>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              Report {targetName ? `@${targetName}` : targetType}
            </Text>
            <Pressable onPress={handleClose} style={[styles.closeBtn, { backgroundColor: theme.colors.surfaceMuted }]} hitSlop={8}>
              <X size={16} color={theme.colors.textSubtle} />
            </Pressable>
          </View>

          {success ? (
            <View style={styles.successWrap}>
              <View style={[styles.successIcon, { backgroundColor: "rgba(61,158,74,0.12)" }]}>
                <Check size={32} color="#3D9E4A" />
              </View>
              <Text style={[styles.successTitle, { color: theme.colors.text }]}>Report Submitted</Text>
              <Text style={[styles.successSub, { color: theme.colors.textMuted }]}>
                Thanks for keeping UniHub safe. We'll review this within 24 hours.
              </Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
                Why are you reporting this? Your report is anonymous.
              </Text>

              <View style={styles.categories}>
                {REPORT_CATEGORIES.map((cat) => (
                  <Pressable
                    key={cat.key}
                    onPress={() => { setCategory(cat.key); setError(""); }}
                    style={[
                      styles.catPill,
                      {
                        backgroundColor: category === cat.key ? "rgba(220,38,38,0.1)" : theme.colors.surfaceMuted,
                        borderColor: category === cat.key ? "#DC2626" : theme.colors.border,
                      },
                    ]}
                  >
                    {category === cat.key && <Check size={12} color="#DC2626" strokeWidth={3} />}
                    <Text style={[styles.catText, { color: category === cat.key ? "#DC2626" : theme.colors.textMuted }]}>
                      {cat.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={[styles.noteLabel, { color: theme.colors.textSubtle }]}>Additional details (optional)</Text>
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder="Provide more context..."
                placeholderTextColor={theme.colors.textSubtle}
                multiline
                numberOfLines={3}
                maxLength={300}
                style={[styles.noteInput, {
                  backgroundColor: theme.colors.surfaceMuted,
                  color: theme.colors.text,
                  borderColor: theme.colors.border,
                }]}
              />

              {error ? <Text style={[styles.error, { color: "#DC2626" }]}>{error}</Text> : null}

              <Pressable
                onPress={handleSubmit}
                disabled={loading || !category}
                style={[styles.submitBtn, {
                  backgroundColor: category ? "#DC2626" : theme.colors.surfaceMuted,
                  opacity: loading ? 0.7 : 1,
                }]}
              >
                {loading
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={[styles.submitText, { color: category ? "#fff" : theme.colors.textSubtle }]}>Submit Report</Text>}
              </Pressable>
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: Platform.OS === "ios" ? 44 : 24,
    maxHeight: "85%",
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: "800",
    fontFamily: "SpaceGrotesk_700Bold",
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  subtitle: {
    fontSize: 13,
    fontFamily: "PlusJakartaSans_400Regular",
    lineHeight: 19,
    marginBottom: 16,
  },
  categories: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },
  catPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 100,
    borderWidth: 1.5,
  },
  catText: {
    fontSize: 13,
    fontFamily: "PlusJakartaSans_500Medium",
    fontWeight: "500",
  },
  noteLabel: {
    fontSize: 11,
    fontWeight: "700",
    fontFamily: "PlusJakartaSans_700Bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  noteInput: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    fontSize: 14,
    fontFamily: "PlusJakartaSans_400Regular",
    textAlignVertical: "top",
    minHeight: 80,
    marginBottom: 12,
  },
  error: {
    fontSize: 13,
    fontFamily: "PlusJakartaSans_500Medium",
    marginBottom: 12,
    textAlign: "center",
  },
  submitBtn: {
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 4,
  },
  submitText: {
    fontSize: 15,
    fontWeight: "700",
    fontFamily: "PlusJakartaSans_700Bold",
  },
  successWrap: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 12,
  },
  successIcon: {
    width: 68,
    height: 68,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  successTitle: {
    fontSize: 20,
    fontWeight: "800",
    fontFamily: "SpaceGrotesk_700Bold",
  },
  successSub: {
    fontSize: 14,
    fontFamily: "PlusJakartaSans_400Regular",
    textAlign: "center",
    lineHeight: 21,
  },
});
