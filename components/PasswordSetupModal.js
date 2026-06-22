import React from "react";
import { StyleSheet, View } from "react-native";
import { ShieldCheck, ArrowRight, CheckCircle2 } from "lucide-react-native";
import { useRouter } from "expo-router";
import { ModalShell } from "./ModalShell";
import { PrimaryButton } from "./PrimaryButton";
import { useTheme } from "../theme/ThemeProvider";

export default function PasswordSetupModal({ isOpen, onClose }) {
  const router = useRouter();
  const { theme } = useTheme();

  const handleSetup = () => {
    onClose();
    router.push("/(auth)/setup-password");
  };

  return (
    <ModalShell
      visible={isOpen}
      title="Secure Your Account"
      subtitle="Set up a password for faster and more secure login. You can still keep OTP as a backup."
      onClose={onClose}
      footer={
        <View style={styles.actions}>
          <PrimaryButton
            label="Maybe Later"
            variant="subtle"
            onPress={onClose}
            style={styles.secondary}
            fullWidth={false}
          />
          <PrimaryButton
            label="Set Up Password"
            onPress={handleSetup}
            icon={<ArrowRight size={18} color="#fff" />}
            style={styles.primary}
            fullWidth={false}
          />
        </View>
      }
    >
      <View style={[styles.iconContainer, { backgroundColor: theme.colors.brandTint }]}>
        <ShieldCheck size={34} color={theme.colors.brand} />
      </View>
      <View style={styles.benefits}>
        {[
          "Instant login without OTP delays",
          "Enhanced account security",
          "OTP still available as backup",
        ].map((item) => (
          <View key={item} style={styles.benefitRow}>
            <View style={[styles.check, { backgroundColor: theme.colors.brand }]}>
              <CheckCircle2 size={12} color="#fff" />
            </View>
            <Text style={[styles.benefitText, { color: theme.colors.textMuted }]}>{item}</Text>
          </View>
        ))}
      </View>
    </ModalShell>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    width: 68,
    height: 68,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  benefits: {
    gap: 12,
    backgroundColor: "transparent",
  },
  benefitRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  check: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  benefitText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
  },
  actions: {
    flexDirection: "row",
    gap: 12,
  },
  primary: {
    flex: 1,
  },
  secondary: {
    flex: 1,
  },
});
