import { useTheme } from "../../theme/ThemeProvider.js";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { Plus, Lock, Filter, X, Search } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  Screen,
  TextField,
  PrimaryButton,
  NeuCard,
  NeuInset,
  EventCard,
} from "../../components/index.js";
import { useSessionStore } from "../../lib/auth.js";
import { API_URL } from "../../lib/config.js";

function getDateString() {
  const now = new Date();
  const weekdays = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  return `${weekdays[now.getDay()]}, ${now.getDate()} ${
    months[now.getMonth()]
  }`;
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 18) return "Good Afternoon";
  return "Good Evening";
}

function parseEventDateTime(dateStr, timeStr) {
  if (!dateStr || !timeStr) return null;
  const dateParts = dateStr.split("/");
  if (dateParts.length !== 3) return null;
  const day = parseInt(dateParts[0], 10);
  const month = parseInt(dateParts[1], 10) - 1;
  const year = parseInt(dateParts[2], 10);
  const timeStrTrimmed = timeStr.trim();
  let hours = 0,
    minutes = 0;

  if (timeStrTrimmed.includes("AM") || timeStrTrimmed.includes("PM")) {
    const [timePart, period] = timeStrTrimmed.split(" ");
    const [h, m] = timePart.split(":").map((v) => parseInt(v, 10));
    hours =
      period === "PM" && h !== 12
        ? h + 12
        : period === "AM" && h === 12
          ? 0
          : h;
    minutes = m || 0;
  } else {
    const [h, m] = timeStrTrimmed.split(":").map((v) => parseInt(v, 10));
    hours = h;
    minutes = m || 0;
  }
  return new Date(year, month, day, hours, minutes);
}

export default function DashboardScreen() {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const token = useSessionStore((state) => state.userToken);
  const [loading, setLoading] = useState(true);
  const [allEvents, setAllEvents] = useState([]);
  const [userName, setUserName] = useState("Explorer");
  const [userInterests, setUserInterests] = useState([]);
  const [showFilter, setShowFilter] = useState(false);
  const [filterOptions, setFilterOptions] = useState({
    keyword: "",
  });
  const [accessCodeSearch, setAccessCodeSearch] = useState("");
  const [accessCodeEvent, setAccessCodeEvent] = useState(null);
  const [accessCodeError, setAccessCodeError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (token) {
          const userRes = await fetch(`${API_URL}/user/details`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          });
          if (userRes.ok) {
            const data = await userRes.json();
            if (data.firstName) setUserName(data.firstName);
            if (data.interests) setUserInterests(data.interests);
          }
        }

        const eventsRes = await fetch(`${API_URL}/event/getallevents`);
        if (eventsRes.ok) {
          const data = await eventsRes.json();
          setAllEvents(data);
        }
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  // Filter events
  const now = new Date();
  const filteredEvents = allEvents.filter((event) => {
    if (filterOptions.keyword.toLowerCase()) {
      const keyword = filterOptions.keyword.toLowerCase();
      if (!event.name.toLowerCase().includes(keyword)) {
        return false;
      }
    }
    return true;
  });

  const premiumEvents = allEvents.filter((e) => {
    if (!e.isPremium) return false;
    const eventStart = parseEventDateTime(e.date, e.time);
    if (!eventStart) return true;
    return now < eventStart;
  });

  const liveEvents = filteredEvents.filter((e) => {
    const eventStart = parseEventDateTime(e.date, e.time);
    if (!eventStart) return false;
    const eventEnd = new Date(eventStart.getTime() + 3 * 60 * 60 * 1000);
    return now >= eventStart && now <= eventEnd;
  });

  const upcomingEvents = filteredEvents.filter((e) => {
    const eventStart = parseEventDateTime(e.date, e.time);
    if (!eventStart) return false;
    return now < eventStart;
  });

  const matchesInterests = (event) => {
    return (
      userInterests.length > 0 &&
      event.category &&
      userInterests.includes(event.category)
    );
  };

  const sortEventsByInterests = (events) => {
    const matching = events.filter(matchesInterests);
    const others = events.filter((e) => !matchesInterests(e));
    return [...matching, ...others];
  };

  const sortedLiveEvents = sortEventsByInterests(liveEvents);
  const sortedUpcomingEvents = sortEventsByInterests(upcomingEvents);

  if (loading) {
    return (
      <Screen padded={false}>
        <View style={styles.loadingContainer}>
          <NeuCard style={styles.loadingCard}>
            <ActivityIndicator size="large" color={theme.colors.brand} />
            <Text style={styles.loadingText}>Loading...</Text>
          </NeuCard>
        </View>
      </Screen>
    );
  }

  return (
    <Screen padded={true}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.dateText}>{getDateString()}</Text>
          <Text style={styles.greetingText}>
            {getGreeting()}, <Text style={styles.userNameText}>{userName}</Text>
          </Text>
        </View>
        <PrimaryButton
          label="Create Event"
          onPress={() => router.push("/(app)/eventform")}
          icon={<Plus size={16} color="white" />}
        />
      </View>

      {/* Search & Filter */}
      <View style={styles.searchSection}>
        <TextField
          placeholder="Search events, categories, organizers..."
          value={filterOptions.keyword}
          onChangeText={(text) =>
            setFilterOptions({ ...filterOptions, keyword: text })
          }
          onFocus={() => setShowFilter(true)}
          leftIcon={<Search size={18} color="#9ca3af" />}
        />

        {showFilter && (
          <NeuCard style={styles.filterContainer}>
            <View style={styles.filterHeader}>
              <Text style={styles.filterTitle}>Filters</Text>
              <Pressable onPress={() => setShowFilter(false)}>
                <X size={20} color="#6b7280" />
              </Pressable>
            </View>
            <View style={{ marginTop: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: theme.colors.text, marginBottom: 8 }}>Categories</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {["All", "Tech", "Sports", "Music", "Business", "Art"].map(cat => (
                  <Pressable 
                    key={cat}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: theme.colors.brand,
                      backgroundColor: cat === "All" ? theme.colors.brand : "transparent"
                    }}
                  >
                    <Text style={{ 
                      fontSize: 12, 
                      fontWeight: "600", 
                      color: cat === "All" ? "#fff" : theme.colors.brand 
                    }}>{cat}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <PrimaryButton
              label="Done"
              onPress={() => setShowFilter(false)}
              style={{ marginTop: 20, alignSelf: "flex-end" }}
            />
          </NeuCard>
        )}
      </View>

      {/* Private Event Code */}
      <View style={styles.section}>
        <NeuCard style={styles.accessCard}>
          <View style={styles.accessHeader}>
            <Lock size={18} color={theme.colors.brand} />
            <Text style={styles.accessTitle}>Have a Private Event Code?</Text>
          </View>
          <TextField
            placeholder="UHB1234"
            value={accessCodeSearch}
            onChangeText={(text) => {
              const value = text.toUpperCase();
              setAccessCodeSearch(value);
            }}
            maxLength={7}
            containerStyle={{ marginTop: 12 }}
          />
          {accessCodeError ? (
            <Text style={styles.errorText}>{accessCodeError}</Text>
          ) : null}
          {accessCodeEvent ? (
            <View style={{ marginTop: 16 }}>
              <EventCard
                title={accessCodeEvent.name}
                date={accessCodeEvent.date}
                time={accessCodeEvent.time}
                location={accessCodeEvent.venue}
                imageSrc={accessCodeEvent.profile}
                eventId={accessCodeEvent.event_id}
                price={accessCodeEvent.price}
                category={accessCodeEvent.category}
                isPremium={accessCodeEvent.isPremium}
              />
            </View>
          ) : null}
        </NeuCard>
      </View>

      {/* Premium Picks */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionDot, { backgroundColor: "#f59e0b" }]} />
          <Text style={styles.sectionTitle}>Premium Picks</Text>
        </View>
        {premiumEvents.length === 0 ? (
          <NeuInset style={styles.emptyBox}>
            <Text style={styles.emptyText}>No premium events yet.</Text>
          </NeuInset>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 12, paddingRight: 16 }}
          >
            {premiumEvents.map((event) => (
              <View key={event.event_id} style={{ width: 220 }}>
                <EventCard
                  title={event.name}
                  date={event.date}
                  time={event.time}
                  location={event.venue}
                  imageSrc={event.profile}
                  eventId={event.event_id}
                  price={event.price}
                  category={event.category}
                  isPremium
                />
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Live Now */}
      {sortedLiveEvents.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.liveDotContainer}>
              <View style={styles.liveDotOuter} />
              <View style={styles.liveDot} />
            </View>
            <Text style={styles.sectionTitle}>Live Now</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 12, paddingRight: 16 }}
          >
            {sortedLiveEvents.map((event) => (
              <View
                key={event.event_id}
                style={{ width: 220, position: "relative" }}
              >
                {matchesInterests(event) && (
                  <View style={styles.forYouBadge}>
                    <Text style={styles.forYouText}>For You</Text>
                  </View>
                )}
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
          </ScrollView>
        </View>
      )}

      {/* Upcoming Events */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionDot, { backgroundColor: "#9ca3af" }]} />
          <Text style={styles.sectionTitle}>Upcoming Events</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>
              {sortedUpcomingEvents.length}
            </Text>
          </View>
        </View>
        {sortedUpcomingEvents.length === 0 ? (
          <NeuInset style={styles.emptyBox}>
            <Text style={{ fontSize: 32, marginBottom: 12 }}>🔍</Text>
            <Text style={styles.emptyTitle}>No events found</Text>
            <Text style={styles.emptyText}>Try adjusting your filters.</Text>
          </NeuInset>
        ) : (
          <View style={styles.upcomingGrid}>
            {sortedUpcomingEvents.map((event) => (
              <View key={event.event_id} style={{ position: "relative" }}>
                {matchesInterests(event) && (
                  <View style={[styles.forYouBadge, { top: 12, right: 12 }]}>
                    <Text style={styles.forYouText}>For You</Text>
                  </View>
                )}
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
        )}
      </View>
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
    padding: 32,
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
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
    gap: 12,
  },
  dateText: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color: theme.colors.brand,
    marginBottom: 4,
  },
  greetingText: {
    fontSize: 24,
    fontWeight: "800",
    fontFamily: "SpaceGrotesk_700Bold",
    color: theme.colors.text,
  },
  userNameText: {
    fontWeight: "500",
    color: theme.colors.textSubtle,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
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
  countBadge: {
    marginLeft: "auto",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "rgba(156, 163, 175, 0.15)",
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.textMuted,
  },
  searchSection: {
    marginBottom: 20,
  },
  filterContainer: {
    marginTop: 12,
    padding: 20,
  },
  filterHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.text,
  },
  accessCard: {
    padding: 20,
  },
  accessHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  accessTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.text,
  },
  errorText: {
    fontSize: 12,
    fontWeight: "500",
    color: theme.colors.error,
    marginTop: 12,
  },
  emptyBox: {
    padding: 32,
    alignItems: "center",
    borderRadius: 24,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.text,
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.textSubtle,
    textAlign: "center",
  },
  forYouBadge: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 20,
    backgroundColor: theme.colors.warning,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    shadowColor: theme.colors.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  forYouText: {
    fontSize: 10,
    fontWeight: "800",
    color: theme.colors.text,
    letterSpacing: 0.3,
  },
  upcomingGrid: {
    gap: 16,
  },
});
