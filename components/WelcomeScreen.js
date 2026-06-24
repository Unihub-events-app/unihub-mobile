import { useEffect, useRef, useState } from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
  interpolate,
} from "react-native-reanimated";
import { useRouter } from "expo-router";
import { useTheme } from "../theme/ThemeProvider";
import { CalendarDays, Ticket, Bell } from "lucide-react-native";

// Lottie is optional — user must place JSON files in assets/animations/
let LottieView = null;
try {
  LottieView = require("lottie-react-native").default;
} catch {}

const SLIDES = [
  {
    title: "Discover Events",
    body: "Browse campus events, filter by interest,\nfind what moves you.",
    icon: CalendarDays,
    lottie: null, // set to require("../assets/animations/onboarding-discover.json") when file exists
  },
  {
    title: "Get Your Tickets",
    body: "Register in seconds. Your digital\ntickets live right here.",
    icon: Ticket,
    lottie: null,
  },
  {
    title: "Stay in the Loop",
    body: "Real-time updates and reminders so you\nnever miss a moment.",
    icon: Bell,
    lottie: null,
  },
];

function SlideIllustration({ slide, theme }) {
  const Icon = slide.icon;
  const scale = useSharedValue(0.88);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 14, stiffness: 160 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (LottieView && slide.lottie) {
    return (
      <Animated.View style={[styles.illustrationWrap, animatedStyle]}>
        <LottieView source={slide.lottie} autoPlay loop style={styles.lottie} />
      </Animated.View>
    );
  }

  // Fallback illustration
  return (
    <Animated.View style={[styles.illustrationWrap, animatedStyle]}>
      <View style={[styles.illustrationCircle, { backgroundColor: "rgba(26,26,20,0.10)" }]}>
        <View style={[styles.illustrationInner, { backgroundColor: "rgba(26,26,20,0.12)" }]}>
          <Icon size={72} color="#1A1A14" strokeWidth={1.5} />
        </View>
      </View>
    </Animated.View>
  );
}

function PaginationDot({ active }) {
  const width = useSharedValue(active ? 24 : 8);

  useEffect(() => {
    width.value = withSpring(active ? 24 : 8, { damping: 18, stiffness: 200 });
  }, [active]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: width.value,
  }));

  return (
    <Animated.View
      style={[
        styles.dot,
        animatedStyle,
        active ? styles.dotActive : styles.dotInactive,
      ]}
    />
  );
}

export function WelcomeScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const [phase, setPhase] = useState("splash");
  const [slideIdx, setSlideIdx] = useState(0);
  const slideOffset = useSharedValue(0);

  // Splash → onboarding auto-advance
  useEffect(() => {
    const t = setTimeout(() => setPhase("onboard"), 1800);
    return () => clearTimeout(t);
  }, []);

  const slideAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: slideOffset.value }],
  }));

  const goNext = () => {
    const next = slideIdx + 1;
    slideOffset.value = withSpring(-(next * SCREEN_WIDTH), {
      damping: 22,
      stiffness: 200,
    });
    setSlideIdx(next);
  };

  const skip = () => {
    router.push("/(auth)/signin");
  };

  // ─── Splash Screen ───────────────────────────────────────────────────────────
  if (phase === "splash") {
    return (
      <View style={[styles.splash, { backgroundColor: theme.colors.brand }]}>
        <Image
          source={require("../assets/images/mobile-logo.png")}
          style={styles.splashLogo}
          resizeMode="contain"
        />
        <Text style={styles.splashTagline}>Campus life, connected.</Text>
      </View>
    );
  }

  // ─── Onboarding ──────────────────────────────────────────────────────────────
  return (
    <View style={[styles.onboard, { backgroundColor: theme.colors.brand }]}>
      {/* Sliding panel */}
      <Animated.View style={[{ width: SCREEN_WIDTH * SLIDES.length, flexDirection: "row" }, slideAnimStyle]}>
        {SLIDES.map((slide, i) => (
          <View key={i} style={[styles.slide, { width: SCREEN_WIDTH }]}>
            <SlideIllustration slide={slide} theme={theme} />
          </View>
        ))}
      </Animated.View>

      {/* Bottom card */}
      <View style={[styles.bottomCard, { backgroundColor: theme.colors.background }]}>
        {/* Slide text */}
        <View style={styles.slideText} key={slideIdx}>
          <Animated.Text
            entering={undefined}
            style={[styles.slideTitle, { color: theme.colors.text }]}
          >
            {SLIDES[slideIdx].title}
          </Animated.Text>
          <Text style={[styles.slideBody, { color: theme.colors.textMuted }]}>
            {SLIDES[slideIdx].body}
          </Text>
        </View>

        {/* Pagination */}
        <View style={styles.pagination}>
          {SLIDES.map((_, i) => (
            <PaginationDot key={i} active={i === slideIdx} />
          ))}
        </View>

        {/* CTAs */}
        {slideIdx < SLIDES.length - 1 ? (
          <View style={styles.ctaRow}>
            <Pressable
              style={({ pressed }) => [
                styles.nextBtn,
                { backgroundColor: theme.colors.brand, opacity: pressed ? 0.9 : 1 },
              ]}
              onPress={goNext}
            >
              <Text style={styles.nextBtnText}>Next</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.skipBtn, { opacity: pressed ? 0.7 : 1 }]}
              onPress={skip}
            >
              <Text style={[styles.skipBtnText, { color: theme.colors.textSubtle }]}>Skip</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.authCtaStack}>
            <Pressable
              style={({ pressed }) => [
                styles.nextBtn,
                { backgroundColor: theme.colors.brand, opacity: pressed ? 0.9 : 1 },
              ]}
              onPress={() => router.push("/(auth)/signup")}
            >
              <Text style={styles.nextBtnText}>Create Account</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.loginBtn,
                {
                  backgroundColor: theme.colors.surfaceMuted,
                  borderColor: theme.colors.border,
                  opacity: pressed ? 0.9 : 1,
                },
              ]}
              onPress={() => router.push("/(auth)/signin")}
            >
              <Text style={[styles.loginBtnText, { color: theme.colors.text }]}>Log In</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Splash
  splash: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  splashLogo: {
    width: 140,
    height: 60,
  },
  splashTagline: {
    fontSize: 18,
    fontWeight: "500",
    fontFamily: "PlusJakartaSans_500Medium",
    color: "rgba(26,26,20,0.65)",
    letterSpacing: 0.2,
  },

  // Onboarding
  onboard: {
    flex: 1,
    overflow: "hidden",
  },
  slide: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
    paddingBottom: 20,
  },
  illustrationWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  lottie: {
    width: 280,
    height: 280,
  },
  illustrationCircle: {
    width: 260,
    height: 260,
    borderRadius: 130,
    alignItems: "center",
    justifyContent: "center",
  },
  illustrationInner: {
    width: 180,
    height: 180,
    borderRadius: 90,
    alignItems: "center",
    justifyContent: "center",
  },

  // Bottom card
  bottomCard: {
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    padding: 32,
    paddingBottom: 48,
    gap: 28,
  },
  slideText: {
    gap: 10,
  },
  slideTitle: {
    fontSize: 36,
    fontWeight: "800",
    fontFamily: "SpaceGrotesk_700Bold",
    letterSpacing: -1,
    lineHeight: 40,
  },
  slideBody: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: "PlusJakartaSans_400Regular",
  },

  // Pagination
  pagination: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    backgroundColor: "#C8E630",
  },
  dotInactive: {
    backgroundColor: "rgba(0,0,0,0.14)",
  },

  // CTAs
  ctaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  nextBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  nextBtnText: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "PlusJakartaSans_700Bold",
    color: "#1A1A14",
  },
  skipBtn: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  skipBtnText: {
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "PlusJakartaSans_600SemiBold",
  },
  authCtaStack: {
    gap: 12,
  },
  loginBtn: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
  },
  loginBtnText: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "PlusJakartaSans_700Bold",
  },
});
