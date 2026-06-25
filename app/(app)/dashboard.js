import { useTheme } from "../../theme/ThemeProvider.js";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Image,
} from "react-native";
import { router } from "expo-router";
import { Plus, Search, X, Lock, Users, SlidersHorizontal } from "lucide-react-native";
import { useEffect, useState, useRef } from "react";
import {
  Screen,
  TextField,
  PrimaryButton,
  NeuCard,
  NeuInset,
  EventCard,
  PageLoader,
} from "../../components/index.js";
import { useSessionStore } from "../../lib/auth.js";
import { API_URL } from "../../lib/config.js";
import { FilterModal, DEFAULT_FILTERS } from "../../components/FilterModal.js";

const CATEGORIES = ["All", "Near Me", "Today", "Trending", "Tech", "Music", "Sports", "Business", "Art"];

const PRIVATE_CODE_REGEX = /^UHB[A-Z0-9]{4}$/i;

function getDateString() {
  const now = new Date();
  const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return `${weekdays[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]}`;
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
  let hours = 0, minutes = 0;
  if (timeStrTrimmed.includes("AM") || timeStrTrimmed.includes("PM")) {
    const [timePart, period] = timeStrTrimmed.split(" ");
    const [h, m] = timePart.split(":").map((v) => parseInt(v, 10));
    hours = period === "PM" && h !== 12 ? h + 12 : period === "AM" && h === 12 ? 0 : h;
    minutes = m || 0;
  } else {
    const [h, m] = timeStrTrimmed.split(":").map((v) => parseInt(v, 10));
    hours = h;
    minutes = m || 0;
  }
  return new Date(year, month, day, hours, minutes);
}

const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
function parseDayMonth(dateStr) {
  if (!dateStr) return null;
  const parts = dateStr.split("/");
  if (parts.length < 2) return null;
  return { day: parts[0], month: MONTHS_SHORT[parseInt(parts[1]) - 1] || "" };
}

function EventListRow({ event, theme, forYou }) {
  const dm = parseDayMonth(event.date);
  const isFree = event.price === 0 || event.price === "0";
  return (
    <Pressable
      onPress={() => router.push(`/event/${event.event_id}`)}
      style={({ pressed }) => [
        {
          flexDirection: "row", alignItems: "center", gap: 14,
          padding: 12, borderRadius: 18, marginBottom: 10,
          backgroundColor: theme.colors.surface,
          borderWidth: 1, borderColor: theme.colors.border,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      {/* Thumbnail */}
      <View style={{ width: 72, height: 72, borderRadius: 14, overflow: "hidden", flexShrink: 0 }}>
        {event.profile ? (
          <Image source={{ uri: event.profile }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
        ) : (
          <View style={{ width: "100%", height: "100%", backgroundColor: theme.colors.navSurface, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontSize: 24 }}>🎉</Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontSize: 15, fontWeight: "700", fontFamily: "SpaceGrotesk_700Bold", color: theme.colors.text, marginBottom: 3 }} numberOfLines={1}>
          {event.name}
        </Text>
        <Text style={{ fontSize: 12, color: theme.colors.textSubtle, fontFamily: "PlusJakartaSans_400Regular", marginBottom: 6 }} numberOfLines={1}>
          {event.venue}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          {dm ? (
            <Text style={{ fontSize: 11, fontWeight: "700", color: theme.colors.brand, fontFamily: "PlusJakartaSans_700Bold" }}>
              {dm.day} {dm.month}
            </Text>
          ) : null}
          {event.time ? <Text style={{ fontSize: 11, color: theme.colors.textSubtle }}>· {event.time}</Text> : null}
          {forYou ? (
            <View style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, backgroundColor: "rgba(217,119,6,0.14)" }}>
              <Text style={{ fontSize: 9, fontWeight: "800", color: "#D97706", letterSpacing: 0.5 }}>FOR YOU</Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* Price */}
      <View style={{
        paddingVertical: 5, paddingHorizontal: 10, borderRadius: 10,
        backgroundColor: isFree ? theme.colors.brandTint : theme.colors.navSurface,
      }}>
        <Text style={{
          fontSize: 11, fontWeight: "800", fontFamily: "PlusJakartaSans_700Bold",
          color: isFree ? theme.colors.brand : "#F0EFE0",
        }}>
          {isFree ? "Free" : `₦${parseInt(event.price || 0).toLocaleString()}`}
        </Text>
      </View>
    </Pressable>
  );
}

export default function DashboardScreen() {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const token = useSessionStore((state) => state.userToken);
  const [loading, setLoading] = useState(true);
  const [allEvents, setAllEvents] = useState([]);
  const [userName, setUserName] = useState("Explorer");
  const [userInterests, setUserInterests] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [privateCodeEvent, setPrivateCodeEvent] = useState(null);
  const [privateCodeError, setPrivateCodeError] = useState("");
  const [fetchingCode, setFetchingCode] = useState(false);
  const [userResults, setUserResults] = useState([]);
  const [fetchingUsers, setFetchingUsers] = useState(false);
  const [userCountry, setUserCountry] = useState("");
  const [userUniversity, setUserUniversity] = useState("");
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const codeSearchTimeout = useRef(null);
  const userSearchTimeout = useRef(null);

  const USER_SEARCH_REGEX = /^@/;

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (token) {
          const userRes = await fetch(`${API_URL}/user/details`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          });
          if (userRes.ok) {
            const data = await userRes.json();
            if (data.firstName) setUserName(data.firstName);
            if (data.interests) setUserInterests(data.interests);
            if (data.country) setUserCountry(data.country);
            if (data.university) setUserUniversity(data.university);
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

  // Auto-detect private event code in search input
  useEffect(() => {
    const trimmed = keyword.trim().toUpperCase();
    if (PRIVATE_CODE_REGEX.test(trimmed)) {
      clearTimeout(codeSearchTimeout.current);
      setPrivateCodeEvent(null);
      setPrivateCodeError("");
      codeSearchTimeout.current = setTimeout(async () => {
        setFetchingCode(true);
        try {
          const res = await fetch(`${API_URL}/event/access/${trimmed}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          if (res.ok) {
            const data = await res.json();
            setPrivateCodeEvent(data);
            setPrivateCodeError("");
          } else {
            setPrivateCodeEvent(null);
            setPrivateCodeError("No private event found for this code.");
          }
        } catch {
          setPrivateCodeError("Failed to look up event code.");
        } finally {
          setFetchingCode(false);
        }
      }, 600);
    } else {
      setPrivateCodeEvent(null);
      setPrivateCodeError("");
    }
    return () => clearTimeout(codeSearchTimeout.current);
  }, [keyword]);

  // User search — triggers when query starts with @
  useEffect(() => {
    const trimmed = keyword.trim();
    if (!USER_SEARCH_REGEX.test(trimmed) || trimmed.length < 2) {
      setUserResults([]);
      return;
    }
    const query = trimmed.slice(1);
    clearTimeout(userSearchTimeout.current);
    userSearchTimeout.current = setTimeout(async () => {
      setFetchingUsers(true);
      try {
        const res = await fetch(`${API_URL}/social/search?q=${encodeURIComponent(query)}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          setUserResults(Array.isArray(data) ? data : data.users || []);
        }
      } catch {}
      finally { setFetchingUsers(false); }
    }, 500);
    return () => clearTimeout(userSearchTimeout.current);
  }, [keyword]);

  const now = new Date();
  const isCodeMode = PRIVATE_CODE_REGEX.test(keyword.trim().toUpperCase());
  const isUserSearchMode = USER_SEARCH_REGEX.test(keyword.trim()) && keyword.trim().length >= 2;

  const applyFilters = (events) => {
    return events.filter((event) => {
      // Keyword
      const kw = keyword.toLowerCase();
      if (kw && !event.name?.toLowerCase().includes(kw) && !event.category?.toLowerCase().includes(kw)) return false;

      // Category pill
      if (activeCategory === "Today") {
        const start = parseEventDateTime(event.date, event.time);
        if (!start) return false;
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        return start >= todayStart && start < new Date(todayStart.getTime() + 86400000);
      }
      if (activeCategory === "Near Me") {
        if (!userCountry && !userUniversity) return true;
        const venue = (event.venue || "").toLowerCase();
        const country = (event.country || "").toLowerCase();
        const uni = (event.university || "").toLowerCase();
        return (userCountry && (country.includes(userCountry.toLowerCase()) || venue.includes(userCountry.toLowerCase()))) ||
          (userUniversity && (uni.includes(userUniversity.toLowerCase()) || venue.includes(userUniversity.toLowerCase())));
      }
      if (activeCategory !== "All" && activeCategory !== "Trending") {
        if (!event.category?.toLowerCase().includes(activeCategory.toLowerCase())) return false;
      }

      // Filter modal filters
      if (filters.price === "free" && !(event.price === 0 || event.price === "0" || !event.price)) return false;
      if (filters.price === "paid" && (event.price === 0 || event.price === "0" || !event.price)) return false;

      if (filters.categories.length > 0) {
        const cat = (event.category || "").toLowerCase();
        if (!filters.categories.some((c) => cat.includes(c.toLowerCase()))) return false;
      }

      if (filters.date !== "all") {
        const start = parseEventDateTime(event.date, event.time);
        if (!start) return false;
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        if (filters.date === "today") {
          if (!(start >= todayStart && start < new Date(todayStart.getTime() + 86400000))) return false;
        } else if (filters.date === "week") {
          const weekEnd = new Date(todayStart.getTime() + 7 * 86400000);
          if (!(start >= todayStart && start < weekEnd)) return false;
        } else if (filters.date === "month") {
          const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
          if (!(start >= todayStart && start < monthEnd)) return false;
        }
      }

      return true;
    });
  };

  const applySorting = (events) => {
    if (filters.sort === "popular") {
      return [...events].sort((a, b) => (b.attendees?.length || 0) - (a.attendees?.length || 0));
    }
    if (filters.sort === "price_asc") {
      return [...events].sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
    }
    if (filters.sort === "price_desc") {
      return [...events].sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
    }
    return events;
  };

  const filteredEvents = isCodeMode ? [] : applyFilters(allEvents);

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

  const trendingEvents = activeCategory === "Trending"
    ? [...filteredEvents].sort((a, b) => (b.attendees?.length || 0) - (a.attendees?.length || 0)).slice(0, 10)
    : [];

  const matchesInterests = (event) =>
    userInterests.length > 0 && event.category && userInterests.includes(event.category);

  const sortByInterests = (events) => {
    const matching = events.filter(matchesInterests);
    const others = events.filter((e) => !matchesInterests(e));
    return [...matching, ...others];
  };

  const sortedLiveEvents = applySorting(sortByInterests(liveEvents));
  const sortedUpcomingEvents = applySorting(sortByInterests(upcomingEvents));

  if (loading) return <PageLoader />;

  return (
    <Screen padded={true}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.dateText}>{getDateString()}</Text>
          <Text style={styles.greetingText}>
            {getGreeting()},{" "}
            <Text style={styles.userNameText}>{userName}</Text>
          </Text>
        </View>
        <Pressable
          style={styles.createBtn}
          onPress={() => router.push("/(app)/eventform")}
        >
          <Plus size={18} color="#1A1A14" strokeWidth={2.5} />
        </Pressable>
      </View>

      {/* Search Bar */}
      <View style={styles.searchRow}>
        <View style={styles.searchInputWrap}>
          <Search size={17} color={theme.colors.textSubtle} style={styles.searchIcon} />
          <TextField
            placeholder="Search events, @users, or a private code..."
            value={keyword}
            onChangeText={setKeyword}
            containerStyle={styles.searchField}
            style={styles.searchFieldInput}
          />
          {keyword.length > 0 && (
            <Pressable onPress={() => setKeyword("")} style={styles.clearBtn}>
              <X size={15} color={theme.colors.textSubtle} />
            </Pressable>
          )}
        </View>
        {/* Filter button */}
        <Pressable
          onPress={() => setFilterModalVisible(true)}
          style={[
            styles.filterBtn,
            {
              backgroundColor: [filters.date, filters.price, filters.sort].some((v, i) => v !== ["all", "all", "soonest"][i]) || filters.categories.length > 0
                ? theme.colors.brand
                : theme.colors.surfaceMuted,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <SlidersHorizontal
            size={18}
            color={[filters.date, filters.price, filters.sort].some((v, i) => v !== ["all", "all", "soonest"][i]) || filters.categories.length > 0
              ? "#1A1A14"
              : theme.colors.textMuted}
          />
        </Pressable>
      </View>

      {/* Category pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryRow}
      >
        {CATEGORIES.map((cat) => (
          <Pressable
            key={cat}
            style={[
              styles.categoryPill,
              activeCategory === cat && styles.categoryPillActive,
            ]}
            onPress={() => setActiveCategory(cat)}
          >
            <Text
              style={[
                styles.categoryPillText,
                activeCategory === cat && styles.categoryPillTextActive,
              ]}
            >
              {cat}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Featured Event Hero */}
      {!isCodeMode && !isUserSearchMode && (premiumEvents[0] || sortedUpcomingEvents[0]) && (
        (() => {
          const featured = premiumEvents[0] || sortedUpcomingEvents[0];
          const isFree = featured.price === 0 || featured.price === "0";
          return (
            <Pressable
              style={({ pressed }) => [styles.featuredCard, { opacity: pressed ? 0.92 : 1 }]}
              onPress={() => router.push(`/event/${featured.event_id}`)}
            >
              {featured.profile ? (
                <Image source={{ uri: featured.profile }} style={StyleSheet.absoluteFill} resizeMode="cover" />
              ) : (
                <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.colors.navSurface, alignItems: "center", justifyContent: "center" }]}>
                  <Text style={{ fontSize: 48 }}>🎉</Text>
                </View>
              )}
              <View style={styles.featuredOverlay} />
              <View style={styles.featuredContent}>
                {featured.isPremium && (
                  <View style={styles.featuredBadge}>
                    <Text style={styles.featuredBadgeText}>⭐ Premium</Text>
                  </View>
                )}
                <Text style={styles.featuredTitle} numberOfLines={2}>{featured.name}</Text>
                <View style={styles.featuredMeta}>
                  <Text style={styles.featuredDate}>{featured.date} · {featured.time}</Text>
                  <View style={[styles.featuredPrice, { backgroundColor: isFree ? theme.colors.brand : "rgba(255,255,255,0.18)" }]}>
                    <Text style={[styles.featuredPriceText, { color: isFree ? "#1A1A14" : "#fff" }]}>
                      {isFree ? "Free" : `₦${parseInt(featured.price || 0).toLocaleString()}`}
                    </Text>
                  </View>
                </View>
              </View>
            </Pressable>
          );
        })()
      )}

      {/* Private code result */}
      {isCodeMode && (
        <View style={styles.privateResultSection}>
          <View style={styles.privateResultHeader}>
            <Lock size={15} color={theme.colors.brand} />
            <Text style={styles.privateResultLabel}>Private Event</Text>
          </View>
          {fetchingCode && (
            <View style={styles.privateLoading}>
              <ActivityIndicator size="small" color={theme.colors.brand} />
              <Text style={styles.privateLoadingText}>Looking up code…</Text>
            </View>
          )}
          {!fetchingCode && privateCodeError ? (
            <Text style={styles.privateErrorText}>{privateCodeError}</Text>
          ) : null}
          {!fetchingCode && privateCodeEvent ? (
            <EventCard
              title={privateCodeEvent.name}
              date={privateCodeEvent.date}
              time={privateCodeEvent.time}
              location={privateCodeEvent.venue}
              imageSrc={privateCodeEvent.profile}
              eventId={privateCodeEvent.event_id}
              price={privateCodeEvent.price}
              category={privateCodeEvent.category}
              isPremium={privateCodeEvent.isPremium}
            />
          ) : null}
        </View>
      )}

      {/* User search results */}
      {isUserSearchMode && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Users size={14} color={theme.colors.brand} />
            <Text style={[styles.sectionTitle, { marginLeft: 6 }]}>People</Text>
          </View>
          {fetchingUsers ? (
            <ActivityIndicator size="small" color={theme.colors.brand} style={{ marginTop: 12 }} />
          ) : userResults.length === 0 ? (
            <NeuInset style={styles.emptyBox}>
              <Text style={styles.emptyText}>No users found for "{keyword.slice(1)}"</Text>
            </NeuInset>
          ) : (
            <View style={{ gap: 10 }}>
              {userResults.map((user) => {
                const initials = (user.displayName || user.username || "?").substring(0, 2).toUpperCase();
                return (
                  <Pressable
                    key={user._id || user.user_id || user.username}
                    onPress={() => router.push(`/users/u/${user._id || user.user_id}`)}
                    style={[styles.userRow, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                  >
                    {user.avatar ? (
                      <Image source={{ uri: user.avatar }} style={styles.userAvatar} />
                    ) : (
                      <View style={[styles.userAvatar, { backgroundColor: theme.colors.brandTint, alignItems: "center", justifyContent: "center" }]}>
                        <Text style={[styles.userAvatarInitials, { color: theme.colors.brand }]}>{initials}</Text>
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.userDisplayName, { color: theme.colors.text }]}>{user.displayName || user.username}</Text>
                      <Text style={[styles.userUsername, { color: theme.colors.textSubtle }]}>@{user.username}</Text>
                      {user.university ? (
                        <Text style={[styles.userMeta, { color: theme.colors.textMuted }]}>{user.university}</Text>
                      ) : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      )}

      {/* Trending (if active) */}
      {!isCodeMode && !isUserSearchMode && activeCategory === "Trending" && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Trending Now 🔥</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{trendingEvents.length}</Text>
            </View>
          </View>
          {trendingEvents.length === 0 ? (
            <NeuInset style={styles.emptyBox}>
              <Text style={styles.emptyText}>No trending events right now.</Text>
            </NeuInset>
          ) : (
            <View>
              {trendingEvents.map((event) => (
                <EventListRow key={event.event_id} event={event} theme={theme} forYou={matchesInterests(event)} />
              ))}
            </View>
          )}
        </View>
      )}

      {/* Premium Picks (only when not in code/user search/trending/near-me mode) */}
      {!isCodeMode && !isUserSearchMode && activeCategory !== "Trending" && activeCategory !== "Near Me" && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Premium Picks ⭐</Text>
          </View>
          {premiumEvents.length === 0 ? (
            <NeuInset style={styles.emptyBox}>
              <Text style={styles.emptyText}>No premium events yet.</Text>
            </NeuInset>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 12, paddingRight: 4 }}
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
      )}

      {/* Live Now */}
      {!isCodeMode && !isUserSearchMode && sortedLiveEvents.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Live Now</Text>
            <View style={styles.liveDotContainer}>
              <View style={styles.liveDotOuter} />
              <View style={styles.liveDot} />
            </View>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 12, paddingRight: 4 }}
          >
            {sortedLiveEvents.map((event) => (
              <View key={event.event_id} style={{ width: 220, position: "relative" }}>
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

      {/* Upcoming / Today / Near Me / Category results */}
      {!isCodeMode && !isUserSearchMode && activeCategory !== "Trending" && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {activeCategory === "Today" ? "Today's Events" : activeCategory === "All" ? "Upcoming Events" : activeCategory === "Near Me" ? "Near You" : activeCategory}
            </Text>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{sortedUpcomingEvents.length}</Text>
            </View>
          </View>
          {sortedUpcomingEvents.length === 0 ? (
            <NeuInset style={styles.emptyBox}>
              <Text style={{ fontSize: 32, marginBottom: 12 }}>🔍</Text>
              <Text style={styles.emptyTitle}>No events found</Text>
              <Text style={styles.emptyText}>
                {keyword ? "Try a different search term." : "Check back later!"}
              </Text>
            </NeuInset>
          ) : (
            <View>
              {sortedUpcomingEvents.map((event) => (
                <EventListRow
                  key={event.event_id}
                  event={event}
                  theme={theme}
                  forYou={matchesInterests(event)}
                />
              ))}
            </View>
          )}
        </View>
      )}
      <FilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        filters={filters}
        onApply={setFilters}
      />
    </Screen>
  );
}

const getStyles = (theme) =>
  StyleSheet.create({
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 20,
    },
    dateText: {
      fontSize: 11,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 1.2,
      color: theme.colors.brand,
      marginBottom: 4,
      fontFamily: "PlusJakartaSans_700Bold",
    },
    greetingText: {
      fontSize: 26,
      fontWeight: "800",
      fontFamily: "SpaceGrotesk_700Bold",
      color: theme.colors.text,
      letterSpacing: -0.5,
    },
    userNameText: {
      fontWeight: "800",
      color: theme.colors.text,
    },
    createBtn: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: theme.colors.brand,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: theme.colors.brand,
      shadowOpacity: 0.35,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 4,
    },
    featuredCard: {
      height: 210,
      borderRadius: 24,
      overflow: "hidden",
      marginBottom: 20,
      position: "relative",
    },
    featuredOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0,0,0,0.48)",
    },
    featuredContent: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      padding: 18,
    },
    featuredBadge: {
      alignSelf: "flex-start",
      backgroundColor: "rgba(200,230,48,0.2)",
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 3,
      marginBottom: 8,
    },
    featuredBadgeText: {
      fontSize: 11,
      fontWeight: "700",
      color: theme.colors.brand,
      fontFamily: "PlusJakartaSans_700Bold",
    },
    featuredTitle: {
      fontSize: 20,
      fontWeight: "800",
      fontFamily: "SpaceGrotesk_700Bold",
      color: "#fff",
      letterSpacing: -0.3,
      marginBottom: 10,
    },
    featuredMeta: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    featuredDate: {
      fontSize: 12,
      color: "rgba(255,255,255,0.75)",
      fontFamily: "PlusJakartaSans_400Regular",
    },
    featuredPrice: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
    },
    featuredPriceText: {
      fontSize: 12,
      fontWeight: "800",
      fontFamily: "PlusJakartaSans_700Bold",
    },
    searchRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginBottom: 14,
    },
    filterBtn: {
      width: 46,
      height: 46,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      flexShrink: 0,
    },
    searchInputWrap: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.colors.surface,
      borderRadius: 18,
      borderWidth: 1.5,
      borderColor: theme.colors.border,
      paddingHorizontal: 14,
      height: 52,
    },
    searchIcon: {
      marginRight: 8,
    },
    searchField: {
      flex: 1,
      backgroundColor: "transparent",
      borderWidth: 0,
      paddingHorizontal: 0,
      height: 50,
    },
    searchFieldInput: {
      fontSize: 14,
      color: theme.colors.text,
    },
    clearBtn: {
      padding: 4,
    },
    categoryRow: {
      paddingBottom: 16,
      gap: 8,
    },
    categoryPill: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 99,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    categoryPillActive: {
      backgroundColor: theme.colors.brand,
      borderColor: theme.colors.brand,
    },
    categoryPillText: {
      fontSize: 13,
      fontWeight: "600",
      color: theme.colors.textMuted,
      fontFamily: "PlusJakartaSans_600SemiBold",
    },
    categoryPillTextActive: {
      color: "#1A1A14",
    },
    privateResultSection: {
      marginBottom: 24,
      gap: 12,
    },
    privateResultHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    privateResultLabel: {
      fontSize: 12,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.8,
      color: theme.colors.brand,
      fontFamily: "PlusJakartaSans_700Bold",
    },
    privateLoading: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 12,
    },
    privateLoadingText: {
      fontSize: 13,
      color: theme.colors.textSubtle,
    },
    privateErrorText: {
      fontSize: 13,
      color: theme.colors.error,
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
      fontSize: 17,
      fontWeight: "800",
      fontFamily: "SpaceGrotesk_700Bold",
      color: theme.colors.text,
      letterSpacing: -0.3,
    },
    countBadge: {
      marginLeft: "auto",
      paddingHorizontal: 9,
      paddingVertical: 3,
      borderRadius: 99,
      backgroundColor: theme.colors.surfaceMuted,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    countBadgeText: {
      fontSize: 11,
      fontWeight: "700",
      fontFamily: "PlusJakartaSans_700Bold",
      color: theme.colors.textMuted,
    },
    emptyBox: {
      padding: 32,
      alignItems: "center",
      borderRadius: 24,
      gap: 8,
    },
    emptyTitle: {
      fontSize: 15,
      fontWeight: "700",
      color: theme.colors.text,
    },
    emptyText: {
      fontSize: 13,
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
    userRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      padding: 12,
      borderRadius: 16,
      borderWidth: 1,
    },
    userAvatar: {
      width: 48,
      height: 48,
      borderRadius: 16,
    },
    userAvatarInitials: {
      fontSize: 16,
      fontWeight: "800",
      fontFamily: "SpaceGrotesk_700Bold",
    },
    userDisplayName: {
      fontSize: 15,
      fontWeight: "600",
      fontFamily: "PlusJakartaSans_600SemiBold",
    },
    userUsername: {
      fontSize: 13,
      fontFamily: "PlusJakartaSans_400Regular",
      marginTop: 1,
    },
    userMeta: {
      fontSize: 11,
      fontFamily: "PlusJakartaSans_400Regular",
      marginTop: 2,
    },
  });
