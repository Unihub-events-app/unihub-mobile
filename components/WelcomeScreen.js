import { useEffect, useRef, useState } from "react";
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { useRouter } from "expo-router";
import { useTheme } from "../theme/ThemeProvider";
import { CalendarDays, Ticket, Bell } from "lucide-react-native";

let LottieView = null;
try {
  LottieView = require("lottie-react-native").default;
} catch {}

const SLIDES = [
  {
    title: "Discover Events",
    body: "Browse campus events, filter by interest,\nand find what moves you.",
    icon: CalendarDays,
    lottie: require("../assets/animations/onboarding-discover.json"),
  },
  {
    title: "Get Your Tickets",
    body: "Register in seconds. Your digital\ntickets live right here.",
    icon: Ticket,
    lottie: require("../assets/animations/onboarding-ticket.json"),
  },
  {
    title: "Stay in the Loop",
    body: "Real-time updates and reminders so you\nnever miss a moment.",
    icon: Bell,
    lottie: require("../assets/animations/onboarding-notify.json"),
  },
];

function SlideIllustration({ slide, containerHeight, theme }) {
  const Icon = slide.icon;

  if (LottieView && slide.lottie) {
    return (
      <LottieView
        source={slide.lottie}
        autoPlay
        loop
        resizeMode="cover"
        style={{ width: "100%", height: containerHeight }}
      />
    );
  }

  return (
    <View
      style={{
        width: "100%",
        height: containerHeight,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Icon size={100} color="rgba(26,26,20,0.55)" strokeWidth={1.2} />
    </View>
  );
}

export function WelcomeScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useWindowDimensions();
  const [phase, setPhase] = useState("splash");
  const [slideIdx, setSlideIdx] = useState(0);
  const slideOffset = useSharedValue(0);
  const swipeStartX = useRef(0);

  // Illustration takes ~55% of screen height
  const illustrationH = SCREEN_HEIGHT * 0.55;

  useEffect(() => {
    const t = setTimeout(() => setPhase("onboard"), 1800);
    return () => clearTimeout(t);
  }, []);

  const slideAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: slideOffset.value }],
  }));

  const goTo = (next) => {
    slideOffset.value = withSpring(-(next * SCREEN_WIDTH), {
      damping: 22,
      stiffness: 200,
    });
    setSlideIdx(next);
  };

  const goNext = () => {
    if (slideIdx < SLIDES.length - 1) goTo(slideIdx + 1);
  };
  const skip = () => router.push("/(auth)/signin");
  const isLast = slideIdx === SLIDES.length - 1;

  // ─── Splash ─────────────────────────────────────────────────────────────
  if (phase === "splash") {
    return (
      <View
        style={[styles.splash, { backgroundColor: theme.colors.background }]}
      >
        <Image
          source={require("../assets/images/mobile-logo.png")}
          style={[styles.splashLogo, { width: SCREEN_WIDTH * 0.72 }]}
          resizeMode="contain"
        />
        <Text
          style={[styles.splashTagline, { color: theme.colors.textSubtle }]}
        >
          Campus life, connected.
        </Text>
      </View>
    );
  }

  // ─── Onboarding ─────────────────────────────────────────────────────────
  return (
    <View style={[styles.onboard, { backgroundColor: theme.colors.brand }]}>
      {/* Illustration strip — on green background, slides horizontally */}
      <View
        style={[styles.illustrationStrip, { height: illustrationH }]}
        onTouchStart={(e) => { swipeStartX.current = e.nativeEvent.pageX; }}
        onTouchEnd={(e) => {
          const dx = e.nativeEvent.pageX - swipeStartX.current;
          if (dx < -50 && slideIdx < SLIDES.length - 1) goTo(slideIdx + 1);
          else if (dx > 50 && slideIdx > 0) goTo(slideIdx - 1);
        }}
      >
        <Animated.View
          style={[
            { width: SCREEN_WIDTH * SLIDES.length, flexDirection: "row" },
            slideAnimStyle,
          ]}
        >
          {SLIDES.map((slide, i) => (
            <View
              key={i}
              style={{
                width: SCREEN_WIDTH,
                height: illustrationH,
                overflow: "hidden",
                paddingTop: 60,
              }}
            >
              <SlideIllustration
                slide={slide}
                containerHeight={illustrationH}
                theme={theme}
              />
            </View>
          ))}
        </Animated.View>
      </View>

      {/* White CTA panel — rounded top corners, fills rest of screen */}
      <View style={[styles.ctaPanel, { backgroundColor: "#FFFFFF" }]}>
        {/* Dot indicators */}
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  width: i === slideIdx ? 20 : 7,
                  backgroundColor:
                    i === slideIdx ? theme.colors.brand : "rgba(0,0,0,0.15)",
                },
              ]}
            />
          ))}
        </View>

        {/* Title */}
        <Text style={styles.title}>{SLIDES[slideIdx].title}</Text>

        {/* Body */}
        <Text style={styles.body}>{SLIDES[slideIdx].body}</Text>

        {/* Primary button */}
        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: theme.colors.brand }]}
          activeOpacity={0.88}
          onPress={isLast ? () => router.push("/(auth)/signup") : goNext}
        >
          <Text style={styles.primaryBtnText}>
            {isLast ? "Create Account" : "Next"}
          </Text>
        </TouchableOpacity>

        {/* Secondary action */}
        <TouchableOpacity
          style={styles.secondaryBtn}
          activeOpacity={0.6}
          onPress={isLast ? () => router.push("/(auth)/signin") : skip}
        >
          <Text style={styles.secondaryBtnText}>
            {isLast ? "Log In" : "Skip"}
          </Text>
        </TouchableOpacity>
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
  },
  splashLogo: {
    height: 130,
  },
  splashTagline: {
    fontSize: 16,
    fontFamily: "PlusJakartaSans_400Regular",
    letterSpacing: 0.2,
    marginTop: -60,
  },

  // Onboarding shell — green bg shows above the white CTA panel
  onboard: {
    flex: 1,
  },

  // Illustration strip
  illustrationStrip: {
    overflow: "hidden",
  },

  // White CTA panel — flat top
  ctaPanel: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 28,
    paddingBottom: 44,
    gap: 14,
  },

  // Dots
  dots: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  dot: {
    height: 7,
    borderRadius: 4,
  },

  // Text
  title: {
    fontSize: 46,
    fontFamily: "Limelight_400Regular",
    color: "#1A1A14",
    letterSpacing: -0.4,
    lineHeight: 42,
    textAlign: "center",
  },
  body: {
    fontSize: 20,
    fontFamily: "PlusJakartaSans_400Regular",
    color: "#6B7280",
    lineHeight: 26,
    marginTop: 26,
    marginBottom: 35,
    textAlign: "center",
  },

  // Primary button — full width, brand bg, light gray text
  primaryBtn: {
    paddingVertical: 17,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: {
    fontSize: 20,
    fontWeight: "700",
    fontFamily: "PlusJakartaSans_700Bold",
    color: "#F2F2F2",
  },

  // Secondary (Skip / Log In) — centered text only
  secondaryBtn: {
    paddingVertical: 10,
    alignItems: "center",
  },
  secondaryBtnText: {
    fontSize: 20,
    fontFamily: "PlusJakartaSans_500Medium",
    fontWeight: "500",
    color: "#6B7280",
  },
});
