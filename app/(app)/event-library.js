import { useTheme } from "../../theme/ThemeProvider.js";
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import {
  Calendar,
  FolderOpen,
  Layers,
  Ticket,
  MapPin,
  Clock,
} from "lucide-react-native";
import {
  Screen,
  NeuCard,
  NeuInset,
  EventCard,
  TicketCard,
  PageLoader,
} from "../../components/index.js";
import { useSessionStore } from "../../lib/auth.js";
import { API_URL } from "../../lib/config.js";

function EmptyState({ type }) {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  return (
    <NeuInset style={styles.emptyState}>
      <NeuCard style={styles.emptyIconContainer}>
        {type === "past" ? (
          <FolderOpen size={32} color="#9ca3af" />
        ) : (
          <Calendar size={32} color="#9ca3af" />
        )}
      </NeuCard>
      <Text style={styles.emptyTitle}>No {type} events</Text>
      <Text style={styles.emptyText}>
        {type === "past"
          ? "Your attended events will show up here."
          : "Register for events to see them here."}
      </Text>
      {type !== "past" && (
        <TouchableOpacity
          style={styles.exploreButton}
          onPress={() => router.push("/(app)/dashboard")}
        >
          <Text style={styles.exploreButtonText}>Explore Events</Text>
        </TouchableOpacity>
      )}
    </NeuInset>
  );
}

function TabButton({ active, icon: Icon, label, onPress }) {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  return (
    <TouchableOpacity
      style={[styles.tabButton, active && styles.tabButtonActive]}
      onPress={onPress}
    >
      <Icon size={16} color={active ? theme.colors.brand : theme.colors.textSubtle} />
      <Text
        style={[styles.tabButtonText, active && styles.tabButtonTextActive]}
      >
        {label}
      </Text>
    </TouchableOpacity>
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
  const [ticketFilter, setTicketFilter] = useState("all");
  const [loading, setLoading] = useState(true);

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

          const allUpcomingEvents = [
            ...(data.live || []),
            ...(data.upcoming || []),
          ];
          setTickets(
            allUpcomingEvents
              .map((event) => {
                const participant = event.participants?.find(
                  (p) => p.id === token,
                );
                if (participant) {
                  return {
                    ...participant,
                    event: event,
                    eventId: event.event_id,
                  };
                }
                return null;
              })
              .filter(Boolean),
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

  useEffect(() => {
    if (ticketFilter === "all") {
      setFilteredTickets(tickets);
    } else {
      setFilteredTickets(
        tickets.filter((ticket) => {
          if (ticketFilter === "free") {
            return (
              ticket.event.price === 0 ||
              ticket.ticketType?.toLowerCase().includes("free")
            );
          } else if (ticketFilter === "paid") {
            return ticket.event.price > 0;
          } else {
            return ticket.ticketType === ticketFilter;
          }
        }),
      );
    }
  }, [tickets, ticketFilter]);

  if (loading) {
    return <PageLoader />;
  }

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Page Header */}
        <View style={styles.header}>
          <Text style={styles.headerLabel}>My Collection</Text>
          <View style={styles.headerTitleRow}>
            <Text style={styles.headerTitle}>Library</Text>
            {tickets.length > 0 && (
              <View style={styles.ticketCountBadge}>
                <Text style={styles.ticketCountBadgeText}>{tickets.length} tickets</Text>
              </View>
            )}
          </View>
        </View>

        {/* Segment controls */}
        <View style={styles.tabsContainer}>
          {/* Row 1: Upcoming / Past */}
          <View style={styles.segmentRow}>
            {[
              { key: "upcoming", label: "Upcoming", icon: Calendar },
              { key: "past", label: "Past", icon: FolderOpen },
            ].map(({ key, label, icon: Icon }) => (
              <TouchableOpacity
                key={key}
                style={[styles.segmentBtn, activeTab === key && styles.segmentBtnActive]}
                onPress={() => setActiveTab(key)}
              >
                <Icon
                  size={14}
                  color={activeTab === key ? theme.colors.brand : theme.colors.textSubtle}
                />
                <Text
                  style={[
                    styles.segmentBtnText,
                    activeTab === key && styles.segmentBtnTextActive,
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Row 2: Events / Tickets (only for upcoming) */}
          {activeTab === "upcoming" && (
            <View style={styles.viewToggleRow}>
              {[
                { key: "events", label: "Events", icon: Layers },
                { key: "tickets", label: "My Tickets", icon: Ticket },
              ].map(({ key, label, icon: Icon }) => (
                <TouchableOpacity
                  key={key}
                  style={[styles.viewToggleBtn, viewMode === key && styles.viewToggleBtnActive]}
                  onPress={() => setViewMode(key)}
                >
                  <Icon
                    size={13}
                    color={viewMode === key ? "#1A1A14" : theme.colors.textSubtle}
                  />
                  <Text
                    style={[
                      styles.viewToggleBtnText,
                      viewMode === key && styles.viewToggleBtnTextActive,
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Content */}
        {activeTab === "upcoming" ? (
          viewMode === "tickets" ? (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionHeaderLeft}>
                  <View
                    style={[styles.sectionDot, { backgroundColor: theme.colors.brand }]}
                  />
                  <Text style={styles.sectionTitle}>Your Tickets</Text>
                </View>
                {tickets.length > 0 && (
                  <TouchableOpacity
                    style={styles.filterButton}
                    onPress={() => {}}
                  >
                    <Text style={styles.filterButtonText}>Filter</Text>
                  </TouchableOpacity>
                )}
              </View>

              {filteredTickets.length > 0 ? (
                <View style={styles.grid}>
                  {filteredTickets.map((ticket, index) => (
                    <TicketCard
                      key={`${ticket.eventId}-${index}`}
                      ticket={ticket}
                      event={ticket.event}
                    />
                  ))}
                </View>
              ) : tickets.length > 0 ? (
                <NeuInset style={styles.emptyFilterState}>
                  <NeuCard style={styles.emptyFilterIconContainer}>
                    <Ticket size={32} color="#9ca3af" />
                  </NeuCard>
                  <Text style={styles.emptyFilterTitle}>
                    No tickets match this filter
                  </Text>
                  <Text style={styles.emptyFilterText}>
                    Try a different filter to see your tickets
                  </Text>
                  <TouchableOpacity
                    style={styles.showAllButton}
                    onPress={() => setTicketFilter("all")}
                  >
                    <Text style={styles.showAllButtonText}>
                      Show All Tickets
                    </Text>
                  </TouchableOpacity>
                </NeuInset>
              ) : (
                <NeuInset style={styles.emptyState}>
                  <NeuCard style={styles.emptyIconContainer}>
                    <Ticket size={32} color="#9ca3af" />
                  </NeuCard>
                  <Text style={styles.emptyTitle}>No Tickets Yet</Text>
                  <Text style={styles.emptyText}>
                    Register for events to get your tickets here
                  </Text>
                  <TouchableOpacity
                    style={styles.exploreButton}
                    onPress={() => router.push("/(app)/dashboard")}
                  >
                    <Text style={styles.exploreButtonText}>Explore Events</Text>
                  </TouchableOpacity>
                </NeuInset>
              )}
            </View>
          ) : (
            <View style={styles.eventsContent}>
              {/* Live Events */}
              {events.live && events.live.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <View style={styles.liveDotContainer}>
                      <View style={styles.liveDotOuter} />
                      <View style={styles.liveDot} />
                    </View>
                    <Text style={styles.sectionTitle}>Happening Now</Text>
                  </View>
                  <View style={styles.grid}>
                    {events.live.map((event) => (
                      <EventCard
                        key={event.event_id}
                        title={event.name}
                        date={event.date}
                        time={event.time}
                        location={event.venue}
                        imageSrc={event.profile}
                        eventId={event.event_id}
                        price={event.price}
                        category={event.category}
                        isPremium={event.isPremium}
                      />
                    ))}
                  </View>
                </View>
              )}

              {/* Upcoming Events */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View
                    style={[styles.sectionDot, { backgroundColor: theme.colors.brand }]}
                  />
                  <Text style={styles.sectionTitle}>Upcoming</Text>
                </View>
                {events.upcoming.length > 0 ? (
                  <View style={styles.grid}>
                    {events.upcoming.map((event) => (
                      <EventCard
                        key={event.event_id}
                        title={event.name}
                        date={event.date}
                        time={event.time}
                        location={event.venue}
                        imageSrc={event.profile}
                        eventId={event.event_id}
                        price={event.price}
                        category={event.category}
                        isPremium={event.isPremium}
                      />
                    ))}
                  </View>
                ) : (
                  !events.live?.length && <EmptyState type="upcoming" />
                )}
              </View>
            </View>
          )
        ) : (
          <View style={styles.section}>
            {events.past.length > 0 ? (
              <View style={styles.grid}>
                {events.past.map((event) => (
                  <View key={event.event_id} style={{ opacity: 0.8 }}>
                    <EventCard
                      title={event.name}
                      date={event.date}
                      time={event.time}
                      location={event.venue}
                      imageSrc={event.profile}
                      eventId={event.event_id}
                      price={event.price}
                      category={event.category}
                      isPremium={event.isPremium}
                    />
                  </View>
                ))}
              </View>
            ) : (
              <EmptyState type="past" />
            )}
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>
    </Screen>
  );
}

const getStyles = (theme) => StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.background,
  },
  loadingCard: {
    padding: 40,
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: "500",
    color: theme.colors.textSubtle,
  },
  scrollContainer: {
    paddingTop: 24,
    paddingBottom: 24,
    paddingHorizontal: 16,
  },
  header: {
    marginBottom: 24,
  },
  headerLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    color: theme.colors.brand,
    marginBottom: 4,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "800",
    fontFamily: "SpaceGrotesk_700Bold",
    color: theme.colors.text,
    letterSpacing: -0.5,
  },
  ticketCountBadge: {
    backgroundColor: theme.colors.brand,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  ticketCountBadgeText: {
    color: "#1A1A14",
    fontSize: 12,
    fontWeight: "700",
  },
  tabsContainer: {
    gap: 10,
    marginBottom: 28,
  },
  segmentRow: {
    flexDirection: "row",
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: 14,
    padding: 3,
    gap: 3,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 11,
  },
  segmentBtnActive: {
    backgroundColor: theme.colors.surface,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.textSubtle,
  },
  segmentBtnTextActive: {
    color: theme.colors.brand,
    fontWeight: "700",
  },
  viewToggleRow: {
    flexDirection: "row",
    gap: 8,
  },
  viewToggleBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceMuted,
  },
  viewToggleBtnActive: {
    backgroundColor: theme.colors.brand,
  },
  viewToggleBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.textSubtle,
  },
  viewToggleBtnTextActive: {
    color: "#1A1A14",
    fontWeight: "700",
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
  },
  tabButtonActive: {
    backgroundColor: theme.colors.surface,
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.textSubtle,
  },
  tabButtonTextActive: {
    color: theme.colors.brand,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  sectionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  sectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  liveDotContainer: {
    position: "relative",
    width: 12,
    height: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  liveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.error,
  },
  liveDotOuter: {
    position: "absolute",
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "rgba(190, 18, 60, 0.3)",
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color: theme.colors.textSubtle,
  },
  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: theme.colors.surface,
    borderRadius: 10,
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.textMuted,
  },
  grid: {
    gap: 16,
  },
  emptyState: {
    padding: 32,
    alignItems: "center",
    borderRadius: 24,
    gap: 16,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    fontFamily: "SpaceGrotesk_700Bold",
    color: theme.colors.text,
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.textSubtle,
    textAlign: "center",
    marginBottom: 12,
  },
  exploreButton: {
    backgroundColor: theme.colors.brand,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  exploreButtonText: {
    color: theme.colors.surface,
    fontSize: 14,
    fontWeight: "700",
  },
  emptyFilterState: {
    padding: 32,
    alignItems: "center",
    borderRadius: 24,
    gap: 16,
  },
  emptyFilterIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyFilterTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.text,
  },
  emptyFilterText: {
    fontSize: 14,
    color: theme.colors.textSubtle,
    textAlign: "center",
    marginBottom: 12,
  },
  showAllButton: {
    backgroundColor: theme.colors.surface,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  showAllButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.brand,
  },
  eventsContent: {
    gap: 32,
  },
});
