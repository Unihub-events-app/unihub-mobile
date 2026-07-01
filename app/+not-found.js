import { View, Text, StyleSheet, Pressable, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withRepeat,
  Easing,
} from "react-native-reanimated";
import { useEffect } from "react";
import { useTheme } from "../theme/ThemeProvider";
import { palette, radius } from "../theme/tokens";
import { ArrowLeft, Compass } from "lucide-react-native";

export default function NotFound() {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const c = theme.colors;

  const ring1Opacity = useSharedValue(0);
  const ring1Scale  = useSharedValue(0.5);
  const ring2Opacity = useSharedValue(0);
  const ring2Scale  = useSharedValue(0.5);
  const ring3Opacity = useSharedValue(0);
  const ring3Scale  = useSharedValue(0.5);
  const ring3Rotate = useSharedValue(0);

  const labelOpacity = useSharedValue(0);
  const labelY       = useSharedValue(20);
  const contentOpacity = useSharedValue(0);
  const contentY       = useSharedValue(28);

  useEffect(() => {
    const easeOut = Easing.out(Easing.quart);

    ring1Opacity.value = withDelay(0,   withTiming(0.22, { duration: 700, easing: easeOut }));
    ring1Scale.value   = withDelay(0,   withTiming(1,    { duration: 800, easing: easeOut }));

    ring2Opacity.value = withDelay(120, withTiming(0.13, { duration: 700, easing: easeOut }));
    ring2Scale.value   = withDelay(120, withTiming(1,    { duration: 800, easing: easeOut }));

    ring3Opacity.value = withDelay(240, withTiming(0.07, { duration: 700, easing: easeOut }));
    ring3Scale.value   = withDelay(240, withTiming(1,    { duration: 800, easing: easeOut }));

    ring3Rotate.value = withRepeat(
      withTiming(360, { duration: 20000, easing: Easing.linear }),
      -1,
      false
    );

    labelOpacity.value   = withDelay(200, withTiming(1,  { duration: 500, easing: easeOut }));
    labelY.value         = withDelay(200, withTiming(0,  { duration: 500, easing: easeOut }));

    contentOpacity.value = withDelay(380, withTiming(1,  { duration: 520, easing: easeOut }));
    contentY.value       = withDelay(380, withTiming(0,  { duration: 520, easing: easeOut }));
  }, []);

  const size1 = width * 0.40;
  const size2 = width * 0.65;
  const size3 = width * 0.90;

  const ring1Style = useAnimatedStyle(() => ({
    opacity: ring1Opacity.value,
    transform: [{ scale: ring1Scale.value }],
  }));

  const ring2Style = useAnimatedStyle(() => ({
    opacity: ring2Opacity.value,
    transform: [{ scale: ring2Scale.value }],
  }));

  const ring3Style = useAnimatedStyle(() => ({
    opacity: ring3Opacity.value,
    transform: [
      { scale: ring3Scale.value },
      { rotate: ring3Rotate.value + "deg" },
    ],
  }));

  const labelStyle = useAnimatedStyle(() => ({
    opacity: labelOpacity.value,
    transform: [{ translateY: labelY.value }],
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: contentY.value }],
  }));

  return (
    <SafeAreaView style={[s.root, { backgroundColor: c.background }]}>

      {/* Concentric ring system */}
      <View style={s.ringsContainer} pointerEvents="none">
        <Animated.View
          style={[
            s.ring,
            ring1Style,
            {
              width: size1,
              height: size1,
              borderRadius: size1 / 2,
              backgroundColor: palette.lime,
            },
          ]}
        />
        <Animated.View
          style={[
            s.ring,
            ring2Style,
            {
              width: size2,
              height: size2,
              borderRadius: size2 / 2,
              borderWidth: 1.5,
              borderColor: palette.lime,
            },
          ]}
        />
        {/* Outer ring: 4 tick marks at cardinal points, slow rotation */}
        <Animated.View
          style={[
            s.ring,
            ring3Style,
            {
              width: size3,
              height: size3,
              borderRadius: size3 / 2,
              borderWidth: 1,
              borderColor: palette.lime,
            },
          ]}
        >
          {[0, 90, 180, 270].map((deg) => (
            <View
              key={deg}
              style={[
                s.tick,
                {
                  transform: [
                    { rotate: deg + "deg" },
                    { translateY: -(size3 / 2 - 1) },
                  ],
                  backgroundColor: palette.lime,
                },
              ]}
            />
          ))}
        </Animated.View>
      </View>

      {/* 404 label — sits over the rings */}
      <Animated.Text
        style={[
          s.fourOhFour,
          labelStyle,
          { fontFamily: "Limelight_400Regular", color: c.text },
        ]}
      >
        404
      </Animated.Text>

      {/* Copy and actions */}
      <Animated.View style={[s.content, contentStyle]}>
        <Text
          style={[
            s.headline,
            { fontFamily: "SpaceGrotesk_700Bold", color: c.text },
          ]}
        >
          Page not found
        </Text>

        <Text
          style={[
            s.body,
            { fontFamily: "PlusJakartaSans_400Regular", color: c.textMuted },
          ]}
        >
          Whatever you were looking for isn't here. But something great probably is.
        </Text>

        <View style={s.actions}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              s.btnGhost,
              {
                backgroundColor: pressed ? c.surfaceMuted : "transparent",
                borderColor: c.borderStrong,
              },
            ]}
          >
            <ArrowLeft size={15} color={c.textMuted} strokeWidth={2} />
            <Text
              style={[
                s.btnGhostLabel,
                { fontFamily: "SpaceGrotesk_600SemiBold", color: c.textMuted },
              ]}
            >
              Go back
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.replace("/(app)/dashboard")}
            style={({ pressed }) => [
              s.btnPrimary,
              { backgroundColor: palette.lime, opacity: pressed ? 0.86 : 1 },
            ]}
          >
            <Compass size={15} color={palette.ink90} strokeWidth={2.5} />
            <Text
              style={[
                s.btnPrimaryLabel,
                { fontFamily: "SpaceGrotesk_700Bold", color: palette.ink90 },
              ]}
            >
              Explore events
            </Text>
          </Pressable>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  ringsContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },

  ring: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },

  tick: {
    position: "absolute",
    width: 6,
    height: 1.5,
    borderRadius: 2,
    top: "50%",
    alignSelf: "center",
  },

  fourOhFour: {
    fontSize: 100,
    lineHeight: 100,
    letterSpacing: -2,
    zIndex: 10,
    marginBottom: 32,
  },

  content: {
    alignItems: "center",
    paddingHorizontal: 36,
    zIndex: 10,
  },

  headline: {
    fontSize: 20,
    letterSpacing: -0.4,
    marginBottom: 10,
    textAlign: "center",
  },

  body: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
    maxWidth: 270,
    marginBottom: 36,
  },

  actions: {
    flexDirection: "row",
    gap: 10,
  },

  btnGhost: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingVertical: 13,
    paddingHorizontal: 18,
    borderRadius: 12,
    borderWidth: 1,
  },

  btnGhostLabel: {
    fontSize: 14,
  },

  btnPrimary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderRadius: 12,
  },

  btnPrimaryLabel: {
    fontSize: 14,
  },
});
