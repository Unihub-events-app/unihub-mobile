import { useTheme } from "../../theme/ThemeProvider.js";
import { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, Pressable, ScrollView, Image,
} from "react-native";
import { router } from "expo-router";
import { Ticket, Layers, Bookmark, MapPin, Clock } from "lucide-react-native";
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring,
  withRepeat, withSequence, withTiming, Easing, useEffect as useAnimatedEffect,
} from "react-native-reanimated";
import {
  Screen, TicketCard, SkeletonLoader, EmptyState,
} from "../../components/index.js";
import { useSessionStore } from "../../lib/auth.js";
import { API_URL } from "../../lib/config.js";
import { getBookmarks } from "../../lib/bookmarks.js";
import { radius, spacing, springs } from "../../theme/tokens.js";

const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function parseEventDate(dateStr) {
  if (!dateStr) return null;
  const parts = dateStr.split("/");
  if (parts.length < 2) return null;
  return { day: parts[0], month: MONTHS_SHORT[parseInt(parts[1]) - 1] || "" };
}

// ─── Animated live pulse ─────────────────────────────────────────────────────
function LivePulse({ color }) {
  const scale   = useSharedValue(1);
  const opacity = useSharedValue(1);

  useAnimatedEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.8, { duration: 750, easing: Easing.out(Easing.ease) }),
        withTiming(1.0, { duration: 750, easing: Easing.in(Easing.ease) })
      ), -1, false
    );
    opacity.value = withRepeat(
      withSequence(withTiming(0, { duration: 750 }), withTiming(1, { duration: 750 })),
      -1, false
    );
  }, []);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View style={{ width: 14, height: 14, alignItems: "center", justifyContent: "center" }}>
      <Animated.View
        style={[StyleSheet.absoluteFill, { borderRadius: 7, backgroundColor: color, opacity: 0.3 }, ringStyle]}
      />
      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color }} />
    </View>
  );
}

// ─── Event row ───────────────────────────────────────────────────────────────
function EventRow({ event, dim, theme }) {
  const dm     = parseEventDate(event.date);
  const isFree = event.price === 0 || event.price === "0" || !event.price;
  const scale  = useSharedValue(1);
  const anim   = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={anim}>
      <Pressable
        onPress={() => router.push(`/event/${event.event_id}`)}
        onPressIn={() => { scale.value = withSpring(0.98, springs.snappy); }}
        onPressOut={() => { scale.value = withSpring(1.00, springs.snappy); }}
        style={({ pressed }) => [
          styles(theme).listRow,
          (pressed || dim) && { opacity: dim ? 0.60 : 0.88 },
        ]}
      >
        {/* Thumb */}
        <View style={styles(theme).listThumb}>
          {event.profile ? (
            <Image source={{ uri: event.profile }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.colors.surfaceMuted, alignItems: "center", justifyContent: "center" }]}>
              <Text style={{ fontSize: 22 }}>🎉</Text>
            </View>
          )}
        </View>

        {/* Info */}
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles(theme).listTitle} numberOfLines={1}>{event.name}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3 }}>
            <MapPin size={11} color={theme.colors.textSubtle} />
            <Text style={styles(theme).listVenue} numberOfLines={1}>{event.venue}</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 }}>
            {dm ? (
              <View style={styles(theme).dateBadge}>
                <Text style={styles(theme).dateBadgeText}>{dm.day} {dm.month}</Text>
              </View>
            ) : null}
            {event.time ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                <Clock size={10} color={theme.colors.textSubtle} />
                <Text style={styles(theme).listTime}>{event.time}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Price */}
        <View style={[
          styles(theme).priceBadge,
          { backgroundColor: isFree ? theme.colors.brandTint : theme.colors.navSurface },
        ]}>
          <Text style={[
            styles(theme).priceText,
            { color: isFree ? theme.colors.brand : theme.colors.textOnDark },
          ]}>
            {isFree ? "Free" : `₦${parseInt(event.price || 0).toLocaleString()}`}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────
export default function EventLibrary() {
  const { theme } = useTheme();
  const token = useSessionStore((state) => state.userToken);
  const [activeTab,      setActiveTab]      = useState("upcoming");
  const [viewMode,       setViewMode]       = useState("events");
  const [events,         setEvents]         = useState({ upcoming: [], live: [], past: [] });
  const [tickets,        setTickets]        = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [savedEvents,    setSavedEvents]    = useState([]);
  const [savedLoading,   setSavedLoading]   = useState(false);

  useEffect(() => {
    if (!token) { router.push("/signin"); return; }
    const fetchEvents = async () => {
      try {
        const res = await fetch(`${API_URL}/event/user-events`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setEvents(data);
          const allUpcoming = [...(data.live || []), ...(data.upcoming || [])];
          setTickets(
            allUpcoming.map((event) => {
              const participant = event.participants?.find((p) => p.id === token);
              return participant ? { ...participant, event, eventId: event.event_id } : null;
            }).filter(Boolean)
          );
        }
      } catch (e) { console.error("Failed to fetch events", e); }
      finally { setLoading(false); }
    };
    fetchEvents();
  }, [token]);

  const fetchSaved = async () => {
    setSavedLoading(true);
    try {
      const ids = await getBookmarks();
      if (!ids.length) { setSavedEvents([]); return; }
      const res = await fetch(`${API_URL}/event/getallevents`);
      if (res.ok) setSavedEvents((await res.json()).filter((e) => ids.includes(e.event_id)));
    } catch {}
    finally { setSavedLoading(false); }
  };

  useEffect(() => { if (activeTab === "saved") fetchSaved(); }, [activeTab]);

  const S = styles(theme);

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <Screen padded>
        <View style={{ gap: 6, marginBottom: 28, marginTop: 8 }}>
          <View style={{ width: 80,  height: 11, borderRadius: radius.xs, backgroundColor: theme.colors.surfaceMuted }} />
          <View style={{ width: 160, height: 30, borderRadius: radius.sm, backgroundColor: theme.colors.surfaceMuted }} />
        </View>
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 24 }}>
          {[1,2,3].map((i) => <View key={i} style={{ flex: 1, height: 42, borderRadius: radius.xxl, backgroundColor: theme.colors.surfaceMuted }} />)}
        </View>
        <SkeletonLoader variant="row" count={4} />
      </Screen>
    );
  }

  const TABS = [
    { key: "upcoming", label: "Upcoming", count: (events.upcoming?.length || 0) + (events.live?.length || 0) },
    { key: "past",     label: "Past",     count: events.past?.length || 0 },
    { key: "saved",    label: "Saved",    count: null },
  ];

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={S.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <View style={S.header}>
          <View style={{ flex: 1 }}>
            <Text style={S.headerEyebrow}>My Collection</Text>
            <Text style={S.headerTitle}>Library</Text>
          </View>
          {tickets.length > 0 && (
            <View style={S.ticketBadge}>
              <Ticket size={12} color={theme.colors.textOnBrand} />
              <Text style={S.ticketBadgeText}>
                {tickets.length} ticket{tickets.length !== 1 ? "s" : ""}
              </Text>
            </View>
          )}
        </View>

        {/* ── Tab bar ── */}
        <View style={S.tabBar}>
          {TABS.map((t) => {
            const active = activeTab === t.key;
            return (
              <Pressable
                key={t.key}
                style={[S.tab, active && S.tabActive]}
                onPress={() => { setActiveTab(t.key); if (t.key !== "upcoming") setViewMode("events"); }}
              >
                <Text style={[S.tabText, active && S.tabTextActive]}>{t.label}</Text>
                {t.count != null && t.count > 0 && (
                  <View style={[S.tabCount, active && S.tabCountActive]}>
                    <Text style={[S.tabCountText, active && S.tabCountTextActive]}>{t.count}</Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        {/* ── Content ── */}
        <View style={S.content}>

          {/* ── Upcoming tab ── */}
          {activeTab === "upcoming" && (
            <>
              {/* Sub-toggle */}
              <View style={S.subRow}>
                {[
                  { key: "events",  label: "Events",     Icon: Layers },
                  { key: "tickets", label: "My Tickets",  Icon: Ticket },
                ].map(({ key, label, Icon }) => {
                  const active = viewMode === key;
                  return (
                    <Pressable
                      key={key}
                      style={[S.subBtn, active && S.subBtnActive]}
                      onPress={() => setViewMode(key)}
                    >
                      <Icon size={13} color={active ? theme.colors.textOnBrand : theme.colors.textSubtle} />
                      <Text style={[S.subBtnText, active && S.subBtnTextActive]}>{label}</Text>
                    </Pressable>
                  );
                })}
              </View>

              {viewMode === "tickets" ? (
                tickets.length > 0 ? (
                  <View style={{ gap: 12 }}>
                    {tickets.map((ticket, i) => (
                      <TicketCard key={`${ticket.eventId}-${i}`} ticket={ticket} event={ticket.event} />
                    ))}
                  </View>
                ) : (
                  <EmptyState
                    emoji="🎟️"
                    title="No tickets yet"
                    subtitle="Register for events to collect your tickets here."
                    actionLabel="Explore Events"
                    onAction={() => router.push("/(app)/dashboard")}
                  />
                )
              ) : (
                <>
                  {events.live?.length > 0 && (
                    <View style={S.section}>
                      <View style={S.sectionHead}>
                        <LivePulse color={theme.colors.error} />
                        <Text style={S.sectionTitle}>Happening Now</Text>
                      </View>
                      <View style={{ gap: 10 }}>
                        {events.live.map((ev) => <EventRow key={ev.event_id} event={ev} theme={theme} />)}
                      </View>
                    </View>
                  )}

                  <View style={S.section}>
                    {events.upcoming.length > 0 ? (
                      <>
                        {events.live?.length > 0 && <Text style={S.sectionTitle}>Upcoming</Text>}
                        <View style={{ gap: 10 }}>
                          {events.upcoming.map((ev) => <EventRow key={ev.event_id} event={ev} theme={theme} />)}
                        </View>
                      </>
                    ) : (
                      !events.live?.length && (
                        <EmptyState
                          emoji="📅"
                          title="Nothing upcoming"
                          subtitle="Events you've signed up for will show here."
                          actionLabel="Explore Events"
                          onAction={() => router.push("/(app)/dashboard")}
                        />
                      )
                    )}
                  </View>
                </>
              )}
            </>
          )}

          {/* ── Past tab ── */}
          {activeTab === "past" && (
            events.past.length > 0 ? (
              <View style={{ gap: 10 }}>
                {events.past.map((ev) => <EventRow key={ev.event_id} event={ev} dim theme={theme} />)}
              </View>
            ) : (
              <EmptyState
                emoji="🗓️"
                title="No past events yet"
                subtitle="Events you've attended will appear here."
              />
            )
          )}

          {/* ── Saved tab ── */}
          {activeTab === "saved" && (
            savedLoading ? (
              <SkeletonLoader variant="row" count={3} />
            ) : savedEvents.length > 0 ? (
              <View style={{ gap: 10 }}>
                {savedEvents.map((ev) => <EventRow key={ev.event_id} event={ev} theme={theme} />)}
              </View>
            ) : (
              <EmptyState
                emoji="🔖"
                title="No saved events"
                subtitle="Tap the bookmark on any event to save it here."
                actionLabel="Browse Events"
                onAction={() => router.push("/(app)/dashboard")}
              />
            )
          )}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>
    </Screen>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = (theme) => StyleSheet.create({
  scroll: {
    paddingTop: 24,
    paddingBottom: 24,
    paddingHorizontal: spacing.page,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 24,
  },
  headerEyebrow: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    color: theme.colors.accentLibrary,
    marginBottom: 4,
    fontFamily: "PlusJakartaSans_700Bold",
    lineHeight: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "700",
    fontFamily: "SpaceGrotesk_700Bold",
    color: theme.colors.text,
    letterSpacing: -0.5,
    lineHeight: 38,
  },
  ticketBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: theme.colors.accentLibrary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.xxl,
    marginBottom: 4,
  },
  ticketBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    fontFamily: "PlusJakartaSans_700Bold",
    color: "#fff",
    lineHeight: 16,
  },

  // Tab bar
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 1.5,
    borderBottomColor: theme.colors.border,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 14,
    borderBottomWidth: 2.5,
    borderBottomColor: "transparent",
    marginBottom: -1.5,
  },
  tabActive: {
    borderBottomColor: theme.colors.accentLibrary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: theme.colors.textMuted,
    lineHeight: 19,
  },
  tabTextActive: {
    color: theme.colors.accentLibrary,
    fontWeight: "700",
    fontFamily: "PlusJakartaSans_700Bold",
  },
  tabCount: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  tabCountActive: {
    backgroundColor: theme.colors.accentLibraryTint,
  },
  tabCountText: {
    fontSize: 11,
    fontWeight: "700",
    fontFamily: "PlusJakartaSans_700Bold",
    color: theme.colors.textSubtle,
    lineHeight: 15,
  },
  tabCountTextActive: {
    color: theme.colors.accentLibrary,
  },

  // Content
  content: { flex: 1 },

  // Sub-toggle
  subRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 22,
  },
  subBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: radius.xxl,
    backgroundColor: theme.colors.surfaceMuted,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  subBtnActive: {
    backgroundColor: theme.colors.accentLibrary,
    borderColor: theme.colors.accentLibrary,
  },
  subBtnText: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: theme.colors.textSubtle,
    lineHeight: 18,
  },
  subBtnTextActive: {
    color: "#fff",
    fontWeight: "700",
    fontFamily: "PlusJakartaSans_700Bold",
  },

  // Sections
  section: { marginBottom: 28 },
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    fontFamily: "SpaceGrotesk_700Bold",
    color: theme.colors.text,
    letterSpacing: -0.3,
    marginBottom: 14,
    lineHeight: 26,
  },

  // List row
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 12,
    borderRadius: radius.lg,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  listThumb: {
    width: 72,
    height: 72,
    borderRadius: radius.md,
    overflow: "hidden",
    flexShrink: 0,
    position: "relative",
  },
  listTitle: {
    fontSize: 15,
    fontWeight: "700",
    fontFamily: "SpaceGrotesk_700Bold",
    color: theme.colors.text,
    lineHeight: 20,
  },
  listVenue: {
    fontSize: 12,
    color: theme.colors.textSubtle,
    fontFamily: "PlusJakartaSans_400Regular",
    flex: 1,
    lineHeight: 17,
  },
  dateBadge: {
    backgroundColor: theme.colors.brandTint,
    borderRadius: radius.xs,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  dateBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    fontFamily: "PlusJakartaSans_700Bold",
    color: theme.colors.brand,
    lineHeight: 15,
  },
  listTime: {
    fontSize: 11,
    color: theme.colors.textSubtle,
    fontFamily: "PlusJakartaSans_400Regular",
    lineHeight: 15,
  },
  priceBadge: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: radius.sm,
    flexShrink: 0,
  },
  priceText: {
    fontSize: 12,
    fontWeight: "700",
    fontFamily: "PlusJakartaSans_700Bold",
    lineHeight: 16,
  },
});
