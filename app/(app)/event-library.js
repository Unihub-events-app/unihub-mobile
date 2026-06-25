import { useTheme } from "../../theme/ThemeProvider.js";
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Pressable,
  Image,
} from "react-native";
import { router } from "expo-router";
import {
  Calendar,
  FolderOpen,
  Layers,
  Ticket,
  Bookmark,
} from "lucide-react-native";
import {
  Screen,
  TicketCard,
  PageLoader,
} from "../../components/index.js";
import { useSessionStore } from "../../lib/auth.js";
import { API_URL } from "../../lib/config.js";
import { getBookmarks } from "../../lib/bookmarks.js";

const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function parseEventDate(dateStr) {
  if (!dateStr) return null;
  const parts = dateStr.split("/");
  if (parts.length < 2) return null;
  return { day: parts[0], month: MONTHS_SHORT[parseInt(parts[1]) - 1] || "" };
}

function EventRow({ event, dim }) {
  const { theme } = useTheme();
  const dm = parseEventDate(event.date);
  const isFree = event.price === 0 || event.price === "0";
  return (
    <Pressable
      onPress={() => router.push(`/event/${event.event_id}`)}
      style={({ pressed }) => [{
        flexDirection: "row", alignItems: "center", gap: 14,
        padding: 12, borderRadius: 20, marginBottom: 10,
        backgroundColor: theme.colors.surface,
        borderWidth: 1, borderColor: theme.colors.border,
        opacity: pressed ? 0.85 : dim ? 0.65 : 1,
      }]}
    >
      <View style={{ width: 72, height: 72, borderRadius: 14, overflow: "hidden", flexShrink: 0 }}>
        {event.profile ? (
          <Image source={{ uri: event.profile }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
        ) : (
          <View style={{ width: "100%", height: "100%", backgroundColor: theme.colors.navSurface, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontSize: 24 }}>🎉</Text>
          </View>
        )}
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontSize: 15, fontWeight: "700", fontFamily: "SpaceGrotesk_700Bold", color: theme.colors.text, marginBottom: 3 }} numberOfLines={1}>
          {event.name}
        </Text>
        <Text style={{ fontSize: 12, color: theme.colors.textSubtle, fontFamily: "PlusJakartaSans_400Regular", marginBottom: 6 }} numberOfLines={1}>
          {event.venue}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          {dm && (
            <Text style={{ fontSize: 11, fontWeight: "700", color: theme.colors.brand, fontFamily: "PlusJakartaSans_700Bold" }}>
              {dm.day} {dm.month}
            </Text>
          )}
          {event.time && <Text style={{ fontSize: 11, color: theme.colors.textSubtle }}>· {event.time}</Text>}
        </View>
      </View>
      <View style={{ paddingVertical: 5, paddingHorizontal: 10, borderRadius: 10, backgroundColor: isFree ? theme.colors.brandTint : theme.colors.navSurface }}>
        <Text style={{ fontSize: 11, fontWeight: "800", fontFamily: "PlusJakartaSans_700Bold", color: isFree ? theme.colors.brand : "#F0EFE0" }}>
          {isFree ? "Free" : `₦${parseInt(event.price || 0).toLocaleString()}`}
        </Text>
      </View>
    </Pressable>
  );
}

function EmptyState({ type }) {
  const { theme } = useTheme();
  const emoji = type === "past" ? "🗓️" : type === "tickets" ? "🎟️" : "📅";
  const title = type === "past" ? "No past events yet" : type === "tickets" ? "No tickets yet" : "Nothing upcoming";
  const body = type === "past"
    ? "Events you've attended will appear here."
    : type === "tickets"
    ? "Register for events to collect your tickets."
    : "Events you've signed up for will show here.";
  return (
    <View style={{ alignItems: "center", paddingVertical: 52, paddingHorizontal: 28 }}>
      <Text style={{ fontSize: 52, marginBottom: 20 }}>{emoji}</Text>
      <Text style={{ fontSize: 20, fontWeight: "800", fontFamily: "SpaceGrotesk_700Bold", color: theme.colors.text, marginBottom: 10, textAlign: "center" }}>
        {title}
      </Text>
      <Text style={{ fontSize: 14, color: theme.colors.textSubtle, textAlign: "center", lineHeight: 22, marginBottom: 28, fontFamily: "PlusJakartaSans_400Regular" }}>
        {body}
      </Text>
      {type !== "past" && (
        <TouchableOpacity
          style={{ backgroundColor: theme.colors.brand, paddingVertical: 13, paddingHorizontal: 32, borderRadius: 99 }}
          onPress={() => router.push("/(app)/dashboard")}
        >
          <Text style={{ fontSize: 15, fontWeight: "700", fontFamily: "PlusJakartaSans_700Bold", color: "#1A1A14" }}>
            Explore Events
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function EventLibrary() {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const token = useSessionStore((state) => state.userToken);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [viewMode, setViewMode] = useState("events");
  const [events, setEvents] = useState({ upcoming: [], live: [], past: [] });
  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savedEvents, setSavedEvents] = useState([]);
  const [savedLoading, setSavedLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      router.push("/signin");
      return;
    }

    const fetchEvents = async () => {
      try {
        const res = await fetch(`${API_URL}/event/user-events`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          setEvents(data);
          const allUpcomingEvents = [...(data.live || []), ...(data.upcoming || [])];
          setTickets(
            allUpcomingEvents.map((event) => {
              const participant = event.participants?.find((p) => p.id === token);
              if (participant) return { ...participant, event, eventId: event.event_id };
              return null;
            }).filter(Boolean)
          );
        }
      } catch (error) {
        console.error("Failed to fetch events", error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, [token]);

  const fetchSaved = async () => {
    setSavedLoading(true);
    try {
      const bookmarkIds = await getBookmarks();
      if (bookmarkIds.length === 0) { setSavedEvents([]); return; }
      const res = await fetch(`${API_URL}/event/getallevents`);
      if (res.ok) {
        const data = await res.json();
        setSavedEvents(data.filter((e) => bookmarkIds.includes(e.event_id)));
      }
    } catch {}
    finally { setSavedLoading(false); }
  };

  useEffect(() => {
    if (activeTab === "saved") fetchSaved();
  }, [activeTab]);

  useEffect(() => {
    setFilteredTickets(tickets);
  }, [tickets]);

  if (loading) return <PageLoader />;

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerSuper}>My Collection</Text>
            <Text style={styles.headerTitle}>Library</Text>
          </View>
          {tickets.length > 0 && (
            <View style={styles.ticketBadge}>
              <Ticket size={11} color="#1A1A14" />
              <Text style={styles.ticketBadgeText}>
                {tickets.length} ticket{tickets.length !== 1 ? "s" : ""}
              </Text>
            </View>
          )}
        </View>

        {/* Underline Tab Bar */}
        <View style={styles.tabBar}>
          {[
            { key: "upcoming", label: "Upcoming" },
            { key: "past", label: "Past" },
            { key: "saved", label: "Saved" },
          ].map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[styles.tab, activeTab === t.key && styles.tabActive]}
              onPress={() => {
                setActiveTab(t.key);
                if (t.key !== "upcoming") setViewMode("events");
              }}
            >
              <Text style={[styles.tabText, activeTab === t.key && styles.tabTextActive]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Content */}
        <View style={styles.content}>
          {activeTab === "upcoming" && (
            <>
              {/* Sub-toggle: Events vs Tickets */}
              <View style={styles.subRow}>
                {[
                  { key: "events", label: "Events", icon: Layers },
                  { key: "tickets", label: "My Tickets", icon: Ticket },
                ].map((m) => (
                  <TouchableOpacity
                    key={m.key}
                    style={[styles.subBtn, viewMode === m.key && styles.subBtnActive]}
                    onPress={() => setViewMode(m.key)}
                  >
                    <m.icon size={13} color={viewMode === m.key ? "#1A1A14" : theme.colors.textSubtle} />
                    <Text style={[styles.subBtnText, viewMode === m.key && styles.subBtnTextActive]}>
                      {m.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {viewMode === "tickets" ? (
                filteredTickets.length > 0 ? (
                  <View style={{ gap: 12 }}>
                    {filteredTickets.map((ticket, i) => (
                      <TicketCard key={`${ticket.eventId}-${i}`} ticket={ticket} event={ticket.event} />
                    ))}
                  </View>
                ) : (
                  <EmptyState type="tickets" />
                )
              ) : (
                <>
                  {events.live && events.live.length > 0 && (
                    <View style={styles.section}>
                      <View style={styles.sectionHead}>
                        <View style={styles.livePulse} />
                        <Text style={styles.sectionTitle}>Happening Now</Text>
                      </View>
                      {events.live.map((event) => (
                        <EventRow key={event.event_id} event={event} />
                      ))}
                    </View>
                  )}
                  <View style={styles.section}>
                    {events.upcoming.length > 0 ? (
                      <>
                        <Text style={styles.sectionTitle}>Upcoming</Text>
                        {events.upcoming.map((event) => (
                          <EventRow key={event.event_id} event={event} />
                        ))}
                      </>
                    ) : (
                      !events.live?.length && <EmptyState type="upcoming" />
                    )}
                  </View>
                </>
              )}
            </>
          )}

          {activeTab === "past" && (
            events.past.length > 0 ? (
              events.past.map((event) => (
                <EventRow key={event.event_id} event={event} dim />
              ))
            ) : (
              <EmptyState type="past" />
            )
          )}

          {activeTab === "saved" && (
            savedLoading ? (
              <View style={{ alignItems: "center", paddingVertical: 52 }}>
                <Calendar size={36} color={theme.colors.textSubtle} />
              </View>
            ) : savedEvents.length > 0 ? (
              savedEvents.map((event) => (
                <EventRow key={event.event_id} event={event} />
              ))
            ) : (
              <View style={{ alignItems: "center", paddingVertical: 52, paddingHorizontal: 28 }}>
                <Text style={{ fontSize: 48, marginBottom: 20 }}>🔖</Text>
                <Text style={{ fontSize: 20, fontWeight: "800", fontFamily: "SpaceGrotesk_700Bold", color: theme.colors.text, marginBottom: 10, textAlign: "center" }}>
                  No saved events
                </Text>
                <Text style={{ fontSize: 14, color: theme.colors.textSubtle, textAlign: "center", lineHeight: 22, fontFamily: "PlusJakartaSans_400Regular" }}>
                  Tap the bookmark icon on any event to save it here.
                </Text>
              </View>
            )
          )}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>
    </Screen>
  );
}

const getStyles = (theme) => StyleSheet.create({
  scrollContainer: {
    paddingTop: 24,
    paddingBottom: 24,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 24,
  },
  headerSuper: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    color: theme.colors.brand,
    marginBottom: 4,
    fontFamily: "PlusJakartaSans_700Bold",
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "800",
    fontFamily: "SpaceGrotesk_700Bold",
    color: theme.colors.text,
    letterSpacing: -0.5,
  },
  ticketBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: theme.colors.brand,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 99,
    marginBottom: 4,
  },
  ticketBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    fontFamily: "PlusJakartaSans_700Bold",
    color: "#1A1A14",
  },
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 1.5,
    borderBottomColor: theme.colors.border,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    borderBottomWidth: 2.5,
    borderBottomColor: "transparent",
    marginBottom: -1.5,
  },
  tabActive: {
    borderBottomColor: theme.colors.brand,
  },
  tabText: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.colors.textMuted,
    fontFamily: "PlusJakartaSans_600SemiBold",
  },
  tabTextActive: {
    color: theme.colors.brand,
    fontWeight: "700",
    fontFamily: "PlusJakartaSans_700Bold",
  },
  content: {
    flex: 1,
  },
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
    paddingVertical: 11,
    borderRadius: 14,
    backgroundColor: theme.colors.surfaceMuted,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  subBtnActive: {
    backgroundColor: theme.colors.brand,
    borderColor: theme.colors.brand,
  },
  subBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.textSubtle,
    fontFamily: "PlusJakartaSans_600SemiBold",
  },
  subBtnTextActive: {
    color: "#1A1A14",
    fontWeight: "700",
    fontFamily: "PlusJakartaSans_700Bold",
  },
  section: {
    marginBottom: 28,
  },
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  livePulse: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.error,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    fontFamily: "SpaceGrotesk_700Bold",
    color: theme.colors.text,
    letterSpacing: -0.3,
    marginBottom: 14,
  },
});
