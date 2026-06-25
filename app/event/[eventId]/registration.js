import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  Platform,
  StatusBar,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, CheckCircle, AlertCircle } from "lucide-react-native";
import { useTheme } from "../../../theme/ThemeProvider.js";
import { API_URL } from "../../../lib/config.js";
import { getUserToken } from "../../../lib/auth.js";

const STATUS_BAR_HEIGHT = Platform.OS === "android" ? StatusBar.currentHeight || 24 : 44;

export default function RegistrationScreen() {
  const { eventId } = useLocalSearchParams();
  const router = useRouter();
  const { theme } = useTheme();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await fetch(`${API_URL}/event/getevent`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ event_id: eventId }),
        });
        if (res.ok) {
          const data = await res.json();
          setEvent(data);
          const initialAnswers = {};
          (data.registrationQuestions || []).forEach((q) => {
            initialAnswers[q._id || q.question] = "";
          });
          setAnswers(initialAnswers);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    if (eventId) fetchEvent();
  }, [eventId]);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");
    try {
      const token = await getUserToken();
      if (!token) {
        router.push("/(auth)/signin");
        return;
      }

      const answersArray = Object.entries(answers).map(([key, value]) => ({
        question: key,
        answer: value,
      }));

      const res = await fetch(`${API_URL}/payment/free`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          user: { user_id: token },
          event: { event_id: eventId },
          answers: answersArray,
        }),
      });

      const data = await res.json();

      if (data.status === "success") {
        setResult("success");
      } else if (data.status === "alreadyregistered") {
        setResult("already");
      } else if (data.status === "waitlisted") {
        setResult("waitlist");
      } else if (data.status === "pending") {
        setResult("pending");
      } else {
        setError(data.msg || "Registration failed. Please try again.");
      }
    } catch (e) {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const styles = getStyles(theme);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.brand} />
      </View>
    );
  }

  if (result) {
    const isSuccess = result === "success" || result === "already" || result === "waitlist" || result === "pending";
    const configs = {
      success: {
        icon: CheckCircle,
        color: "#3D9E4A",
        title: "You're in!",
        message: "You've successfully registered for this event. Check your email for a confirmation.",
      },
      already: {
        icon: CheckCircle,
        color: theme.colors.brand,
        title: "Already Registered",
        message: "You're already registered for this event.",
      },
      waitlist: {
        icon: AlertCircle,
        color: "#f59e0b",
        title: "Added to Waitlist",
        message: "The event is full. You've been added to the waitlist and will be notified if a spot opens.",
      },
      pending: {
        icon: AlertCircle,
        color: "#f59e0b",
        title: "Pending Approval",
        message: "Your registration is pending host approval. You'll be notified of the decision.",
      },
    };
    const cfg = configs[result];
    const Icon = cfg.icon;

    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.resultCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <View style={[styles.resultIconWrap, { backgroundColor: `${cfg.color}18` }]}>
            <Icon size={40} color={cfg.color} />
          </View>
          <Text style={[styles.resultTitle, { color: theme.colors.text }]}>{cfg.title}</Text>
          <Text style={[styles.resultMsg, { color: theme.colors.textMuted }]}>{cfg.message}</Text>
          <Pressable
            style={[styles.doneBtn, { backgroundColor: theme.colors.brand }]}
            onPress={() => router.replace(`/event/${eventId}`)}
          >
            <Text style={styles.doneBtnText}>Back to Event</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const questions = event?.registrationQuestions || [];

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={[styles.header, { paddingTop: STATUS_BAR_HEIGHT + 12 }]}>
        <Pressable onPress={() => router.back()} style={styles.backPill} hitSlop={8}>
          <ArrowLeft size={18} color={theme.colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Register</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Event summary */}
        <View style={[styles.summaryCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <Text style={[styles.summaryLabel, { color: theme.colors.textSubtle }]}>REGISTERING FOR</Text>
          <Text style={[styles.summaryName, { color: theme.colors.text }]} numberOfLines={2}>
            {event?.name}
          </Text>
          <Text style={[styles.summaryMeta, { color: theme.colors.textMuted }]}>
            {event?.date} • {event?.time} • {event?.venue}
          </Text>
        </View>

        {/* Registration questions */}
        {questions.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: theme.colors.textSubtle }]}>REGISTRATION QUESTIONS</Text>
            {questions.map((q, i) => {
              const key = q._id || q.question;
              return (
                <View key={key} style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.colors.text }]}>
                    {q.question}
                    {q.required && <Text style={{ color: theme.colors.error }}> *</Text>}
                  </Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, color: theme.colors.text }]}
                    placeholder={q.placeholder || "Your answer"}
                    placeholderTextColor={theme.colors.textSubtle}
                    value={answers[key] || ""}
                    onChangeText={(val) => setAnswers((prev) => ({ ...prev, [key]: val }))}
                    multiline={q.type === "textarea"}
                    numberOfLines={q.type === "textarea" ? 4 : 1}
                  />
                </View>
              );
            })}
          </View>
        )}

        {error ? (
          <View style={[styles.errorCard, { borderColor: theme.colors.error }]}>
            <AlertCircle size={16} color={theme.colors.error} />
            <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>
          </View>
        ) : null}

        <Pressable
          style={[styles.submitBtn, { backgroundColor: submitting ? theme.colors.surfaceMuted : theme.colors.brand }]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#1A1A14" />
          ) : (
            <Text style={styles.submitBtnText}>Confirm Registration</Text>
          )}
        </Pressable>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const getStyles = (theme) => StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backPill: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: theme.colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    fontFamily: "PlusJakartaSans_700Bold",
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  summaryCard: {
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    gap: 6,
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: "800",
    fontFamily: "PlusJakartaSans_700Bold",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  summaryName: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "SpaceGrotesk_700Bold",
    lineHeight: 24,
  },
  summaryMeta: {
    fontSize: 13,
    fontFamily: "PlusJakartaSans_400Regular",
    lineHeight: 18,
  },
  section: {
    gap: 14,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: "800",
    fontFamily: "PlusJakartaSans_700Bold",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "PlusJakartaSans_600SemiBold",
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: "PlusJakartaSans_400Regular",
  },
  errorCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: "rgba(220,38,38,0.06)",
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "PlusJakartaSans_500Medium",
  },
  submitBtn: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "PlusJakartaSans_700Bold",
    color: "#1A1A14",
  },
  resultCard: {
    width: "100%",
    borderRadius: 24,
    borderWidth: 1,
    padding: 28,
    alignItems: "center",
    gap: 14,
  },
  resultIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  resultTitle: {
    fontSize: 22,
    fontWeight: "800",
    fontFamily: "SpaceGrotesk_700Bold",
    textAlign: "center",
  },
  resultMsg: {
    fontSize: 14,
    fontFamily: "PlusJakartaSans_400Regular",
    textAlign: "center",
    lineHeight: 21,
  },
  doneBtn: {
    marginTop: 8,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 16,
    width: "100%",
    alignItems: "center",
  },
  doneBtnText: {
    fontSize: 15,
    fontWeight: "700",
    fontFamily: "PlusJakartaSans_700Bold",
    color: "#1A1A14",
  },
});
