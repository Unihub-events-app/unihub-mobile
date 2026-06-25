import { useTheme } from "../../theme/ThemeProvider.js";
import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { CheckCircle2 } from "lucide-react-native";
import { Screen, NeuCard, NeuInset } from "../../components/index.js";

export default function VerifyScreen() {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.headerTitle}>Verify Your Email</Text>
        
        <NeuInset style={styles.emptyState}>
          <CheckCircle2 size={48} color={theme.colors.textSubtle} />
          <Text style={styles.emptyTitle}>Coming Soon</Text>
          <Text style={styles.emptyText}>
            Email verification will be available here soon!
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
