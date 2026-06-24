import { useEffect, useRef, useState } from "react";
import { router } from "expo-router";
import { View, Text, Pressable, TextInput, StyleSheet } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import {
  Mail, User, CheckCircle2, AlertCircle, ArrowRight,
  Lock, Eye, EyeOff, Calendar, Users, Star,
} from "lucide-react-native";
import { Screen, TextField, PrimaryButton, BackButton } from "../../components";
import { PasswordStrength } from "../../components/PasswordStrength";
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
    if (userToken) { setStep(3); setTimeout(() => router.replace("/users/dashboard"), 1500); }
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
        setTimeout(() => { setError("Redirecting to sign in…"); setTimeout(() => router.push("/users/signin"), 2000); }, 2000);
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
        setTimeout(() => router.push("/users/dashboard"), 2500);
      } else {
        setError(data.msg || "Verification failed. Please check your code.");
      }
    } catch { setError("Something went wrong. Please try again."); } finally { setLoading(false); }
  };

  const CurrentSlideIcon = SLIDES[activeSlide].icon;
  const progressPercent = step < 3 ? (step / TOTAL_STEPS) * 100 : 100;

  function CheckMark() {
    return <Text style={styles.checkMark}>✓</Text>;
  }

  return (
    <Screen padded={false}>
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        {/* Top section — feature slide */}
        <View style={styles.topSection}>
          <View style={styles.topBar}>
            <BackButton
              onPress={() => (step === 2 ? setStep(1) : router.push("/"))}
              label={step === 2 ? "Back" : "Home"}
            />
            <Text style={[styles.stepCounter, { color: theme.colors.textSubtle }]}>
              {step < 3 ? `${step} of ${TOTAL_STEPS}` : "Done"}
            </Text>
          </View>

          <View style={styles.slideContent} key={`${activeSlide}-${isOrganization}`}>
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
              {step === 2 && name && activeSlide === 1
                ? `Join as ${name.split(" ")[0]}`
                : SLIDES[activeSlide].title}
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
            style={[
              styles.formCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                shadowColor: theme.colors.shadow,
              },
            ]}
          >
            {/* Lime progress bar */}
            {step < 3 && (
              <View style={[styles.progressTrack, { backgroundColor: theme.colors.surfaceMuted }]}>
                <View
                  style={[styles.progressFill, { width: `${progressPercent}%`, backgroundColor: theme.colors.brand }]}
                />
              </View>
            )}

            <Text style={[styles.formTitle, { color: theme.colors.text }]}>
              {step === 1 ? "Create Account" : step === 2 ? "Finish Up" : "Welcome!"}
            </Text>
            <Text style={[styles.formSubtitle, { color: theme.colors.textMuted }]}>
              {step === 1
                ? "Start your campus journey — it only takes a minute."
                : step === 2
                  ? "A few more details to complete your profile."
                  : "Your account is ready. Heading to your dashboard…"}
            </Text>

            {/* Alerts */}
            {error ? (
              <View style={[styles.alertBox, { backgroundColor: theme.colors.mode === "dark" ? "rgba(220,38,38,0.12)" : "#fff1f2", borderColor: theme.colors.error }]}>
                <AlertCircle size={16} color={theme.colors.error} />
                <Text style={[styles.alertText, { color: theme.colors.error }]}>{error}</Text>
              </View>
            ) : null}
            {success ? (
              <View style={[styles.alertBox, { backgroundColor: theme.colors.mode === "dark" ? "rgba(22,163,74,0.12)" : "#f0fdf4", borderColor: theme.colors.success }]}>
                <CheckCircle2 size={16} color={theme.colors.success} />
                <Text style={[styles.alertText, { color: theme.colors.success }]}>{success}</Text>
              </View>
            ) : null}

            {/* Step 1 — email */}
            {step === 1 && (
              <View style={{ gap: 16 }}>
                <TextField
                  label="Email Address"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="janedoe@mail.com"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  leftIcon={<Mail size={20} color={theme.colors.textSubtle} />}
                />
                <PrimaryButton
                  label={loading ? "Sending code…" : "Continue"}
                  onPress={handleSendOtp}
                  loading={loading}
                  icon={!loading ? <ArrowRight size={18} color="#1A1A14" /> : null}
                />
                <Pressable onPress={() => router.push("/users/signin")}>
                  <Text style={[styles.switchText, { color: theme.colors.textMuted }]}>
                    Already have an account?{" "}
                    <Text style={{ color: theme.colors.brand, fontWeight: "700" }}>Sign in</Text>
                  </Text>
                </Pressable>
              </View>
            )}

            {/* Step 2 — profile + OTP boxes */}
            {step === 2 && (
              <View style={{ gap: 14 }}>
                <TextField
                  label="Full Name"
                  value={name}
                  onChangeText={setName}
                  placeholder="What should we call you?"
                  leftIcon={<User size={20} color={theme.colors.textSubtle} />}
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

                {/* OTP boxes */}
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
                </View>

                <View>
                  <TextField
                    label="Password"
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Create a strong password"
                    secureTextEntry={!showPassword}
                    leftIcon={<Lock size={20} color={theme.colors.textSubtle} />}
                    rightIcon={
                      <Pressable onPress={() => setShowPassword((v) => !v)}>
                        {showPassword ? <EyeOff size={20} color={theme.colors.textSubtle} /> : <Eye size={20} color={theme.colors.textSubtle} />}
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
                  leftIcon={<Lock size={20} color={theme.colors.textSubtle} />}
                  rightIcon={
                    <Pressable onPress={() => setShowConfirmPw((v) => !v)}>
                      {showConfirmPw ? <EyeOff size={20} color={theme.colors.textSubtle} /> : <Eye size={20} color={theme.colors.textSubtle} />}
                    </Pressable>
                  }
                />

                {/* Is Organizer toggle */}
                <Pressable
                  onPress={() => setIsOrganization((v) => !v)}
                  style={[
                    styles.orgToggle,
                    {
                      backgroundColor: isOrganization ? theme.colors.brandTint : theme.colors.surfaceMuted,
                      borderColor: isOrganization ? theme.colors.brand : theme.colors.border,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.toggleCircle,
                      {
                        backgroundColor: isOrganization ? theme.colors.brand : "transparent",
                        borderColor: isOrganization ? theme.colors.brand : theme.colors.border,
                      },
                    ]}
                  >
                    {isOrganization && <CheckMark />}
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

                {/* Terms checkbox */}
                <Pressable
                  onPress={() => setAcceptedTerms((v) => !v)}
                  style={styles.termsRow}
                >
                  <View
                    style={[
                      styles.checkbox,
                      {
                        backgroundColor: acceptedTerms ? theme.colors.brand : "transparent",
                        borderColor: acceptedTerms ? theme.colors.brand : theme.colors.border,
                      },
                    ]}
                  >
                    {acceptedTerms && <CheckMark />}
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
                <Pressable onPress={() => router.push("/users/signin")}>
                  <Text style={[styles.switchText, { color: theme.colors.textMuted }]}>
                    Already have an account?{" "}
                    <Text style={{ color: theme.colors.brand, fontWeight: "700" }}>Sign in</Text>
                  </Text>
                </Pressable>
              </View>
            )}

            {/* Step 3 — success */}
            {step === 3 && (
              <View style={styles.successState}>
                <View style={[styles.successIcon, { backgroundColor: theme.colors.surfaceMuted, borderColor: theme.colors.border }]}>
                  <CheckCircle2 size={40} color={theme.colors.success} />
                </View>
                <Text style={[styles.successTitle, { color: theme.colors.text }]}>You're in!</Text>
                <Text style={[styles.successSub, { color: theme.colors.textMuted }]}>Heading to your dashboard…</Text>
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
  atSign: {
    fontSize: 16,
    fontWeight: "700",
  },
  usernameStatus: {
    fontSize: 12,
    marginTop: 6,
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
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "PlusJakartaSans_600SemiBold",
  },
  cooldownText: {
    fontSize: 12,
    fontWeight: "500",
    fontFamily: "PlusJakartaSans_500Medium",
  },
  linkText: {
    fontSize: 12,
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
    borderRadius: 12,
    borderWidth: 2,
    fontSize: 22,
    fontWeight: "800",
  },
  orgToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
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
