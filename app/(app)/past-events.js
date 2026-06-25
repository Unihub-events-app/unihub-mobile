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
import { Screen, NeuInset } from "../../components/index.js";
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
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.brand} />
      </View>
    );
  }

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.headerTitle}>Past Events</Text>

        {pastEvents.length === 0 ? (
          <NeuInset style={styles.emptyState}>
            <Calendar size={44} color={theme.colors.textSubtle} />
            <Text style={styles.emptyTitle}>No past events</Text>
            <Text style={styles.emptyText}>
              Events you've attended will show up here after they end.
            </Text>
          </NeuInset>
        ) : (
          <View style={styles.eventList}>
            {pastEvents.map((event) => {
              const cover = event.profile || event.cover;
              return (
                <Pressable
                  key={event.event_id}
                  style={[styles.eventCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                  onPress={() => router.push(`/event/${event.event_id}`)}
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

                    <Text style={[styles.eventName, { color: theme.colors.text }]} numberOfLines={2}>
                      {event.name}
                    </Text>

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
                      <Pressable
                        style={[styles.viewBtn, { backgroundColor: theme.colors.brand }]}
                        onPress={() => router.push(`/event/${event.event_id}`)}
                      >
                        <Ticket size={13} color="#1A1A14" />
                        <Text style={styles.viewBtnText}>View Ticket</Text>
                      </Pressable>

                      <Pressable
                        style={[styles.cancelBtn, { borderColor: theme.colors.border }]}
                        onPress={() => handleCancel(event.event_id, event.name)}
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
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    fontFamily: "SpaceGrotesk_700Bold",
    color: theme.colors.text,
    marginBottom: 20,
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
    borderRadius: 20,
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
    borderRadius: 10,
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
    borderRadius: 10,
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
    paddingVertical: 10,
    borderRadius: 12,
  },
  viewBtnText: {
    fontSize: 13,
    fontWeight: "700",
    fontFamily: "PlusJakartaSans_700Bold",
    color: "#1A1A14",
  },
  cancelBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "PlusJakartaSans_600SemiBold",
  },
});
