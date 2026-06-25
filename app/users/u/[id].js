import React, { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Image, Pressable, Linking, Alert } from "react-native";
import { User, MapPin, Link as LinkIcon, Calendar, Clock, AlertCircle, MoreVertical } from "lucide-react-native";
import { Screen, BackButton, NeuCard, PrimaryButton } from "../../../components";
import { useTheme } from "../../../theme/ThemeProvider";
import { getUserToken } from "../../../lib/auth";
import { API_URL } from "../../../lib/config";
import { ReportModal } from "../../../components/ReportModal";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BLOCKED_KEY = "unihub_blocked_users";

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
        // Refresh local states
        setProfile(prev => ({
          ...prev,
          followersCount: isFollowing
            ? Math.max(0, (prev.followersCount || 0) - 1)
            : (prev.followersCount || 0) + 1
        }));
        setCurrentUser(prev => {
          const updatedFollowing = isFollowing
            ? (prev.following || []).filter(fid => fid !== profile._id)
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
          <NeuCard style={[styles.profileCard, { backgroundColor: theme.colors.surface }]}>
            {/* Header banner or gradient */}
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
              <Text style={[styles.name, { color: theme.colors.text }]}>{profile.name || profile.username}</Text>
              <Text style={[styles.username, { color: theme.colors.textSubtle }]}>@{profile.username}</Text>

              {profile.bio ? (
                <Text style={[styles.bio, { color: theme.colors.textMuted }]}>{profile.bio}</Text>
              ) : null}

              {/* Meta details list */}
              <View style={styles.metaList}>
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

              {/* Stats Row */}
              <View style={[styles.statsRow, { borderTopColor: theme.colors.border, borderBottomColor: theme.colors.border }]}>
                <View style={styles.statCell}>
                  <Text style={[styles.statValue, { color: theme.colors.text }]}>{profile.followersCount || 0}</Text>
                  <Text style={[styles.statName, { color: theme.colors.textSubtle }]}>Followers</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: theme.colors.border }]} />
                <View style={styles.statCell}>
                  <Text style={[styles.statValue, { color: theme.colors.text }]}>{profile.followingCount || 0}</Text>
                  <Text style={[styles.statName, { color: theme.colors.textSubtle }]}>Following</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: theme.colors.border }]} />
                <View style={styles.statCell}>
                  <Text style={[styles.statValue, { color: theme.colors.text }]}>{profile.eventsCount || 0}</Text>
                  <Text style={[styles.statName, { color: theme.colors.textSubtle }]}>Events</Text>
                </View>
              </View>

              {/* CTA actions */}
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
  moreBtn: {
    padding: 8,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
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
  avatarImg: {
    width: "100%",
    height: "100%",
  },
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
  statCell: {
    flex: 1,
    alignItems: "center",
  },
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
  actionBtn: {
    width: "100%",
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
