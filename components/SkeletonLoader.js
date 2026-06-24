import React from "react";
import { View } from "react-native";
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
  const opacity = useSharedValue(0.4);
  const { theme } = useTheme();

  React.useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.9, { duration: 700, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.4, { duration: 700, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          backgroundColor: theme.colors.surfaceMuted,
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
