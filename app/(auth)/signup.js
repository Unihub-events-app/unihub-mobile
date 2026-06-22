import { useEffect, useState } from "react";
import { router } from "expo-router";
import { View, Text, Pressable } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import {
  Mail,
  User,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Lock,
  Eye,
  EyeOff,
  Calendar,
  Users,
  Star,
} from "lucide-react-native";
import { Screen, TextField, PrimaryButton, BackButton } from "../../components";
import { PasswordStrength } from "../../components/PasswordStrength";
import { validatePassword } from "../../lib/password";
import { API_URL } from "../../lib/config";
import { useSessionStore } from "../../lib/auth";
import { useTheme } from "../../theme/ThemeProvider";

// Feature slides matching web
const SLIDES = [
  {
    icon: Calendar,
    color: "#3b82f6",
    title: "Discover Events",
    desc: "Find parties, workshops, and meetups happening around your campus.",
  },
  {
    icon: Users,
    color: "#8b5cf6",
    title: "Connect with Peers",
    desc: "Meet like-minded students and grow your campus network.",
  },
  {
    icon: Star,
    color: "#f59e0b",
    title: "Host Your Own",
    desc: "Organize events with powerful tools and sell tickets in minutes.",
  },
];

export default function SignupScreen() {
  const { theme } = useTheme();
  const userToken = useSessionStore((state) => state.userToken);
  const setUserToken = useSessionStore((state) => state.setUserToken);

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
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

  // Slide auto-cycle; freeze on "Host" when org selected
  useEffect(() => {
    if (isOrganization) {
      setActiveSlide(2);
      return;
    }
    const id = setInterval(
      () => setActiveSlide((p) => (p + 1) % SLIDES.length),
      4500,
    );
    return () => clearInterval(id);
  }, [isOrganization]);

  // Auto-generate username from name
  useEffect(() => {
    if (name) {
      setUsername(
        name
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, "")
          .replace(/\s+/g, ""),
      );
    }
  }, [name]);

  // Check username availability (debounced 500ms)
  useEffect(() => {
    if (!username || username.length < 3) {
      setUsernameAvailable(null);
      return;
    }
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
      } catch {
        /* silent */
      } finally {
        setCheckingUsername(false);
      }
    };
    const t = setTimeout(check, 500);
    return () => clearTimeout(t);
  }, [username]);

  // Redirect if already logged in
  useEffect(() => {
    if (userToken) {
      setStep(3);
      setTimeout(() => router.replace("/users/dashboard"), 1500);
    }
  }, [userToken]);

  // Cooldown countdown
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  const handleSendOtp = async () => {
    clearMessages();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
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
        setSuccess(data.msg || "Verification code sent!");
        setStep(2);
        setCooldown(60);
      } else if (
        res.status === 400 &&
        data.msg?.includes("already registered")
      ) {
        setError(data.msg);
        setTimeout(() => {
          setError("Redirecting to sign in…");
          setTimeout(() => router.push("/users/signin"), 2000);
        }, 2000);
      } else {
        setError(data.msg || "Failed to send code");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndSignup = async () => {
    clearMessages();
    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (!username.trim() || username.length < 3) {
      setError("Username must be at least 3 characters.");
      return;
    }
    if (usernameAvailable === false) {
      setError("Username is taken. Please choose another.");
      return;
    }
    if (!otp.trim()) {
      setError("Please enter the verification code.");
      return;
    }
    if (!password.trim()) {
      setError("Please enter a password.");
      return;
    }
    const v = validatePassword(password);
    if (!v.isValid) {
      setError(v.message);
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!acceptedTerms) {
      setError("Please accept the Terms of Service and Privacy Policy.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/signup/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          otp,
          name,
          username,
          isOrganization,
          password,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(data.msg || "Account created!");
        setStep(3);
        const token = data.user?.user_token || data.accessToken;
        await setUserToken(token);
        setTimeout(() => router.push("/users/dashboard"), 2500);
      } else {
        setError(data.msg || "Verification failed. Please check your code.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const CurrentSlideIcon = SLIDES[activeSlide].icon;

  function Check() {
    return (
      <View
        style={{
          width: 10,
          height: 10,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ color: "white", fontSize: 8, fontWeight: "bold" }}>
          ✓
        </Text>
      </View>
    );
  }

  return (
    <Screen padded={false}>
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        {/* Top section: feature slide */}
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 20,
            position: "relative",
          }}
        >
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 20,
              paddingTop: 10,
              paddingBottom: 8,
              zIndex: 20,
            }}
          >
            <BackButton
              onPress={() => (step === 2 ? setStep(1) : router.push("/"))}
              label={step === 2 ? "Back" : "Home"}
            />
            <Text
              style={{
                fontSize: 12,
                fontWeight: "700",
                color: theme.colors.textMuted,
                textTransform: "uppercase",
                letterSpacing: 2,
              }}
            >
              {step < 3 ? `${step} / 2` : "✓"}
            </Text>
          </View>

          <View
            style={{ alignItems: "center", maxWidth: 300 }}
            key={`${activeSlide}-${isOrganization}`}
          >
            <Animated.View
              entering={FadeInUp.duration(500)}
              style={{
                width: 96,
                height: 96,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 32,
                backgroundColor: theme.colors.surface,
                borderRadius: 24,
                borderWidth: 1,
                borderColor: theme.colors.border,
                shadowColor: theme.colors.shadow,
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.08,
                shadowRadius: 16,
                elevation: 3,
              }}
            >
              <CurrentSlideIcon color={SLIDES[activeSlide].color} size={40} />
            </Animated.View>
            <Text
              style={{
                fontFamily: "SpaceGrotesk_700Bold",
                fontSize: 32,
                color: theme.colors.text,
                textAlign: "center",
                marginBottom: 12,
                lineHeight: 36,
              }}
            >
              {step === 2 && name && activeSlide === 1
                ? `Join as ${name.split(" ")[0]}`
                : SLIDES[activeSlide].title}
            </Text>
            <Text
              style={{
                fontFamily: "PlusJakartaSans_400Regular",
                fontSize: 16,
                color: theme.colors.textMuted,
                textAlign: "center",
                lineHeight: 24,
              }}
            >
              {SLIDES[activeSlide].desc}
            </Text>

            <View style={{ flexDirection: "row", gap: 8, marginTop: 40 }}>
              {SLIDES.map((_, i) => (
                <Pressable key={i} onPress={() => setActiveSlide(i)}>
                  <View
                    style={{
                      height: 6,
                      borderRadius: 3,
                      width: i === activeSlide ? 28 : 6,
                      backgroundColor:
                        i === activeSlide
                          ? theme.colors.brand
                          : theme.colors.border,
                    }}
                  />
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        {/* Bottom section: form */}
        <View
          style={{
            flex: 1,
            padding: 20,
            paddingTop: 0,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Animated.View
            entering={FadeInUp.duration(500)}
            style={{
              width: "100%",
              maxWidth: 400,
              padding: 28,
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
            <Text
              key={`h-${step}`}
              style={{
                fontFamily: "SpaceGrotesk_700Bold",
                fontSize: 28,
                color: theme.colors.text,
                marginBottom: 6,
              }}
            >
              {step === 1
                ? "Create Account"
                : step === 2
                  ? "Finish Up"
                  : "Welcome!"}
            </Text>
            <Text
              style={{
                fontFamily: "PlusJakartaSans_400Regular",
                fontSize: 14,
                color: theme.colors.textMuted,
                marginBottom: 24,
              }}
            >
              {step === 1
                ? "Start your campus journey — it only takes a minute."
                : step === 2
                  ? "A few more details to complete your profile."
                  : "Your account is ready. Heading to your dashboard…"}
            </Text>

            {error ? (
              <View
                style={{
                  backgroundColor:
                    theme.colors.mode === "dark"
                      ? "rgba(220, 38, 38, 0.15)"
                      : "#fff1f2",
                  borderWidth: 1,
                  borderColor: theme.colors.error,
                  borderRadius: 16,
                  padding: 12,
                  marginBottom: 20,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <AlertCircle size={18} color={theme.colors.error} />
                <Text
                  style={{
                    fontFamily: "PlusJakartaSans_500Medium",
                    fontSize: 14,
                    color: theme.colors.error,
                  }}
                >
                  {error}
                </Text>
              </View>
            ) : null}
            {success ? (
              <View
                style={{
                  backgroundColor:
                    theme.colors.mode === "dark"
                      ? "rgba(22, 163, 74, 0.15)"
                      : "#f0fdf4",
                  borderWidth: 1,
                  borderColor: theme.colors.success,
                  borderRadius: 16,
                  padding: 12,
                  marginBottom: 20,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <CheckCircle2 size={18} color={theme.colors.success} />
                <Text
                  style={{
                    fontFamily: "PlusJakartaSans_500Medium",
                    fontSize: 14,
                    color: theme.colors.success,
                  }}
                >
                  {success}
                </Text>
              </View>
            ) : null}

            {step === 1 ? (
              <View style={{ gap: 20 }}>
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
                  icon={!loading ? <ArrowRight size={18} color="#fff" /> : null}
                />
                <Pressable onPress={() => router.push("/users/signin")}>
                  <Text
                    style={{
                      textAlign: "center",
                      fontFamily: "PlusJakartaSans_500Medium",
                      fontSize: 14,
                      color: theme.colors.textMuted,
                    }}
                  >
                    Already have an account?{" "}
                    <Text
                      style={{ color: theme.colors.brand, fontWeight: "700" }}
                    >
                      Sign in
                    </Text>
                  </Text>
                </Pressable>
              </View>
            ) : step === 2 ? (
              <View style={{ gap: 16 }}>
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
                    onChangeText={(value) =>
                      setUsername(
                        value.toLowerCase().replace(/[^a-z0-9_]/g, ""),
                      )
                    }
                    placeholder="your_username"
                    leftIcon={
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: "700",
                          color: theme.colors.textSubtle,
                        }}
                      >
                        @
                      </Text>
                    }
                  />
                  {!checkingUsername && username.length >= 3 && (
                    <Text
                      style={{
                        fontSize: 12,
                        marginTop: 6,
                        marginLeft: 4,
                        fontWeight: "500",
                        color: usernameAvailable
                          ? theme.colors.success
                          : theme.colors.error,
                      }}
                    >
                      {usernameAvailable ? "✓ Available" : "✗ Already taken"}
                    </Text>
                  )}
                </View>
                <View>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 8,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: "PlusJakartaSans_600SemiBold",
                        fontSize: 14,
                        color: theme.colors.text,
                      }}
                    >
                      Verification Code
                    </Text>
                    {cooldown > 0 ? (
                      <Text
                        style={{
                          fontSize: 12,
                          color: theme.colors.textMuted,
                          fontWeight: "500",
                        }}
                      >
                        Resend in {cooldown}s
                      </Text>
                    ) : (
                      <Pressable onPress={handleSendOtp}>
                        <Text
                          style={{
                            fontSize: 12,
                            color: theme.colors.brand,
                            fontWeight: "700",
                          }}
                        >
                          Resend code
                        </Text>
                      </Pressable>
                    )}
                  </View>
                  <TextField
                    value={otp}
                    onChangeText={setOtp}
                    placeholder="000000"
                    keyboardType="number-pad"
                    maxLength={6}
                  />
                </View>
                <View>
                  <TextField
                    label="Password"
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Create a strong password"
                    secureTextEntry={!showPassword}
                    leftIcon={
                      <Lock size={20} color={theme.colors.textSubtle} />
                    }
                    rightIcon={
                      <Pressable onPress={() => setShowPassword((v) => !v)}>
                        {showPassword ? (
                          <EyeOff size={20} color={theme.colors.textSubtle} />
                        ) : (
                          <Eye size={20} color={theme.colors.textSubtle} />
                        )}
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
                      {showConfirmPw ? (
                        <EyeOff size={20} color={theme.colors.textSubtle} />
                      ) : (
                        <Eye size={20} color={theme.colors.textSubtle} />
                      )}
                    </Pressable>
                  }
                />
                <Pressable
                  onPress={() => setIsOrganization((v) => !v)}
                  style={{
                    padding: 16,
                    borderRadius: 16,
                    backgroundColor: isOrganization
                      ? theme.colors.mode === "dark"
                        ? "rgba(59,130,246,0.15)"
                        : "rgba(59,130,246,0.06)"
                      : theme.colors.surfaceMuted,
                    borderWidth: 1,
                    borderColor: isOrganization
                      ? theme.colors.brand
                      : theme.colors.border,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <View
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 10,
                        backgroundColor: isOrganization
                          ? theme.colors.brand
                          : "transparent",
                        borderWidth: 2,
                        borderColor: isOrganization
                          ? theme.colors.brand
                          : theme.colors.border,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {isOrganization && <Check />}
                    </View>
                    <View>
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: "700",
                          color: isOrganization
                            ? theme.colors.brand
                            : theme.colors.text,
                          marginBottom: 2,
                        }}
                      >
                        I&apos;m an Organizer
                      </Text>
                      <Text
                        style={{ fontSize: 12, color: theme.colors.textMuted }}
                      >
                        Host events, manage tickets, grow a community
                      </Text>
                    </View>
                  </View>
                </Pressable>
                <Pressable
                  onPress={() => setAcceptedTerms((v) => !v)}
                  style={{
                    flexDirection: "row",
                    gap: 12,
                    alignItems: "flex-start",
                  }}
                >
                  <View
                    style={{
                      marginTop: 2,
                      width: 20,
                      height: 20,
                      borderRadius: 4,
                      backgroundColor: acceptedTerms
                        ? theme.colors.brand
                        : "transparent",
                      borderWidth: 2,
                      borderColor: acceptedTerms
                        ? theme.colors.brand
                        : theme.colors.border,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {acceptedTerms && <Check />}
                  </View>
                  <Text
                    style={{
                      flex: 1,
                      fontSize: 12,
                      color: theme.colors.textMuted,
                      lineHeight: 18,
                    }}
                  >
                    I agree to the Terms of Service and Privacy Policy
                  </Text>
                </Pressable>
                <PrimaryButton
                  label={loading ? "Creating account…" : "Complete Signup"}
                  onPress={handleVerifyAndSignup}
                  loading={loading}
                />
                <Pressable onPress={() => router.push("/users/signin")}>
                  <Text
                    style={{
                      textAlign: "center",
                      fontFamily: "PlusJakartaSans_500Medium",
                      fontSize: 14,
                      color: theme.colors.textMuted,
                    }}
                  >
                    Already have an account?{" "}
                    <Text
                      style={{ color: theme.colors.brand, fontWeight: "700" }}
                    >
                      Sign in
                    </Text>
                  </Text>
                </Pressable>
              </View>
            ) : (
              <View style={{ paddingVertical: 32, alignItems: "center" }}>
                <View
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 40,
                    backgroundColor: theme.colors.surfaceElevated,
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 20,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                  }}
                >
                  <CheckCircle2 size={40} color={theme.colors.success} />
                </View>
                <Text
                  style={{
                    fontFamily: "SpaceGrotesk_700Bold",
                    fontSize: 24,
                    color: theme.colors.text,
                    marginBottom: 6,
                  }}
                >
                  You&apos;re in!
                </Text>
                <Text
                  style={{
                    fontFamily: "PlusJakartaSans_400Regular",
                    fontSize: 14,
                    color: theme.colors.textMuted,
                  }}
                >
                  Heading to your dashboard…
                </Text>
              </View>
            )}
          </Animated.View>
        </View>
      </View>
    </Screen>
  );
}
