import { useTheme } from "../../theme/ThemeProvider.js";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Plus, Search, X, Lock, Users, SlidersHorizontal, MapPin, Clock, Heart } from "lucide-react-native";
import { useEffect, useState, useRef } from "react";
import Animated, {
  useSharedValue, useAnimatedStyle,
  withRepeat, withSequence, withTiming, withSpring,
  Easing,
} from "react-native-reanimated";
import {
  Screen,
  NeuCard,
  EventCard,
  SkeletonLoader,
  EmptyState,
} from "../../components/index.js";
import { useSessionStore } from "../../lib/auth.js";
import { API_URL } from "../../lib/config.js";
import { FilterModal, DEFAULT_FILTERS } from "../../components/FilterModal.js";
import { radius, spacing, springs } from "../../theme/tokens.js";

const CATEGORIES = ["All", "Near Me", "Today", "Trending", "Tech", "Music", "Sports", "Business", "Art"];
const PRIVATE_CODE_REGEX = /^UHB[A-Z0-9]{4}$/i;
const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function parseEventDateTime(dateStr, timeStr) {
  if (!dateStr || !timeStr) return null;
  const parts = dateStr.split("/");
  if (parts.length !== 3) return null;
  const [day, month, year] = parts.map(Number);
  const t = timeStr.trim();
  let hours = 0, minutes = 0;
  if (t.includes("AM") || t.includes("PM")) {
    const [tp, period] = t.split(" ");
    const [h, m] = tp.split(":").map(Number);
    hours = period === "PM" && h !== 12 ? h + 12 : period === "AM" && h === 12 ? 0 : h;
    minutes = m || 0;
  } else {
    const [h, m] = t.split(":").map(Number);
    hours = h; minutes = m || 0;
  }
  return new Date(year, month - 1, day, hours, minutes);
}

function parseDayMonth(dateStr) {
  if (!dateStr) return null;
  const parts = dateStr.split("/");
  if (parts.length < 2) return null;
  return { day: parts[0], month: MONTHS_SHORT[parseInt(parts[1]) - 1] || "" };
}

// ─── Animated live pulse dot ─────────────────────────────────────────────────
function LivePulse({ color }) {
  const scale   = useSharedValue(1);
  const opacity = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.7, { duration: 800, easing: Easing.out(Easing.ease) }),
        withTiming(1.0, { duration: 800, easing: Easing.in(Easing.ease) })
      ), -1, false
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 800 }),
        withTiming(1, { duration: 800 })
      ), -1, false
    );
  }, []);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View style={{ width: 14, height: 14, alignItems: "center", justifyContent: "center" }}>
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { borderRadius: 7, backgroundColor: color, opacity: 0.3 },
          ringStyle,
        ]}
      />
      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color }} />
    </View>
  );
}

// ─── Event list row ──────────────────────────────────────────────────────────
function EventListRow({ event, theme, forYou }) {
  const dm    = parseDayMonth(event.date);
  const isFree = event.price === 0 || event.price === "0" || !event.price;
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={animStyle}>
      <Pressable
        onPress={() => router.push(`/event/${event.event_id}`)}
        onPressIn={() => { scale.value = withSpring(0.98, springs.snappy); }}
        onPressOut={() => { scale.value = withSpring(1.00, springs.snappy); }}
        style={({ pressed }) => [
          styles(theme).listRow,
          pressed && { backgroundColor: theme.colors.surfaceMuted },
        ]}
      >
        {/* Thumbnail */}
        <View style={styles(theme).listThumb}>
          {event.profile ? (
            <Image source={{ uri: event.profile }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.colors.surfaceMuted, alignItems: "center", justifyContent: "center" }]}>
              <Text style={{ fontSize: 22 }}>🎉</Text>
            </View>
          )}
          {forYou && (
            <View style={styles(theme).forYouDot} />
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

// ─── Hero featured card ──────────────────────────────────────────────────────
function HeroCard({ event, theme }) {
  const isFree  = event.price === 0 || event.price === "0" || !event.price;
  const scale   = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={[styles(theme).heroWrap, animStyle]}>
      <Pressable
        onPress={() => router.push(`/event/${event.event_id}`)}
        onPressIn={() => { scale.value = withSpring(0.97, springs.smooth); }}
        onPressOut={() => { scale.value = withSpring(1.00, springs.smooth); }}
        style={styles(theme).heroCard}
      >
        {/* Image */}
        {event.profile ? (
          <Image source={{ uri: event.profile }} style={StyleSheet.absoluteFill} resizeMode="cover"
            onError={() => {}} />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.colors.navSurface, alignItems: "center", justifyContent: "center" }]}>
            <Text style={{ fontSize: 56 }}>🎉</Text>
          </View>
        )}

        {/* Gradient overlay */}
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.20)", "rgba(0,0,0,0.78)"]}
          style={StyleSheet.absoluteFill}
          locations={[0.3, 0.55, 1]}
        />

        {/* Top badges */}
        <View style={styles(theme).heroTopRow}>
          {event.isPremium && (
            <View style={styles(theme).premiumBadge}>
              <Text style={styles(theme).premiumBadgeText}>⭐ Premium</Text>
            </View>
          )}
          <Pressable
            style={styles(theme).heartBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="Save event"
          >
            <Heart size={16} color="#fff" />
          </Pressable>
        </View>

        {/* Content */}
        <View style={styles(theme).heroContent}>
          {event.category ? (
            <View style={styles(theme).heroCatBadge}>
              <Text style={styles(theme).heroCatText}>{event.category}</Text>
            </View>
          ) : null}
          <Text style={styles(theme).heroTitle} numberOfLines={2}>{event.name}</Text>
          <View style={styles(theme).heroMeta}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 5, flex: 1 }}>
              <MapPin size={12} color="rgba(255,255,255,0.75)" />
              <Text style={styles(theme).heroLocation} numberOfLines={1}>{event.venue}</Text>
            </View>
            <View style={[
              styles(theme).heroPriceBadge,
              { backgroundColor: isFree ? theme.colors.brand : "rgba(255,255,255,0.18)" },
            ]}>
              <Text style={[
                styles(theme).heroPriceText,
                { color: isFree ? theme.colors.textOnBrand : "#fff" },
              ]}>
                {isFree ? "Free" : `₦${parseInt(event.price || 0).toLocaleString()}`}
              </Text>
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ─── Dashboard screen ────────────────────────────────────────────────────────
export default function DashboardScreen() {
  const { theme } = useTheme();
  const token = useSessionStore((state) => state.userToken);
  const [loading,         setLoading]         = useState(true);
  const [allEvents,       setAllEvents]       = useState([]);
  const [userName,        setUserName]        = useState("Explorer");
  const [userInterests,   setUserInterests]   = useState([]);
  const [keyword,         setKeyword]         = useState("");
  const [activeCategory,  setActiveCategory]  = useState("All");
  const [privateCodeEvent,  setPrivateCodeEvent]  = useState(null);
  const [privateCodeError,  setPrivateCodeError]  = useState("");
  const [fetchingCode,      setFetchingCode]      = useState(false);
  const [userResults,       setUserResults]       = useState([]);
  const [fetchingUsers,     setFetchingUsers]     = useState(false);
  const [userCountry,       setUserCountry]       = useState("");
  const [userUniversity,    setUserUniversity]    = useState("");
  const [filters,           setFilters]           = useState(DEFAULT_FILTERS);
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
            if (data.firstName)  setUserName(data.firstName);
            if (data.interests)  setUserInterests(data.interests);
            if (data.country)    setUserCountry(data.country);
            if (data.university) setUserUniversity(data.university);
          }
        }
        const eventsRes = await fetch(`${API_URL}/event/getallevents`);
        if (eventsRes.ok) setAllEvents(await eventsRes.json());
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

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
          if (res.ok) { setPrivateCodeEvent(await res.json()); setPrivateCodeError(""); }
          else        { setPrivateCodeEvent(null); setPrivateCodeError("No private event found for this code."); }
        } catch { setPrivateCodeError("Failed to look up event code."); }
        finally  { setFetchingCode(false); }
      }, 600);
    } else {
      setPrivateCodeEvent(null);
      setPrivateCodeError("");
    }
    return () => clearTimeout(codeSearchTimeout.current);
  }, [keyword]);

  useEffect(() => {
    const trimmed = keyword.trim();
    if (!USER_SEARCH_REGEX.test(trimmed) || trimmed.length < 2) { setUserResults([]); return; }
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
  const isCodeMode       = PRIVATE_CODE_REGEX.test(keyword.trim().toUpperCase());
  const isUserSearchMode = USER_SEARCH_REGEX.test(keyword.trim()) && keyword.trim().length >= 2;
  const hasActiveFilters = filters.categories.length > 0 ||
    [filters.date, filters.price, filters.sort].some((v, i) => v !== ["all", "all", "soonest"][i]);

  const applyFilters = (events) => events.filter((event) => {
    const kw = keyword.toLowerCase();
    if (kw && !event.name?.toLowerCase().includes(kw) && !event.category?.toLowerCase().includes(kw)) return false;
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
      if (filters.date === "today") { if (!(start >= todayStart && start < new Date(todayStart.getTime() + 86400000))) return false; }
      else if (filters.date === "week") { if (!(start >= todayStart && start < new Date(todayStart.getTime() + 7 * 86400000))) return false; }
      else if (filters.date === "month") { if (!(start >= todayStart && start < new Date(now.getFullYear(), now.getMonth() + 1, 1))) return false; }
    }
    return true;
  });

  const applySorting = (events) => {
    if (filters.sort === "popular")    return [...events].sort((a, b) => (b.attendees?.length || 0) - (a.attendees?.length || 0));
    if (filters.sort === "price_asc")  return [...events].sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
    if (filters.sort === "price_desc") return [...events].sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
    return events;
  };

  const filteredEvents = isCodeMode ? [] : applyFilters(allEvents);
  const matchesInterests = (e) => userInterests.length > 0 && e.category && userInterests.includes(e.category);
  const sortByInterests = (events) => [...events.filter(matchesInterests), ...events.filter((e) => !matchesInterests(e))];

  const premiumEvents   = allEvents.filter((e) => { if (!e.isPremium) return false; const s = parseEventDateTime(e.date, e.time); return !s || now < s; });
  const liveEvents      = filteredEvents.filter((e) => { const s = parseEventDateTime(e.date, e.time); if (!s) return false; return now >= s && now <= new Date(s.getTime() + 3 * 3600000); });
  const upcomingEvents  = filteredEvents.filter((e) => { const s = parseEventDateTime(e.date, e.time); return s ? now < s : false; });
  const trendingEvents  = activeCategory === "Trending" ? [...filteredEvents].sort((a, b) => (b.attendees?.length || 0) - (a.attendees?.length || 0)).slice(0, 10) : [];

  const sortedLive     = applySorting(sortByInterests(liveEvents));
  const sortedUpcoming = applySorting(sortByInterests(upcomingEvents));
  const featured       = premiumEvents[0] || sortedUpcoming[0];
  const S = styles(theme);

  // Loading state — skeleton
  if (loading) {
    return (
      <Screen padded>
        <View style={S.headerRow}>
          <View>
            <View style={{ width: 100, height: 12, borderRadius: radius.xs, backgroundColor: theme.colors.surfaceMuted, marginBottom: 8 }} />
            <View style={{ width: 180, height: 28, borderRadius: radius.sm, backgroundColor: theme.colors.surfaceMuted }} />
          </View>
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: theme.colors.surfaceMuted }} />
        </View>
        <View style={{ width: "100%", height: 52, borderRadius: radius.xxl, backgroundColor: theme.colors.surfaceMuted, marginBottom: 16 }} />
        <SkeletonLoader variant="card" count={1} />
        <View style={{ marginTop: 24 }}>
          <SkeletonLoader variant="row" count={3} style={{ gap: 12 }} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen padded>
      {/* ── Header ── */}
      <View style={S.headerRow}>
        <View style={{ flex: 1, marginRight: 12 }}>
          <Text style={S.greetingLabel}>{getGreeting()},</Text>
          <Text style={S.greetingName} numberOfLines={1}>{userName} 👋</Text>
          {sortedUpcoming.length > 0 && (
            <Text style={S.eventStat}>
              <Text style={{ color: theme.colors.brand, fontWeight: "700" }}>{sortedUpcoming.length}</Text>
              {" upcoming event{sortedUpcoming.length === 1 ? '' : 's'}"}
            </Text>
          )}
        </View>
        <Pressable
          style={S.createBtn}
          onPress={() => router.push("/(app)/eventform")}
          accessibilityLabel="Create event"
        >
          <Plus size={20} color={theme.colors.textOnBrand} strokeWidth={2.5} />
        </Pressable>
      </View>

      {/* ── Search ── */}
      <View style={S.searchRow}>
        <View style={S.searchWrap}>
          <Search size={17} color={theme.colors.textSubtle} />
          <TextInput
            placeholder="Search events, @users, or a private code…"
            placeholderTextColor={theme.colors.textSubtle}
            value={keyword}
            onChangeText={setKeyword}
            style={S.searchInput}
          />
          {keyword.length > 0 && (
            <Pressable
              onPress={() => setKeyword("")}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityLabel="Clear search"
            >
              <X size={16} color={theme.colors.textSubtle} />
            </Pressable>
          )}
        </View>
        <Pressable
          onPress={() => setFilterModalVisible(true)}
          style={[S.filterBtn, hasActiveFilters && { backgroundColor: theme.colors.brand }]}
          accessibilityLabel="Filter events"
        >
          <SlidersHorizontal size={18} color={hasActiveFilters ? theme.colors.textOnBrand : theme.colors.textMuted} />
        </Pressable>
      </View>

      {/* ── Category pills ── */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={S.pillRow}>
        {CATEGORIES.map((cat) => {
          const active = activeCategory === cat;
          return (
            <Pressable
              key={cat}
              style={[S.pill, active && S.pillActive]}
              onPress={() => setActiveCategory(cat)}
            >
              <Text style={[S.pillText, active && S.pillTextActive]}>{cat}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* ── Hero card ── */}
      {!isCodeMode && !isUserSearchMode && featured && (
        <View style={{ marginBottom: spacing.xxl }}>
          <HeroCard event={featured} theme={theme} />
        </View>
      )}

      {/* ── Private code result ── */}
      {isCodeMode && (
        <View style={S.section}>
          <View style={S.sectionHeader}>
            <Lock size={14} color={theme.colors.brand} />
            <Text style={S.sectionTitle}>Private Event</Text>
          </View>
          {fetchingCode && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12 }}>
              <ActivityIndicator size="small" color={theme.colors.brand} />
              <Text style={{ fontSize: 13, color: theme.colors.textSubtle, fontFamily: "PlusJakartaSans_400Regular" }}>Looking up code…</Text>
            </View>
          )}
          {!fetchingCode && privateCodeError ? (
            <Text style={{ fontSize: 13, color: theme.colors.error, fontFamily: "PlusJakartaSans_400Regular" }}>{privateCodeError}</Text>
          ) : null}
          {!fetchingCode && privateCodeEvent ? (
            <EventCard
              title={privateCodeEvent.name} date={privateCodeEvent.date}
              time={privateCodeEvent.time} location={privateCodeEvent.venue}
              imageSrc={privateCodeEvent.profile} eventId={privateCodeEvent.event_id}
              price={privateCodeEvent.price} category={privateCodeEvent.category}
              isPremium={privateCodeEvent.isPremium}
            />
          ) : null}
        </View>
      )}

      {/* ── User search results ── */}
      {isUserSearchMode && (
        <View style={S.section}>
          <View style={S.sectionHeader}>
            <Users size={14} color={theme.colors.brand} />
            <Text style={S.sectionTitle}>People</Text>
          </View>
          {fetchingUsers ? (
            <SkeletonLoader variant="row" count={3} />
          ) : userResults.length === 0 ? (
            <EmptyState emoji="👤" title="No users found" subtitle={`No results for "${keyword.slice(1)}"`} />
          ) : (
            <View style={{ gap: 10 }}>
              {userResults.map((user) => {
                const initials = (user.displayName || user.username || "?").substring(0, 2).toUpperCase();
                return (
                  <Pressable
                    key={user._id || user.user_id || user.username}
                    onPress={() => router.push(`/users/u/${user._id || user.user_id}`)}
                    style={[S.userRow, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                  >
                    {user.avatar ? (
                      <Image source={{ uri: user.avatar }} style={S.userAvatar} />
                    ) : (
                      <View style={[S.userAvatar, { backgroundColor: theme.colors.brandTint, alignItems: "center", justifyContent: "center" }]}>
                        <Text style={{ fontSize: 15, fontWeight: "700", color: theme.colors.brand }}>{initials}</Text>
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={[S.userDisplayName, { color: theme.colors.text }]}>{user.displayName || user.username}</Text>
                      <Text style={[S.userUsername,    { color: theme.colors.textSubtle }]}>@{user.username}</Text>
                      {user.university ? <Text style={{ fontSize: 11, color: theme.colors.textMuted, fontFamily: "PlusJakartaSans_400Regular", marginTop: 2, lineHeight: 15 }}>{user.university}</Text> : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      )}

      {/* ── Trending ── */}
      {!isCodeMode && !isUserSearchMode && activeCategory === "Trending" && (
        <View style={S.section}>
          <View style={S.sectionHeader}>
            <Text style={S.sectionTitle}>Trending Now 🔥</Text>
            <View style={S.countPill}><Text style={S.countPillText}>{trendingEvents.length}</Text></View>
          </View>
          {trendingEvents.length === 0 ? (
            <EmptyState emoji="🔥" title="Nothing trending yet" subtitle="Check back soon!" />
          ) : (
            <View style={{ gap: 10 }}>
              {trendingEvents.map((event) => (
                <EventListRow key={event.event_id} event={event} theme={theme} forYou={matchesInterests(event)} />
              ))}
            </View>
          )}
        </View>
      )}

      {/* ── Premium picks ── */}
      {!isCodeMode && !isUserSearchMode && activeCategory !== "Trending" && activeCategory !== "Near Me" && (
        <View style={S.section}>
          <View style={S.sectionHeader}>
            <Text style={S.sectionTitle}>Premium Picks ⭐</Text>
          </View>
          {premiumEvents.length === 0 ? (
            <EmptyState emoji="⭐" title="No premium events yet" subtitle="They'll show up here when they're live." />
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 4 }}>
              {premiumEvents.map((event) => (
                <View key={event.event_id} style={{ width: 220 }}>
                  <EventCard
                    title={event.name} date={event.date} time={event.time}
                    location={event.venue} imageSrc={event.profile} eventId={event.event_id}
                    price={event.price} category={event.category} isPremium
                  />
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      )}

      {/* ── Live Now ── */}
      {!isCodeMode && !isUserSearchMode && sortedLive.length > 0 && (
        <View style={S.section}>
          <View style={S.sectionHeader}>
            <LivePulse color={theme.colors.error} />
            <Text style={S.sectionTitle}>Live Now</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 4 }}>
            {sortedLive.map((event) => (
              <View key={event.event_id} style={{ width: 220 }}>
                <EventCard
                  title={event.name} date={event.date} time={event.time}
                  location={event.venue} imageSrc={event.profile} eventId={event.event_id}
                  price={event.price} category={event.category} isPremium={event.isPremium}
                />
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* ── Upcoming / filtered list ── */}
      {!isCodeMode && !isUserSearchMode && activeCategory !== "Trending" && (
        <View style={S.section}>
          <View style={S.sectionHeader}>
            <Text style={S.sectionTitle}>
              {activeCategory === "Today"   ? "Today's Events"  :
               activeCategory === "All"    ? "Upcoming Events" :
               activeCategory === "Near Me"? "Near You"        : activeCategory}
            </Text>
            <View style={S.countPill}>
              <Text style={S.countPillText}>{sortedUpcoming.length}</Text>
            </View>
          </View>
          {sortedUpcoming.length === 0 ? (
            <EmptyState
              emoji="🔍"
              title="No events found"
              subtitle={keyword ? "Try a different search term." : "Check back later — events are coming!"}
            />
          ) : (
            <View style={{ gap: 10 }}>
              {sortedUpcoming.map((event) => (
                <EventListRow key={event.event_id} event={event} theme={theme} forYou={matchesInterests(event)} />
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

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = (theme) => StyleSheet.create({
  // Header
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: spacing.xl,
  },
  greetingLabel: {
    fontSize: 14,
    fontWeight: "500",
    fontFamily: "PlusJakartaSans_500Medium",
    color: theme.colors.textMuted,
    lineHeight: 20,
    marginBottom: 2,
  },
  greetingName: {
    fontSize: 30,
    fontWeight: "700",
    fontFamily: "SpaceGrotesk_700Bold",
    color: theme.colors.text,
    letterSpacing: -0.5,
    lineHeight: 36,
  },
  eventStat: {
    fontSize: 13,
    fontFamily: "PlusJakartaSans_500Medium",
    color: theme.colors.textMuted,
    lineHeight: 19,
    marginTop: 4,
  },
  createBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: theme.colors.brand,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
    shadowColor: theme.colors.brand,
    shadowOpacity: 0.30,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },

  // Search
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: spacing.lg,
  },
  searchWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: theme.colors.surface,
    borderRadius: radius.xxl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 16,
    height: 52,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: "PlusJakartaSans_400Regular",
    color: theme.colors.text,
    lineHeight: 20,
  },
  filterBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: theme.colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.colors.border,
    flexShrink: 0,
  },

  // Pills
  pillRow: {
    paddingBottom: spacing.lg,
    gap: 8,
  },
  pill: {
    height: 36,
    paddingHorizontal: 16,
    borderRadius: radius.xxl,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  pillActive: {
    backgroundColor: theme.colors.brand,
    borderColor: theme.colors.brand,
  },
  pillText: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: theme.colors.textMuted,
    lineHeight: 18,
  },
  pillTextActive: {
    color: theme.colors.textOnBrand,
  },

  // Hero card
  heroWrap: { borderRadius: radius.xl, overflow: "hidden" },
  heroCard: {
    height: 260,
    borderRadius: radius.xl,
    overflow: "hidden",
    position: "relative",
  },
  heroTopRow: {
    position: "absolute",
    top: 14,
    left: 14,
    right: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 2,
  },
  premiumBadge: {
    backgroundColor: "rgba(200,230,48,0.22)",
    borderRadius: radius.xxl,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "rgba(200,230,48,0.35)",
  },
  premiumBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.colors.brand,
    fontFamily: "PlusJakartaSans_700Bold",
    lineHeight: 15,
  },
  heartBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroContent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 18,
    zIndex: 2,
  },
  heroCatBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: radius.xxl,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  heroCatText: {
    fontSize: 11,
    fontWeight: "700",
    fontFamily: "PlusJakartaSans_700Bold",
    color: "#fff",
    lineHeight: 15,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: "700",
    fontFamily: "SpaceGrotesk_700Bold",
    color: "#fff",
    letterSpacing: -0.3,
    lineHeight: 28,
    marginBottom: 10,
  },
  heroMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  heroLocation: {
    fontSize: 12,
    color: "rgba(255,255,255,0.75)",
    fontFamily: "PlusJakartaSans_400Regular",
    flex: 1,
    lineHeight: 17,
  },
  heroPriceBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radius.xxl,
  },
  heroPriceText: {
    fontSize: 13,
    fontWeight: "700",
    fontFamily: "PlusJakartaSans_700Bold",
    lineHeight: 17,
  },

  // Sections
  section: { marginBottom: spacing.section },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    fontFamily: "SpaceGrotesk_700Bold",
    color: theme.colors.text,
    letterSpacing: -0.3,
    lineHeight: 26,
    flex: 1,
  },
  countPill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radius.xxl,
    backgroundColor: theme.colors.surfaceMuted,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  countPillText: {
    fontSize: 12,
    fontWeight: "700",
    fontFamily: "PlusJakartaSans_700Bold",
    color: theme.colors.textMuted,
    lineHeight: 17,
  },

  // Event list row
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
  forYouDot: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.brand,
    borderWidth: 1.5,
    borderColor: theme.colors.surface,
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

  // User search
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    overflow: "hidden",
  },
  userDisplayName: {
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "PlusJakartaSans_600SemiBold",
    lineHeight: 20,
  },
  userUsername: {
    fontSize: 13,
    fontFamily: "PlusJakartaSans_400Regular",
    marginTop: 1,
    lineHeight: 18,
  },
});
