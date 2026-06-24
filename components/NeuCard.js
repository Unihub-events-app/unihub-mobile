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
    borderRadius: 20,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  small: {
    borderRadius: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
});
