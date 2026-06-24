import { Modal, Pressable, StyleSheet, Text, TouchableWithoutFeedback, View } from "react-native";
import { X } from "lucide-react-native";
import { NeuCard } from "./NeuCard";
import { useTheme } from "../theme/ThemeProvider";

export function ModalShell({
  visible,
  title,
  subtitle,
  onClose,
  children,
  footer,
  maxWidth = 440,
  scrollable = true,
}) {
  const { theme } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={[styles.overlay, { backgroundColor: theme.colors.overlay }]}>
          <TouchableWithoutFeedback>
            <NeuCard style={[styles.card, { maxWidth }]}>
              <View style={styles.header}>
                <View style={styles.headingBlock}>
                  {title ? <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text> : null}
                  {subtitle ? <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>{subtitle}</Text> : null}
                </View>
                <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn}>
                  <X size={18} color={theme.colors.textSubtle} />
                </Pressable>
              </View>
              <View style={scrollable ? styles.scrollContent : styles.content}>{children}</View>
              {footer ? <View style={styles.footer}>{footer}</View> : null}
            </NeuCard>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
  },
  card: {
    width: "100%",
    padding: 20,
    borderRadius: 24,
    maxHeight: "88%",
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 16,
  },
  headingBlock: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "800",
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
  },
  footer: {
    marginTop: 20,
  },
});
