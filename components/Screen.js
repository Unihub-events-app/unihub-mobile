import { KeyboardAvoidingView, Platform, ScrollView, View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../theme/ThemeProvider";
import { usePathname } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

export function Screen({
  children,
  style = {},
  contentStyle = {},
  padded = true,
  scrollable = true,
  scrollProps = {},
  edges,
}) {
  const { theme } = useTheme();
  const pathname = usePathname();
  const defaultEdges =
    pathname.startsWith("/(app)") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/community") ||
    pathname.startsWith("/wallet") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/event-library") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/notifications")
      ? ["left", "right"]
      : ["top", "left", "right", "bottom"];

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }, style]}
      edges={edges || defaultEdges}
    >
      <View pointerEvents="none" style={styles.decorWrap}>
        <LinearGradient
          colors={
            theme.mode === "dark"
              ? ["rgba(96,165,250,0.16)", "rgba(7,16,27,0)"]
              : ["rgba(219,234,254,0.88)", "rgba(244,247,252,0)"]
          }
          style={styles.topGlow}
        />
        <View
          style={[
            styles.bottomGlow,
            {
              backgroundColor:
                theme.mode === "dark"
                  ? "rgba(37,99,235,0.08)"
                  : "rgba(96,165,250,0.08)",
            },
          ]}
        />
      </View>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {scrollable ? (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[
              styles.scrollContent,
              padded && styles.padded,
              { backgroundColor: theme.colors.background },
              contentStyle,
              scrollProps.contentContainerStyle,
            ]}
            showsVerticalScrollIndicator={false}
            {...scrollProps}
          >
            <View style={styles.contentWrap}>{children}</View>
          </ScrollView>
        ) : (
          <View
            style={[
              styles.nonScrollView,
              { backgroundColor: theme.colors.background },
              padded && styles.padded,
              contentStyle,
            ]}
          >
            {children}
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    position: "relative",
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 16,
    paddingBottom: 24,
  },
  padded: {
    paddingHorizontal: 20,
  },
  nonScrollView: {
    flex: 1,
  },
  contentWrap: {
    flex: 1,
    width: "100%",
  },
  decorWrap: {
    ...StyleSheet.absoluteFillObject,
  },
  topGlow: {
    position: "absolute",
    top: -30,
    left: -20,
    right: -20,
    height: 200,
  },
  bottomGlow: {
    position: "absolute",
    bottom: -120,
    left: -100,
    width: 240,
    height: 240,
    borderRadius: 120,
  },
});
