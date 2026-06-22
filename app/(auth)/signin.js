import { useEffect, useState } from "react";
import { router } from "expo-router";
import { View, Text, Pressable } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { Mail, Lock, Eye, EyeOff, ArrowRight, CheckCircle2, AlertCircle, Bell, TrendingUp } from "lucide-react-native";
import { Screen, TextField, PrimaryButton, BackButton } from "../../components";
import { useTheme } from "../../theme/ThemeProvider";
import { useSessionStore } from "../../lib/auth";
import { API_URL } from "../../lib/config";

// Feature slides matching web app
const SLIDES = [
  { icon: Lock, color: "#3b82f6", title: "Welcome Back", desc: "Securely access your account and pick up where you left off." },
  { icon: Bell, color: "#8b5cf6", title: "Stay Connected", desc: "Never miss an event. Real-time updates keep you in the loop." },
  { icon: TrendingUp, color: "#10b981", title: "Track Everything", desc: "Monitor your registrations and ticket sales from one place." }
];

const STEP_TITLES = ["", "Welcome Back", "Enter Password", "Verify Login", "You're in!"];
const STEP_DESCS = [
  "",
  "Enter your email or username to continue.",
  "Enter your password to sign in.",
  "We sent a 6-digit code to your email.",
  "Heading to your dashboard…"
];

export default function SignInScreen() {
  const { theme } = useTheme();
  const userToken = useSessionStore((state) => state.userToken);
  const setUserToken = useSessionStore((state) => state.setUserToken);
  const [step, setStep] = useState(1);
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState({ error: "", success: "" });
  const [activeSlide, setActiveSlide] = useState(0);

  // Auto-cycle slides
  useEffect(() => {
    const id = setInterval(() => setActiveSlide(p => (p + 1) % SLIDES.length), 4500);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (userToken) {
      setStep(4);
      setTimeout(() => router.replace("/(app)/dashboard"), 1500);
    }
  }, [userToken]);

  async function handleVerifyEmail(e) {
    e?.preventDefault?.();
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
          username: !emailOrUsername.includes("@") ? emailOrUsername : undefined
        })
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
        body: JSON.stringify({ email: userEmail || email })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ error: "", success: data.msg || "Verification code sent!" });
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

  async function handlePasswordSubmit(e) {
    e?.preventDefault?.();
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
        body: JSON.stringify({ email, password })
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

  async function handleOTPSubmit(e) {
    e?.preventDefault?.();
    setMessage({ error: "", success: "" });
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/signin/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp })
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
        {/* Top section (feature slide) */}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, position: 'relative' }}>
          {/* Mobile top bar */}
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 8, zIndex: 20 }}>
            <BackButton
              onPress={() => (step === 2 || step === 3 ? setStep(1) : router.push("/"))}
              label={step === 2 || step === 3 ? "Back" : "Home"}
            />
            <Text style={{ fontSize: 12, fontWeight: '700', color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: 2 }}>
              {step < 4 ? `${step} / 3` : "✓"}
            </Text>
          </View>

          <View style={{ alignItems: 'center', maxWidth: 300 }} key={activeSlide}>
            <Animated.View
              entering={FadeInUp.duration(500)}
              style={{
                width: 96,
                height: 96,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 32,
                backgroundColor: theme.colors.surface,
                borderRadius: 24,
                borderColor: theme.colors.border,
                borderWidth: 1,
                shadowColor: theme.colors.shadow,
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.08,
                shadowRadius: 16,
                elevation: 3,
              }}
            >
              <CurrentSlideIcon color={SLIDES[activeSlide].color} size={40} />
            </Animated.View>
            <Text style={{ fontFamily: 'SpaceGrotesk_700Bold', fontSize: 32, color: theme.colors.text, textAlign: 'center', marginBottom: 12, lineHeight: 36 }}>
              {SLIDES[activeSlide].title}
            </Text>
            <Text style={{ fontFamily: 'PlusJakartaSans_400Regular', fontSize: 16, color: theme.colors.textMuted, textAlign: 'center', lineHeight: 24 }}>
              {SLIDES[activeSlide].desc}
            </Text>

            {/* Pagination dots */}
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 40 }}>
              {SLIDES.map((_, i) => (
                <Pressable key={i} onPress={() => setActiveSlide(i)}>
                  <View
                    style={{
                      height: 6,
                      borderRadius: 3,
                      width: i === activeSlide ? 28 : 6,
                      backgroundColor: i === activeSlide ? theme.colors.brand : theme.colors.border
                    }}
                  />
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        {/* Bottom section (form) */}
        <View style={{ flex: 1, padding: 20, paddingTop: 0, alignItems: 'center', justifyContent: 'center' }}>
          <Animated.View
            entering={FadeInUp.duration(500)}
            style={{
              width: '100%',
              maxWidth: 400,
              padding: 24,
              backgroundColor: theme.colors.surface,
              borderRadius: 24,
              borderWidth: 1,
              borderColor: theme.colors.border,
              shadowColor: theme.colors.shadow,
              shadowOffset: { width: 0, height: 12 },
              shadowOpacity: 0.1,
              shadowRadius: 24,
              elevation: 4,
            }}
          >
            <Text key={`heading-${step}`} style={{ fontFamily: 'SpaceGrotesk_700Bold', fontSize: 28, color: theme.colors.text, marginBottom: 6 }}>
              {STEP_TITLES[step]}
            </Text>
            <Text style={{ fontFamily: 'PlusJakartaSans_400Regular', fontSize: 14, color: theme.colors.textMuted, marginBottom: 24 }}>
              {step === 2 ? `Sign in as ${email}.` : STEP_DESCS[step]}
            </Text>

            {/* Alerts */}
            {message.error ? (
              <View style={{ backgroundColor: theme.colors.mode === 'dark' ? 'rgba(220, 38, 38, 0.15)' : '#fff1f2', borderWidth: 1, borderColor: theme.colors.error, borderRadius: 16, padding: 12, marginBottom: 20, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <AlertCircle size={18} color={theme.colors.error} />
                <Text style={{ fontFamily: 'PlusJakartaSans_500Medium', fontSize: 14, color: theme.colors.error }}>{message.error}</Text>
              </View>
            ) : null}
            {message.success ? (
              <View style={{ backgroundColor: theme.colors.mode === 'dark' ? 'rgba(22, 163, 74, 0.15)' : '#f0fdf4', borderWidth: 1, borderColor: theme.colors.success, borderRadius: 16, padding: 12, marginBottom: 20, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <CheckCircle2 size={18} color={theme.colors.success} />
                <Text style={{ fontFamily: 'PlusJakartaSans_500Medium', fontSize: 14, color: theme.colors.success }}>{message.success}</Text>
              </View>
            ) : null}

            {step === 1 ? (
              <View style={{ gap: 20 }}>
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
                  icon={!loading ? <ArrowRight size={18} color="#fff" /> : null}
                />
                <Pressable onPress={() => router.push("/users/signup")}>
                  <Text style={{ textAlign: 'center', fontFamily: 'PlusJakartaSans_500Medium', fontSize: 14, color: theme.colors.textMuted }}>
                    Don't have an account? <Text style={{ color: theme.colors.brand, fontWeight: '700' }}>Create one</Text>
                  </Text>
                </Pressable>
              </View>
            ) : step === 2 ? (
              <View style={{ gap: 20 }}>
                <TextField
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Your password"
                  secureTextEntry={!showPassword}
                  leftIcon={<Lock size={20} color={theme.colors.textSubtle} />}
                  rightIcon={
                    <Pressable onPress={() => setShowPassword(v => !v)}>
                      {showPassword ? <EyeOff size={20} color={theme.colors.textSubtle} /> : <Eye size={20} color={theme.colors.textSubtle} />}
                    </Pressable>
                  }
                />
                <Pressable onPress={() => handleSendOTP()}>
                  <Text style={{ fontFamily: 'PlusJakartaSans_500Medium', fontSize: 14, color: theme.colors.brand }}>Use OTP instead</Text>
                </Pressable>
                <PrimaryButton
                  label={loading ? "Signing in…" : "Sign In"}
                  onPress={handlePasswordSubmit}
                  loading={loading}
                />
              </View>
            ) : step === 3 ? (
              <View style={{ gap: 20 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={{ fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 14, color: theme.colors.text }}>Verification Code</Text>
                  <Pressable onPress={() => handleSendOTP()}>
                    <Text style={{ fontFamily: 'PlusJakartaSans_700Bold', fontSize: 12, color: theme.colors.brand }}>Resend code</Text>
                  </Pressable>
                </View>
                <TextField
                  value={otp}
                  onChangeText={setOtp}
                  placeholder="000000"
                  keyboardType="number-pad"
                  maxLength={6}
                />
                <PrimaryButton
                  label={loading ? "Verifying…" : "Verify & Sign In"}
                  onPress={handleOTPSubmit}
                  loading={loading}
                />
              </View>
            ) : (
              <View style={{ paddingVertical: 32, alignItems: 'center' }}>
                <View style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: theme.colors.surfaceElevated,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 20,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                }}>
                  <CheckCircle2 size={40} color={theme.colors.success} />
                </View>
                <Text style={{ fontFamily: 'SpaceGrotesk_700Bold', fontSize: 24, color: theme.colors.text, marginBottom: 6 }}>You're in!</Text>
                <Text style={{ fontFamily: 'PlusJakartaSans_400Regular', fontSize: 14, color: theme.colors.textMuted }}>Taking you to your dashboard…</Text>
              </View>
            )}
          </Animated.View>
        </View>
      </View>
    </Screen>
  );
}
