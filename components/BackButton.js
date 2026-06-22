import React from "react";
import { TouchableOpacity, Text } from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useTheme } from "../theme/ThemeProvider";

export default function BackButton({ className = "", onPress, label = "Back" }) {
  const router = useRouter();
  const { theme } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress || (() => router.back())}
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          paddingHorizontal: 14,
          paddingVertical: 8,
          borderRadius: 16,
          backgroundColor: theme.colors.surfaceMuted,
          borderWidth: 1,
          borderColor: theme.colors.border,
        },
      ]}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold transition-all ${className}`}
    >
      <ArrowLeft size={16} color={theme.colors.text} />
      <Text style={{ fontSize: 14, fontWeight: "700", color: theme.colors.text }}>{label}</Text>
    </TouchableOpacity>
  );
}
