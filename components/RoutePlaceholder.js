import { View, Text, StyleSheet } from "react-native";
import { Screen } from "./Screen";
import { useTheme } from "../theme/ThemeProvider";

export function RoutePlaceholder({ title, description }) {
  const { theme } = useTheme();

  return (
    <Screen padded={false}>
      <View style={[styles.wrap, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
          <Text style={[styles.description, { color: theme.colors.textMuted }]}>{description}</Text>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
});
