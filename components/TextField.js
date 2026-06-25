import { forwardRef, useState } from "react";
import { StyleSheet, Text, TextInput, View, Pressable } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { CheckCircle2, AlertCircle, Eye, EyeOff } from "lucide-react-native";
import { useTheme } from "../theme/ThemeProvider";
import { radius } from "../theme/tokens";

export const TextField = forwardRef(function TextField(
  {
    label,
    error,
    helperText,
    leftIcon,
    rightIcon,
    containerStyle,
    inputStyle,
    onFocus,
    onBlur,
    validationState,
    secureTextEntry,
    multiline,
    numberOfLines,
    ...props
  },
  ref
) {
  const { theme } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [isSecureVisible, setIsSecureVisible] = useState(false);
  const borderProgress = useSharedValue(0);

  const hasError   = !!error || validationState === "error";
  const hasSuccess = validationState === "success";
  const isPending  = validationState === "pending";

  const borderColor =
    hasError   ? theme.colors.error  :
    hasSuccess ? theme.colors.success :
    isFocused  ? theme.colors.brand   :
    theme.colors.border;

  const borderWidth = isFocused || hasError || hasSuccess ? 2 : 1;

  const animatedStyle = useAnimatedStyle(() => ({
    borderWidth: withTiming(borderProgress.value === 1 ? 2 : 1, { duration: 150 }),
  }));

  const handleFocus = (e) => {
    setIsFocused(true);
    borderProgress.value = 1;
    onFocus?.(e);
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    borderProgress.value = 0;
    onBlur?.(e);
  };

  const resolvedSecure = secureTextEntry && !isSecureVisible;

  const trailingIcon =
    secureTextEntry ? (
      <Pressable
        onPress={() => setIsSecureVisible((v) => !v)}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        accessibilityLabel={isSecureVisible ? "Hide password" : "Show password"}
      >
        {isSecureVisible
          ? <EyeOff size={18} color={theme.colors.textSubtle} />
          : <Eye     size={18} color={theme.colors.textSubtle} />
        }
      </Pressable>
    ) : hasError   ? <AlertCircle  size={18} color={theme.colors.error}   /> :
      hasSuccess   ? <CheckCircle2 size={18} color={theme.colors.success} /> :
      isPending    ? null :
      rightIcon    ? rightIcon : null;

  const fieldHeight = multiline ? undefined : 52;

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <Text
          style={[
            styles.label,
            {
              color: hasError
                ? theme.colors.error
                : isFocused
                  ? theme.colors.brand
                  : theme.colors.textMuted,
            },
          ]}
        >
          {label}
        </Text>
      ) : null}

      <Animated.View
        style={[
          styles.field,
          {
            backgroundColor: theme.colors.surfaceMuted,
            borderColor,
            borderWidth,
            minHeight: fieldHeight,
            shadowColor: theme.colors.shadow,
          },
          multiline && styles.multiline,
          animatedStyle,
        ]}
      >
        {leftIcon ? <View style={styles.iconLeft}>{leftIcon}</View> : null}
        <TextInput
          ref={ref}
          placeholderTextColor={theme.colors.textSubtle}
          onFocus={handleFocus}
          onBlur={handleBlur}
          secureTextEntry={resolvedSecure}
          multiline={multiline}
          numberOfLines={numberOfLines}
          style={[
            styles.input,
            { color: theme.colors.text },
            multiline && styles.inputMultiline,
            inputStyle,
          ]}
          {...props}
        />
        {trailingIcon ? (
          <View style={styles.iconRight}>{trailingIcon}</View>
        ) : null}
      </Animated.View>

      {hasError && error ? (
        <View style={styles.metaRow}>
          <AlertCircle size={12} color={theme.colors.error} style={{ marginRight: 4 }} />
          <Text style={[styles.meta, { color: theme.colors.error }]}>{error}</Text>
        </View>
      ) : helperText ? (
        <Text style={[styles.meta, { color: theme.colors.textSubtle }]}>{helperText}</Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "PlusJakartaSans_600SemiBold",
    letterSpacing: 0.1,
    lineHeight: 18,
  },
  field: {
    borderRadius: radius.md,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  multiline: {
    alignItems: "flex-start",
    paddingVertical: 14,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 14,
    fontFamily: "PlusJakartaSans_400Regular",
    lineHeight: 22,
  },
  inputMultiline: {
    paddingVertical: 0,
    textAlignVertical: "top",
  },
  iconLeft: {
    marginRight: 12,
  },
  iconRight: {
    marginLeft: 12,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  meta: {
    fontSize: 12,
    fontFamily: "PlusJakartaSans_400Regular",
    lineHeight: 17,
  },
});
