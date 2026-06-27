import { useState } from "react";
import { router } from "expo-router";
import { View, Text, Pressable } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from "lucide-react-native";
import { Screen, TextField, PrimaryButton, BackButton } from "../../components";
import { PasswordStrength } from "../../components/PasswordStrength";
import { validatePassword } from "../../lib/password";
import { API_URL } from "../../lib/config";
import { useTheme } from "../../theme/ThemeProvider";

export default function ForgotPasswordScreen() {
  const { theme } = useTheme();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ error: "", success: "" });

  async function sendOtp() {
    setMessage({ error: "", success: "" });
    if (!email.includes("@")) {
      setMessage({ error: "Please enter a valid email address.", success: "" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/forgot-password/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ error: "", success: data.msg || "Verification code sent to your email!" });
        setStep(2);
      } else {
        setMessage({ error: data.msg || "Failed to send verification code", success: "" });
      }
    } catch {
      setMessage({ error: "Network error. Please try again.", success: "" });
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp() {
    setLoading(true);
    setMessage({ error: "", success: "" });
    try {
      const res = await fetch(`${API_URL}/auth/forgot-password/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ error: "", success: "Code verified! Set your new password." });
        setStep(3);
      } else {
        setMessage({ error: data.msg || "Invalid or expired code", success: "" });
      }
    } catch {
      setMessage({ error: "Network error. Please try again.", success: "" });
    } finally {
      setLoading(false);
    }
  }

  async function resetPassword() {
    setMessage({ error: "", success: "" });
    const validation = validatePassword(password);
    if (!validation.isValid) {
      setMessage({ error: validation.message, success: "" });
      return;
    }
    if (password !== confirmPassword) {
      setMessage({ error: "Passwords do not match.", success: "" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/forgot-password/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ error: "", success: "Password reset successfully!" });
        setStep(4);
        setTimeout(() => router.replace("/users/signin"), 2000);
      } else {
        setMessage({ error: data.msg || "Failed to reset password", success: "" });
      }
    } catch {
      setMessage({ error: "Network error. Please try again.", success: "" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen padded={false}>
      <View style={{ flex: 1, backgroundColor: theme.colors.background, padding: 20, justifyContent: "center", alignItems: "center", position: "relative" }}>
        <View style={{ position: "absolute", top: 20, left: 20, zIndex: 20 }}>
          <BackButton
            onPress={() => (step === 1 ? router.back() : setStep(step - 1))}
            label="Back"
          />
        </View>

        <Animated.View
          entering={FadeInUp.duration(500)}
          style={{
            width: "100%",
            maxWidth: 400,
            padding: 32,
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
          <View style={{ alignItems: "center", marginBottom: 32 }}>
            <View
              style={{
                width: 80,
                height: 80,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
                backgroundColor: theme.colors.surfaceElevated,
                borderRadius: 40,
                borderWidth: 1,
                borderColor: theme.colors.border,
              }}
            >
              <ShieldCheck size={32} color={theme.colors.brand} />
            </View>
            <Text style={{ fontFamily: "SpaceGrotesk_700Bold", fontSize: 32, color: theme.colors.text, marginBottom: 8, textAlign: "center" }}>
              {step === 1 && "Forgot Password?"}
              {step === 2 && "Verify Code"}
              {step === 3 && "New Password"}
              {step === 4 && "All Set!"}
            </Text>
            <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 16, color: theme.colors.textMuted, textAlign: "center" }}>
              {step === 1 && "Enter your email to receive a verification code"}
              {step === 2 && "Enter the 6-digit code sent to your email"}
              {step === 3 && "Create a strong new password"}
              {step === 4 && "Your password has been reset"}
            </Text>
          </View>

          {message.success ? (
            <View
              style={{
                backgroundColor: theme.colors.mode === 'dark' ? 'rgba(22, 163, 74, 0.15)' : '#f0fdf4',
                borderWidth: 1,
                borderColor: theme.colors.success,
                borderRadius: 16,
                padding: 16,
                marginBottom: 24,
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
              }}
            >
              <CheckCircle2 size={20} color={theme.colors.success} />
              <Text style={{ fontFamily: "PlusJakartaSans_500Medium", fontSize: 14, color: theme.colors.success }}>{message.success}</Text>
            </View>
          ) : null}

          {step === 1 && (
            <View style={{ gap: 24 }}>
              <TextField
                label="Email Address"
                value={email}
                onChangeText={setEmail}
                placeholder="your@email.com"
                autoCapitalize="none"
                keyboardType="email-address"
                leftIcon={<Mail size={20} color={theme.colors.textSubtle} />}
              />
              {message.error ? (
                <View style={{ backgroundColor: theme.colors.mode === 'dark' ? 'rgba(220, 38, 38, 0.15)' : '#fff1f2', borderWidth: 1, borderColor: theme.colors.error, borderRadius: 12, padding: 12, flexDirection: "row", alignItems: "center", gap: 10, marginTop: -8 }}>
                  <AlertCircle size={16} color={theme.colors.error} />
                  <Text style={{ fontFamily: "PlusJakartaSans_500Medium", fontSize: 13, color: theme.colors.error, flex: 1 }}>{message.error}</Text>
                </View>
              ) : null}
              <PrimaryButton
                label={loading ? "Sending..." : "Send Code"}
                onPress={sendOtp}
                loading={loading}
                icon={!loading ? <ArrowRight size={18} color="#fff" /> : null}
              />
              <Pressable onPress={() => router.push("/users/signin")}>
                <Text style={{ textAlign: "center", fontFamily: "PlusJakartaSans_500Medium", fontSize: 14, color: theme.colors.brand, fontWeight: '600' }}>
                  Back to Sign In
                </Text>
              </Pressable>
            </View>
          )}

          {step === 2 && (
            <View style={{ gap: 24 }}>
              <View style={{ marginBottom: 8 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 14, color: theme.colors.text }}>Verification Code</Text>
                  <Pressable onPress={sendOtp} disabled={loading}>
                    <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 12, color: loading ? theme.colors.textSubtle : theme.colors.brand }}>Resend Code</Text>
                  </Pressable>
                </View>
                <TextField
                  value={otp}
                  onChangeText={(text) => setOtp(text.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  keyboardType="number-pad"
                  maxLength={6}
                />
                <Text style={{ fontSize: 12, color: theme.colors.textSubtle, textAlign: "center", marginTop: 8 }}>Code sent to {email}</Text>
                {message.error ? (
                  <View style={{ backgroundColor: theme.colors.mode === 'dark' ? 'rgba(220, 38, 38, 0.15)' : '#fff1f2', borderWidth: 1, borderColor: theme.colors.error, borderRadius: 12, padding: 12, flexDirection: "row", alignItems: "center", gap: 10, marginTop: 10 }}>
                    <AlertCircle size={16} color={theme.colors.error} />
                    <Text style={{ fontFamily: "PlusJakartaSans_500Medium", fontSize: 13, color: theme.colors.error, flex: 1 }}>{message.error}</Text>
                  </View>
                ) : null}
              </View>
              <PrimaryButton
                label={loading ? "Verifying..." : "Verify Code"}
                onPress={verifyOtp}
                loading={loading}
              />
              <Pressable onPress={() => setStep(1)}>
                <Text style={{ textAlign: "center", fontFamily: "PlusJakartaSans_500Medium", fontSize: 14, color: theme.colors.brand, fontWeight: '600' }}>
                  Change Email
                </Text>
              </Pressable>
            </View>
          )}

          {step === 3 && (
            <View style={{ gap: 24 }}>
              <View>
                <TextField
                  label="New Password"
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
              <View>
                <TextField
                  label="Confirm Password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Re-enter your password"
                  secureTextEntry={!showConfirmPassword}
                  leftIcon={<Lock size={20} color={theme.colors.textSubtle} />}
                  rightIcon={
                    <Pressable onPress={() => setShowConfirmPassword((v) => !v)}>
                      {showConfirmPassword ? <EyeOff size={20} color={theme.colors.textSubtle} /> : <Eye size={20} color={theme.colors.textSubtle} />}
                    </Pressable>
                  }
                />
                {message.error ? (
                  <View style={{ backgroundColor: theme.colors.mode === 'dark' ? 'rgba(220, 38, 38, 0.15)' : '#fff1f2', borderWidth: 1, borderColor: theme.colors.error, borderRadius: 12, padding: 12, flexDirection: "row", alignItems: "center", gap: 10, marginTop: 10 }}>
                    <AlertCircle size={16} color={theme.colors.error} />
                    <Text style={{ fontFamily: "PlusJakartaSans_500Medium", fontSize: 13, color: theme.colors.error, flex: 1 }}>{message.error}</Text>
                  </View>
                ) : null}
              </View>
              <PrimaryButton
                label={loading ? "Resetting..." : "Reset Password"}
                onPress={resetPassword}
                loading={loading}
              />
            </View>
          )}

          {step === 4 && (
            <View style={{ alignItems: "center", paddingVertical: 32 }}>
              <View
                style={{
                  width: 96,
                  height: 96,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 24,
                  backgroundColor: theme.colors.surfaceElevated,
                  borderRadius: 48,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                }}
              >
                <CheckCircle2 size={40} color={theme.colors.success} />
              </View>
              <Text style={{ fontFamily: "SpaceGrotesk_700Bold", fontSize: 24, color: theme.colors.text, marginBottom: 8 }}>Password Reset!</Text>
              <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 14, color: theme.colors.textMuted, marginBottom: 24, textAlign: "center" }}>
                You can now sign in with your new password
              </Text>
              <PrimaryButton label="Go to Sign In" onPress={() => router.replace("/users/signin")} />
            </View>
          )}
        </Animated.View>
      </View>
    </Screen>
  );
}
