import { forwardRef, useMemo, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useTheme } from "../theme/ThemeProvider";

export const TextField = forwardRef(function TextField(
  { label, error, helperText, leftIcon, rightIcon, containerStyle, inputStyle, onFocus, onBlur, ...props },
  ref
) {
  const { theme } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const borderProgress = useSharedValue(0);

  const surfaceStyles = useMemo(
    () => ({
      backgroundColor: theme.colors.surfaceMuted,
      borderColor: error
        ? theme.colors.error
        : isFocused
          ? theme.colors.brand
          : theme.colors.border,
      shadowColor: theme.colors.shadow,
    }),
    [theme, error, isFocused]
  );

  const animatedStyle = useAnimatedStyle(() => ({
    borderWidth: 1,
    transform: [{ translateY: borderProgress.value * -1 }],
  }));

  const handleFocus = (event) => {
    setIsFocused(true);
    borderProgress.value = withTiming(1, { duration: 180, easing: Easing.out(Easing.cubic) });
    onFocus?.(event);
  };

  const handleBlur = (event) => {
    setIsFocused(false);
    borderProgress.value = withTiming(0, { duration: 180, easing: Easing.out(Easing.cubic) });
    onBlur?.(event);
  };

  return (
    <View style={containerStyle}>
      {label ? (
        <Text style={[styles.label, { color: theme.colors.text }]}>{label}</Text>
      ) : null}
      <Animated.View style={[styles.field, surfaceStyles, animatedStyle]}>
        {leftIcon ? <View style={styles.iconLeft}>{leftIcon}</View> : null}
        <TextInput
          ref={ref}
          placeholderTextColor={theme.colors.textSubtle}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={[
            styles.input,
            { color: theme.colors.text },
            inputStyle,
          ]}
          {...props}
        />
        {rightIcon ? <View style={styles.iconRight}>{rightIcon}</View> : null}
      </Animated.View>
      {error ? (
        <Text style={[styles.meta, { color: theme.colors.error }]}>{error}</Text>
      ) : helperText ? (
        <Text style={[styles.meta, { color: theme.colors.textSubtle }]}>{helperText}</Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  label: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  field: {
    minHeight: 56,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 2,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 14,
  },
  iconLeft: {
    marginRight: 12,
  },
  iconRight: {
    marginLeft: 12,
  },
  meta: {
    fontSize: 12,
    marginTop: 6,
  },
});
