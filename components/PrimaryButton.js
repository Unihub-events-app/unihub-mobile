import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { useTheme } from "../theme/ThemeProvider";
import { springs } from "../theme/tokens";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const SIZE_CONFIG = {
  sm: { height: 40, paddingHorizontal: 16, fontSize: 13, borderRadius: 20 },
  md: { height: 50, paddingHorizontal: 20, fontSize: 15, borderRadius: 25 },
  lg: { height: 58, paddingHorizontal: 24, fontSize: 16, borderRadius: 29 },
};

export function PrimaryButton({
  label,
  onPress,
  loading = false,
  icon = null,
  variant = "primary",
  size = "md",
  style,
  textStyle,
  disabled = false,
  fullWidth = true,
  accentColor,
}) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);
  const sizeConfig = SIZE_CONFIG[size] || SIZE_CONFIG.md;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const isPrimary     = variant === "primary";
  const isSecondary   = variant === "secondary";
  const isGhost       = variant === "ghost";
  const isDestructive = variant === "destructive";
  const isAccent      = variant === "accent";

  const backgroundColor =
    isPrimary     ? theme.colors.brand :
    isDestructive ? theme.colors.error :
    isAccent      ? (accentColor || theme.colors.accentCommunity) :
    isSecondary   ? theme.colors.surfaceElevated :
    "transparent";

  const borderColor =
    isPrimary || isDestructive || isAccent
      ? "transparent"
      : theme.colors.borderStrong;

  const textColor =
    isPrimary     ? theme.colors.textOnBrand :
    isDestructive ? "#ffffff" :
    isAccent      ? "#ffffff" :
    theme.colors.text;

  const shadowColor =
    isPrimary  ? theme.colors.brand :
    isAccent   ? (accentColor || theme.colors.accentCommunity) :
    "transparent";

  const handlePressIn = () => {
    scale.value = withSpring(0.96, springs.snappy);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, springs.snappy);
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      style={[
        animatedStyle,
        styles.button,
        fullWidth && styles.fullWidth,
        {
          height: sizeConfig.height,
          borderRadius: sizeConfig.borderRadius,
          paddingHorizontal: sizeConfig.paddingHorizontal,
          backgroundColor,
          borderColor,
          shadowColor,
        },
        (isPrimary || isAccent) && styles.shadow,
        disabled && styles.disabled,
        style,
      ]}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator color={textColor} size="small" />
        ) : (
          <>
            {icon ? <View style={styles.icon}>{icon}</View> : null}
            <Text
              style={[
                styles.label,
                { color: textColor, fontSize: sizeConfig.fontSize },
                textStyle,
              ]}
            >
              {label}
            </Text>
          </>
        )}
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderWidth: 1.5,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  fullWidth: {
    width: "100%",
  },
  shadow: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 5,
  },
  disabled: {
    opacity: 0.45,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  icon: {},
  label: {
    fontWeight: "700",
    fontFamily: "PlusJakartaSans_700Bold",
    letterSpacing: 0.1,
  },
});
