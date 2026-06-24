import { View, StyleSheet } from "react-native";
import { useTheme } from "../theme/ThemeProvider";

export function NeuInset({ children, style, ...props }) {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.neuInset,
        {
          backgroundColor: theme.colors.surfaceMuted,
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
  neuInset: {
    borderRadius: 14,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
});
