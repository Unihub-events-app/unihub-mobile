import { useTheme } from "../../theme/ThemeProvider.js";
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Image,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { Calendar, MapPin, Clock, Ticket, X } from "lucide-react-native";
import { Screen, NeuInset, SkeletonLoader, EmptyState } from "../../components/index.js";
import { radius, spacing } from "../../theme/tokens.js";
import Reanimated, { useSharedValue, useAnimatedStyle, withSpring } from "react-native-reanimated";
import { useSessionStore } from "../../lib/auth.js";
import { API_URL } from "../../lib/config.js";

function isPastOneDay(dateStr) {
  if (!dateStr) return false;
  try {
    const parts = String(dateStr).split("/");
    if (parts.length !== 3) return false;
    const eventDate = new Date(
      parseInt(parts[2], 10),
      parseInt(parts[1], 10) - 1,
      parseInt(parts[0], 10)
    );
    return new Date() >= new Date(eventDate.getTime() + 24 * 60 * 60 * 1000);
  } catch { return false; }
}

function PastEventCard({ event, cover, theme, styles, cancelling, onPress, onCancel }) {
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Reanimated.View style={anim}>
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.98, { damping: 20, stiffness: 400 }); }}
        onPressOut={() => { scale.value = withSpring(1.0, { damping: 22, stiffness: 280 }); }}
        onPress={onPress}
        style={[styles.eventCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
      >
        {cover ? (
          <Image source={{ uri: cover }} style={styles.eventCover} />
        ) : (
          <View style={[styles.eventCover, { backgroundColor: theme.colors.surfaceMuted, alignItems: "center", justifyContent: "center" }]}>
            <Calendar size={32} color={theme.colors.textSubtle} />
          </View>
        )}
        <View style={[styles.pastBadge, { backgroundColor: theme.colors.surfaceMuted }]}>
          <Text style={[styles.pastBadgeText, { color: theme.colors.textSubtle }]}>Past</Text>
        </View>

        <View style={styles.eventBody}>
          {event.category ? (
            <View style={[styles.categoryBadge, { backgroundColor: theme.colors.brandTint }]}>
              <Text style={[styles.categoryBadgeText, { color: theme.colors.brand }]}>{event.category}</Text>
            </View>
          ) : null}
          <Text style={[styles.eventName, { color: theme.colors.text }]} numberOfLines={2}>{event.name}</Text>
          <View style={styles.metaRow}>
            <Calendar size={13} color={theme.colors.textSubtle} />
            <Text style={[styles.metaText, { color: theme.colors.textSubtle }]}>{event.date}</Text>
            {event.time ? (
              <>
                <Clock size={13} color={theme.colors.textSubtle} />
                <Text style={[styles.metaText, { color: theme.colors.textSubtle }]}>{event.time}</Text>
              </>
            ) : null}
          </View>
          {event.venue ? (
            <View style={styles.metaRow}>
              <MapPin size={13} color={theme.colors.textSubtle} />
              <Text style={[styles.metaText, { color: theme.colors.textSubtle }]} numberOfLines={1}>{event.venue}</Text>
            </View>
          ) : null}
          <View style={styles.cardActions}>
            <Pressable style={[styles.viewBtn, { backgroundColor: theme.colors.brand }]} onPress={onPress}>
              <Ticket size={13} color={theme.colors.textOnBrand} />
              <Text style={[styles.viewBtnText, { color: theme.colors.textOnBrand }]}>View Ticket</Text>
            </Pressable>
            <Pressable
              style={[styles.cancelBtn, { borderColor: theme.colors.border }]}
              onPress={onCancel}
              disabled={cancelling === event.event_id}
            >
              {cancelling === event.event_id
                ? <ActivityIndicator size="small" color={theme.colors.error} />
                : <X size={13} color={theme.colors.error} />}
              <Text style={[styles.cancelBtnText, { color: theme.colors.error }]}>Remove</Text>
            </Pressable>
          </View>
        </View>
      </Pressable>
    </Reanimated.View>
  );
}

export default function PastEventsScreen() {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const token = useSessionStore((s) => s.userToken);

  const [pastEvents, setPastEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(null);

  useEffect(() => {
    const load = async () => {
      if (!token) { setLoading(false); return; }
      try {
        const res = await fetch(`${API_URL}/user/details`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ user_token: token }),
        });
        if (res.ok) {
          const data = await res.json();
          const past = (data.registeredEvents || []).filter((ev) => isPastOneDay(ev.date));
          setPastEvents(past);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  const handleCancel = (eventId, eventName) => {
    Alert.alert(
      "Cancel Registration",
      `Remove your registration from "${eventName}"?`,
      [
        { text: "Keep", style: "cancel" },
        {
          text: "Cancel Registration",
          style: "destructive",
          onPress: async () => {
            setCancelling(eventId);
            try {
              const res = await fetch(`${API_URL}/payment/cancel`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ user: { user_id: token }, event: { event_id: eventId } }),
              });
              const data = await res.json();
              if (data.status === "success") {
                setPastEvents((prev) => prev.filter((e) => e.event_id !== eventId));
              }
            } catch {}
            finally { setCancelling(null); }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <Screen padded>
        <SkeletonLoader variant="text" />
        <SkeletonLoader variant="card" count={3} />
      </Screen>
    );
  }

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.headerEyebrow, { color: theme.colors.accentLibrary }]}>History</Text>
        <Text style={styles.headerTitle}>Past Events</Text>

        {pastEvents.length === 0 ? (
          <EmptyState
            emoji="🎟️"
            title="No past events"
            subtitle="Events you've attended will show up here after they end."
          />
        ) : (
          <View style={styles.eventList}>
            {pastEvents.map((event) => {
              const cover = event.profile || event.cover;
              return (
                <PastEventCard
                  key={event.event_id}
                  event={event}
                  cover={cover}
                  theme={theme}
                  styles={styles}
                  cancelling={cancelling}
                  onPress={() => router.push(`/event/${event.event_id}`)}
                  onCancel={() => handleCancel(event.event_id, event.name)}
                />
              );
            })}
          </View>
        )}
        <View style={{ height: 120 }} />
      </ScrollView>
    </Screen>
  );
}

const getStyles = (theme) => StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  scrollContainer: {
    paddingTop: 24,
    paddingBottom: 24,
    paddingHorizontal: spacing.page,
  },
  headerEyebrow: {
    fontSize: 11,
    fontWeight: "700",
    fontFamily: "PlusJakartaSans_700Bold",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 4,
    lineHeight: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "700",
    fontFamily: "SpaceGrotesk_700Bold",
    color: theme.colors.text,
    marginBottom: 24,
    lineHeight: 38,
    letterSpacing: -0.5,
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
    fontFamily: "SpaceGrotesk_700Bold",
    color: theme.colors.text,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "PlusJakartaSans_400Regular",
    color: theme.colors.textSubtle,
    textAlign: "center",
    lineHeight: 20,
  },
  eventList: { gap: 16 },
  eventCard: {
    borderRadius: radius.xl,
    borderWidth: 1,
    overflow: "hidden",
  },
  eventCover: {
    width: "100%",
    height: 160,
  },
  pastBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.xxl,
  },
  pastBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    fontFamily: "PlusJakartaSans_700Bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  eventBody: {
    padding: 16,
    gap: 8,
  },
  categoryBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.xxl,
    marginBottom: 2,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    fontFamily: "PlusJakartaSans_700Bold",
  },
  eventName: {
    fontSize: 17,
    fontWeight: "700",
    fontFamily: "SpaceGrotesk_700Bold",
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  metaText: {
    fontSize: 13,
    fontFamily: "PlusJakartaSans_400Regular",
    flex: 1,
  },
  cardActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  viewBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 11,
    borderRadius: radius.xxl,
  },
  viewBtnText: {
    fontSize: 13,
    fontWeight: "700",
    fontFamily: "PlusJakartaSans_700Bold",
  },
  cancelBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: radius.xxl,
    borderWidth: 1,
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "PlusJakartaSans_600SemiBold",
  },
});
