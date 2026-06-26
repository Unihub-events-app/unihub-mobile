import { useEffect, useRef, useState } from "react";
import { router } from "expo-router";
import {
  View,
  Text,
  Pressable,
  TextInput,
  StyleSheet,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import {
  Mail, Lock, Eye, EyeOff, ArrowRight, CheckCircle2, AlertCircle,
  Bell, TrendingUp, CalendarDays,
} from "lucide-react-native";
import { Screen, TextField, PrimaryButton } from "../../components";
import { useTheme } from "../../theme/ThemeProvider";
import { radius } from "../../theme/tokens";
import { useSessionStore } from "../../lib/auth";
import { API_URL } from "../../lib/config";

const SLIDES = [
  { icon: CalendarDays, title: "Welcome Back", desc: "Securely access your account and pick up where you left off." },
  { icon: Bell, title: "Stay Connected", desc: "Never miss an event. Real-time updates keep you in the loop." },
  { icon: TrendingUp, title: "Track Everything", desc: "Monitor your registrations and ticket sales from one place." },
];

const STEP_TITLES = ["", "Sign In", "Enter Password", "Verify Login", "You're in!"];
const STEP_DESCS = [
  "",
  "Enter your email or username to continue.",
  "Enter your password to sign in.",
  "We sent a 6-digit code to your email.",
  "Heading to your dashboard…",
];

export default function SignInScreen() {
  const { theme } = useTheme();
  const { height: SCREEN_HEIGHT } = useWindowDimensions();
  const userToken = useSessionStore((state) => state.userToken);
  const setUserToken = useSessionStore((state) => state.setUserToken);
  const [step, setStep] = useState(1);
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState({ error: "", success: "" });
  const [activeSlide, setActiveSlide] = useState(0);
  const otpRefs = useRef([]);

  useEffect(() => {
    const id = setInterval(() => setActiveSlide((p) => (p + 1) % SLIDES.length), 4500);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (userToken) {
      setStep(4);
      setTimeout(() => router.replace("/(app)/dashboard"), 1500);
    }
  }, [userToken]);

  const handleOtpChange = (val, idx) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    const next = [...otpDigits];
    next[idx] = digit;
    setOtpDigits(next);
    if (digit && idx < 5) otpRefs.current[idx + 1]?.focus();
  };

  const handleOtpKeyPress = (e, idx) => {
    if (e.nativeEvent.key === "Backspace" && !otpDigits[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus();
    }
  };

  async function handleVerifyEmail() {
    setMessage({ error: "", success: "" });
    if (!emailOrUsername.trim()) {
      setMessage({ error: "Please enter your email or username.", success: "" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/check-user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailOrUsername.includes("@") ? emailOrUsername : undefined,
          username: !emailOrUsername.includes("@") ? emailOrUsername : undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.email && data.email !== emailOrUsername) setEmail(data.email);
        else setEmail(emailOrUsername);
        if (data.hasPassword) {
          setStep(2);
        } else {
          await handleSendOTP(data.email || emailOrUsername);
        }
      } else {
        setMessage({ error: data.msg || "Failed to verify user", success: "" });
        if (data.msg?.toLowerCase().includes("not found") || data.msg?.toLowerCase().includes("not registered")) {
          setTimeout(() => setMessage({ error: "Redirecting you to sign up…", success: "" }), 1500);
          setTimeout(() => router.push("/(auth)/signup"), 2500);
        }
      }
    } catch {
      setMessage({ error: "Network error. Please try again.", success: "" });
    } finally {
      setLoading(false);
    }
  }

  async function handleSendOTP(userEmail) {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/signin/otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail || email }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ error: "", success: data.msg || "Verification code sent!" });
        setOtpDigits(["", "", "", "", "", ""]);
        setStep(3);
      } else {
        setMessage({ error: data.msg || "Failed to send code", success: "" });
      }
    } catch {
      setMessage({ error: "Network error. Please try again.", success: "" });
    } finally {
      setLoading(false);
    }
  }

  async function handlePasswordSubmit() {
    setMessage({ error: "", success: "" });
    if (!password.trim()) {
      setMessage({ error: "Please enter your password.", success: "" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/signin/password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        const token = data.accessToken || data.user?.user_token;
        if (!token) {
          setMessage({ error: "Authentication error. Please try again.", success: "" });
          return;
        }
        await setUserToken(token);
        setMessage({ error: "", success: data.msg || "Login successful!" });
        setStep(4);
        setTimeout(() => router.replace("/(app)/dashboard"), 1500);
      } else {
        setMessage({ error: data.msg || "Invalid password", success: "" });
      }
    } catch {
      setMessage({ error: "Network error. Please try again.", success: "" });
    } finally {
      setLoading(false);
    }
  }

  async function handleOTPSubmit() {
    setMessage({ error: "", success: "" });
    const otp = otpDigits.join("");
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/signin/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (res.ok) {
        const token = data.accessToken || data.user?.user_token;
        if (!token) {
          setMessage({ error: "Authentication error. Please try again.", success: "" });
          return;
        }
        await setUserToken(token);
        setMessage({ error: "", success: data.msg || "Verified!" });
        setStep(4);
        setTimeout(() => router.replace(data.needsPasswordSetup ? "/users/setup-password" : "/(app)/dashboard"), 1500);
      } else {
        setMessage({ error: data.msg || "Invalid code", success: "" });
      }
    } catch {
      setMessage({ error: "Something went wrong. Please try again.", success: "" });
    } finally {
      setLoading(false);
    }
  }

  const CurrentSlideIcon = SLIDES[activeSlide].icon;
  const topH = SCREEN_HEIGHT * 0.42;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.colors.brand }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Brand top section */}
      <View style={[styles.topSection, { height: topH }]}>
        {/* Logo */}
        <View style={styles.logoRow}>
          <Pressable
            style={styles.backPill}
            onPress={() => (step === 2 || step === 3 ? setStep(1) : router.push("/"))}
          >
            <Text style={styles.backPillText}>{step === 2 || step === 3 ? "← Back" : "← Home"}</Text>
          </Pressable>
          <Text style={[styles.stepBadge]}>
            {step < 4 ? `${step} / 3` : "✓"}
          </Text>
        </View>

        {/* Feature slide */}
        <Animated.View
          entering={FadeInUp.duration(400)}
          style={styles.slideContent}
          key={activeSlide}
        >
          <View style={styles.slideIconWrap}>
            <CurrentSlideIcon color="#1A1A14" size={32} />
          </View>
          <Text style={styles.slideTitle}>{SLIDES[activeSlide].title}</Text>
          <Text style={styles.slideDesc}>{SLIDES[activeSlide].desc}</Text>
        </Animated.View>

        {/* Pagination dots */}
        <View style={styles.pagination}>
          {SLIDES.map((_, i) => (
            <Pressable key={i} onPress={() => setActiveSlide(i)}>
              <View
                style={[
                  styles.paginationDot,
                  { width: i === activeSlide ? 24 : 6, backgroundColor: i === activeSlide ? "#1A1A14" : "rgba(26,26,20,0.3)" },
                ]}
              />
            </Pressable>
          ))}
        </View>
      </View>

      {/* White bottom panel */}
      <ScrollView
        style={[styles.bottomPanel, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={{ paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Tab row */}
        <View style={[styles.tabRow, { borderBottomColor: theme.colors.border }]}>
          <View style={styles.tabActive}>
            <Text style={[styles.tabActiveText, { color: theme.colors.text }]}>Log In</Text>
            <View style={[styles.tabIndicator, { backgroundColor: theme.colors.brand }]} />
          </View>
          <Pressable onPress={() => router.replace("/(auth)/signup")}>
            <Text style={[styles.tabInactiveText, { color: theme.colors.textSubtle }]}>Sign Up</Text>
          </Pressable>
        </View>

        {/* Form */}
        <Animated.View
          entering={FadeInUp.duration(400)}
          style={[styles.formCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
        >
          <Text style={[styles.formTitle, { color: theme.colors.text }]}>
            {STEP_TITLES[step]}
          </Text>
          <Text style={[styles.formSubtitle, { color: theme.colors.textMuted }]}>
            {step === 2 ? `Signing in as ${email}.` : STEP_DESCS[step]}
          </Text>

          {message.error ? (
            <View style={[styles.alertBox, { backgroundColor: "rgba(220,38,38,0.08)", borderColor: theme.colors.error }]}>
              <AlertCircle size={15} color={theme.colors.error} />
              <Text style={[styles.alertText, { color: theme.colors.error }]}>{message.error}</Text>
            </View>
          ) : null}
          {message.success ? (
            <View style={[styles.alertBox, { backgroundColor: "rgba(61,158,74,0.08)", borderColor: theme.colors.success }]}>
              <CheckCircle2 size={15} color={theme.colors.success} />
              <Text style={[styles.alertText, { color: theme.colors.success }]}>{message.success}</Text>
            </View>
          ) : null}

          {step === 1 && (
            <View style={{ gap: 14 }}>
              <TextField
                label="Email or Username"
                value={emailOrUsername}
                onChangeText={setEmailOrUsername}
                placeholder="janedoe@mail.com or @username"
                autoCapitalize="none"
                leftIcon={<Mail size={18} color={theme.colors.textSubtle} />}
              />
              <PrimaryButton
                label={loading ? "Checking…" : "Continue"}
                onPress={handleVerifyEmail}
                loading={loading}
                icon={!loading ? <ArrowRight size={17} color="#1A1A14" /> : null}
              />
              <View style={styles.dividerRow}>
                <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
                <Text style={[styles.dividerText, { color: theme.colors.textSubtle }]}>or</Text>
                <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
              </View>
              <Pressable
                style={[styles.socialBtn, { backgroundColor: theme.colors.surfaceMuted, borderColor: theme.colors.border }]}
                onPress={() => require("react-native").Alert.alert("Coming soon", "Google Sign In will be available in a future update.")}
              >
                <Text style={[styles.socialBtnText, { color: theme.colors.text }]}>G  Continue with Google</Text>
              </Pressable>
              <Pressable onPress={() => router.push("/(auth)/signup")}>
                <Text style={[styles.switchText, { color: theme.colors.textMuted }]}>
                  No account?{" "}
                  <Text style={{ color: theme.colors.brand, fontWeight: "700" }}>Create one</Text>
                </Text>
              </Pressable>
            </View>
          )}

          {step === 2 && (
            <View style={{ gap: 14 }}>
              <TextField
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="Your password"
                secureTextEntry={!showPassword}
                leftIcon={<Lock size={18} color={theme.colors.textSubtle} />}
                rightIcon={
                  <Pressable onPress={() => setShowPassword((v) => !v)}>
                    {showPassword
                      ? <EyeOff size={18} color={theme.colors.textSubtle} />
                      : <Eye size={18} color={theme.colors.textSubtle} />}
                  </Pressable>
                }
              />
              <Pressable onPress={() => handleSendOTP()}>
                <Text style={[styles.linkText, { color: theme.colors.brand }]}>Use OTP instead</Text>
              </Pressable>
              <PrimaryButton label={loading ? "Signing in…" : "Sign In"} onPress={handlePasswordSubmit} loading={loading} />
            </View>
          )}

          {step === 3 && (
            <View style={{ gap: 14 }}>
              <View style={styles.otpHeader}>
                <Text style={[styles.otpLabel, { color: theme.colors.text }]}>Verification Code</Text>
                <Pressable onPress={() => handleSendOTP()}>
                  <Text style={[styles.linkText, { color: theme.colors.brand }]}>Resend</Text>
                </Pressable>
              </View>
              <View style={styles.otpRow}>
                {otpDigits.map((digit, i) => (
                  <TextInput
                    key={i}
                    ref={(r) => (otpRefs.current[i] = r)}
                    value={digit}
                    onChangeText={(v) => handleOtpChange(v, i)}
                    onKeyPress={(e) => handleOtpKeyPress(e, i)}
                    keyboardType="number-pad"
                    autoCapitalize="none"
                    maxLength={1}
                    style={[styles.otpBox, {
                      backgroundColor: theme.colors.surfaceMuted,
                      borderColor: digit ? theme.colors.brand : theme.colors.border,
                      color: theme.colors.text,
                    }]}
                    textAlign="center"
                    selectTextOnFocus
                  />
                ))}
              </View>
              <PrimaryButton
                label={loading ? "Verifying…" : "Verify & Sign In"}
                onPress={handleOTPSubmit}
                loading={loading}
              />
            </View>
          )}

          {step === 4 && (
            <View style={styles.successState}>
              <View style={[styles.successIcon, { backgroundColor: theme.colors.brandTint }]}>
                <CheckCircle2 size={36} color={theme.colors.brand} />
              </View>
              <Text style={[styles.successTitle, { color: theme.colors.text }]}>You're in!</Text>
              <Text style={[styles.successSub, { color: theme.colors.textMuted }]}>Taking you to your dashboard…</Text>
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  topSection: {
    paddingHorizontal: 24,
    paddingTop: 52,
    justifyContent: "space-between",
    paddingBottom: 28,
  },
  logoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  backPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: "rgba(26,26,20,0.14)",
    borderRadius: 99,
  },
  backPillText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1A1A14",
    fontFamily: "PlusJakartaSans_700Bold",
  },
  stepBadge: {
    fontSize: 12,
    fontWeight: "800",
    color: "rgba(26,26,20,0.6)",
    fontFamily: "PlusJakartaSans_700Bold",
    letterSpacing: 0.5,
  },
  slideContent: {
    alignItems: "center",
    gap: 8,
    flex: 1,
    justifyContent: "center",
  },
  slideIconWrap: {
    width: 72,
    height: 72,
    borderRadius: radius.xl,
    backgroundColor: "rgba(26,26,20,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  slideTitle: {
    fontFamily: "Limelight_400Regular",
    fontSize: 30,
    color: "#1A1A14",
    textAlign: "center",
    letterSpacing: -0.3,
  },
  slideDesc: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 14,
    color: "rgba(26,26,20,0.65)",
    textAlign: "center",
    lineHeight: 21,
    maxWidth: 280,
  },
  pagination: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  paginationDot: {
    height: 6,
    borderRadius: 3,
  },

  bottomPanel: {
    flex: 1,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  tabRow: {
    flexDirection: "row",
    gap: 24,
    marginBottom: 16,
    paddingBottom: 0,
    borderBottomWidth: 1,
  },
  tabActive: {
    paddingBottom: 12,
    alignItems: "center",
  },
  tabActiveText: {
    fontSize: 15,
    fontWeight: "700",
    fontFamily: "PlusJakartaSans_700Bold",
  },
  tabIndicator: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 2.5,
    borderRadius: 2,
  },
  tabInactiveText: {
    fontSize: 15,
    fontWeight: "500",
    fontFamily: "PlusJakartaSans_500Medium",
    paddingBottom: 12,
  },
  formCard: {
    width: "100%",
    padding: 20,
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: 4,
  },
  formTitle: {
    fontFamily: "SpaceGrotesk_700Bold",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 2,
  },
  formSubtitle: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 13,
    marginBottom: 14,
    lineHeight: 19,
  },
  alertBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: 10,
  },
  alertText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "PlusJakartaSans_500Medium",
  },
  linkText: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "PlusJakartaSans_600SemiBold",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 12,
    fontFamily: "PlusJakartaSans_400Regular",
  },
  socialBtn: {
    paddingVertical: 13,
    borderRadius: radius.xxl,
    borderWidth: 1,
    alignItems: "center",
  },
  socialBtnText: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "PlusJakartaSans_600SemiBold",
  },
  switchText: {
    textAlign: "center",
    fontSize: 13,
    fontFamily: "PlusJakartaSans_400Regular",
  },
  otpHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  otpLabel: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "PlusJakartaSans_600SemiBold",
  },
  otpRow: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between",
  },
  otpBox: {
    flex: 1,
    height: 52,
    borderRadius: radius.md,
    borderWidth: 2,
    fontSize: 20,
    fontWeight: "800",
  },
  successState: {
    paddingVertical: 20,
    alignItems: "center",
    gap: 8,
  },
  successIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  successTitle: {
    fontFamily: "SpaceGrotesk_700Bold",
    fontSize: 22,
    fontWeight: "700",
  },
  successSub: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 13,
  },
});
