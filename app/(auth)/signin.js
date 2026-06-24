import { useEffect, useRef, useState } from "react";
import { router } from "expo-router";
import {
  View,
  Text,
  Pressable,
  TextInput,
  StyleSheet,
} from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { Mail, Lock, Eye, EyeOff, ArrowRight, CheckCircle2, AlertCircle, Bell, TrendingUp, CalendarDays } from "lucide-react-native";
import { Screen, TextField, PrimaryButton, BackButton } from "../../components";
import { useTheme } from "../../theme/ThemeProvider";
import { useSessionStore } from "../../lib/auth";
import { API_URL } from "../../lib/config";

const SLIDES = [
  { icon: CalendarDays, title: "Welcome Back", desc: "Securely access your account and pick up where you left off." },
  { icon: Bell, title: "Stay Connected", desc: "Never miss an event. Real-time updates keep you in the loop." },
  { icon: TrendingUp, title: "Track Everything", desc: "Monitor your registrations and ticket sales from one place." },
];

const STEP_TITLES = ["", "Welcome Back", "Enter Password", "Verify Login", "You're in!"];
const STEP_DESCS = [
  "",
  "Enter your email or username to continue.",
  "Enter your password to sign in.",
  "We sent a 6-digit code to your email.",
  "Heading to your dashboard…",
];

export default function SignInScreen() {
  const { theme } = useTheme();
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
    const next = [...otpDigits];
    next[idx] = val.slice(-1);
    setOtpDigits(next);
    if (val && idx < 5) otpRefs.current[idx + 1]?.focus();
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
          setTimeout(() => router.push("/users/signup"), 2500);
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

  return (
    <Screen padded={false}>
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        {/* Top section — feature slide */}
        <View style={styles.topSection}>
          <View style={styles.topBar}>
            <BackButton
              onPress={() => (step === 2 || step === 3 ? setStep(1) : router.push("/"))}
              label={step === 2 || step === 3 ? "Back" : "Home"}
            />
            <Text style={[styles.stepCounter, { color: theme.colors.textSubtle }]}>
              {step < 4 ? `${step} of 3` : "Done"}
            </Text>
          </View>

          <View style={styles.slideContent} key={activeSlide}>
            <Animated.View
              entering={FadeInUp.duration(400)}
              style={[styles.slideIconWrap, { backgroundColor: theme.colors.brandTint }]}
            >
              <CurrentSlideIcon color={theme.colors.brand} size={36} />
            </Animated.View>
            <Animated.Text
              entering={FadeInUp.delay(60).duration(400)}
              style={[styles.slideTitle, { color: theme.colors.text }]}
            >
              {SLIDES[activeSlide].title}
            </Animated.Text>
            <Text style={[styles.slideDesc, { color: theme.colors.textMuted }]}>
              {SLIDES[activeSlide].desc}
            </Text>

            <View style={styles.pagination}>
              {SLIDES.map((_, i) => (
                <Pressable key={i} onPress={() => setActiveSlide(i)}>
                  <View
                    style={[
                      styles.paginationDot,
                      {
                        width: i === activeSlide ? 28 : 6,
                        backgroundColor: i === activeSlide ? theme.colors.brand : theme.colors.border,
                      },
                    ]}
                  />
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        {/* Bottom section — tab + form */}
        <View style={styles.bottomSection}>
          {/* Tab switcher */}
          <View style={[styles.tabRow, { borderBottomColor: theme.colors.border }]}>
            <View style={styles.tabActive}>
              <Text style={[styles.tabActiveText, { color: theme.colors.text }]}>Log In</Text>
              <View style={[styles.tabIndicator, { backgroundColor: theme.colors.brand }]} />
            </View>
            <Pressable onPress={() => router.replace("/(auth)/signup")}>
              <Text style={[styles.tabInactiveText, { color: theme.colors.textSubtle }]}>Sign Up</Text>
            </Pressable>
          </View>

          {/* Form card */}
          <Animated.View
            entering={FadeInUp.duration(400)}
            style={[
              styles.formCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                shadowColor: theme.colors.shadow,
              },
            ]}
          >
            <Text style={[styles.formTitle, { color: theme.colors.text }]}>
              {STEP_TITLES[step]}
            </Text>
            <Text style={[styles.formSubtitle, { color: theme.colors.textMuted }]}>
              {step === 2 ? `Signing in as ${email}.` : STEP_DESCS[step]}
            </Text>

            {/* Alerts */}
            {message.error ? (
              <View style={[styles.alertBox, { backgroundColor: theme.colors.mode === "dark" ? "rgba(220,38,38,0.12)" : "#fff1f2", borderColor: theme.colors.error }]}>
                <AlertCircle size={16} color={theme.colors.error} />
                <Text style={[styles.alertText, { color: theme.colors.error }]}>{message.error}</Text>
              </View>
            ) : null}
            {message.success ? (
              <View style={[styles.alertBox, { backgroundColor: theme.colors.mode === "dark" ? "rgba(22,163,74,0.12)" : "#f0fdf4", borderColor: theme.colors.success }]}>
                <CheckCircle2 size={16} color={theme.colors.success} />
                <Text style={[styles.alertText, { color: theme.colors.success }]}>{message.success}</Text>
              </View>
            ) : null}

            {/* Step 1 — identifier */}
            {step === 1 && (
              <View style={{ gap: 16 }}>
                <TextField
                  label="Email or Username"
                  value={emailOrUsername}
                  onChangeText={setEmailOrUsername}
                  placeholder="janedoe@mail.com or @username"
                  autoCapitalize="none"
                  leftIcon={<Mail size={20} color={theme.colors.textSubtle} />}
                />
                <PrimaryButton
                  label={loading ? "Checking…" : "Continue"}
                  onPress={handleVerifyEmail}
                  loading={loading}
                  icon={!loading ? <ArrowRight size={18} color="#1A1A14" /> : null}
                />
                {/* Social login */}
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
                <Pressable onPress={() => router.push("/users/signup")}>
                  <Text style={[styles.switchText, { color: theme.colors.textMuted }]}>
                    No account? <Text style={{ color: theme.colors.brand, fontWeight: "700" }}>Create one</Text>
                  </Text>
                </Pressable>
              </View>
            )}

            {/* Step 2 — password */}
            {step === 2 && (
              <View style={{ gap: 16 }}>
                <TextField
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Your password"
                  secureTextEntry={!showPassword}
                  leftIcon={<Lock size={20} color={theme.colors.textSubtle} />}
                  rightIcon={
                    <Pressable onPress={() => setShowPassword((v) => !v)}>
                      {showPassword ? <EyeOff size={20} color={theme.colors.textSubtle} /> : <Eye size={20} color={theme.colors.textSubtle} />}
                    </Pressable>
                  }
                />
                <Pressable onPress={() => handleSendOTP()}>
                  <Text style={[styles.linkText, { color: theme.colors.brand }]}>Use OTP instead</Text>
                </Pressable>
                <PrimaryButton label={loading ? "Signing in…" : "Sign In"} onPress={handlePasswordSubmit} loading={loading} />
              </View>
            )}

            {/* Step 3 — OTP boxes */}
            {step === 3 && (
              <View style={{ gap: 16 }}>
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
                      maxLength={1}
                      style={[
                        styles.otpBox,
                        {
                          backgroundColor: theme.colors.surfaceMuted,
                          borderColor: digit ? theme.colors.brand : theme.colors.border,
                          color: theme.colors.text,
                        },
                      ]}
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

            {/* Step 4 — success */}
            {step === 4 && (
              <View style={styles.successState}>
                <View style={[styles.successIcon, { backgroundColor: theme.colors.surfaceMuted, borderColor: theme.colors.border }]}>
                  <CheckCircle2 size={40} color={theme.colors.success} />
                </View>
                <Text style={[styles.successTitle, { color: theme.colors.text }]}>You're in!</Text>
                <Text style={[styles.successSub, { color: theme.colors.textMuted }]}>Taking you to your dashboard…</Text>
              </View>
            )}
          </Animated.View>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topSection: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 10,
    zIndex: 20,
  },
  stepCounter: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    fontFamily: "PlusJakartaSans_700Bold",
  },
  slideContent: {
    alignItems: "center",
    maxWidth: 300,
    gap: 12,
  },
  slideIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  slideTitle: {
    fontFamily: "SpaceGrotesk_700Bold",
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: -0.5,
  },
  slideDesc: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },
  pagination: {
    flexDirection: "row",
    gap: 8,
    marginTop: 24,
    alignItems: "center",
  },
  paginationDot: {
    height: 6,
    borderRadius: 3,
  },

  // Bottom
  bottomSection: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
    justifyContent: "flex-start",
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

  // Form card
  formCard: {
    width: "100%",
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
    gap: 4,
  },
  formTitle: {
    fontFamily: "SpaceGrotesk_700Bold",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 2,
  },
  formSubtitle: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  alertBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  alertText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "PlusJakartaSans_500Medium",
  },
  linkText: {
    fontSize: 14,
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
    fontSize: 13,
    fontFamily: "PlusJakartaSans_400Regular",
  },
  socialBtn: {
    paddingVertical: 13,
    borderRadius: 12,
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
    fontSize: 14,
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
    borderRadius: 12,
    borderWidth: 2,
    fontSize: 22,
    fontWeight: "800",
  },
  successState: {
    paddingVertical: 24,
    alignItems: "center",
    gap: 8,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    borderWidth: 1,
  },
  successTitle: {
    fontFamily: "SpaceGrotesk_700Bold",
    fontSize: 24,
    fontWeight: "700",
  },
  successSub: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 14,
  },
});
