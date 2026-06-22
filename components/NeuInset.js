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
    borderRadius: 18,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
});
