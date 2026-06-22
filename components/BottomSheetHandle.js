import { View, StyleSheet } from "react-native";
import { useTheme } from "../theme/ThemeProvider";

export function BottomSheetHandle() {
  const { theme } = useTheme();

  return (
    <View style={styles.wrap}>
      <View style={[styles.handle, { backgroundColor: theme.colors.border }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    paddingVertical: 10,
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: 999,
  },
});
