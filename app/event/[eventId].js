import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  TouchableOpacity,
  Share,
  Alert,
  Dimensions,
  Linking,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  Share2,
  Ticket,
  Lock,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Info,
  Settings,
  Banknote,
  UserCheck,
  Bookmark,
  BookmarkCheck,
} from "lucide-react-native";
import { toggleBookmark, isBookmarked } from "../../lib/bookmarks.js";
import { scheduleReminder, cancelReminder, getReminderInfo } from "../../lib/reminders.js";
import * as Calendar from "expo-calendar";
import { useTheme } from "../../theme/ThemeProvider.js";
import { API_URL } from "../../lib/config.js";
import { getUserToken } from "../../lib/auth.js";
import { SkeletonLoader } from "../../components/index.js";
import { radius } from "../../theme/tokens.js";
import { ReviewModal } from "../../components/ReviewModal.js";
import { Platform, StatusBar } from "react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const HERO_HEIGHT = SCREEN_HEIGHT * 0.46;
const STATUS_BAR_HEIGHT = Platform.OS === "android" ? StatusBar.currentHeight || 24 : 44;

function formatDate(dateStr) {
  if (!dateStr) return "TBA";
  const parts = dateStr.split("/");
  if (parts.length >= 3) {
    const [day, month, year] = parts;
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${day} ${months[parseInt(month) - 1]} ${year}`;
  }
  return dateStr;
}

function TicketCard({ ticket, onSelect, selected, theme }) {
  const isFree = Number(ticket.price) === 0;
  const isSoldOut = ticket.capacity !== undefined && ticket.sold >= ticket.capacity;

  return (
    <Pressable
      onPress={() => !isSoldOut && onSelect(ticket)}
      disabled={isSoldOut}
      style={[
        styles.ticketCard,
        {
          backgroundColor: selected ? theme.colors.brandTint : theme.colors.surface,
          borderColor: selected ? theme.colors.brand : theme.colors.border,
          opacity: isSoldOut ? 0.4 : 1,
        },
      ]}
    >
      <View style={styles.ticketCardLeft}>
        <Text style={[styles.ticketName, { color: theme.colors.text }]}>{ticket.name}</Text>
        {ticket.description ? (
          <Text style={[styles.ticketDesc, { color: theme.colors.textMuted }]} numberOfLines={2}>
            {ticket.description}
          </Text>
        ) : null}
        {isSoldOut ? (
          <Text style={[styles.soldOutLabel, { color: theme.colors.error }]}>Sold out</Text>
        ) : ticket.capacity !== undefined ? (
          <Text style={[styles.ticketCapacity, { color: theme.colors.textSubtle }]}>
            {ticket.capacity - (ticket.sold || 0)} remaining
          </Text>
        ) : null}
      </View>
      <View style={styles.ticketCardRight}>
        <Text style={[styles.ticketPrice, { color: isFree ? theme.colors.brand : theme.colors.text }]}>
          {isFree ? "Free" : `₦${parseInt(ticket.price).toLocaleString()}`}
        </Text>
        {selected && <CheckCircle size={18} color={theme.colors.brand} style={{ marginTop: 6 }} />}
      </View>
    </Pressable>
  );
}

export default function EventDetailScreen() {
  const { eventId } = useLocalSearchParams();
  const router = useRouter();
  const { theme } = useTheme();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [waitlistLoading, setWaitlistLoading] = useState(false);
  const [waitlistPosition, setWaitlistPosition] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [avgRating, setAvgRating] = useState(null);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [reminderSet, setReminderSet] = useState(false);
  const [reminderLoading, setReminderLoading] = useState(false);
  const [calendarAdded, setCalendarAdded] = useState(false);

  const fetchEvent = useCallback(async () => {
    try {
      const token = await getUserToken();
      setUserId(token);

      const res = await fetch(`${API_URL}/event/getevent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event_id: eventId }),
      });

      if (res.ok) {
        const data = await res.json();
        setEvent(data);
        if (data.ticketTypes?.length > 0) {
          setSelectedTicket(data.ticketTypes[0]);
        }
        if (data.feedback?.length > 0) {
          setReviews(data.feedback.slice(0, 3));
          const avg = data.feedback.reduce((s, f) => s + (f.rating || 0), 0) / data.feedback.length;
          setAvgRating(avg.toFixed(1));
        }
      }
    } catch (e) {
      console.error("Error fetching event:", e);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    if (eventId) {
      fetchEvent();
      isBookmarked(eventId).then(setBookmarked);
      getReminderInfo(eventId).then((info) => setReminderSet(!!info));
    }
  }, [eventId]);

  const handleShare = async () => {
    if (!event) return;
    try {
      await Share.share({
        message: `${event.name}\n${event.date} at ${event.time}\n${event.venue}`,
        title: event.name,
      });
    } catch (e) {}
  };

  const handleRegister = () => {
    if (!userId) {
      router.push("/(auth)/signin");
      return;
    }
    if (!selectedTicket) {
      Alert.alert("Select a ticket", "Please select a ticket type to continue.");
      return;
    }
    if (Number(selectedTicket.price) === 0) {
      router.push(`/event/${eventId}/registration`);
    } else {
      router.push(`/event/${eventId}/payment`);
    }
  };

  const handleJoinWaitlist = async () => {
    if (!userId) { router.push("/(auth)/signin"); return; }
    setWaitlistLoading(true);
    try {
      const token = await getUserToken();
      const res = await fetch(`${API_URL}/event/waitlist/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ event_id: eventId, user_token: token }),
      });
      const data = await res.json();
      if (res.ok) {
        setWaitlistPosition(data.position || null);
        fetchEvent();
      } else {
        Alert.alert("Waitlist", data.msg || "Could not join waitlist. Try again.");
      }
    } catch {
      Alert.alert("Error", "Network error. Please try again.");
    } finally {
      setWaitlistLoading(false);
    }
  };

  if (loading) return (
    <View style={{ flex: 1, backgroundColor: theme?.colors?.background || "#FAF9F0" }}>
      <SkeletonLoader variant="card" count={1} style={{ height: HERO_HEIGHT, borderRadius: 0, margin: 0 }} />
      <View style={{ padding: 16, gap: 14 }}>
        <SkeletonLoader variant="text" count={2} />
        <SkeletonLoader variant="row"  count={3} />
      </View>
    </View>
  );

  if (!event) {
    return (
      <View style={[styles.errorScreen, { backgroundColor: theme.colors.background }]}>
        <AlertCircle size={48} color={theme.colors.error} />
        <Text style={[styles.errorTitle, { color: theme.colors.text }]}>Event Not Found</Text>
        <Text style={[styles.errorSub, { color: theme.colors.textMuted }]}>
          This event may have been removed or is no longer available.
        </Text>
        <Pressable
          style={[styles.backBtn, { backgroundColor: theme.colors.brand }]}
          onPress={() => router.back()}
        >
          <Text style={styles.backBtnText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const isRegistered = event.participants?.some((p) => p.id === userId);
  const isWaitlisted = event.waitlist?.some((p) => p.userId === userId);
  const isFull =
    event.capacity && event.participants && event.participants.length >= event.capacity;
  const isOwner = event.creatorToken === userId || event.adminId === userId;
  const hasEnded = event.ended === true;

  const minimumPrice = event.ticketTypes?.length > 0
    ? Math.min(...event.ticketTypes.map((t) => Number(t.price) || 0))
    : Number(event.price) || 0;

  const displayPrice = minimumPrice === 0 ? "Free" : `₦${minimumPrice.toLocaleString()}`;

  const getCtaLabel = () => {
    if (hasEnded) return "Event Ended";
    if (isOwner) return "Manage Event";
    if (isRegistered) return "Registered";
    if (isWaitlisted) return "On Waitlist";
    if (isFull && event.waitlistEnabled) return "Join Waitlist";
    if (isFull) return "Sold Out";
    return minimumPrice === 0 ? "Register Free" : "Get Tickets";
  };

  const ctaLabel = getCtaLabel();
  const ctaDisabled = hasEnded || isRegistered || isWaitlisted || (isFull && !event.waitlistEnabled);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={[styles.hero, { height: HERO_HEIGHT }]}>
          {event.cover ? (
            <Image source={{ uri: event.cover }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
          ) : (
            <View style={[StyleSheet.absoluteFillObject, { backgroundColor: "#1C1C18" }]} />
          )}
          <LinearGradient
            colors={["rgba(0,0,0,0.1)", "rgba(0,0,0,0.5)", "rgba(0,0,0,0.88)"]}
            locations={[0, 0.5, 1]}
            style={StyleSheet.absoluteFillObject}
          />

          {/* Back + Share row */}
          <View style={[styles.heroTopRow, { paddingTop: STATUS_BAR_HEIGHT + 12 }]}>
            <Pressable
              onPress={() => router.back()}
              style={styles.heroPill}
              hitSlop={8}
            >
              <ArrowLeft size={18} color="white" />
              <Text style={styles.heroPillText}>Back</Text>
            </Pressable>
            <View style={styles.heroTopRight}>
              {isOwner && (
                <Pressable
                  onPress={() => router.push(`/event/${eventId}/manage`)}
                  style={styles.heroPill}
                >
                  <Settings size={16} color="white" />
                </Pressable>
              )}
              <Pressable
                onPress={async () => {
                  const next = await toggleBookmark(eventId);
                  setBookmarked(next);
                }}
                style={styles.heroPill}
              >
                {bookmarked
                  ? <BookmarkCheck size={16} color={theme.colors.brand} />
                  : <Bookmark size={16} color="white" />}
              </Pressable>
              <Pressable onPress={handleShare} style={styles.heroPill}>
                <Share2 size={16} color="white" />
              </Pressable>
            </View>
          </View>

          {/* Hero bottom content */}
          <View style={styles.heroBottom}>
            <View style={styles.heroBadgeRow}>
              {event.category && (
                <View style={styles.heroBadge}>
                  <Text style={styles.heroBadgeText}>{event.category.toUpperCase()}</Text>
                </View>
              )}
              {event.visibility === "private" && (
                <View style={[styles.heroBadge, { backgroundColor: "rgba(200,230,48,0.2)", borderColor: "rgba(200,230,48,0.4)" }]}>
                  <Lock size={10} color="#C8E630" />
                  <Text style={[styles.heroBadgeText, { color: "#C8E630" }]}>PRIVATE</Text>
                </View>
              )}
              {isFull && (
                <View style={[styles.heroBadge, { backgroundColor: "rgba(220,38,38,0.3)", borderColor: "rgba(220,38,38,0.5)" }]}>
                  <Text style={[styles.heroBadgeText, { color: "#fca5a5" }]}>SOLD OUT</Text>
                </View>
              )}
            </View>

            <Text style={styles.heroTitle} numberOfLines={3}>{event.name}</Text>

            <View style={styles.heroMetaRow}>
              <View style={styles.heroMetaItem}>
                <Calendar size={14} color="rgba(255,255,255,0.75)" />
                <Text style={styles.heroMetaText}>{formatDate(event.date)}</Text>
              </View>
              {event.time && (
                <View style={styles.heroMetaItem}>
                  <Clock size={14} color="rgba(255,255,255,0.75)" />
                  <Text style={styles.heroMetaText}>{event.time}</Text>
                </View>
              )}
              <View style={styles.heroMetaItem}>
                <Users size={14} color="rgba(255,255,255,0.75)" />
                <Text style={styles.heroMetaText}>
                  {event.participants?.length || 0} attending
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Organizer */}
          {event.organizer && (
            <Pressable
              style={[styles.organizerRow, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
              onPress={() => event.creatorId && router.push(`/users/u/${event.creatorId}`)}
            >
              {event.organizerAvatar ? (
                <Image source={{ uri: event.organizerAvatar }} style={styles.organizerAvatar} />
              ) : (
                <View style={[styles.organizerAvatar, { backgroundColor: theme.colors.brandTint }]}>
                  <Text style={[styles.organizerAvatarText, { color: theme.colors.brand }]}>
                    {event.organizer.substring(0, 2).toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={[styles.organizerLabel, { color: theme.colors.textSubtle }]}>Organized by</Text>
                <Text style={[styles.organizerName, { color: theme.colors.text }]}>{event.organizer}</Text>
              </View>
              <ChevronRight size={16} color={theme.colors.textSubtle} />
            </Pressable>
          )}

          {/* Location card */}
          <View style={[styles.infoCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <View style={styles.infoRow}>
              <View style={[styles.infoIcon, { backgroundColor: theme.colors.brandTint }]}>
                <MapPin size={18} color={theme.colors.brand} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.infoLabel, { color: theme.colors.textSubtle }]}>Location</Text>
                <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                  {event.hideLocation && !isRegistered ? "Location revealed after registration" : event.venue || "TBA"}
                </Text>
                {event.address && isRegistered && (
                  <Text style={[styles.infoSub, { color: theme.colors.textMuted }]}>{event.address}</Text>
                )}
              </View>
            </View>
          </View>

          {/* Description */}
          {event.description && (
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: theme.colors.textSubtle }]}>ABOUT</Text>
              <Text style={[styles.descText, { color: theme.colors.textMuted }]}>{event.description}</Text>
            </View>
          )}

          {/* Tickets */}
          {event.ticketTypes?.length > 0 ? (
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: theme.colors.textSubtle }]}>TICKETS</Text>
              <View style={styles.ticketList}>
                {event.ticketTypes.map((t, i) => (
                  <TicketCard
                    key={i}
                    ticket={t}
                    selected={selectedTicket?.name === t.name}
                    onSelect={setSelectedTicket}
                    theme={theme}
                  />
                ))}
              </View>
            </View>
          ) : (
            <View style={[styles.infoCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <View style={styles.infoRow}>
                <View style={[styles.infoIcon, { backgroundColor: theme.colors.brandTint }]}>
                  <Ticket size={18} color={theme.colors.brand} />
                </View>
                <View>
                  <Text style={[styles.infoLabel, { color: theme.colors.textSubtle }]}>Admission</Text>
                  <Text style={[styles.infoValue, { color: theme.colors.text }]}>{displayPrice}</Text>
                </View>
              </View>
            </View>
          )}

          {/* Approval notice */}
          {event.requiresApproval && !isRegistered && (
            <View style={[styles.noticeCard, { backgroundColor: "rgba(245,158,11,0.1)", borderColor: "rgba(245,158,11,0.3)" }]}>
              <UserCheck size={16} color="#f59e0b" />
              <Text style={[styles.noticeText, { color: "#f59e0b" }]}>
                This event requires host approval. You may be added to a waitlist pending review.
              </Text>
            </View>
          )}

          {/* Already registered notice */}
          {isRegistered && (
            <View style={[styles.noticeCard, { backgroundColor: "rgba(61,158,74,0.12)", borderColor: "rgba(61,158,74,0.3)" }]}>
              <CheckCircle size={16} color=theme.colors.success />
              <Text style={[styles.noticeText, { color: theme.colors.success }]}>
                You're registered for this event!
              </Text>
            </View>
          )}

          {/* Remind Me — for registered, upcoming events */}
          {isRegistered && !hasEnded && (
            <Pressable
              onPress={async () => {
                if (reminderSet) {
                  await cancelReminder(eventId);
                  setReminderSet(false);
                  return;
                }
                Alert.alert(
                  "Set Reminder",
                  "When would you like to be reminded?",
                  [
                    { text: "15 min before", onPress: async () => {
                      setReminderLoading(true);
                      const r = await scheduleReminder(eventId, event.name, event.date, event.time, 15);
                      setReminderSet(r.ok);
                      setReminderLoading(false);
                      if (!r.ok) Alert.alert("Reminder", r.reason === "permission_denied" ? "Please allow notifications in settings." : "Could not set reminder.");
                    }},
                    { text: "1 hour before", onPress: async () => {
                      setReminderLoading(true);
                      const r = await scheduleReminder(eventId, event.name, event.date, event.time, 60);
                      setReminderSet(r.ok);
                      setReminderLoading(false);
                      if (!r.ok) Alert.alert("Reminder", "Could not set reminder.");
                    }},
                    { text: "1 day before", onPress: async () => {
                      setReminderLoading(true);
                      const r = await scheduleReminder(eventId, event.name, event.date, event.time, 1440);
                      setReminderSet(r.ok);
                      setReminderLoading(false);
                      if (!r.ok) Alert.alert("Reminder", "Could not set reminder.");
                    }},
                    { text: "Cancel", style: "cancel" },
                  ]
                );
              }}
              style={[styles.remindBtn, {
                backgroundColor: reminderSet ? "rgba(99,102,241,0.1)" : theme.colors.surfaceMuted,
                borderColor: reminderSet ? "#6366f1" : theme.colors.border,
              }]}
            >
              {reminderLoading
                ? <ActivityIndicator size="small" color="#6366f1" />
                : <Text style={{ fontSize: 14 }}>{reminderSet ? "🔔" : "🔕"}</Text>}
              <Text style={[styles.remindBtnText, { color: reminderSet ? "#6366f1" : theme.colors.textMuted }]}>
                {reminderSet ? "Reminder set · Tap to cancel" : "Set Reminder"}
              </Text>
            </Pressable>
          )}

          {/* Add to Calendar */}
          {isRegistered && (
            <Pressable
              onPress={async () => {
                try {
                  const { status } = await Calendar.requestCalendarPermissionsAsync();
                  if (status !== "granted") { Alert.alert("Permission required", "Please allow calendar access in settings."); return; }
                  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
                  const defaultCal = calendars.find((c) => c.allowsModifications && c.isPrimary) || calendars.find((c) => c.allowsModifications);
                  if (!defaultCal) { Alert.alert("No calendar found"); return; }

                  // Parse event date+time
                  let startDate = new Date();
                  if (event.date) {
                    const parts = event.date.split("/");
                    if (parts.length === 3) {
                      const [day, month, year] = parts;
                      startDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                    }
                  }
                  if (event.time) {
                    const timeParts = event.time.split(":");
                    if (timeParts.length >= 2) {
                      startDate.setHours(parseInt(timeParts[0]), parseInt(timeParts[1]), 0);
                    }
                  }
                  const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);

                  await Calendar.createEventAsync(defaultCal.id, {
                    title: event.name || "UniHub Event",
                    startDate,
                    endDate,
                    location: event.venue || event.location || "",
                    notes: event.description || "",
                  });
                  setCalendarAdded(true);
                  Alert.alert("Added!", "Event added to your calendar.");
                } catch (e) {
                  Alert.alert("Error", "Could not add to calendar.");
                }
              }}
              style={[styles.remindBtn, {
                backgroundColor: calendarAdded ? "rgba(61,158,74,0.1)" : theme.colors.surfaceMuted,
                borderColor: calendarAdded ? theme.colors.success : theme.colors.border,
              }]}
            >
              <Calendar size={16} color={calendarAdded ? theme.colors.success : theme.colors.textMuted} />
              <Text style={[styles.remindBtnText, { color: calendarAdded ? theme.colors.success : theme.colors.textMuted }]}>
                {calendarAdded ? "Added to Calendar" : "Add to Calendar"}
              </Text>
            </Pressable>
          )}

          {/* Waitlisted notice */}
          {isWaitlisted && (
            <View style={[styles.noticeCard, { backgroundColor: "rgba(245,158,11,0.1)", borderColor: "rgba(245,158,11,0.35)" }]}>
              <Info size={16} color="#f59e0b" />
              <Text style={[styles.noticeText, { color: "#f59e0b" }]}>
                {waitlistPosition
                  ? `You're #${waitlistPosition} on the waitlist. We'll notify you when a spot opens.`
                  : "You're on the waitlist. We'll notify you when a spot opens."}
              </Text>
            </View>
          )}

          {/* Attendee social proof */}
          {(event.participants?.length || 0) > 0 && (
            <View style={[styles.noticeCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <Users size={16} color={theme.colors.brand} />
              <Text style={[styles.noticeText, { color: theme.colors.textMuted }]}>
                <Text style={{ color: theme.colors.text, fontFamily: "PlusJakartaSans_700Bold" }}>{event.participants.length}</Text> {event.participants.length === 1 ? "person is" : "people are"} attending
              </Text>
            </View>
          )}

          {/* Leave a Review CTA — for registered users on ended events */}
          {isRegistered && hasEnded && (
            <View style={styles.section}>
              <Pressable
                onPress={() => setReviewModalVisible(true)}
                style={[styles.reviewCtaBtn, { backgroundColor: theme.colors.brandTint, borderColor: theme.colors.brand }]}
              >
                <Text style={[styles.reviewCtaIcon]}>★</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.reviewCtaTitle, { color: theme.colors.text }]}>Leave a Review</Text>
                  <Text style={[styles.reviewCtaSub, { color: theme.colors.textMuted }]}>Share your experience at this event</Text>
                </View>
                <ChevronRight size={18} color={theme.colors.brand} />
              </Pressable>
            </View>
          )}

          {/* Reviews summary */}
          {avgRating && (
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: theme.colors.textSubtle }]}>REVIEWS</Text>
              <View style={[styles.reviewSummary, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <Text style={[styles.reviewAvg, { color: theme.colors.text }]}>{avgRating}</Text>
                <Text style={[styles.reviewStars, { color: "#F59E0B" }]}>{"★".repeat(Math.round(parseFloat(avgRating)))}{"☆".repeat(5 - Math.round(parseFloat(avgRating)))}</Text>
                <Text style={[styles.reviewCount, { color: theme.colors.textMuted }]}>{event.feedback?.length || 0} review{(event.feedback?.length || 0) !== 1 ? "s" : ""}</Text>
              </View>
              {reviews.map((r, i) => (
                <View key={i} style={[styles.reviewCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                  <View style={styles.reviewCardTop}>
                    <Text style={[styles.reviewCardStars, { color: "#F59E0B" }]}>{"★".repeat(r.rating || 0)}</Text>
                    <Text style={[styles.reviewCardDate, { color: theme.colors.textSubtle }]}>
                      {r.createdAt ? new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""}
                    </Text>
                  </View>
                  {r.comment ? <Text style={[styles.reviewCardText, { color: theme.colors.textMuted }]}>{r.comment}</Text> : null}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <ReviewModal
        visible={reviewModalVisible}
        onClose={() => setReviewModalVisible(false)}
        onSuccess={() => fetchEvent()}
        eventId={eventId}
      />

      {/* Bottom CTA */}
      <View style={[styles.cta, { backgroundColor: theme.colors.background, borderTopColor: theme.colors.border }]}>
        <View style={styles.ctaLeft}>
          <Text style={[styles.ctaPrice, { color: theme.colors.brand }]}>{displayPrice}</Text>
          <Text style={[styles.ctaPriceSub, { color: theme.colors.textSubtle }]}>per ticket</Text>
        </View>
        <Pressable
          style={[
            styles.ctaBtn,
            { backgroundColor: ctaDisabled ? theme.colors.surfaceMuted : theme.colors.brand, opacity: waitlistLoading ? 0.75 : 1 },
          ]}
          onPress={
            isOwner
              ? () => router.push(`/event/${eventId}/manage`)
              : isFull && event.waitlistEnabled && !isWaitlisted
              ? handleJoinWaitlist
              : handleRegister
          }
          disabled={(ctaDisabled && !isOwner) || waitlistLoading}
        >
          {waitlistLoading ? (
            <ActivityIndicator size="small" color={theme.colors.textOnBrand} />
          ) : isOwner ? (
            <Settings size={18} color={theme.colors.textOnBrand} />
          ) : isRegistered || isWaitlisted ? (
            <CheckCircle size={18} color={ctaDisabled ? theme.colors.textSubtle : theme.colors.textOnBrand} />
          ) : (
            <Ticket size={18} color={ctaDisabled ? theme.colors.textSubtle : theme.colors.textOnBrand} />
          )}
          <Text style={[styles.ctaBtnText, { color: ctaDisabled ? theme.colors.textSubtle : theme.colors.textOnBrand }]}>
            {waitlistLoading ? "Joining…" : ctaLabel}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  errorScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 12,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: "800",
    fontFamily: "SpaceGrotesk_700Bold",
    marginTop: 8,
  },
  errorSub: {
    fontSize: 14,
    fontFamily: "PlusJakartaSans_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
  backBtn: {
    marginTop: 12,
    paddingHorizontal: 28,
    paddingVertical: 13,
    borderRadius: radius.xxl,
  },
  backBtnText: {
    fontSize: 15,
    fontWeight: "700",
    fontFamily: "PlusJakartaSans_700Bold",
    color: "#1A1A14",
  },
  hero: {
    position: "relative",
    overflow: "hidden",
  },
  heroTopRow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    zIndex: 10,
  },
  heroTopRight: {
    flexDirection: "row",
    gap: 8,
  },
  heroPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.38)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    borderRadius: 100,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  heroPillText: {
    fontSize: 13,
    fontWeight: "700",
    fontFamily: "PlusJakartaSans_700Bold",
    color: "white",
  },
  heroBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 24,
    zIndex: 10,
  },
  heroBadgeRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
    flexWrap: "wrap",
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.44)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  heroBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    fontFamily: "PlusJakartaSans_700Bold",
    color: "rgba(255,255,255,0.9)",
    letterSpacing: 1,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "900",
    fontFamily: "SpaceGrotesk_700Bold",
    color: "white",
    lineHeight: 34,
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  heroMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
  },
  heroMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  heroMetaText: {
    fontSize: 12,
    fontFamily: "PlusJakartaSans_500Medium",
    color: "rgba(255,255,255,0.82)",
  },
  content: {
    padding: 16,
    gap: 14,
  },
  organizerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  organizerAvatar: {
    width: 46,
    height: 46,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  organizerAvatarText: {
    fontSize: 16,
    fontWeight: "800",
    fontFamily: "SpaceGrotesk_700Bold",
  },
  organizerLabel: {
    fontSize: 11,
    fontFamily: "PlusJakartaSans_400Regular",
    marginBottom: 2,
  },
  organizerName: {
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "PlusJakartaSans_600SemiBold",
  },
  infoCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: 16,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  infoIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  infoLabel: {
    fontSize: 11,
    fontFamily: "PlusJakartaSans_500Medium",
    marginBottom: 3,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "PlusJakartaSans_600SemiBold",
    lineHeight: 21,
  },
  infoSub: {
    fontSize: 12,
    fontFamily: "PlusJakartaSans_400Regular",
    marginTop: 2,
    lineHeight: 17,
  },
  section: {
    gap: 12,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "800",
    fontFamily: "PlusJakartaSans_700Bold",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  descText: {
    fontSize: 14,
    fontFamily: "PlusJakartaSans_400Regular",
    lineHeight: 22,
  },
  ticketList: {
    gap: 10,
  },
  ticketCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    gap: 12,
  },
  ticketCardLeft: {
    flex: 1,
    gap: 4,
  },
  ticketCardRight: {
    alignItems: "flex-end",
  },
  ticketName: {
    fontSize: 15,
    fontWeight: "700",
    fontFamily: "PlusJakartaSans_700Bold",
  },
  ticketDesc: {
    fontSize: 12,
    fontFamily: "PlusJakartaSans_400Regular",
    lineHeight: 17,
  },
  ticketCapacity: {
    fontSize: 11,
    fontFamily: "PlusJakartaSans_500Medium",
    marginTop: 2,
  },
  soldOutLabel: {
    fontSize: 11,
    fontWeight: "700",
    fontFamily: "PlusJakartaSans_700Bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  ticketPrice: {
    fontSize: 18,
    fontWeight: "800",
    fontFamily: "SpaceGrotesk_700Bold",
  },
  noticeCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 14,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  noticeText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "PlusJakartaSans_500Medium",
    lineHeight: 19,
  },
  cta: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingBottom: Platform.OS === "ios" ? 28 : 14,
    borderTopWidth: 1,
  },
  ctaLeft: {
    gap: 2,
  },
  ctaPrice: {
    fontSize: 22,
    fontWeight: "800",
    fontFamily: "SpaceGrotesk_700Bold",
    letterSpacing: -0.3,
  },
  ctaPriceSub: {
    fontSize: 12,
    fontFamily: "PlusJakartaSans_400Regular",
  },
  ctaBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 26,
    paddingVertical: 15,
    borderRadius: radius.xxl,
  },
  ctaBtnText: {
    fontSize: 15,
    fontWeight: "700",
    fontFamily: "PlusJakartaSans_700Bold",
  },
  remindBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  remindBtnText: {
    fontSize: 13,
    fontFamily: "PlusJakartaSans_500Medium",
    fontWeight: "500",
  },
  reviewCtaBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  reviewCtaIcon: {
    fontSize: 24,
    color: "#F59E0B",
  },
  reviewCtaTitle: {
    fontSize: 15,
    fontWeight: "700",
    fontFamily: "PlusJakartaSans_700Bold",
  },
  reviewCtaSub: {
    fontSize: 12,
    fontFamily: "PlusJakartaSans_400Regular",
    marginTop: 2,
  },
  reviewSummary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  reviewAvg: {
    fontSize: 22,
    fontWeight: "900",
    fontFamily: "SpaceGrotesk_700Bold",
  },
  reviewStars: {
    fontSize: 16,
    letterSpacing: 2,
  },
  reviewCount: {
    fontSize: 13,
    fontFamily: "PlusJakartaSans_400Regular",
    marginLeft: 2,
  },
  reviewCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
  },
  reviewCardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  reviewCardStars: {
    fontSize: 14,
    letterSpacing: 1,
  },
  reviewCardDate: {
    fontSize: 12,
    fontFamily: "PlusJakartaSans_400Regular",
  },
  reviewCardText: {
    fontSize: 13,
    fontFamily: "PlusJakartaSans_400Regular",
    lineHeight: 19,
  },
});
