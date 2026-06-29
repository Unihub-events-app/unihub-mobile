import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Linking,
  Pressable,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Screen, BackButton, SkeletonLoader } from "../../../components/index.js";
import { radius, spacing } from "../../../theme/tokens.js";
import { useTheme } from "../../../theme/ThemeProvider.js";
import { API_URL } from "../../../lib/config.js";
import { getUserToken } from "../../../lib/auth.js";
import { Bell, ExternalLink } from "lucide-react-native";

const DEFAULT_COVER = require("../../../assets/images/unihub_cover.jpg");
const UNIHUB_LOGO = require("../../../assets/images/unihub-logo.png");

export default function NotificationDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { theme } = useTheme();
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchNotification = async () => {
      try {
        const token = await getUserToken();
        if (!token) return;
        const res = await fetch(`${API_URL}/notifications/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) { setNotFound(true); return; }
        const data = await res.json();
        setNotification(data);
        if (!data.read) {
          fetch(`${API_URL}/notifications/${id}/read`, {
            method: "PATCH",
            headers: { Authorization: `Bearer ${token}` },
          }).catch(() => {});
        }
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchNotification();
  }, [id]);

  const formatDate = (d) => d
    ? new Date(d).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    : "";
  const formatTime = (d) => d
    ? new Date(d).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
    : "";
  const resolveImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith("/") && !url.startsWith("/email/")) return `${API_URL}${url}`;
    return url;
  };

  if (loading) {
    return (
      <Screen padded>
        <SkeletonLoader variant="text" />
        <SkeletonLoader variant="card" />
        <SkeletonLoader variant="row" count={4} />
      </Screen>
    );
  }

  if (notFound || !notification) {
    return (
      <Screen padded>
        <BackButton onPress={() => router.back()} />
        <View style={styles.emptyWrap}>
          <View style={[styles.emptyIcon, { backgroundColor: theme.colors.surfaceMuted }]}>
            <Bell size={28} color={theme.colors.textSubtle} />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
            Notification not found
          </Text>
          <Text style={[styles.emptySub, { color: theme.colors.textSubtle }]}>
            It may have been deleted or doesn't exist.
          </Text>
          <Pressable
            style={[styles.emptyBtn, { backgroundColor: theme.colors.surfaceMuted, borderColor: theme.colors.border }]}
            onPress={() => router.back()}
          >
            <Text style={[styles.emptyBtnText, { color: theme.colors.textMuted }]}>Go back</Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  const hasSections = notification.sections && notification.sections.length > 0;
  const sectionHasButton = hasSections && notification.sections.some(s => s.type === "button");

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ paddingTop: 16, paddingHorizontal: spacing.page, paddingBottom: 12 }}>
          <BackButton onPress={() => router.back()} />
        </View>

        {/* Full-bleed banner */}
        <View style={[styles.bannerWrap, { borderColor: theme.colors.border }]}>
          <Image
            source={notification.banner ? { uri: resolveImageUrl(notification.banner) } : DEFAULT_COVER}
            style={styles.bannerImage}
            resizeMode="cover"
          />
        </View>

        <View style={{ paddingHorizontal: spacing.page }}>
          {/* Meta bar — branded lime-tint pill + timestamp */}
          <View style={styles.metaBar}>
            <View style={[styles.metaPill, { backgroundColor: theme.colors.brandTint }]}>
              <Image source={UNIHUB_LOGO} style={styles.metaLogo} resizeMode="contain" />
              <Text style={[styles.metaSender, { color: theme.colors.brand }]}>UniHub</Text>
            </View>
            <Text style={[styles.metaTime, { color: theme.colors.textSubtle }]}>
              {formatDate(notification.createdAt)} at {formatTime(notification.createdAt)}
            </Text>
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: theme.colors.text }]}>
            {notification.title}
          </Text>

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
        </View>

        {/* Sections or plain message */}
        <View style={{ paddingHorizontal: spacing.page }}>
          {hasSections ? (
            <View style={styles.sectionsWrap}>
              {notification.sections.map((section, idx) => {
                if (section.type === "image") {
                  return (
                    <View key={idx} style={styles.sectionImageWrap}>
                      <Image
                        source={{ uri: resolveImageUrl(section.content) }}
                        style={styles.sectionImage}
                        resizeMode="contain"
                      />
                    </View>
                  );
                }
                if (section.type === "button") {
                  return (
                    <Pressable
                      key={idx}
                      style={({ pressed }) => [
                        styles.sectionButton,
                        { backgroundColor: theme.colors.brand, opacity: pressed ? 0.78 : 1 },
                      ]}
                      onPress={() => section.link && Linking.openURL(section.link)}
                    >
                      <Text style={[styles.sectionButtonText, { color: theme.colors.textOnBrand }]}>
                        {section.content}
                      </Text>
                      <ExternalLink size={13} color={theme.colors.textOnBrand} />
                    </Pressable>
                  );
                }
                const styleType = section.style || "body";
                if (styleType === "header") {
                  return (
                    <Text
                      key={idx}
                      style={[
                        styles.sectionHeader,
                        { color: theme.colors.text, marginTop: idx === 0 ? 0 : spacing.xxl },
                      ]}
                    >
                      {section.content}
                    </Text>
                  );
                }
                if (styleType === "subheader") {
                  return (
                    <Text
                      key={idx}
                      style={[
                        styles.sectionSubheader,
                        { color: theme.colors.textMuted, marginTop: idx === 0 ? 0 : spacing.lg },
                      ]}
                    >
                      {section.content}
                    </Text>
                  );
                }
                return (
                  <Text key={idx} style={[styles.sectionBody, { color: theme.colors.textMuted }]}>
                    {section.content}
                  </Text>
                );
              })}
            </View>
          ) : (
            <Text style={[styles.message, { color: theme.colors.textMuted }]}>
              {notification.message}
            </Text>
          )}

          {/* Action buttons */}
          {notification.buttons && notification.buttons.length > 0 && !sectionHasButton ? (
            <View style={styles.actionsWrap}>
              <Text style={[styles.actionsLabel, { color: theme.colors.textSubtle }]}>
                ACTIONS
              </Text>
              <View style={styles.buttonsList}>
                {notification.buttons.map((btn, i) => (
                  <Pressable
                    key={i}
                    style={({ pressed }) => [
                      styles.actionButton,
                      { backgroundColor: theme.colors.brand, opacity: pressed ? 0.78 : 1 },
                    ]}
                    onPress={() => btn.link && Linking.openURL(btn.link)}
                  >
                    <Text style={[styles.actionButtonText, { color: theme.colors.textOnBrand }]}>
                      {btn.title}
                    </Text>
                    <ExternalLink size={13} color={theme.colors.textOnBrand} />
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: 24,
  },

  // Meta bar
  metaBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 12,
    marginBottom: 20,
    flexWrap: "wrap",
  },
  metaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: radius.full,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  metaLogo: {
    width: 16,
    height: 16,
    borderRadius: 3,
  },
  metaSender: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  metaTime: {
    fontSize: 12,
    lineHeight: 18,
    flexShrink: 1,
  },

  // Title
  title: {
    fontSize: 28,
    fontWeight: "700",
    fontFamily: "SpaceGrotesk_700Bold",
    lineHeight: 34,
    letterSpacing: -0.4,
    marginBottom: 20,
  },
  divider: {
    height: 1,
    marginBottom: 24,
  },

  // Banner — full-bleed, no horizontal margins
  bannerWrap: {
    overflow: "hidden",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    marginBottom: 20,
    aspectRatio: 16 / 9,
  },
  bannerImage: {
    width: "100%",
    height: "100%",
  },

  // Sections
  sectionsWrap: {
    marginBottom: 12,
  },
  sectionImageWrap: {
    alignItems: "center",
    marginVertical: 10,
  },
  sectionImage: {
    width: "100%",
    height: 180,
    borderRadius: radius.md,
  },
  sectionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: radius.lg,
    alignSelf: "center",
    marginVertical: 10,
    minWidth: 160,
  },
  sectionButtonText: {
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "PlusJakartaSans_700Bold",
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: "700",
    fontFamily: "SpaceGrotesk_700Bold",
    lineHeight: 26,
    marginBottom: 8,
  },
  sectionSubheader: {
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 22,
    marginBottom: 6,
  },
  sectionBody: {
    fontSize: 16,
    lineHeight: 26,
    marginBottom: 14,
  },

  // Plain message
  message: {
    fontSize: 16,
    lineHeight: 26,
    marginBottom: 12,
  },

  // Action buttons
  actionsWrap: {
    marginTop: 32,
  },
  actionsLabel: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
    marginBottom: 12,
    fontFamily: "PlusJakartaSans_700Bold",
  },
  buttonsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: radius.lg,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "PlusJakartaSans_700Bold",
  },

  // Empty / not found state
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingTop: 60,
    gap: 10,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: radius.xl,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "SpaceGrotesk_700Bold",
    textAlign: "center",
  },
  emptySub: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  emptyBtn: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  emptyBtnText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
