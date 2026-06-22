import { View, StyleSheet } from "react-native";
import { useTheme } from "../theme/ThemeProvider";

export function AppShell({ children, style }) {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.shell,
        { backgroundColor: theme.colors.background },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    width: "100%",
  },
});
