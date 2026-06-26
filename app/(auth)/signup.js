import { useEffect, useRef, useState } from "react";
import { router } from "expo-router";
import {
  View, Text, Pressable, TextInput, StyleSheet, ScrollView,
  KeyboardAvoidingView, Platform, useWindowDimensions,
} from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import {
  Mail, User, CheckCircle2, AlertCircle, ArrowRight,
  Lock, Eye, EyeOff, Calendar, Users, Star,
} from "lucide-react-native";
import { Screen, TextField, PrimaryButton } from "../../components";
import { PasswordStrength } from "../../components/PasswordStrength";
import { radius } from "../../theme/tokens";
import { validatePassword } from "../../lib/password";
import { API_URL } from "../../lib/config";
import { useSessionStore } from "../../lib/auth";
import { useTheme } from "../../theme/ThemeProvider";

const SLIDES = [
  { icon: Calendar, title: "Discover Events", desc: "Find parties, workshops, and meetups happening around your campus." },
  { icon: Users, title: "Connect with Peers", desc: "Meet like-minded students and grow your campus network." },
  { icon: Star, title: "Host Your Own", desc: "Organize events with powerful tools and sell tickets in minutes." },
];

const TOTAL_STEPS = 2;

export default function SignupScreen() {
  const { theme } = useTheme();
  const { height: SCREEN_HEIGHT } = useWindowDimensions();
  const userToken = useSessionStore((state) => state.userToken);
  const setUserToken = useSessionStore((state) => state.setUserToken);

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [isOrganization, setIsOrganization] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [activeSlide, setActiveSlide] = useState(0);
  const otpRefs = useRef([]);

  useEffect(() => {
    if (isOrganization) { setActiveSlide(2); return; }
    const id = setInterval(() => setActiveSlide((p) => (p + 1) % SLIDES.length), 4500);
    return () => clearInterval(id);
  }, [isOrganization]);

  useEffect(() => {
    if (name) {
      setUsername(name.trim().toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, ""));
    }
  }, [name]);

  useEffect(() => {
    if (!username || username.length < 3) { setUsernameAvailable(null); return; }
    const check = async () => {
      setCheckingUsername(true);
      try {
        const res = await fetch(`${API_URL}/auth/check-username`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username }),
        });
        const data = await res.json();
        setUsernameAvailable(data.available);
      } catch { /* silent */ } finally {
        setCheckingUsername(false);
      }
    };
    const t = setTimeout(check, 500);
    return () => clearTimeout(t);
  }, [username]);

  useEffect(() => {
    if (userToken) { setStep(3); setTimeout(() => router.replace("/onboarding/interests"), 1500); }
  }, [userToken]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const clearMessages = () => { setError(""); setSuccess(""); };

  const handleOtpChange = (val, idx) => {
    const next = [...otpDigits];
    next[idx] = val.slice(-1);
    setOtpDigits(next);
    setOtp(next.join(""));
    if (val && idx < 5) otpRefs.current[idx + 1]?.focus();
  };

  const handleOtpKeyPress = (e, idx) => {
    if (e.nativeEvent.key === "Backspace" && !otpDigits[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus();
    }
  };

  const handleSendOtp = async () => {
    clearMessages();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address."); return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(data.msg || "Verification code sent!"); setStep(2); setCooldown(60);
        setOtpDigits(["", "", "", "", "", ""]); setOtp("");
      } else if (res.status === 400 && data.msg?.includes("already registered")) {
        setError(data.msg);
        setTimeout(() => { setError("Redirecting to sign in…"); setTimeout(() => router.push("/(auth)/signin"), 2000); }, 2000);
      } else {
        setError(data.msg || "Failed to send code");
      }
    } catch { setError("Network error. Please try again."); } finally { setLoading(false); }
  };

  const handleVerifyAndSignup = async () => {
    clearMessages();
    if (!name.trim()) { setError("Please enter your name."); return; }
    if (!username.trim() || username.length < 3) { setError("Username must be at least 3 characters."); return; }
    if (usernameAvailable === false) { setError("Username is taken. Please choose another."); return; }
    if (!otp.trim()) { setError("Please enter the verification code."); return; }
    if (!password.trim()) { setError("Please enter a password."); return; }
    const v = validatePassword(password);
    if (!v.isValid) { setError(v.message); return; }
    if (password !== confirmPassword) { setError("Passwords do not match."); return; }
    if (!acceptedTerms) { setError("Please accept the Terms of Service and Privacy Policy."); return; }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/signup/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, name, username, isOrganization, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(data.msg || "Account created!"); setStep(3);
        const token = data.user?.user_token || data.accessToken;
        await setUserToken(token);
        setTimeout(() => router.push("/onboarding/interests"), 2500);
      } else {
        setError(data.msg || "Verification failed. Please check your code.");
      }
    } catch { setError("Something went wrong. Please try again."); } finally { setLoading(false); }
  };

  const CurrentSlideIcon = SLIDES[activeSlide].icon;
  const progressPercent = step < 3 ? (step / TOTAL_STEPS) * 100 : 100;
  const topH = SCREEN_HEIGHT * 0.40;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.colors.brand }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Brand top section */}
      <View style={[styles.topSection, { height: topH }]}>
        <View style={styles.logoRow}>
          <Pressable
            style={styles.backPill}
            onPress={() => (step === 2 ? setStep(1) : router.push("/"))}
          >
            <Text style={styles.backPillText}>{step === 2 ? "← Back" : "← Home"}</Text>
          </Pressable>
          <Text style={styles.stepBadge}>
            {step < 3 ? `${step} / ${TOTAL_STEPS}` : "✓"}
          </Text>
        </View>

        <Animated.View
          entering={FadeInUp.duration(400)}
          style={styles.slideContent}
          key={`${activeSlide}-${isOrganization}`}
        >
          <View style={styles.slideIconWrap}>
            <CurrentSlideIcon color="#1A1A14" size={32} />
          </View>
          <Text style={styles.slideTitle}>
            {step === 2 && name && activeSlide === 1
              ? `Join as ${name.split(" ")[0]}`
              : SLIDES[activeSlide].title}
          </Text>
          <Text style={styles.slideDesc}>{SLIDES[activeSlide].desc}</Text>
        </Animated.View>

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
        contentContainerStyle={{ paddingBottom: 60 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Tab row */}
        <View style={[styles.tabRow, { borderBottomColor: theme.colors.border }]}>
          <Pressable onPress={() => router.replace("/(auth)/signin")}>
            <Text style={[styles.tabInactiveText, { color: theme.colors.textSubtle }]}>Log In</Text>
          </Pressable>
          <View style={styles.tabActive}>
            <Text style={[styles.tabActiveText, { color: theme.colors.text }]}>Sign Up</Text>
            <View style={[styles.tabIndicator, { backgroundColor: theme.colors.brand }]} />
          </View>
        </View>

        {/* Form card */}
        <Animated.View
          entering={FadeInUp.duration(400)}
          style={[styles.formCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
        >
          {/* Progress bar */}
          {step < 3 && (
            <View style={[styles.progressTrack, { backgroundColor: theme.colors.surfaceMuted }]}>
              <View style={[styles.progressFill, { width: `${progressPercent}%`, backgroundColor: theme.colors.brand }]} />
            </View>
          )}

          <Text style={[styles.formTitle, { color: theme.colors.text }]}>
            {step === 1 ? "Create Account" : step === 2 ? "Finish Up" : "Welcome!"}
          </Text>
          <Text style={[styles.formSubtitle, { color: theme.colors.textMuted }]}>
            {step === 1 ? "Start your campus journey — it only takes a minute."
              : step === 2 ? "A few more details to complete your profile."
              : "Your account is ready. Heading to your dashboard…"}
          </Text>

          {error ? (
            <View style={[styles.alertBox, { backgroundColor: "rgba(220,38,38,0.08)", borderColor: theme.colors.error }]}>
              <AlertCircle size={15} color={theme.colors.error} />
              <Text style={[styles.alertText, { color: theme.colors.error }]}>{error}</Text>
            </View>
          ) : null}
          {success ? (
            <View style={[styles.alertBox, { backgroundColor: "rgba(61,158,74,0.08)", borderColor: theme.colors.success }]}>
              <CheckCircle2 size={15} color={theme.colors.success} />
              <Text style={[styles.alertText, { color: theme.colors.success }]}>{success}</Text>
            </View>
          ) : null}

          {step === 1 && (
            <View style={{ gap: 14 }}>
              <TextField
                label="Email Address"
                value={email}
                onChangeText={setEmail}
                placeholder="janedoe@mail.com"
                autoCapitalize="none"
                keyboardType="email-address"
                leftIcon={<Mail size={18} color={theme.colors.textSubtle} />}
              />
              <PrimaryButton
                label={loading ? "Sending code…" : "Continue"}
                onPress={handleSendOtp}
                loading={loading}
                icon={!loading ? <ArrowRight size={17} color="#1A1A14" /> : null}
              />
              <Pressable onPress={() => router.push("/(auth)/signin")}>
                <Text style={[styles.switchText, { color: theme.colors.textMuted }]}>
                  Already have an account?{" "}
                  <Text style={{ color: theme.colors.brand, fontWeight: "700" }}>Sign in</Text>
                </Text>
              </Pressable>
            </View>
          )}

          {step === 2 && (
            <View style={{ gap: 12 }}>
              <TextField
                label="Full Name"
                value={name}
                onChangeText={setName}
                placeholder="What should we call you?"
                leftIcon={<User size={18} color={theme.colors.textSubtle} />}
              />
              <View>
                <TextField
                  label="Username"
                  value={username}
                  onChangeText={(v) => setUsername(v.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                  placeholder="your_username"
                  leftIcon={<Text style={[styles.atSign, { color: theme.colors.textSubtle }]}>@</Text>}
                />
                {!checkingUsername && username.length >= 3 && (
                  <Text style={[styles.usernameStatus, { color: usernameAvailable ? theme.colors.success : theme.colors.error }]}>
                    {usernameAvailable ? "✓ Available" : "✗ Already taken"}
                  </Text>
                )}
              </View>

              {/* OTP */}
              <View>
                <View style={styles.otpHeader}>
                  <Text style={[styles.otpLabel, { color: theme.colors.text }]}>Verification Code</Text>
                  {cooldown > 0 ? (
                    <Text style={[styles.cooldownText, { color: theme.colors.textSubtle }]}>Resend in {cooldown}s</Text>
                  ) : (
                    <Pressable onPress={handleSendOtp}>
                      <Text style={[styles.linkText, { color: theme.colors.brand }]}>Resend code</Text>
                    </Pressable>
                  )}
                </View>
                <View style={styles.otpRow}>
                  {otpDigits.map((digit, i) => (
                    <TextInput
                      key={i}
                      ref={(r) => (otpRefs.current[i] = r)}
                      value={digit}
                      onChangeText={(v) => handleOtpChange(v, i)}
                      onKeyPress={(e) => handleOtpKeyPress(e, i)}
                      keyboardType="default"
                      autoCapitalize="characters"
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
              </View>

              <View>
                <TextField
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Create a strong password"
                  secureTextEntry={!showPassword}
                  leftIcon={<Lock size={18} color={theme.colors.textSubtle} />}
                  rightIcon={
                    <Pressable onPress={() => setShowPassword((v) => !v)}>
                      {showPassword ? <EyeOff size={18} color={theme.colors.textSubtle} /> : <Eye size={18} color={theme.colors.textSubtle} />}
                    </Pressable>
                  }
                />
                <PasswordStrength password={password} />
              </View>

              <TextField
                label="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Re-enter your password"
                secureTextEntry={!showConfirmPw}
                leftIcon={<Lock size={18} color={theme.colors.textSubtle} />}
                rightIcon={
                  <Pressable onPress={() => setShowConfirmPw((v) => !v)}>
                    {showConfirmPw ? <EyeOff size={18} color={theme.colors.textSubtle} /> : <Eye size={18} color={theme.colors.textSubtle} />}
                  </Pressable>
                }
              />

              {/* Organizer toggle */}
              <Pressable
                onPress={() => setIsOrganization((v) => !v)}
                style={[styles.orgToggle, {
                  backgroundColor: isOrganization ? theme.colors.brandTint : theme.colors.surfaceMuted,
                  borderColor: isOrganization ? theme.colors.brand : theme.colors.border,
                }]}
              >
                <View style={[styles.toggleCircle, {
                  backgroundColor: isOrganization ? theme.colors.brand : "transparent",
                  borderColor: isOrganization ? theme.colors.brand : theme.colors.border,
                }]}>
                  {isOrganization && <Text style={styles.checkMark}>✓</Text>}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.orgTitle, { color: isOrganization ? theme.colors.brand : theme.colors.text }]}>
                    I'm an Organizer
                  </Text>
                  <Text style={[styles.orgDesc, { color: theme.colors.textMuted }]}>
                    Host events, manage tickets, grow a community
                  </Text>
                </View>
              </Pressable>

              {/* Terms */}
              <Pressable onPress={() => setAcceptedTerms((v) => !v)} style={styles.termsRow}>
                <View style={[styles.checkbox, {
                  backgroundColor: acceptedTerms ? theme.colors.brand : "transparent",
                  borderColor: acceptedTerms ? theme.colors.brand : theme.colors.border,
                }]}>
                  {acceptedTerms && <Text style={styles.checkMark}>✓</Text>}
                </View>
                <Text style={[styles.termsText, { color: theme.colors.textMuted }]}>
                  I agree to the Terms of Service and Privacy Policy
                </Text>
              </Pressable>

              <PrimaryButton
                label={loading ? "Creating account…" : "Complete Signup"}
                onPress={handleVerifyAndSignup}
                loading={loading}
              />
              <Pressable onPress={() => router.push("/(auth)/signin")}>
                <Text style={[styles.switchText, { color: theme.colors.textMuted }]}>
                  Already have an account?{" "}
                  <Text style={{ color: theme.colors.brand, fontWeight: "700" }}>Sign in</Text>
                </Text>
              </Pressable>
            </View>
          )}

          {step === 3 && (
            <View style={styles.successState}>
              <View style={[styles.successIcon, { backgroundColor: theme.colors.brandTint }]}>
                <CheckCircle2 size={36} color={theme.colors.brand} />
              </View>
              <Text style={[styles.successTitle, { color: theme.colors.text }]}>You're in!</Text>
              <Text style={[styles.successSub, { color: theme.colors.textMuted }]}>Heading to your dashboard…</Text>
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
    fontSize: 28,
    color: "#1A1A14",
    textAlign: "center",
    letterSpacing: -0.3,
  },
  slideDesc: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 13,
    color: "rgba(26,26,20,0.65)",
    textAlign: "center",
    lineHeight: 20,
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
  progressTrack: {
    width: "100%",
    height: 3,
    borderRadius: 2,
    marginBottom: 12,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
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
  atSign: {
    fontSize: 15,
    fontWeight: "700",
  },
  usernameStatus: {
    fontSize: 12,
    marginTop: 5,
    marginLeft: 4,
    fontWeight: "500",
    fontFamily: "PlusJakartaSans_500Medium",
  },
  otpHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  otpLabel: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "PlusJakartaSans_600SemiBold",
  },
  cooldownText: {
    fontSize: 12,
    fontWeight: "500",
    fontFamily: "PlusJakartaSans_500Medium",
  },
  linkText: {
    fontSize: 13,
    fontWeight: "700",
    fontFamily: "PlusJakartaSans_700Bold",
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
  orgToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  toggleCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  orgTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 2,
    fontFamily: "PlusJakartaSans_700Bold",
  },
  orgDesc: {
    fontSize: 12,
    fontFamily: "PlusJakartaSans_400Regular",
  },
  termsRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  checkbox: {
    marginTop: 2,
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  checkMark: {
    color: "#1A1A14",
    fontSize: 10,
    fontWeight: "bold",
  },
  termsText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: "PlusJakartaSans_400Regular",
  },
  switchText: {
    textAlign: "center",
    fontSize: 13,
    fontFamily: "PlusJakartaSans_400Regular",
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
