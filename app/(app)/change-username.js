import { useTheme } from "../../theme/ThemeProvider.js";
import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { User } from "lucide-react-native";
import { Screen, NeuCard, NeuInset } from "../../components/index.js";

export default function ChangeUsernameScreen() {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.headerTitle}>Change Username</Text>
        
        <NeuInset style={styles.emptyState}>
          <User size={48} color="#9ca3af" />
          <Text style={styles.emptyTitle}>Coming Soon</Text>
          <Text style={styles.emptyText}>
            Username change will be available here soon!
          </Text>
        </NeuInset>
        
        <View style={{ height: 120 }} />
      </ScrollView>
    </Screen>
  );
}

const getStyles = (theme) => StyleSheet.create({
  scrollContainer: {
    paddingTop: 24,
    paddingBottom: 24,
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    fontFamily: "SpaceGrotesk_700Bold",
    color: theme.colors.text,
    marginBottom: 20,
  },
  emptyState: {
    padding: 40,
    alignItems: "center",
    borderRadius: 24,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.text,
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.textSubtle,
    textAlign: "center",
  },
});
