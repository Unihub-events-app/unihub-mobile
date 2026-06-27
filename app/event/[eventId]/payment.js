import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  Linking,
  Platform,
  StatusBar,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  CreditCard,
  Wallet,
  ChevronRight,
  Ticket,
} from "lucide-react-native";
import { useTheme } from "../../../theme/ThemeProvider.js";
import { radius, spacing } from "../../../theme/tokens.js";
import { API_URL } from "../../../lib/config.js";
import { getUserToken } from "../../../lib/auth.js";

const STATUS_BAR_HEIGHT = Platform.OS === "android" ? StatusBar.currentHeight || 24 : 44;

export default function PaymentScreen() {
  const { eventId } = useLocalSearchParams();
  const router = useRouter();
  const { theme } = useTheme();

  const [event, setEvent] = useState(null);
  const [userWallet, setUserWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("paystack");
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const init = async () => {
      try {
        const token = await getUserToken();

        const [eventRes, walletRes] = await Promise.all([
          fetch(`${API_URL}/event/getevent`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ event_id: eventId }),
          }),
          token
            ? fetch(`${API_URL}/wallet/info`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ user_token: token }),
              })
            : Promise.resolve(null),
        ]);

        if (eventRes.ok) {
          const data = await eventRes.json();
          setEvent(data);
          if (data.ticketTypes?.length > 0) {
            setSelectedTicket(data.ticketTypes[0]);
          }
          const initialAnswers = {};
          (data.registrationQuestions || []).forEach((q) => {
            initialAnswers[q._id || q.question] = "";
          });
          setAnswers(initialAnswers);
        }

        if (walletRes?.ok) {
          const wData = await walletRes.json();
          setUserWallet(wData.wallet);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    if (eventId) init();
  }, [eventId]);

  const handlePayment = async () => {
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

      if (paymentMethod === "wallet") {
        const res = await fetch(`${API_URL}/payment`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            user_token: token,
            event: { event_id: eventId },
            product: selectedTicket,
            provider: "wallet",
            ticketType: selectedTicket,
            answers: answersArray,
          }),
        });

        const data = await res.json();

        if (data.status === "success") {
          setResult("success");
        } else if (data.status === "insufficient_funds") {
          setError("Insufficient wallet balance. Please top up or pay with card.");
        } else if (data.status === "alreadyregistered") {
          setResult("already");
        } else {
          setError(data.msg || "Payment failed. Please try again.");
        }
      } else {
        // Paystack — initialize then open payment URL
        const res = await fetch(`${API_URL}/wallet/initialize`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            user_token: token,
            amount: Number(selectedTicket?.price) * 100,
            metadata: {
              event_id: eventId,
              ticket_type: selectedTicket?.name,
              payment_type: "ticket",
            },
          }),
        });

        const data = await res.json();

        if (data.authorization_url) {
          await Linking.openURL(data.authorization_url);
          Alert.alert(
            "Complete Payment",
            "After completing payment in your browser, come back here to verify.",
            [
              {
                text: "I've Paid",
                onPress: async () => {
                  if (data.reference) {
                    await verifyPaystackPayment(token, data.reference, answersArray);
                  }
                },
              },
              { text: "Cancel", style: "cancel" },
            ]
          );
        } else {
          setError("Could not initialize payment. Please try again.");
        }
      }
    } catch (e) {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const verifyPaystackPayment = async (token, reference, answersArray) => {
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_token: token,
          event: { event_id: eventId },
          product: selectedTicket,
          provider: "paystack",
          paystackReference: reference,
          ticketType: selectedTicket,
          answers: answersArray,
        }),
      });

      const data = await res.json();
      if (data.status === "success") {
        setResult("success");
      } else {
        setError(data.msg || "Payment verification failed.");
      }
    } catch (e) {
      setError("Could not verify payment. Contact support if charged.");
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
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.resultCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <View style={[styles.resultIconWrap, { backgroundColor: theme.colors.successTint }]}>
            <CheckCircle size={40} color={theme.colors.success} />
          </View>
          <Text style={[styles.resultTitle, { color: theme.colors.text }]}>
            {result === "already" ? "Already Registered" : "Ticket Confirmed!"}
          </Text>
          <Text style={[styles.resultMsg, { color: theme.colors.textMuted }]}>
            {result === "already"
              ? "You're already registered for this event."
              : "Your ticket has been confirmed. Check your email for your ticket details."}
          </Text>
          <Pressable
            style={[styles.doneBtn, { backgroundColor: theme.colors.brand }]}
            onPress={() => router.replace(`/event/${eventId}`)}
          >
            <Text style={styles.doneBtnText}>View Event</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const ticketPrice = Number(selectedTicket?.price) || 0;
  const serviceFee = Math.round(ticketPrice * 0.03);
  const total = ticketPrice + serviceFee;
  const walletBalance = userWallet?.availableBalance || 0;
  const hasEnoughBalance = walletBalance >= total;

  const questions = event?.registrationQuestions || [];

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={[styles.header, { paddingTop: STATUS_BAR_HEIGHT + 12 }]}>
        <Pressable onPress={() => router.back()} style={styles.backPill} hitSlop={8}>
          <ArrowLeft size={18} color={theme.colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Get Tickets</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Event summary */}
        <View style={[styles.summaryCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <Text style={[styles.summaryLabel, { color: theme.colors.textSubtle }]}>EVENT</Text>
          <Text style={[styles.summaryName, { color: theme.colors.text }]} numberOfLines={2}>
            {event?.name}
          </Text>
          <Text style={[styles.summaryMeta, { color: theme.colors.textMuted }]}>
            {event?.date} • {event?.time}
          </Text>
        </View>

        {/* Ticket selection */}
        {event?.ticketTypes?.length > 1 && (
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: theme.colors.textSubtle }]}>SELECT TICKET</Text>
            {event.ticketTypes.map((t, i) => (
              <Pressable
                key={i}
                onPress={() => setSelectedTicket(t)}
                style={[
                  styles.ticketOption,
                  {
                    backgroundColor: selectedTicket?.name === t.name ? theme.colors.brandTint : theme.colors.surface,
                    borderColor: selectedTicket?.name === t.name ? theme.colors.brand : theme.colors.border,
                  },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.ticketOptionName, { color: theme.colors.text }]}>{t.name}</Text>
                  {t.description ? (
                    <Text style={[styles.ticketOptionDesc, { color: theme.colors.textMuted }]} numberOfLines={1}>
                      {t.description}
                    </Text>
                  ) : null}
                </View>
                <Text style={[styles.ticketOptionPrice, { color: theme.colors.brand }]}>
                  ₦{parseInt(t.price).toLocaleString()}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* Order summary */}
        <View style={[styles.orderCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <Text style={[styles.sectionLabel, { color: theme.colors.textSubtle }]}>ORDER SUMMARY</Text>
          <View style={styles.orderRow}>
            <Text style={[styles.orderKey, { color: theme.colors.textMuted }]}>{selectedTicket?.name || "Ticket"}</Text>
            <Text style={[styles.orderVal, { color: theme.colors.text }]}>₦{ticketPrice.toLocaleString()}</Text>
          </View>
          <View style={styles.orderRow}>
            <Text style={[styles.orderKey, { color: theme.colors.textMuted }]}>Service fee (3%)</Text>
            <Text style={[styles.orderVal, { color: theme.colors.text }]}>₦{serviceFee.toLocaleString()}</Text>
          </View>
          <View style={[styles.orderDivider, { backgroundColor: theme.colors.border }]} />
          <View style={styles.orderRow}>
            <Text style={[styles.orderTotalKey, { color: theme.colors.text }]}>Total</Text>
            <Text style={[styles.orderTotalVal, { color: theme.colors.brand }]}>₦{total.toLocaleString()}</Text>
          </View>
        </View>

        {/* Payment method */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: theme.colors.textSubtle }]}>PAYMENT METHOD</Text>

          <Pressable
            onPress={() => setPaymentMethod("paystack")}
            style={[
              styles.methodCard,
              {
                backgroundColor: paymentMethod === "paystack" ? theme.colors.brandTint : theme.colors.surface,
                borderColor: paymentMethod === "paystack" ? theme.colors.brand : theme.colors.border,
              },
            ]}
          >
            <View style={[styles.methodIcon, { backgroundColor: "rgba(0,180,100,0.12)" }]}>
              <CreditCard size={20} color="#00b464" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.methodName, { color: theme.colors.text }]}>Pay with Card</Text>
              <Text style={[styles.methodSub, { color: theme.colors.textSubtle }]}>Debit/credit via Paystack</Text>
            </View>
            {paymentMethod === "paystack" && <CheckCircle size={18} color={theme.colors.brand} />}
          </Pressable>

          <Pressable
            onPress={() => setPaymentMethod("wallet")}
            style={[
              styles.methodCard,
              {
                backgroundColor: paymentMethod === "wallet" ? theme.colors.brandTint : theme.colors.surface,
                borderColor: paymentMethod === "wallet" ? theme.colors.brand : theme.colors.border,
                opacity: hasEnoughBalance ? 1 : 0.6,
              },
            ]}
          >
            <View style={[styles.methodIcon, { backgroundColor: theme.colors.brandTint }]}>
              <Wallet size={20} color={theme.colors.brand} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.methodName, { color: theme.colors.text }]}>UniHub Wallet</Text>
              <Text style={[styles.methodSub, { color: hasEnoughBalance ? theme.colors.textSubtle : theme.colors.error }]}>
                Balance: ₦{walletBalance.toLocaleString()}
                {!hasEnoughBalance ? " (insufficient)" : ""}
              </Text>
            </View>
            {paymentMethod === "wallet" && <CheckCircle size={18} color={theme.colors.brand} />}
          </Pressable>
        </View>

        {/* Registration questions */}
        {questions.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: theme.colors.textSubtle }]}>REGISTRATION DETAILS</Text>
            {questions.map((q) => {
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
          style={[
            styles.payBtn,
            { backgroundColor: submitting ? theme.colors.surfaceMuted : theme.colors.brand },
          ]}
          onPress={handlePayment}
          disabled={submitting || (paymentMethod === "wallet" && !hasEnoughBalance)}
        >
          {submitting ? (
            <ActivityIndicator size="small" color={theme.colors.textOnBrand} />
          ) : (
            <>
              <Ticket size={18} color={theme.colors.textOnBrand} />
              <Text style={styles.payBtnText}>
                Pay ₦{total.toLocaleString()}
              </Text>
            </>
          )}
        </Pressable>

        <Text style={[styles.termsNote, { color: theme.colors.textSubtle }]}>
          By completing this purchase you agree to the event's terms and conditions.
        </Text>

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
    borderRadius: radius.xxl,
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
    paddingHorizontal: spacing.page,
    paddingVertical: 16,
    gap: 16,
  },
  summaryCard: {
    padding: 18,
    borderRadius: radius.lg,
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
  },
  section: {
    gap: 10,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: "800",
    fontFamily: "PlusJakartaSans_700Bold",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  ticketOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: 12,
  },
  ticketOptionName: {
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "PlusJakartaSans_600SemiBold",
  },
  ticketOptionDesc: {
    fontSize: 12,
    fontFamily: "PlusJakartaSans_400Regular",
    marginTop: 2,
  },
  ticketOptionPrice: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "SpaceGrotesk_700Bold",
  },
  orderCard: {
    padding: 18,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: 12,
  },
  orderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderKey: {
    fontSize: 14,
    fontFamily: "PlusJakartaSans_400Regular",
  },
  orderVal: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "PlusJakartaSans_600SemiBold",
  },
  orderDivider: {
    height: 1,
    marginVertical: 2,
  },
  orderTotalKey: {
    fontSize: 15,
    fontWeight: "700",
    fontFamily: "PlusJakartaSans_700Bold",
  },
  orderTotalVal: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "SpaceGrotesk_700Bold",
  },
  methodCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: 12,
  },
  methodIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  methodName: {
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "PlusJakartaSans_600SemiBold",
  },
  methodSub: {
    fontSize: 12,
    fontFamily: "PlusJakartaSans_400Regular",
    marginTop: 2,
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
    borderWidth: 1,
    borderRadius: radius.lg,
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
    borderRadius: radius.md,
    borderWidth: 1,
    backgroundColor: "rgba(220,38,38,0.06)",
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "PlusJakartaSans_500Medium",
  },
  payBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: radius.xxl,
  },
  payBtnText: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "PlusJakartaSans_700Bold",
    color: theme.colors.textOnBrand,
  },
  termsNote: {
    fontSize: 12,
    fontFamily: "PlusJakartaSans_400Regular",
    textAlign: "center",
    lineHeight: 18,
  },
  resultCard: {
    width: "100%",
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: 28,
    alignItems: "center",
    gap: 14,
  },
  resultIconWrap: {
    width: 72,
    height: 72,
    borderRadius: radius.xl,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  resultTitle: {
    fontSize: 22,
    fontWeight: "700",
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
    paddingVertical: 15,
    borderRadius: radius.xxl,
    width: "100%",
    alignItems: "center",
  },
  doneBtnText: {
    fontSize: 15,
    fontWeight: "700",
    fontFamily: "PlusJakartaSans_700Bold",
    color: theme.colors.textOnBrand,
  },
});
