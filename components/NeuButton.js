import { Pressable, Text, StyleSheet } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from "react-native-reanimated";
import { useTheme } from "../theme/ThemeProvider";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function NeuButton({ children, onPress, style, textStyle, disabled = false, small = false, ...props }) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return { transform: [{ scale: scale.value }] };
  });

  const handlePressIn = () => {
    if (!disabled) scale.value = withTiming(0.96, { duration: 140 });
  };
  const handlePressOut = () => {
    if (!disabled) scale.value = withTiming(1, { duration: 140 });
  };

  const buttonStyle = small ? styles.neuButtonSmall : styles.neuButton;
  const textStyleLocal = small ? styles.neuButtonTextSmall : styles.neuButtonText;

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={[
        buttonStyle,
        {
          backgroundColor: theme.colors.surfaceMuted,
          shadowColor: theme.colors.shadow,
          borderColor: theme.colors.border,
        },
        animatedStyle,
        disabled && { opacity: 0.5 },
        style,
      ]}
      {...props}
    >
      {typeof children === "string" ? (
        <Text style={[textStyleLocal, { color: theme.colors.textMuted }, textStyle]}>{children}</Text>
      ) : (
        children
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  neuButton: {
    borderRadius: 18,
    paddingHorizontal: 20,
    paddingVertical: 12,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  neuButtonSmall: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6
  },
  neuButtonText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 14,
  },
  neuButtonTextSmall: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 13,
  }
});
