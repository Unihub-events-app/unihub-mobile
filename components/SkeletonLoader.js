import React from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useTheme } from "../theme/ThemeProvider";

const SkeletonLoader = ({ width = "100%", height = 20, borderRadius = 8, style }) => {
  const opacity = useSharedValue(0.3);
  const { theme } = useTheme();

  React.useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.3, { duration: 800, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  return (
    <Animated.View
      style={[
        {
          backgroundColor: theme.mode === "dark" ? "rgba(148, 163, 184, 0.14)" : "#e5e7eb",
          width,
          height,
          borderRadius,
        },
        style,
        animatedStyle,
      ]}
    />
  );
};

export default SkeletonLoader;
