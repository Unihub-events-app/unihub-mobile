import { View, StyleSheet } from "react-native";
import { useTheme } from "../theme/ThemeProvider";
import { radius, elevation } from "../theme/tokens";

export function NeuCard({ children, style, variant = "base", accentBorder, ...props }) {
  const { theme } = useTheme();

  const variantStyle = VARIANTS[variant] || VARIANTS.base;
  const bg =
    variant === "elevated" ? theme.colors.surfaceElevated :
    variant === "dark"     ? "#1C1C18" :
    theme.colors.surface;

  return (
    <View
      style={[
        styles.common,
        variantStyle,
        {
          backgroundColor: bg,
          borderColor: accentBorder || theme.colors.border,
          shadowColor: theme.colors.shadow,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

const VARIANTS = {
  base: {
    borderRadius: radius.lg,
    borderWidth: 1,
    ...elevation.card,
  },
  elevated: {
    borderRadius: radius.xl,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  flat: {
    borderRadius: radius.lg,
    borderWidth: 1,
    shadowOpacity: 0,
    elevation: 0,
  },
  pill: {
    borderRadius: radius.full,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowOpacity: 0,
    elevation: 0,
  },
  dark: {
    borderRadius: radius.xl,
    borderWidth: 0,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.30,
    shadowRadius: 24,
    elevation: 10,
  },
};

const styles = StyleSheet.create({
  common: {},
});
