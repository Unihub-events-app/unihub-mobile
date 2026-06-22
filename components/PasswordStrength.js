import { View, Text } from "react-native";
import { calculatePasswordStrength } from "../lib/password";
import { useTheme } from "../theme/ThemeProvider";

export function PasswordStrength({ password }) {
  const { theme } = useTheme();
  const strength = calculatePasswordStrength(password);
  const barColor =
    strength.level === "weak"
      ? theme.colors.error
      : strength.level === "fair"
      ? theme.colors.warning
      : strength.level === "good"
      ? theme.colors.brand
      : theme.colors.success;

  if (!password) return null;

  return (
    <View style={{ marginTop: 12, gap: 8 }}>
      <View
        style={{
          height: 8,
          borderRadius: 999,
          backgroundColor: theme.mode === "dark" ? "rgba(148, 163, 184, 0.18)" : theme.colors.surfaceElevated,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            height: 8,
            borderRadius: 999,
            width: `${strength.percentage}%`,
            backgroundColor: barColor,
          }}
        />
      </View>
      <Text style={{ fontSize: 12, fontWeight: "600", color: theme.colors.textSubtle }}>
        {strength.label}
      </Text>
    </View>
  );
}
