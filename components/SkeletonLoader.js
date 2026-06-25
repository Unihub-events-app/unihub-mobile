import { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useTheme } from "../theme/ThemeProvider";
import { radius } from "../theme/tokens";

function SkeletonBase({ width = "100%", height = 16, borderRadius = radius.xs, style }) {
  const { theme } = useTheme();
  const opacity = useSharedValue(0.35);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.80, { duration: 700, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.35, { duration: 700, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[{ backgroundColor: theme.colors.surfaceMuted, width, height, borderRadius }, style, animatedStyle]}
    />
  );
}

function SkeletonRow({ style }) {
  return (
    <View style={[styles.row, style]}>
      <SkeletonBase width={72} height={72} borderRadius={radius.md} />
      <View style={styles.rowContent}>
        <SkeletonBase width="65%" height={15} borderRadius={radius.xs} />
        <SkeletonBase width="45%" height={12} borderRadius={radius.xs} style={{ marginTop: 8 }} />
        <SkeletonBase width="30%" height={12} borderRadius={radius.xs} style={{ marginTop: 8 }} />
      </View>
    </View>
  );
}

function SkeletonCard({ style }) {
  return (
    <View style={[styles.card, style]}>
      <SkeletonBase width="100%" height={200} borderRadius={radius.xl} />
      <View style={styles.cardContent}>
        <SkeletonBase width="50%" height={14} borderRadius={radius.xs} />
        <SkeletonBase width="80%" height={18} borderRadius={radius.xs} style={{ marginTop: 8 }} />
        <SkeletonBase width="60%" height={14} borderRadius={radius.xs} style={{ marginTop: 8 }} />
      </View>
    </View>
  );
}

function SkeletonPill({ width = 80, style }) {
  return <SkeletonBase width={width} height={36} borderRadius={radius.xxl} style={style} />;
}

function SkeletonText({ width = "70%", style }) {
  return <SkeletonBase width={width} height={14} borderRadius={radius.xs} style={style} />;
}

function SkeletonAvatar({ size = 48, style }) {
  return <SkeletonBase width={size} height={size} borderRadius={radius.full} style={style} />;
}

export function SkeletonLoader({ variant = "text", count = 1, style }) {
  const Component =
    variant === "card"   ? SkeletonCard :
    variant === "row"    ? SkeletonRow  :
    variant === "pill"   ? SkeletonPill :
    variant === "avatar" ? SkeletonAvatar :
    SkeletonText;

  return (
    <View style={[styles.container, style]}>
      {Array.from({ length: count }).map((_, i) => (
        <Component key={i} style={i > 0 ? styles.subsequent : undefined} />
      ))}
    </View>
  );
}

export default SkeletonLoader;

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  subsequent: {},
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  rowContent: {
    flex: 1,
  },
  card: {},
  cardContent: {
    padding: 14,
    gap: 0,
  },
});
