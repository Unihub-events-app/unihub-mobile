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
import { Star, X } from "lucide-react-native";
import { useTheme } from "../theme/ThemeProvider";
import { API_URL } from "../lib/config";
import { getUserToken } from "../lib/auth";

export function ReviewModal({ visible, onClose, onSuccess, eventId }) {
  const { theme } = useTheme();
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const displayed = hovered || rating;

  const handleSubmit = async () => {
    if (rating === 0) { setError("Please select a star rating."); return; }
    setError("");
    setLoading(true);
    try {
      const token = await getUserToken();
      const res = await fetch(`${API_URL}/event/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ event_id: eventId, rating, comment: comment.trim(), user_token: token }),
      });
      const data = await res.json();
      if (res.ok) {
        setRating(0);
        setComment("");
        onSuccess?.();
        onClose();
      } else {
        setError(data.msg || "Failed to submit review. Try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const ratingLabels = ["", "Poor", "Fair", "Good", "Great", "Excellent"];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: theme.colors.surface }]}>
          {/* Handle */}
          <View style={[styles.handle, { backgroundColor: theme.colors.border }]} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.colors.text }]}>Leave a Review</Text>
            <Pressable onPress={onClose} style={[styles.closeBtn, { backgroundColor: theme.colors.surfaceMuted }]} hitSlop={8}>
              <X size={16} color={theme.colors.textSubtle} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
              How was your experience at this event?
            </Text>

            {/* Star Rating */}
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Pressable
                  key={star}
                  onPress={() => { setRating(star); setError(""); }}
                  onPressIn={() => setHovered(star)}
                  onPressOut={() => setHovered(0)}
                  hitSlop={6}
                >
                  <Star
                    size={40}
                    color={star <= displayed ? "#F59E0B" : theme.colors.border}
                    fill={star <= displayed ? "#F59E0B" : "transparent"}
                  />
                </Pressable>
              ))}
            </View>

            {displayed > 0 && (
              <Text style={[styles.ratingLabel, { color: "#F59E0B" }]}>{ratingLabels[displayed]}</Text>
            )}

            {/* Comment */}
            <Text style={[styles.inputLabel, { color: theme.colors.textSubtle }]}>
              Add a comment (optional)
            </Text>
            <TextInput
              value={comment}
              onChangeText={setComment}
              placeholder="What did you love? What could be better?"
              placeholderTextColor={theme.colors.textSubtle}
              multiline
              numberOfLines={4}
              maxLength={500}
              style={[
                styles.commentInput,
                {
                  backgroundColor: theme.colors.surfaceMuted,
                  color: theme.colors.text,
                  borderColor: theme.colors.border,
                },
              ]}
            />
            <Text style={[styles.charCount, { color: theme.colors.textSubtle }]}>
              {comment.length}/500
            </Text>

            {error ? (
              <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>
            ) : null}

            {/* Submit */}
            <Pressable
              onPress={handleSubmit}
              disabled={loading || rating === 0}
              style={[
                styles.submitBtn,
                {
                  backgroundColor: rating > 0 ? theme.colors.brand : theme.colors.surfaceMuted,
                  opacity: loading ? 0.7 : 1,
                },
              ]}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#1A1A14" />
              ) : (
                <Text style={[styles.submitText, { color: rating > 0 ? "#1A1A14" : theme.colors.textSubtle }]}>
                  Submit Review
                </Text>
              )}
            </Pressable>
          </ScrollView>
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
    paddingBottom: Platform.OS === "ios" ? 44 : 28,
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
    justifyContent: "space-between",
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: "900",
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
    fontSize: 14,
    fontFamily: "PlusJakartaSans_400Regular",
    marginBottom: 24,
    lineHeight: 21,
  },
  starsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginBottom: 12,
  },
  ratingLabel: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "PlusJakartaSans_700Bold",
    textAlign: "center",
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 12,
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  commentInput: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    fontSize: 14,
    fontFamily: "PlusJakartaSans_400Regular",
    textAlignVertical: "top",
    minHeight: 100,
    lineHeight: 21,
  },
  charCount: {
    fontSize: 11,
    fontFamily: "PlusJakartaSans_400Regular",
    textAlign: "right",
    marginTop: 4,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 13,
    fontFamily: "PlusJakartaSans_500Medium",
    marginBottom: 12,
    textAlign: "center",
  },
  submitBtn: {
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  submitText: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "PlusJakartaSans_700Bold",
  },
});
