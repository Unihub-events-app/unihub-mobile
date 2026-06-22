import { View, StyleSheet } from "react-native";
import { useTheme } from "../theme/ThemeProvider";

export function NeuCard({ children, style, small = false, elevated = false, ...props }) {
  const { theme } = useTheme();
  const cardStyle = small ? styles.small : styles.base;
  const backgroundColor = elevated ? theme.colors.surfaceElevated : theme.colors.surface;

  return (
    <View
      style={[
        cardStyle,
        {
          backgroundColor,
          borderColor: theme.colors.border,
          shadowColor: theme.colors.shadow,
          overflow: "hidden",
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 24,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.1,
    shadowRadius: 28,
    elevation: 5,
  },
  small: {
    borderRadius: 18,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
});
