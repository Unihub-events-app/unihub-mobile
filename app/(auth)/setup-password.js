import { useState, useEffect } from "react";
import { router } from "expo-router";
import { View, Text, Pressable } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import {
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
} from "lucide-react-native";
import { Screen, TextField, PrimaryButton, BackButton } from "../../components";
import { PasswordStrength } from "../../components/PasswordStrength";
import { validatePassword } from "../../lib/password";
import { API_URL } from "../../lib/config";
import { useSessionStore } from "../../lib/auth";
import { useTheme } from "../../theme/ThemeProvider";

export default function SetupPasswordScreen() {
  const { theme } = useTheme();
  const token = useSessionStore((state) => state.userToken);
  const hydrated = useSessionStore((state) => state.hydrated);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ error: "", success: "" });

  useEffect(() => {
    if (hydrated && !token) {
      router.replace("/users/signin");
    }
  }, [hydrated, token]);

  async function submit() {
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
      const res = await fetch(`${API_URL}/auth/set-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ error: "", success: data.msg || "Password set successfully!" });
        setTimeout(() => router.replace("/(app)/dashboard"), 2000);
      } else {
        setMessage({ error: data.msg || "Failed to set password. Please try again.", success: "" });
      }
    } catch {
      setMessage({ error: "Network error. Please try again.", success: "" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen padded={false}>
      <View style={{ flex: 1, backgroundColor: theme.colors.background, padding: 20, position: "relative" }}>
        <View style={{ position: "absolute", top: 20, left: 20, zIndex: 20 }}>
          <BackButton onPress={() => router.back()} label="Back" />
        </View>

        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Animated.View
            entering={FadeInUp.duration(500)}
            style={{
              width: "100%",
              maxWidth: 500,
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
                Set Up Your Password
              </Text>
              <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 16, color: theme.colors.textMuted, textAlign: "center" }}>
                Secure your account with a password for faster login next time.
              </Text>
            </View>

            {message.error ? (
              <View
                style={{
                  backgroundColor: theme.colors.mode === 'dark' ? 'rgba(220, 38, 38, 0.15)' : '#fff1f2',
                  borderWidth: 1,
                  borderColor: theme.colors.error,
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: 24,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <AlertCircle size={20} color={theme.colors.error} />
                <Text style={{ fontFamily: "PlusJakartaSans_500Medium", fontSize: 14, color: theme.colors.error }}>{message.error}</Text>
              </View>
            ) : null}
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
              <PrimaryButton label={loading ? "Setting Password..." : "Set Password"} onPress={submit} loading={loading} />
              <Pressable onPress={() => router.replace("/(app)/dashboard")}>
                <Text style={{ textAlign: "center", fontFamily: "PlusJakartaSans_500Medium", fontSize: 14, color: theme.colors.brand, fontWeight: '600' }}>
                  Skip for now
                </Text>
              </Pressable>
            </View>

            <View
              style={{
                marginTop: 32,
                padding: 16,
                borderRadius: 16,
                backgroundColor: theme.colors.surfaceMuted,
                borderWidth: 1,
                borderColor: theme.colors.border,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <ShieldCheck size={20} color={theme.colors.brand} />
                <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 14, color: theme.colors.text }}>Why set a password?</Text>
              </View>
              <View style={{ marginLeft: 28 }}>
                <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 13, color: theme.colors.textMuted, marginBottom: 4 }}>• Faster login without waiting for OTP codes</Text>
                <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 13, color: theme.colors.textMuted, marginBottom: 4 }}>• More secure access to your account</Text>
                <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 13, color: theme.colors.textMuted }}>• You can still use OTP if you forget your password</Text>
              </View>
            </View>
          </Animated.View>
        </View>
      </View>
    </Screen>
  );
}
