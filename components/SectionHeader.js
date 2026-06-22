import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../theme/ThemeProvider";

export function SectionHeader({ title, subtitle, action }) {
  const { theme } = useTheme();

  return (
    <View style={styles.row}>
      <View style={styles.textBlock}>
        <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
        {subtitle ? <Text style={[styles.subtitle, { color: theme.colors.textSubtle }]}>{subtitle}</Text> : null}
      </View>
      {action ? <View>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  textBlock: {
    flex: 1,
    paddingRight: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
  },
});
