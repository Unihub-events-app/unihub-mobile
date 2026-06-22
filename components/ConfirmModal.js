import React from "react";
import { StyleSheet, View } from "react-native";
import { AlertTriangle } from "lucide-react-native";
import { ModalShell } from "./ModalShell";
import { PrimaryButton } from "./PrimaryButton";
import { useTheme } from "../theme/ThemeProvider";

export function ConfirmModal({
  visible,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  isDestructive = false,
}) {
  const { theme } = useTheme();
  const accent = isDestructive ? theme.colors.error : theme.colors.brand;

  return (
    <ModalShell
      visible={visible}
      title={title}
      subtitle={message}
      onClose={onCancel}
      footer={
        <View style={styles.buttons}>
          <PrimaryButton
            label={cancelText}
            variant="subtle"
            onPress={onCancel}
            style={styles.button}
            fullWidth={false}
          />
          <PrimaryButton
            label={confirmText}
            variant={isDestructive ? "destructive" : "primary"}
            onPress={onConfirm}
            style={[styles.button, { shadowColor: accent }]}
            fullWidth={false}
          />
        </View>
      }
    >
      <View style={[styles.iconWrap, { backgroundColor: isDestructive ? "rgba(248, 113, 113, 0.12)" : "rgba(96, 165, 250, 0.12)" }]}>
        <AlertTriangle size={26} color={accent} />
      </View>
    </ModalShell>
  );
}

const styles = StyleSheet.create({
  buttons: {
    flexDirection: "row",
    gap: 12,
  },
  button: {
    flex: 1,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
});
