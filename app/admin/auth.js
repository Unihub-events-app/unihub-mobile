import { useEffect, useState } from "react";
import { router } from "expo-router";
import { View, Text, Pressable } from "react-native";
import { ChevronLeft, Mail, Lock, ShieldCheck } from "lucide-react-native";
import { Screen } from "../../components/Screen";
import { TextField } from "../../components/TextField";
import { PrimaryButton } from "../../components/PrimaryButton";
import { useSessionStore } from "../../lib/auth";
import { API_URL } from "../../lib/config";

export default function AdminAuthScreen() {
  const adminToken = useSessionStore((state) => state.adminToken);
  const setAdminToken = useSessionStore((state) => state.setAdminToken);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ error: "", success: "" });

  useEffect(() => {
    if (adminToken) {
      router.replace("/admin/dashboard");
    }
  }, [adminToken]);

  async function submit() {
    setMessage({ error: "", success: "" });
    if (!email || !password) {
      setMessage({ error: "Enter your admin credentials.", success: "" });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ error: data.msg || "Admin authentication failed.", success: "" });
        return;
      }

      if (!data.admin_token) {
        setMessage({ error: "Authentication error. Please try again.", success: "" });
        return;
      }
      await setAdminToken(data.admin_token);
      setMessage({ error: "", success: data.msg || "Authenticated." });
      router.replace("/admin/dashboard");
    } catch {
      setMessage({ error: "Network error. Please try again.", success: "" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen className="bg-slate-50">
      <View className="flex-1 py-4">
        <Pressable onPress={() => router.replace("/")} className="self-start flex-row items-center gap-2 rounded-full bg-white px-3 py-2">
          <ChevronLeft size={18} color="#0f172a" />
          <Text className="text-sm font-semibold text-slate-900">Home</Text>
        </Pressable>

        <View className="mt-8 rounded-[28px] bg-white p-5 shadow-sm">
          <View className="items-center">
            <View className="mb-4 rounded-full bg-brand-50 p-4">
              <ShieldCheck size={32} color="#2563eb" />
            </View>
            <Text className="text-3xl font-bold text-slate-950">UniHub Admin</Text>
            <Text className="mt-2 text-center text-sm leading-5 text-slate-500">
              Restricted access. Admin authentication required.
            </Text>
          </View>

          {message.error ? (
            <View className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
              <Text className="text-sm font-medium text-rose-700">{message.error}</Text>
            </View>
          ) : null}
          {message.success ? (
            <View className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
              <Text className="text-sm font-medium text-emerald-700">{message.success}</Text>
            </View>
          ) : null}

          <View className="mt-6 gap-4">
            <TextField
              label="Admin Email"
              value={email}
              onChangeText={setEmail}
              placeholder="admin@unihub.com"
              autoCapitalize="none"
              keyboardType="email-address"
              leftIcon={<Mail size={18} color="#64748b" />}
            />
            <TextField
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry
              leftIcon={<Lock size={18} color="#64748b" />}
            />
            <PrimaryButton label="Verify Credentials" onPress={submit} loading={loading} />
            <Text className="text-center text-xs text-slate-400">Review docs in the UniHub repository.</Text>
          </View>
        </View>
      </View>
    </Screen>
  );
}
