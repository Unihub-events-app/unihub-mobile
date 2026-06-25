import { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { CheckCircle2, XCircle, AlertCircle, Info } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../theme/ThemeProvider";
import { radius } from "../theme/tokens";

const TYPE_CONFIG = {
  success: { icon: CheckCircle2, bg: "#22C55E", iconColor: "#fff" },
  error:   { icon: XCircle,      bg: "#EF4444", iconColor: "#fff" },
  warning: { icon: AlertCircle,  bg: "#F59E0B", iconColor: "#fff" },
  info:    { icon: Info,         bg: "#1A1A14", iconColor: "#C8E630" },
};

export function Toast({ message, type = "info", onDismiss, visible, action, actionLabel }) {
  const opacity    = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(24)).current;
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(opacity,    { toValue: 1, useNativeDriver: true, damping: 22, stiffness: 280 }),
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, damping: 22, stiffness: 280 }),
      ]).start();

      const timer = setTimeout(() => onDismiss?.(), 3500);
      return () => clearTimeout(timer);
    } else {
      Animated.parallel([
        Animated.timing(opacity,    { toValue: 0, duration: 180, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 24, duration: 180, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  const config = TYPE_CONFIG[type] || TYPE_CONFIG.info;
  const Icon   = config.icon;

  return (
    <View
      style={[
        styles.overlay,
        { bottom: insets.bottom + 88 },
      ]}
      pointerEvents="box-none"
    >
      <Animated.View
        style={[
          styles.toast,
          { backgroundColor: config.bg, opacity, transform: [{ translateY }] },
        ]}
      >
        <View style={styles.iconWrap}>
          <Icon size={20} color={config.iconColor} />
        </View>

        <Text style={styles.message} numberOfLines={2}>{message}</Text>

        {actionLabel && action ? (
          <Pressable onPress={action} style={styles.actionBtn}>
            <Text style={styles.actionText}>{actionLabel}</Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={onDismiss}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityLabel="Dismiss notification"
          >
            <XCircle size={16} color="rgba(255,255,255,0.70)" />
          </Pressable>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    left: 16,
    right: 16,
    alignItems: "center",
    zIndex: 9999,
  },
  toast: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: radius.xxl,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.20,
    shadowRadius: 16,
    elevation: 10,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  message: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: "#fff",
    lineHeight: 20,
  },
  actionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: "rgba(255,255,255,0.20)",
    borderRadius: 12,
  },
  actionText: {
    fontSize: 12,
    fontWeight: "700",
    fontFamily: "PlusJakartaSans_700Bold",
    color: "#fff",
  },
});
