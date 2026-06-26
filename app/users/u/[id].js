import React, { useEffect, useState } from "react";
import {
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
  Pressable,
  Linking,
  Alert,
  TextInput,
  TouchableOpacity,
} from "react-native";
import {
  User,
  MapPin,
  Link as LinkIcon,
  Calendar,
  Clock,
  AlertCircle,
  MoreVertical,
  GraduationCap,
  Users,
  Zap,
  Trash2,
  Send,
} from "lucide-react-native";
import { Screen, BackButton, NeuCard, PrimaryButton } from "../../../components";
import { useTheme } from "../../../theme/ThemeProvider";
import { getUserToken } from "../../../lib/auth";
import { API_URL } from "../../../lib/config";
import { ReportModal } from "../../../components/ReportModal";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { radius, spacing } from "../../../theme/tokens";

const BLOCKED_KEY = "unihub_blocked_users";

function SectionHeader({ title, icon: Icon, color, theme }) {
  return (
    <View style={[sectionStyles.header]}>
      <View style={[sectionStyles.iconWrap, { backgroundColor: color + "22" }]}>
        <Icon size={14} color={color} />
      </View>
      <Text style={[sectionStyles.title, { color: theme.colors.textSubtle }]}>
        {title}
      </Text>
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  iconWrap: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    fontFamily: "PlusJakartaSans_700Bold",
  },
});

export default function PublicProfileScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { theme } = useTheme();

  const [profile, setProfile] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [localTime, setLocalTime] = useState("");
  const [reportVisible, setReportVisible] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`${API_URL}/social/profile/${id}`);
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      }
    } catch (e) {
      console.error("Error fetching profile:", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const token = await getUserToken();
      if (!token) return;
      const res = await fetch(`${API_URL}/user/details`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_token: token }),
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (id) {
      fetchProfile();
      fetchCurrentUser();
      AsyncStorage.getItem(BLOCKED_KEY).then((raw) => {
        const list = raw ? JSON.parse(raw) : [];
        setIsBlocked(list.includes(id));
      });
    }
  }, [id]);

  const handleBlockUser = async () => {
    const raw = await AsyncStorage.getItem(BLOCKED_KEY);
    const list = raw ? JSON.parse(raw) : [];
    if (isBlocked) {
      const updated = list.filter((uid) => uid !== id);
      await AsyncStorage.setItem(BLOCKED_KEY, JSON.stringify(updated));
      setIsBlocked(false);
      Alert.alert("Unblocked", `You have unblocked @${profile?.username}.`);
    } else {
      await AsyncStorage.setItem(BLOCKED_KEY, JSON.stringify([...list, id]));
      setIsBlocked(true);
      Alert.alert("Blocked", `@${profile?.username} has been blocked.`);
    }
  };

  const handleMoreMenu = () => {
    Alert.alert(
      profile?.username ? `@${profile.username}` : "Options",
      "",
      [
        { text: isBlocked ? "Unblock User" : "Block User", onPress: handleBlockUser },
        { text: "Report User", style: "destructive", onPress: () => setReportVisible(true) },
        { text: "Cancel", style: "cancel" },
      ]
    );
  };

  useEffect(() => {
    if (!profile?.timezone) return;
    const updateTime = () => {
      try {
        const time = new Date().toLocaleTimeString("en-US", {
          timeZone: profile.timezone,
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });
        setLocalTime(time);
      } catch (e) {
        console.error("Invalid timezone", e);
      }
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, [profile?.timezone]);

  const handleFollowToggle = async () => {
    if (!profile || !currentUser) return;
    const isFollowing = currentUser?.following?.includes(profile._id);
    const endpoint = isFollowing ? "/social/unfollow" : "/social/follow";
    try {
      const token = await getUserToken();
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ targetUserId: profile._id, user_token: token }),
      });
      if (res.ok) {
        setProfile((prev) => ({
          ...prev,
          followersCount: isFollowing
            ? Math.max(0, (prev.followersCount || 0) - 1)
            : (prev.followersCount || 0) + 1,
        }));
        setCurrentUser((prev) => {
          const updatedFollowing = isFollowing
            ? (prev.following || []).filter((fid) => fid !== profile._id)
            : [...(prev.following || []), profile._id];
          return { ...prev, following: updatedFollowing };
        });
      }
    } catch (e) {
      console.error("Error following/unfollowing user:", e);
    }
  };

  if (loading) {
    return (
      <Screen scrollable={false}>
        <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
          <ActivityIndicator size="large" color={theme.colors.brand} />
        </View>
      </Screen>
    );
  }

  if (!profile) {
    return (
      <Screen scrollable={false}>
        <View style={[styles.center, { backgroundColor: theme.colors.background, padding: 24 }]}>
          <AlertCircle size={48} color={theme.colors.error} style={{ marginBottom: 16 }} />
          <Text style={[styles.errorTitle, { color: theme.colors.text }]}>Profile Not Found</Text>
          <Text style={[styles.errorText, { color: theme.colors.textMuted }]}>
            The user profile you are looking for does not exist or has been removed.
          </Text>
          <PrimaryButton label="Go Back" onPress={() => router.back()} style={{ marginTop: 24 }} />
        </View>
      </Screen>
    );
  }

  const isFollowing = currentUser?.following?.includes(profile._id);
  const isMe = currentUser?._id === profile._id;
  const attendedEvents = profile.registeredEvents || [];
  const communities = profile.communitiesJoined || [];
  const updates = profile.updates || [];

  return (
    <Screen padded={false}>
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <View style={styles.header}>
          <BackButton label="Back" />
          {!isMe && (
            <Pressable onPress={handleMoreMenu} hitSlop={8} style={styles.moreBtn}>
              <MoreVertical size={20} color={theme.colors.textSubtle} />
            </Pressable>
          )}
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* ── PROFILE CARD ─────────────────────────────── */}
          <NeuCard style={[styles.profileCard, { backgroundColor: theme.colors.surface }]}>
            <View style={[styles.banner, { backgroundColor: theme.colors.surfaceElevated }]} />

            <View style={styles.avatarContainer}>
              <View style={[styles.avatar, { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.surface }]}>
                {profile.avatar ? (
                  <Image source={{ uri: profile.avatar }} style={styles.avatarImg} />
                ) : (
                  <Text style={[styles.avatarText, { color: theme.colors.brand }]}>
                    {profile.username?.substring(0, 2).toUpperCase()}
                  </Text>
                )}
              </View>
            </View>

            <View style={styles.infoSection}>
              <Text style={[styles.name, { color: theme.colors.text }]}>
                {profile.displayName || profile.name || profile.username}
              </Text>
              <Text style={[styles.username, { color: theme.colors.textSubtle }]}>
                @{profile.username}
              </Text>

              {profile.bio ? (
                <Text style={[styles.bio, { color: theme.colors.textMuted }]}>{profile.bio}</Text>
              ) : null}

              {/* Meta details */}
              <View style={styles.metaList}>
                {profile.university ? (
                  <View style={styles.metaItem}>
                    <GraduationCap size={16} color={theme.colors.brand} />
                    <Text style={[styles.metaLabel, { color: theme.colors.text, fontFamily: "PlusJakartaSans_600SemiBold" }]}>
                      {profile.university}
                    </Text>
                  </View>
                ) : null}

                {profile.location ? (
                  <View style={styles.metaItem}>
                    <MapPin size={16} color={theme.colors.textSubtle} />
                    <Text style={[styles.metaLabel, { color: theme.colors.textMuted }]}>{profile.location}</Text>
                  </View>
                ) : null}

                {profile.website ? (
                  <Pressable style={styles.metaItem} onPress={() => Linking.openURL(profile.website)}>
                    <LinkIcon size={16} color={theme.colors.brand} />
                    <Text style={[styles.metaLabel, { color: theme.colors.brand }]} numberOfLines={1}>
                      {profile.website}
                    </Text>
                  </Pressable>
                ) : null}

                {profile.createdAt ? (
                  <View style={styles.metaItem}>
                    <Calendar size={16} color={theme.colors.textSubtle} />
                    <Text style={[styles.metaLabel, { color: theme.colors.textMuted }]}>
                      Joined {new Date(profile.createdAt).toLocaleDateString([], { month: "long", year: "numeric" })}
                    </Text>
                  </View>
                ) : null}

                {localTime ? (
                  <View style={styles.metaItem}>
                    <Clock size={16} color={theme.colors.textSubtle} />
                    <Text style={[styles.metaLabel, { color: theme.colors.textMuted }]}>
                      Local time: {localTime}
                    </Text>
                  </View>
                ) : null}
              </View>

              {/* Stats */}
              <View style={[styles.statsRow, { borderTopColor: theme.colors.border, borderBottomColor: theme.colors.border }]}>
                <View style={styles.statCell}>
                  <Text style={[styles.statValue, { color: theme.colors.text }]}>{profile.followersCount || 0}</Text>
                  <Text style={[styles.statName, { color: theme.colors.textSubtle }]}>Followers</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: theme.colors.border }]} />
                <View style={styles.statCell}>
                  <Text style={[styles.statValue, { color: theme.colors.text }]}>{attendedEvents.length}</Text>
                  <Text style={[styles.statName, { color: theme.colors.textSubtle }]}>Events</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: theme.colors.border }]} />
                <View style={styles.statCell}>
                  <Text style={[styles.statValue, { color: theme.colors.text }]}>{communities.length}</Text>
                  <Text style={[styles.statName, { color: theme.colors.textSubtle }]}>Communities</Text>
                </View>
              </View>

              {/* CTA */}
              {!isMe && currentUser ? (
                <PrimaryButton
                  label={isFollowing ? "Following" : "Follow"}
                  variant={isFollowing ? "secondary" : "primary"}
                  onPress={handleFollowToggle}
                  style={styles.actionBtn}
                />
              ) : isMe ? (
                <PrimaryButton
                  label="Edit Profile"
                  variant="secondary"
                  onPress={() => router.push("/users/settings")}
                  style={styles.actionBtn}
                />
              ) : null}
            </View>
          </NeuCard>

          {/* ── DAILY UPDATES ────────────────────────────── */}
          <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
            <SectionHeader title="Daily Updates" icon={Zap} color={theme.colors.brand} theme={theme} />
            {updates.length === 0 ? (
              <Text style={[styles.emptyText, { color: theme.colors.textSubtle }]}>
                No updates yet.
              </Text>
            ) : (
              <View style={styles.updatesList}>
                {updates.map((u) => (
                  <View
                    key={u._id}
                    style={[styles.updateCard, { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border }]}
                  >
                    <Text style={[styles.updateContent, { color: theme.colors.text }]}>
                      {u.content}
                    </Text>
                    <Text style={[styles.updateTime, { color: theme.colors.textSubtle }]}>
                      {formatRelativeTime(u.createdAt)}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* ── EVENTS ATTENDED ──────────────────────────── */}
          <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
            <SectionHeader title="Events Attended" icon={Calendar} color="#F97316" theme={theme} />
            {attendedEvents.length === 0 ? (
              <Text style={[styles.emptyText, { color: theme.colors.textSubtle }]}>
                No events attended yet.
              </Text>
            ) : (
              <View style={styles.itemList}>
                {attendedEvents.slice(0, 5).map((event, idx) => (
                  <TouchableOpacity
                    key={event.event_id || idx}
                    style={[styles.itemRow, { borderColor: theme.colors.border }]}
                    onPress={() => router.push(`/event/${event.event_id}`)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.itemThumb, { backgroundColor: "#F9731622" }]}>
                      <Calendar size={18} color="#F97316" />
                    </View>
                    <View style={styles.itemInfo}>
                      <Text style={[styles.itemName, { color: theme.colors.text }]} numberOfLines={1}>
                        {event.name}
                      </Text>
                      {event.venue ? (
                        <Text style={[styles.itemSub, { color: theme.colors.textSubtle }]} numberOfLines={1}>
                          {event.venue}
                        </Text>
                      ) : null}
                    </View>
                  </TouchableOpacity>
                ))}
                {attendedEvents.length > 5 ? (
                  <Text style={[styles.moreLabel, { color: theme.colors.textSubtle }]}>
                    +{attendedEvents.length - 5} more events
                  </Text>
                ) : null}
              </View>
            )}
          </View>

          {/* ── COMMUNITIES ──────────────────────────────── */}
          <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
            <SectionHeader title="Communities" icon={Users} color="#7C3AED" theme={theme} />
            {communities.length === 0 ? (
              <Text style={[styles.emptyText, { color: theme.colors.textSubtle }]}>
                Not part of any communities yet.
              </Text>
            ) : (
              <View style={styles.communityGrid}>
                {communities.map((c) => (
                  <View
                    key={c._id}
                    style={[styles.communityChip, { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border }]}
                  >
                    {c.profileImage ? (
                      <Image source={{ uri: c.profileImage }} style={styles.communityThumb} />
                    ) : (
                      <View style={[styles.communityThumbFallback, { backgroundColor: "#7C3AED22" }]}>
                        <Users size={12} color="#7C3AED" />
                      </View>
                    )}
                    <Text style={[styles.communityName, { color: theme.colors.text }]} numberOfLines={1}>
                      {c.name}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>

        {profile && (
          <ReportModal
            visible={reportVisible}
            onClose={() => setReportVisible(false)}
            targetId={profile._id}
            targetType="user"
            targetName={profile.username}
          />
        )}
      </View>
    </Screen>
  );
}

function formatRelativeTime(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  moreBtn: { padding: 8 },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 12,
  },
  // Profile card
  profileCard: {
    borderRadius: 24,
    overflow: "hidden",
  },
  banner: {
    height: 120,
    width: "100%",
  },
  avatarContainer: {
    alignItems: "center",
    marginTop: -55,
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 4,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImg: { width: "100%", height: "100%" },
  avatarText: {
    fontSize: 32,
    fontWeight: "800",
  },
  infoSection: {
    padding: 24,
    alignItems: "center",
  },
  name: {
    fontSize: 24,
    fontWeight: "800",
    fontFamily: "SpaceGrotesk_700Bold",
    textAlign: "center",
  },
  username: {
    fontSize: 14,
    fontFamily: "PlusJakartaSans_500Medium",
    marginTop: 4,
    marginBottom: 16,
  },
  bio: {
    fontSize: 15,
    fontFamily: "PlusJakartaSans_400Regular",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 20,
  },
  metaList: {
    width: "100%",
    gap: 12,
    marginBottom: 24,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  metaLabel: {
    fontSize: 14,
    fontFamily: "PlusJakartaSans_400Regular",
    flex: 1,
  },
  statsRow: {
    flexDirection: "row",
    width: "100%",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingVertical: 16,
    marginBottom: 24,
  },
  statCell: { flex: 1, alignItems: "center" },
  statValue: {
    fontSize: 18,
    fontWeight: "800",
    fontFamily: "SpaceGrotesk_700Bold",
  },
  statName: {
    fontSize: 12,
    fontFamily: "PlusJakartaSans_500Medium",
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: "80%",
    alignSelf: "center",
  },
  actionBtn: { width: "100%" },

  // Sections below profile card
  section: {
    borderRadius: radius.lg,
    padding: 18,
  },
  emptyText: {
    fontSize: 13,
    fontFamily: "PlusJakartaSans_400Regular",
    fontStyle: "italic",
  },

  // Updates
  updatesList: { gap: 10 },
  updateCard: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  updateContent: {
    fontSize: 14,
    fontFamily: "PlusJakartaSans_400Regular",
    lineHeight: 21,
  },
  updateTime: {
    fontSize: 11,
    fontFamily: "PlusJakartaSans_500Medium",
  },

  // Events / generic item list
  itemList: { gap: 8 },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  itemThumb: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  itemInfo: { flex: 1, minWidth: 0 },
  itemName: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "PlusJakartaSans_600SemiBold",
  },
  itemSub: {
    fontSize: 12,
    fontFamily: "PlusJakartaSans_400Regular",
    marginTop: 2,
  },
  moreLabel: {
    fontSize: 12,
    fontFamily: "PlusJakartaSans_500Medium",
    paddingTop: 6,
    textAlign: "center",
  },

  // Communities grid
  communityGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  communityChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  communityThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  communityThumbFallback: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  communityName: {
    fontSize: 12,
    fontFamily: "PlusJakartaSans_600SemiBold",
    maxWidth: 120,
  },

  errorTitle: {
    fontSize: 20,
    fontWeight: "800",
    fontFamily: "SpaceGrotesk_700Bold",
    marginTop: 12,
  },
  errorText: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginTop: 8,
  },
});
