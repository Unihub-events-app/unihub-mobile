import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from "react-native";
import { XCircle, CheckCircle2, AlertCircle } from "lucide-react-native";
import { useTheme } from "../theme/ThemeProvider";

export function Toast({ message, type = "info", onDismiss, visible }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  const { theme } = useTheme();

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        onDismiss?.();
      }, 4000);

      return () => clearTimeout(timer);
    } else {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 20,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle2 size={20} color={theme.colors.success} />;
      case "error":
        return <XCircle size={20} color={theme.colors.error} />;
      case "info":
      default:
        return <AlertCircle size={20} color={theme.colors.brand} />;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case "success":
        return theme.mode === "dark" ? "rgba(74, 222, 128, 0.12)" : "rgba(240, 253, 244, 0.96)";
      case "error":
        return theme.mode === "dark" ? "rgba(248, 113, 113, 0.12)" : "rgba(254, 242, 242, 0.96)";
      case "info":
      default:
        return theme.mode === "dark" ? "rgba(96, 165, 250, 0.14)" : "rgba(239, 246, 255, 0.96)";
    }
  };

  return (
    <View style={styles.overlay}>
      <Animated.View
        style={[
          styles.toast,
          { backgroundColor: getBackgroundColor(), opacity, transform: [{ translateY }] },
        ]}
      >
        <View style={styles.iconContainer}>{getIcon()}</View>
        <Text style={[styles.message, { color: theme.colors.text }]}>{message}</Text>
        <TouchableOpacity style={styles.closeBtn} onPress={onDismiss}>
          <XCircle size={16} color={theme.colors.textSubtle} />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 60,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 1000,
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    shadowColor: "rgba(15, 23, 42, 0.24)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    marginHorizontal: 16,
    width: "100%",
    maxWidth: 400,
  },
  iconContainer: {
    marginRight: 12,
  },
  message: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
  },
  closeBtn: {
    marginLeft: 8,
  },
});
