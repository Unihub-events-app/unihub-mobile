import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Image,
  Linking,
  Pressable,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Screen, NeuCard, BackButton, SkeletonLoader } from "../../../components/index.js";
import { radius, spacing } from "../../../theme/tokens.js";
import { useTheme } from "../../../theme/ThemeProvider.js";
import { API_URL } from "../../../lib/config.js";
import { getUserToken } from "../../../lib/auth.js";
import { Bell, Clock, ExternalLink } from "lucide-react-native";

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

        if (!res.ok) {
          setNotFound(true);
          return;
        }

        const data = await res.json();
        setNotification(data);

        if (!data.read) {
          fetch(`${API_URL}/notifications/${id}/read`, {
            method: "PATCH",
            headers: { Authorization: `Bearer ${token}` },
          }).catch(() => {});
        }
      } catch (e) {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchNotification();
  }, [id]);

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

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
        <View style={styles.center}>
          <Bell size={48} color={theme.colors.textSubtle} />
          <Text style={[styles.notFoundTitle, { color: theme.colors.text }]}>
            Notification not found
          </Text>
          <Text style={[styles.notFoundSub, { color: theme.colors.textSubtle }]}>
            It may have been deleted or doesn't exist.
          </Text>
        </View>
      </Screen>
    );
  }

  const hasSections = notification.sections && notification.sections.length > 0;
  const sectionHasButton = hasSections && notification.sections.some((s) => s.type === "button");

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ paddingTop: 16, paddingBottom: 8 }}>
          <BackButton onPress={() => router.back()} />
        </View>

        {/* Meta bar */}
        <View style={styles.metaBar}>
          <View style={[styles.metaIcon, { backgroundColor: theme.colors.surfaceMuted }]}>
            <Bell size={16} color={theme.colors.textSubtle} />
          </View>
          <View>
            <Text style={[styles.metaFrom, { color: theme.colors.textSubtle }]}>UniHub Team</Text>
            <View style={styles.metaTimeRow}>
              <Clock size={11} color={theme.colors.textSubtle} />
              <Text style={[styles.metaTime, { color: theme.colors.textSubtle }]}>
                {formatDate(notification.createdAt)} at {formatTime(notification.createdAt)}
              </Text>
            </View>
          </View>
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: theme.colors.text }]}>{notification.title}</Text>

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

        {/* Banner */}
        {notification.banner ? (
          <View style={[styles.bannerWrap, { borderColor: theme.colors.border }]}>
            <Image
              source={{ uri: resolveImageUrl(notification.banner) }}
              style={styles.bannerImage}
              resizeMode="cover"
            />
          </View>
        ) : null}

        {/* Sections or plain message */}
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
                    style={[styles.sectionButton, { backgroundColor: theme.colors.brand }]}
                    onPress={() => section.link && Linking.openURL(section.link)}
                  >
                    <Text style={styles.sectionButtonText}>{section.content}</Text>
                    <ExternalLink size={14} color={theme.colors.textOnBrand} />
                  </Pressable>
                );
              }
              const styleType = section.style || "body";
              if (styleType === "header") {
                return (
                  <Text key={idx} style={[styles.sectionHeader, { color: theme.colors.text }]}>
                    {section.content}
                  </Text>
                );
              }
              if (styleType === "subheader") {
                return (
                  <Text key={idx} style={[styles.sectionSubheader, { color: theme.colors.textMuted }]}>
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
            <Text style={[styles.actionsLabel, { color: theme.colors.textSubtle }]}>ACTIONS</Text>
            <View style={styles.buttonsList}>
              {notification.buttons.map((btn, i) => (
                <Pressable
                  key={i}
                  style={[styles.actionButton, { backgroundColor: theme.colors.brand }]}
                  onPress={() => btn.link && Linking.openURL(btn.link)}
                >
                  <Text style={styles.actionButtonText}>{btn.title}</Text>
                  <ExternalLink size={14} color={theme.colors.textOnBrand} />
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        <View style={{ height: 80 }} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 24,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 24,
  },
  notFoundTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 8,
  },
  notFoundSub: {
    fontSize: 14,
    textAlign: "center",
  },
  metaBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 12,
    marginBottom: 20,
  },
  metaIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  metaFrom: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  metaTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  metaTime: {
    fontSize: 11,
  },
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
  bannerWrap: {
    borderRadius: radius.md,
    overflow: "hidden",
    borderWidth: 1,
    marginBottom: 24,
  },
  bannerImage: {
    width: "100%",
    height: 200,
  },
  sectionsWrap: {
    gap: 14,
    marginBottom: 12,
  },
  sectionImageWrap: {
    alignItems: "center",
    marginVertical: 8,
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
    borderRadius: radius.xxl,
    alignSelf: "center",
    marginVertical: 8,
  },
  sectionButtonText: {
    color: "#1A1A14",
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "PlusJakartaSans_700Bold",
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: "700",
    fontFamily: "SpaceGrotesk_700Bold",
    lineHeight: 26,
    marginTop: 8,
  },
  sectionSubheader: {
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 22,
    marginTop: 4,
  },
  sectionBody: {
    fontSize: 16,
    lineHeight: 26,
  },
  message: {
    fontSize: 16,
    lineHeight: 26,
    marginBottom: 12,
  },
  actionsWrap: {
    marginTop: 32,
  },
  actionsLabel: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
    marginBottom: 12,
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
    borderRadius: radius.xxl,
  },
  actionButtonText: {
    color: "#1A1A14",
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "PlusJakartaSans_700Bold",
  },
});
