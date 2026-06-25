import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../theme/ThemeProvider";
import { PrimaryButton } from "./PrimaryButton";
import { radius, spacing } from "../theme/tokens";

export function EmptyState({
  emoji,
  title,
  subtitle,
  actionLabel,
  onAction,
  variant = "primary",
  style,
}) {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, style]}>
      {emoji ? (
        <View style={[styles.emojiWrap, { backgroundColor: theme.colors.surfaceMuted }]}>
          <Text style={styles.emoji}>{emoji}</Text>
        </View>
      ) : null}

      <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>

      {subtitle ? (
        <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>{subtitle}</Text>
      ) : null}

      {actionLabel && onAction ? (
        <PrimaryButton
          label={actionLabel}
          onPress={onAction}
          variant={variant}
          size="md"
          fullWidth={false}
          style={styles.action}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.xxl,
  },
  emojiWrap: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  emoji: {
    fontSize: 32,
    lineHeight: 40,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    fontFamily: "SpaceGrotesk_700Bold",
    textAlign: "center",
    lineHeight: 26,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "PlusJakartaSans_400Regular",
    textAlign: "center",
    lineHeight: 21,
    maxWidth: 280,
  },
  action: {
    marginTop: spacing.xl,
    minWidth: 180,
  },
});
