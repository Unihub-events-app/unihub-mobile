import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../theme/ThemeProvider";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function PrimaryButton({
  label,
  onPress,
  loading = false,
  icon = null,
  variant = "primary",
  style,
  textStyle,
  disabled = false,
  fullWidth = true,
}) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const isPrimary = variant === "primary";
  const isDestructive = variant === "destructive";
  const isGhost = variant === "ghost";
  const isSubtle = variant === "subtle" || variant === "secondary";
  const backgroundColor =
    isPrimary
      ? theme.colors.brand
      : isDestructive
        ? theme.colors.error
        : isSubtle
          ? theme.colors.surfaceElevated
          : "transparent";
  const textColor =
    isPrimary || isDestructive
      ? "#ffffff"
      : theme.colors.text;

  const handlePressIn = () => {
    scale.value = withTiming(0.98, { duration: 120, easing: Easing.out(Easing.cubic) });
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 120, easing: Easing.out(Easing.cubic) });
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
          backgroundColor,
          borderColor: isPrimary || isDestructive ? backgroundColor : theme.colors.border,
          shadowColor: isPrimary ? theme.colors.brand : theme.colors.shadow,
        },
        isGhost && styles.ghost,
        disabled && styles.disabled,
        style,
      ]}
    >
      {isPrimary ? (
        <LinearGradient
          colors={[theme.colors.brandSoft, theme.colors.brandStrong]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
      ) : null}
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator color={textColor} />
        ) : (
          <>
            {icon ? <View style={styles.icon}>{icon}</View> : null}
            <Text style={[styles.label, { color: textColor }, textStyle]}>{label}</Text>
          </>
        )}
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 22,
    elevation: 6,
  },
  fullWidth: {
    width: "100%",
  },
  ghost: {
    borderWidth: 1,
  },
  disabled: {
    opacity: 0.55,
  },
  content: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    gap: 8,
  },
  icon: {
    marginRight: 0,
  },
  label: {
    fontSize: 15,
    fontWeight: "700",
  },
});
