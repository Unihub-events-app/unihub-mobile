import { View } from "react-native";
import { useTheme } from "../theme/ThemeProvider";

export function ThemeAwareSurface({ variant = "surface", style, children, ...props }) {
  const { theme } = useTheme();
  const backgroundMap = {
    background: theme.colors.background,
    backgroundAlt: theme.colors.backgroundAlt,
    surface: theme.colors.surface,
    muted: theme.colors.surfaceMuted,
    elevated: theme.colors.surfaceElevated,
  };

  return (
    <View style={[{ backgroundColor: backgroundMap[variant] ?? theme.colors.surface }, style]} {...props}>
      {children}
    </View>
  );
}
