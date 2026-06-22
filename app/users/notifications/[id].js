import { useEffect, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { View, Text, StyleSheet, Image, ActivityIndicator, ScrollView } from "react-native";
import { Bell, Calendar, Clock, AlertCircle } from "lucide-react-native";
import { Screen, BackButton, NeuCard, NeuInset } from "../../../components";
import { useTheme } from "../../../theme/ThemeProvider";
import { getUserToken } from "../../../lib/auth";
import { API_URL } from "../../../lib/config";

export default function NotificationDetailScreen() {
  const { id } = useLocalSearchParams();
  const { theme } = useTheme();
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    let alive = true;

    const fetchNotification = async () => {
      try {
        const token = await getUserToken();
        if (!token) return;

        const res = await fetch(`${API_URL}/notifications/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!alive) return;

        if (!res.ok) {
          setNotFound(true);
          return;
        }

        const data = await res.json();
        setNotification(data);

        if (!data.read) {
          await fetch(`${API_URL}/notifications/${id}/read`, {
            method: "PATCH",
            headers: { Authorization: `Bearer ${token}` },
          });
        }
      } catch (e) {
        if (alive) setNotFound(true);
      } finally {
        if (alive) setLoading(false);
      }
    };

    fetchNotification();
    return () => {
      alive = false;
    };
  }, [id]);

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Screen padded={false}>
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <View style={styles.header}>
          <BackButton label="Notifications" />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {loading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color={theme.colors.brand} />
              <Text style={[styles.loadingText, { color: theme.colors.textMuted }]}>Loading details...</Text>
            </View>
          ) : notFound ? (
            <NeuInset style={styles.emptyState}>
              <AlertCircle size={48} color={theme.colors.error} />
              <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>Notification Not Found</Text>
              <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>
                This notification could not be loaded. It may have been deleted.
              </Text>
            </NeuInset>
          ) : (
            <NeuCard style={[styles.card, { backgroundColor: theme.colors.surface }]}>
              {/* Meta information */}
              <View style={styles.metaRow}>
                <View style={[styles.iconContainer, { backgroundColor: theme.colors.surfaceElevated }]}>
                  <Bell size={22} color={theme.colors.brand} />
                </View>
                <View style={styles.metaTextContainer}>
                  <Text style={[styles.metaAuthor, { color: theme.colors.text }]}>UniHub Team</Text>
                  <View style={styles.timeRow}>
                    <Clock size={12} color={theme.colors.textSubtle} style={{ marginRight: 4 }} />
                    <Text style={[styles.metaTime, { color: theme.colors.textSubtle }]}>
                      {formatDate(notification.createdAt)} at {formatTime(notification.createdAt)}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Title */}
              <Text style={[styles.title, { color: theme.colors.text }]}>
                {notification.title}
              </Text>

              {/* Divider */}
              <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

              {/* Banner image */}
              {notification.banner ? (
                <Image
                  source={{
                    uri: notification.banner.startsWith("/") && !notification.banner.startsWith("/email/")
                      ? `${API_URL}${notification.banner}`
                      : notification.banner,
                  }}
                  style={styles.bannerImage}
                  resizeMode="cover"
                />
              ) : null}

              {/* Message Content */}
              <Text style={[styles.message, { color: theme.colors.textMuted }]}>
                {notification.message}
              </Text>
            </NeuCard>
          )}
        </ScrollView>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  centerContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: "PlusJakartaSans_500Medium",
  },
  card: {
    padding: 24,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    gap: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  metaTextContainer: {
    flex: 1,
  },
  metaAuthor: {
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "PlusJakartaSans_700Bold",
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  metaTime: {
    fontSize: 12,
    fontFamily: "PlusJakartaSans_400Regular",
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    fontFamily: "SpaceGrotesk_700Bold",
    lineHeight: 28,
    marginBottom: 16,
  },
  divider: {
    height: 1,
    marginBottom: 20,
  },
  bannerImage: {
    width: "100%",
    height: 180,
    borderRadius: 12,
    marginBottom: 20,
  },
  message: {
    fontSize: 15,
    fontFamily: "PlusJakartaSans_400Regular",
    lineHeight: 22,
  },
  emptyState: {
    padding: 40,
    alignItems: "center",
    borderRadius: 24,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
  },
});
