import { useTheme } from "../../theme/ThemeProvider.js";
import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, TextInput, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { router } from "expo-router";
import { User, MapPin, Edit, Calendar, Users, Bookmark, Zap, Send, Trash2 } from "lucide-react-native";
import { Screen, InterestsModal, SkeletonLoader, EmptyState } from "../../components/index.js";
import { radius, spacing } from "../../theme/tokens.js";
import { BadgeRow } from "../../components/BadgeRow.js";
import { useSessionStore } from "../../lib/auth.js";
import { API_URL } from "../../lib/config.js";
import { Image as ExpoImage } from "expo-image";

export default function ProfileScreen() {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const token = useSessionStore((state) => state.userToken);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [showInterestsModal, setShowInterestsModal] = useState(false);
  const [editableInterests, setEditableInterests] = useState([]);
  const [allAvailableInterests, setAllAvailableInterests] = useState([
    "Music", "Art", "Tech", "Sports", "Food", "Travel",
    "Gaming", "Reading", "Fitness", "Photography",
  ]);
  const [followers, setFollowers] = useState([]);
  const [followersLoading, setFollowersLoading] = useState(false);
  const [updates, setUpdates] = useState([]);
  const [updatesLoading, setUpdatesLoading] = useState(false);
  const [updateDraft, setUpdateDraft] = useState("");
  const [postingUpdate, setPostingUpdate] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      if (!token) {
        router.push("/signin");
        return;
      }
      try {
        const res = await fetch(`${API_URL}/user/details`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data);
          setEditableInterests(data.interests || []);
          // Fetch followers and updates
          if (data._id) {
            fetchFollowers(data._id);
            fetchUpdates(data._id);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [token]);

  const fetchFollowers = async (userId) => {
    setFollowersLoading(true);
    try {
      const res = await fetch(`${API_URL}/social/followers/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setFollowers(data.followers || data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setFollowersLoading(false);
    }
  };

  const fetchUpdates = async (userId) => {
    setUpdatesLoading(true);
    try {
      const res = await fetch(`${API_URL}/social/updates/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setUpdates(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatesLoading(false);
    }
  };

  const handlePostUpdate = async () => {
    const trimmed = updateDraft.trim();
    if (!trimmed || !token) return;
    if (trimmed.length > 300) {
      Alert.alert("Too long", "Updates can be at most 300 characters.");
      return;
    }
    setPostingUpdate(true);
    try {
      const res = await fetch(`${API_URL}/social/updates`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: trimmed }),
      });
      if (res.ok) {
        const newUpdate = await res.json();
        setUpdates((prev) => [newUpdate, ...prev]);
        setUpdateDraft("");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setPostingUpdate(false);
    }
  };

  const handleDeleteUpdate = (updateId) => {
    Alert.alert("Delete update?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const res = await fetch(`${API_URL}/social/updates/${updateId}`, {
              method: "DELETE",
              headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
              setUpdates((prev) => prev.filter((u) => u._id !== updateId));
            }
          } catch (e) {
            console.error(e);
          }
        },
      },
    ]);
  };

  const toggleInterest = (interest) => {
    if (editableInterests.includes(interest)) {
      setEditableInterests(editableInterests.filter((i) => i !== interest));
    } else {
      setEditableInterests([...editableInterests, interest]);
    }
  };

  const saveInterests = () => {
    setUser({ ...user, interests: editableInterests });
    setShowInterestsModal(false);
  };

  if (loading) {
    return (
      <Screen padded>
        <View style={{ flexDirection: "row", gap: 16, marginBottom: 20, alignItems: "flex-start" }}>
          <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: "#e5e7eb", opacity: 0.6 }} />
          <View style={{ flex: 1, gap: 8, paddingTop: 8 }}>
            <View style={{ width: "60%", height: 18, borderRadius: radius.xs, backgroundColor: "#e5e7eb", opacity: 0.6 }} />
            <View style={{ width: "40%", height: 13, borderRadius: radius.xs, backgroundColor: "#e5e7eb", opacity: 0.5 }} />
          </View>
        </View>
        <SkeletonLoader variant="text" count={3} />
        <SkeletonLoader variant="row"  count={4} />
      </Screen>
    );
  }

  const stats = [
    { value: (user?.eventCreated || []).length, label: "Hosted" },
    { value: (user?.registeredEvents || []).length, label: "Attended" },
    { value: (user?.communitiesJoined || []).length, label: "Communities" },
    { value: user?.followersCount ?? followers.length, label: "Followers" },
  ];

  return (
    <Screen padded={false}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── HERO HEADER ─────────────────────────────────── */}
        <View style={styles.hero}>
          {/* Top row: avatar + edit button */}
          <View style={styles.heroTopRow}>
            {user?.avatar ? (
              <ExpoImage source={{ uri: user.avatar }} style={styles.avatar} contentFit="cover" />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <User size={34} color={theme.colors.brand} />
              </View>
            )}
            <TouchableOpacity style={styles.editBtn} onPress={() => router.push("/users/profile-edit")}>
              <Edit size={14} color={theme.colors.textMuted} />
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>
          </View>

          {/* Name / username */}
          <Text style={styles.displayName}>
            {user?.displayName || user?.username || "Your Profile"}
          </Text>
          {user?.username ? <Text style={styles.username}>@{user.username}</Text> : null}

          {/* Bio */}
          {user?.bio ? (
            <Text style={styles.bio}>{user.bio}</Text>
          ) : (
            <Text style={styles.bioEmpty}>No bio yet — tap Edit to add one.</Text>
          )}

          {/* Location / University chips */}
          {(user?.location || user?.university) ? (
            <View style={styles.metaRow}>
              {user?.location ? (
                <View style={styles.metaChip}>
                  <MapPin size={12} color={theme.colors.textSubtle} />
                  <Text style={styles.metaChipText}>{user.location}</Text>
                </View>
              ) : null}
              {user?.university ? (
                <View style={styles.metaChip}>
                  <Text style={styles.metaEmoji}>🎓</Text>
                  <Text style={styles.metaChipText}>{user.university}</Text>
                </View>
              ) : null}
            </View>
          ) : null}

          {/* Stats row */}
          <View style={styles.statsRow}>
            {stats.map((s, i) => (
              <React.Fragment key={s.label}>
                {i > 0 ? <View style={styles.statSep} /> : null}
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{s.value}</Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </View>
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* ── UNDERLINE TABS ──────────────────────────────── */}
        <View style={styles.tabBar}>
          {[
            { key: "overview", label: "Overview" },
            { key: "updates", label: "Updates" },
            { key: "events", label: "Hosted" },
            { key: "past", label: "Attending" },
            { key: "followers", label: "Followers" },
          ].map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[styles.tab, activeTab === t.key && styles.tabActive]}
              onPress={() => setActiveTab(t.key)}
            >
              <Text style={[styles.tabText, activeTab === t.key && styles.tabTextActive]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── CONTENT ─────────────────────────────────────── */}
        <View style={styles.content}>

          {activeTab === "overview" && (
            <>
              {/* Interests */}
              <View style={styles.contentHeader}>
                <Text style={styles.contentSectionTitle}>Interests</Text>
                <TouchableOpacity onPress={() => setShowInterestsModal(true)} style={styles.addBtn}>
                  <Text style={styles.addBtnText}>
                    {(user?.interests || []).length === 0 ? "+ Add" : "Edit"}
                  </Text>
                </TouchableOpacity>
              </View>
              {(user?.interests || []).length > 0 ? (
                <View style={styles.pillsRow}>
                  {(user.interests || []).map((interest, idx) => (
                    <View key={idx} style={styles.pill}>
                      <Text style={styles.pillText}>{interest}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.inlineEmpty}>
                  <Text style={styles.inlineEmptyText}>No interests added yet.</Text>
                </View>
              )}

              <View style={styles.divider} />

              {/* Achievement Badges */}
              <BadgeRow user={user} />

              <View style={styles.divider} />

              {/* Communities */}
              <Text style={styles.contentSectionTitle}>Communities</Text>
              <View style={styles.inlineEmpty}>
                <Text style={styles.inlineEmptyText}>No communities joined yet.</Text>
              </View>
            </>
          )}

          {activeTab === "updates" && (
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
              {/* Compose box */}
              <View style={[styles.composeBox, { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border }]}>
                <View style={[styles.composeAvatar, { backgroundColor: theme.colors.brandTint }]}>
                  {user?.avatar ? (
                    <ExpoImage source={{ uri: user.avatar }} style={styles.composeAvatarImg} contentFit="cover" />
                  ) : (
                    <Zap size={14} color={theme.colors.brand} />
                  )}
                </View>
                <View style={styles.composeRight}>
                  <TextInput
                    style={[styles.composeInput, { color: theme.colors.text }]}
                    placeholder="What's on your mind today?"
                    placeholderTextColor={theme.colors.textSubtle}
                    value={updateDraft}
                    onChangeText={setUpdateDraft}
                    multiline
                    maxLength={300}
                  />
                  <View style={styles.composeFooter}>
                    <Text style={[styles.charCount, { color: updateDraft.length > 270 ? theme.colors.error : theme.colors.textSubtle }]}>
                      {updateDraft.length}/300
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.sendBtn,
                        { backgroundColor: updateDraft.trim().length > 0 ? theme.colors.brand : theme.colors.surfaceMuted },
                      ]}
                      onPress={handlePostUpdate}
                      disabled={!updateDraft.trim() || postingUpdate}
                    >
                      {postingUpdate ? (
                        <ActivityIndicator size={14} color={theme.colors.text} />
                      ) : (
                        <Send size={14} color={updateDraft.trim().length > 0 ? theme.colors.textOnBrand : theme.colors.textSubtle} />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <View style={styles.divider} />

              {/* Updates list */}
              {updatesLoading ? (
                <View style={styles.emptyState}>
                  <ActivityIndicator color={theme.colors.brand} />
                </View>
              ) : updates.length === 0 ? (
                <View style={styles.emptyState}>
                  <Zap size={40} color={theme.colors.textSubtle} />
                  <Text style={styles.emptyTitle}>No updates yet</Text>
                  <Text style={styles.emptyText}>Share what's on your mind. Your followers will see it.</Text>
                </View>
              ) : (
                <View style={{ gap: 10 }}>
                  {updates.map((u) => (
                    <View
                      key={u._id}
                      style={[styles.updateCard, { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border }]}
                    >
                      <Text style={[styles.updateContent, { color: theme.colors.text }]}>{u.content}</Text>
                      <View style={styles.updateMeta}>
                        <Text style={[styles.updateTime, { color: theme.colors.textSubtle }]}>
                          {formatRelativeTime(u.createdAt)}
                        </Text>
                        <TouchableOpacity onPress={() => handleDeleteUpdate(u._id)} hitSlop={8}>
                          <Trash2 size={14} color={theme.colors.textSubtle} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </KeyboardAvoidingView>
          )}

          {activeTab === "events" && (
            <>
              {(user?.eventCreated || []).length > 0 ? (
                <View style={styles.eventList}>
                  {(user.eventCreated || []).map((event, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={[styles.eventRow, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                      onPress={() => router.push(`/event/${event.event_id}`)}
                    >
                      <View style={[styles.eventRowThumb, { backgroundColor: theme.colors.surfaceMuted }]}>
                        <Calendar size={20} color={theme.colors.textSubtle} />
                      </View>
                      <View style={styles.eventRowInfo}>
                        <Text style={[styles.eventRowName, { color: theme.colors.text }]} numberOfLines={1}>{event.name}</Text>
                        <Text style={[styles.eventRowMeta, { color: theme.colors.textSubtle }]} numberOfLines={1}>{event.venue}</Text>
                      </View>
                      <View style={[styles.eventRowBadge, { backgroundColor: theme.colors.brandTint }]}>
                        <Text style={[styles.eventRowBadgeText, { color: theme.colors.brand }]}>HOST</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Calendar size={40} color={theme.colors.textSubtle} />
                  <Text style={styles.emptyTitle}>No events hosted yet</Text>
                  <Text style={styles.emptyText}>Create your first event and share it with the world.</Text>
                  <TouchableOpacity style={[styles.emptyAction, { backgroundColor: theme.colors.brand }]} onPress={() => router.push("/users/eventform")}>
                    <Text style={styles.emptyActionText}>Create Event</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}

          {activeTab === "past" && (
            <>
              {(user?.registeredEvents || []).length > 0 ? (
                <View style={styles.eventList}>
                  {(user.registeredEvents || []).map((event, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={[styles.eventRow, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                      onPress={() => router.push(`/event/${event.event_id}`)}
                    >
                      <View style={[styles.eventRowThumb, { backgroundColor: theme.colors.surfaceMuted }]}>
                        <Bookmark size={20} color={theme.colors.textSubtle} />
                      </View>
                      <View style={styles.eventRowInfo}>
                        <Text style={[styles.eventRowName, { color: theme.colors.text }]} numberOfLines={1}>{event.name}</Text>
                        <Text style={[styles.eventRowMeta, { color: theme.colors.textSubtle }]} numberOfLines={1}>{event.venue}</Text>
                      </View>
                      <View style={[styles.eventRowBadge, { backgroundColor: theme.colors.surfaceMuted }]}>
                        <Text style={[styles.eventRowBadgeText, { color: theme.colors.textSubtle }]}>GOING</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Calendar size={40} color={theme.colors.textSubtle} />
                  <Text style={styles.emptyTitle}>No events registered</Text>
                  <Text style={styles.emptyText}>Explore upcoming events and join the fun.</Text>
                  <TouchableOpacity style={[styles.emptyAction, { borderWidth: 1, borderColor: theme.colors.brand }]} onPress={() => router.push("/(app)/dashboard")}>
                    <Text style={[styles.emptyActionText, { color: theme.colors.brand }]}>Explore Events</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}

          {activeTab === "followers" && (
            followersLoading ? (
              <View style={styles.emptyState}>
                <ActivityIndicator color={theme.colors.brand} />
              </View>
            ) : followers.length === 0 ? (
              <View style={styles.emptyState}>
                <Users size={40} color={theme.colors.textSubtle} />
                <Text style={styles.emptyTitle}>No followers yet</Text>
                <Text style={styles.emptyText}>Share your profile to grow your network.</Text>
              </View>
            ) : (
              <View style={styles.eventList}>
                {followers.map((f, i) => (
                  <TouchableOpacity
                    key={f._id || i}
                    style={[styles.followerRow, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                    onPress={() => router.push(`/users/u/${f._id}`)}
                  >
                    <View style={[styles.followerAvatar, { backgroundColor: theme.colors.brandTint }]}>
                      {f.avatar ? (
                        <ExpoImage source={{ uri: f.avatar }} style={styles.followerAvatarImg} contentFit="cover" />
                      ) : (
                        <Text style={[styles.followerAvatarText, { color: theme.colors.brand }]}>
                          {(f.username || f.displayName || "?").substring(0, 2).toUpperCase()}
                        </Text>
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.followerName, { color: theme.colors.text }]} numberOfLines={1}>
                        {f.displayName || f.username}
                      </Text>
                      {f.username && f.displayName && (
                        <Text style={[styles.followerHandle, { color: theme.colors.textSubtle }]}>@{f.username}</Text>
                      )}
                    </View>
                    <Users size={14} color={theme.colors.textSubtle} />
                  </TouchableOpacity>
                ))}
              </View>
            )
          )}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      <InterestsModal
        isOpen={showInterestsModal}
        currentInterests={editableInterests}
        onClose={() => setShowInterestsModal(false)}
        onSave={(nextInterests) => {
          setEditableInterests(nextInterests);
          if (user) setUser({ ...user, interests: nextInterests });
        }}
      />
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

const getStyles = (theme) =>
  StyleSheet.create({
    // ── HERO ──────────────────────────────────────────
    hero: {
      paddingHorizontal: 20,
      paddingTop: 24,
      paddingBottom: 24,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    heroTopRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 16,
    },
    avatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      borderWidth: 3,
      borderColor: theme.colors.brand,
    },
    avatarPlaceholder: {
      width: 80,
      height: 80,
      borderRadius: 40,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.brandTint,
      borderWidth: 3,
      borderColor: theme.colors.brand,
    },
    editBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 99,
      borderWidth: 1.5,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    editBtnText: {
      fontSize: 13,
      fontWeight: "600",
      fontFamily: "PlusJakartaSans_600SemiBold",
      color: theme.colors.textMuted,
    },
    displayName: {
      fontSize: 26,
      fontWeight: "700",
      fontFamily: "SpaceGrotesk_700Bold",
      color: theme.colors.text,
      letterSpacing: -0.5,
      marginBottom: 2,
      lineHeight: 32,
    },
    username: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.colors.accentProfile,
      fontFamily: "PlusJakartaSans_600SemiBold",
      marginBottom: 10,
    },
    bio: {
      fontSize: 14,
      color: theme.colors.textMuted,
      lineHeight: 21,
      fontFamily: "PlusJakartaSans_400Regular",
      marginBottom: 14,
    },
    bioEmpty: {
      fontSize: 13,
      color: theme.colors.textSubtle,
      fontFamily: "PlusJakartaSans_400Regular",
      fontStyle: "italic",
      marginBottom: 14,
    },
    metaRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginBottom: 20,
    },
    metaChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      paddingVertical: 5,
      paddingHorizontal: 10,
      borderRadius: 99,
      backgroundColor: theme.colors.surfaceMuted,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    metaEmoji: { fontSize: 12 },
    metaChipText: {
      fontSize: 12,
      color: theme.colors.textMuted,
      fontFamily: "PlusJakartaSans_400Regular",
    },
    statsRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    statItem: { flex: 1, alignItems: "center" },
    statSep: {
      width: 1,
      height: 28,
      backgroundColor: theme.colors.border,
    },
    statValue: {
      fontSize: 20,
      fontWeight: "800",
      fontFamily: "SpaceGrotesk_700Bold",
      color: theme.colors.text,
    },
    statLabel: {
      fontSize: 10,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.8,
      color: theme.colors.textSubtle,
      fontFamily: "PlusJakartaSans_700Bold",
      marginTop: 2,
    },

    // ── TABS ──────────────────────────────────────────
    tabBar: {
      flexDirection: "row",
      borderBottomWidth: 1.5,
      borderBottomColor: theme.colors.border,
    },
    tab: {
      flex: 1,
      paddingVertical: 14,
      alignItems: "center",
      borderBottomWidth: 2.5,
      borderBottomColor: "transparent",
    },
    tabActive: {
      borderBottomColor: theme.colors.accentProfile,
    },
    tabText: {
      fontSize: 13,
      fontWeight: "600",
      fontFamily: "PlusJakartaSans_600SemiBold",
      color: theme.colors.textSubtle,
    },
    tabTextActive: {
      color: theme.colors.accentProfile,
      fontFamily: "PlusJakartaSans_700Bold",
      fontWeight: "700",
    },

    // ── CONTENT ───────────────────────────────────────
    content: {
      paddingHorizontal: 20,
      paddingTop: 24,
      paddingBottom: 20,
    },
    contentHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 14,
    },
    contentSectionTitle: {
      fontSize: 11,
      fontWeight: "800",
      textTransform: "uppercase",
      letterSpacing: 1.2,
      color: theme.colors.textSubtle,
      fontFamily: "PlusJakartaSans_700Bold",
    },
    addBtn: {
      paddingVertical: 5,
      paddingHorizontal: 14,
      borderRadius: radius.xxl,
      backgroundColor: theme.colors.brandTint,
    },
    addBtnText: {
      fontSize: 12,
      fontWeight: "700",
      color: theme.colors.brand,
      fontFamily: "PlusJakartaSans_700Bold",
    },
    pillsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginBottom: 8,
    },
    pill: {
      paddingVertical: 6,
      paddingHorizontal: 14,
      borderRadius: radius.xxl,
      backgroundColor: theme.colors.brand,
    },
    pillText: {
      fontSize: 12,
      fontWeight: "700",
      color: theme.colors.textOnBrand,
      fontFamily: "PlusJakartaSans_700Bold",
    },
    inlineEmpty: {
      paddingVertical: 16,
    },
    inlineEmptyText: {
      fontSize: 13,
      color: theme.colors.textSubtle,
      fontFamily: "PlusJakartaSans_400Regular",
    },
    divider: {
      height: 1,
      backgroundColor: theme.colors.border,
      marginVertical: 20,
    },

    // ── EVENT LIST ────────────────────────────────────
    eventList: { gap: 10 },
    eventRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      padding: 14,
      borderRadius: radius.lg,
      borderWidth: 1,
    },
    eventRowThumb: {
      width: 48,
      height: 48,
      borderRadius: radius.md,
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    eventRowInfo: { flex: 1, minWidth: 0 },
    eventRowName: {
      fontSize: 14,
      fontWeight: "700",
      fontFamily: "PlusJakartaSans_700Bold",
      marginBottom: 3,
    },
    eventRowMeta: {
      fontSize: 12,
      fontFamily: "PlusJakartaSans_400Regular",
    },
    eventRowBadge: {
      paddingVertical: 4,
      paddingHorizontal: 8,
      borderRadius: 6,
    },
    eventRowBadgeText: {
      fontSize: 9,
      fontWeight: "800",
      letterSpacing: 0.8,
      fontFamily: "PlusJakartaSans_700Bold",
    },

    // ── EMPTY STATE ───────────────────────────────────
    emptyState: {
      alignItems: "center",
      paddingVertical: 40,
      gap: 10,
    },
    emptyTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: theme.colors.text,
      fontFamily: "SpaceGrotesk_700Bold",
    },
    emptyText: {
      fontSize: 13,
      color: theme.colors.textSubtle,
      textAlign: "center",
      fontFamily: "PlusJakartaSans_400Regular",
      lineHeight: 19,
      maxWidth: 260,
    },
    emptyAction: {
      marginTop: 8,
      paddingVertical: 11,
      paddingHorizontal: 24,
      borderRadius: 99,
    },
    emptyActionText: {
      fontSize: 14,
      fontWeight: "700",
      color: theme.colors.textOnBrand,
      fontFamily: "PlusJakartaSans_700Bold",
    },

    modalBackdrop: {
      position: "absolute",
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: "rgba(0,0,0,0.4)",
      alignItems: "center",
      justifyContent: "flex-end",
    },
    modalContainer: {
      width: "100%",
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
      padding: 24,
      paddingBottom: 40,
    },
    modalHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 20,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: "800",
      fontFamily: "SpaceGrotesk_700Bold",
      color: theme.colors.text,
    },
    modalInterestsContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginBottom: 24,
    },
    followerRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      padding: 12,
      borderRadius: radius.lg,
      borderWidth: 1,
      marginBottom: 8,
    },
    followerAvatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    followerAvatarImg: {
      width: 44,
      height: 44,
    },
    followerAvatarText: {
      fontSize: 16,
      fontWeight: "700",
      fontFamily: "PlusJakartaSans_700Bold",
    },
    followerName: {
      fontSize: 14,
      fontWeight: "700",
      fontFamily: "PlusJakartaSans_700Bold",
    },
    followerHandle: {
      fontSize: 12,
      fontFamily: "PlusJakartaSans_400Regular",
      marginTop: 2,
    },

    // ── UPDATES ───────────────────────────────────────
    composeBox: {
      flexDirection: "row",
      gap: 12,
      borderRadius: radius.lg,
      borderWidth: 1,
      padding: 14,
      marginBottom: 4,
    },
    composeAvatar: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      flexShrink: 0,
    },
    composeAvatarImg: {
      width: 38,
      height: 38,
    },
    composeRight: {
      flex: 1,
      gap: 10,
    },
    composeInput: {
      fontSize: 14,
      fontFamily: "PlusJakartaSans_400Regular",
      lineHeight: 20,
      minHeight: 60,
      textAlignVertical: "top",
    },
    composeFooter: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    charCount: {
      fontSize: 11,
      fontFamily: "PlusJakartaSans_500Medium",
    },
    sendBtn: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: "center",
      justifyContent: "center",
    },
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
    updateMeta: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    updateTime: {
      fontSize: 11,
      fontFamily: "PlusJakartaSans_500Medium",
    },
  });
