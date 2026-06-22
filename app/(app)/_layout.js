import { Stack } from "expo-router";
import { View, StyleSheet } from "react-native";
import { UserNavBar, UserBottomNav } from "../../components/index.js";
import { useTheme } from "../../theme/ThemeProvider.js";

export default function AppLayout() {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <UserNavBar />
      <View style={styles.content}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: "transparent", flex: 1 },
          }}
        />
      </View>
      <UserBottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
