import { useMemo } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { View, Text, StyleSheet } from "react-native";
import { CheckCircle2, Mail, ArrowRight } from "lucide-react-native";
import { Screen, PrimaryButton, NeuCard } from "../../components/index.js";
import { useTheme } from "../../theme/ThemeProvider.js";

export default function VerifyScreen() {
  const { email, status } = useLocalSearchParams();
  const { theme } = useTheme();

  const subtitle = useMemo(() => {
    if (typeof email === "string" && email.trim()) {
      return `We sent a verification link to ${email.trim()}.`;
    }
    return "We sent a verification link to the email on your account.";
  }, [email]);

  return (
    <Screen padded={false}>
      <View style={[styles.wrap, { backgroundColor: theme.colors.background }]}>
        <NeuCard style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <View style={[styles.iconWrap, { backgroundColor: theme.colors.surfaceElevated }]}>
            <CheckCircle2 size={34} color={theme.colors.brand} />
          </View>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            {status === "success" ? "Email verified" : "Check your inbox"}
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
            {subtitle}
          </Text>

          <View style={[styles.infoRow, { backgroundColor: theme.colors.surfaceMuted, borderColor: theme.colors.border }]}>
            <Mail size={18} color={theme.colors.textSubtle} />
            <Text style={[styles.infoText, { color: theme.colors.textMuted }]}>
              Follow the link in that email to finish account verification.
            </Text>
          </View>

          <View style={styles.actions}>
            <PrimaryButton
              label="Back to Sign In"
              onPress={() => router.replace("/users/signin")}
              icon={<ArrowRight size={18} color="#fff" />}
            />
          </View>
        </NeuCard>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },
  card: {
    padding: 24,
    borderRadius: 24,
  },
  iconWrap: {
    width: 76,
    height: 76,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
  },
  actions: {
    gap: 12,
  },
});
