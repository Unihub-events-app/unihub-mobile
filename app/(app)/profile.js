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
  User,
  MapPin,
  Clock,
  Edit,
  Calendar,
  Users,
  ChevronRight,
  Plus,
  X,
  Check,
  Bookmark,
  Heart,
  Globe,
  Compass,
} from "lucide-react-native";
import {
  Screen,
  NeuCard,
  NeuInset,
  PrimaryButton,
  InterestsModal,
} from "../../components/index.js";
import { useSessionStore } from "../../lib/auth.js";
import { API_URL } from "../../lib/config.js";
import { Image as ExpoImage } from "expo-image";

function StatCard({ value, label }) {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  return (
    <NeuCard style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </NeuCard>
  );
}

function TabButton({ active, label, onPress }) {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  return (
    <TouchableOpacity
      style={[styles.tabButton, active && styles.tabButtonActive]}
      onPress={onPress}
    >
      <Text
        style={[styles.tabButtonText, active && styles.tabButtonTextActive]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function InterestPill({ label, active, onPress }) {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  return (
    <TouchableOpacity
      style={[styles.interestPill, active && styles.interestPillActive]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.interestPillText,
          active && styles.interestPillTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

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
    "Music",
    "Art",
    "Tech",
    "Sports",
    "Food",
    "Travel",
    "Gaming",
    "Reading",
    "Fitness",
    "Photography",
  ]);

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
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [token]);

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
      <Screen padded={false}>
        <View style={styles.loadingContainer}>
          <NeuCard style={styles.loadingCard}>
            <ActivityIndicator size="large" color={theme.colors.brand} />
            <Text style={styles.loadingText}>Loading profile...</Text>
          </NeuCard>
        </View>
      </Screen>
    );
  }

  const stats = [
    { value: (user?.eventCreated || []).length, label: "Hosted" },
    { value: (user?.registeredEvents || []).length, label: "Attended" },
    { value: (user?.communitiesJoined || []).length, label: "Communities" },
    { value: 0, label: "Followers" },
  ];

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <NeuCard style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            {user?.avatar ? (
              <ExpoImage
                source={{ uri: user.avatar }}
                style={styles.avatar}
                contentFit="cover"
              />
            ) : (
              <NeuInset style={styles.avatarPlaceholder}>
                <User size={40} color="#9ca3af" />
              </NeuInset>
            )}
          </View>

          <Text style={styles.displayName}>
            {user?.displayName || user?.username || "Your Profile"}
          </Text>
          <Text style={styles.username}>
            {user?.username ? `@${user.username}` : ""}
          </Text>
          <Text style={styles.bio}>
            {user?.bio || "Add a short bio from Settings."}
          </Text>

          <View style={styles.metaInfoContainer}>
            {user?.location && (
              <View style={styles.metaInfoItem}>
                <MapPin size={16} color="#6b7280" />
                <Text style={styles.metaInfoText}>{user.location}</Text>
              </View>
            )}
            {user?.university && (
              <View style={styles.metaInfoItem}>
                <Text style={styles.metaEmoji}>🎓</Text>
                <Text style={styles.metaInfoText}>{user.university}</Text>
              </View>
            )}
          </View>

          <PrimaryButton
            label="Edit Profile"
            variant="secondary"
            icon={<Edit size={16} color="#4b5563" />}
            onPress={() => router.push("/(app)/settings")}
          />
        </NeuCard>

        {/* Tabs */}
        <NeuCard style={styles.tabsContainer}>
          <TabButton
            label="Overview"
            active={activeTab === "overview"}
            onPress={() => setActiveTab("overview")}
          />
          <TabButton
            label="Hosted"
            active={activeTab === "events"}
            onPress={() => setActiveTab("events")}
          />
          <TabButton
            label="Attending"
            active={activeTab === "past"}
            onPress={() => setActiveTab("past")}
          />
          <TabButton
            label="Followers"
            active={activeTab === "followers"}
            onPress={() => setActiveTab("followers")}
          />
        </NeuCard>

        {/* Content */}
        <NeuCard style={styles.contentCard}>
          {activeTab === "overview" && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Interests</Text>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => setShowInterestsModal(true)}
                >
                  <Text style={styles.editButtonText}>
                    {(user?.interests || []).length === 0 ? "Add" : "Edit"}
                  </Text>
                </TouchableOpacity>
              </View>

              {(user?.interests || []).length > 0 ? (
                <View style={styles.interestsContainer}>
                  {(user.interests || []).map((i, idx) => (
                    <InterestPill key={idx} label={i} active />
                  ))}
                </View>
              ) : (
                <NeuInset style={styles.emptyInterests}>
                  <Text style={styles.emptyInterestsText}>
                    No interests yet. Add some to personalize your feed.
                  </Text>
                </NeuInset>
              )}

              <View style={styles.divider} />

              <Text style={styles.sectionTitle}>Stats</Text>
              <View style={styles.statsGrid}>
                {stats.map((stat, idx) => (
                  <StatCard key={idx} {...stat} />
                ))}
              </View>

              <View style={styles.divider} />

              <Text style={styles.sectionTitle}>Communities</Text>
              <NeuInset style={styles.emptyInterests}>
                <Text style={styles.emptyInterestsText}>
                  No communities joined yet.
                </Text>
              </NeuInset>
            </>
          )}

          {activeTab === "events" && (
            <View style={styles.tabContent}>
              {(user?.eventCreated || []).length > 0 ? (
                <View style={styles.eventsGrid}>
                  {(user.eventCreated || []).map((event, idx) => (
                    <NeuCard key={idx} style={styles.eventMiniCard}>
                      <View style={styles.eventMiniImagePlaceholder}>
                        <Calendar size={24} color="#9ca3af" />
                      </View>
                      <Text style={styles.eventMiniTitle} numberOfLines={1}>
                        {event.name}
                      </Text>
                      <Text style={styles.eventMiniVenue} numberOfLines={1}>
                        {event.venue}
                      </Text>
                    </NeuCard>
                  ))}
                </View>
              ) : (
                <View style={styles.tabEmptyState}>
                  <Calendar size={48} color="#9ca3af" />
                  <Text style={styles.tabEmptyTitle}>No events hosted yet</Text>
                  <Text style={styles.tabEmptyText}>
                    Create your first event and share it with the world.
                  </Text>
                  <PrimaryButton
                    label="Create Event"
                    onPress={() => router.push("/users/eventform")}
                  />
                </View>
              )}
            </View>
          )}

          {activeTab === "past" && (
            <View style={styles.tabContent}>
              {(user?.registeredEvents || []).length > 0 ? (
                <View style={styles.eventsGrid}>
                  {(user.registeredEvents || []).map((event, idx) => (
                    <NeuCard key={idx} style={styles.eventMiniCard}>
                      <View style={styles.eventMiniImagePlaceholder}>
                        <Bookmark size={24} color="#9ca3af" />
                      </View>
                      <Text style={styles.eventMiniTitle} numberOfLines={1}>
                        {event.name}
                      </Text>
                      <Text style={styles.eventMiniVenue} numberOfLines={1}>
                        {event.venue}
                      </Text>
                    </NeuCard>
                  ))}
                </View>
              ) : (
                <View style={styles.tabEmptyState}>
                  <Calendar size={48} color="#9ca3af" />
                  <Text style={styles.tabEmptyTitle}>No events registered</Text>
                  <Text style={styles.tabEmptyText}>
                    Explore upcoming events and join the fun.
                  </Text>
                  <PrimaryButton
                    label="Explore Events"
                    variant="secondary"
                    onPress={() => router.push("/(app)/dashboard")}
                  />
                </View>
              )}
            </View>
          )}

          {activeTab === "followers" && (
            <View style={styles.tabContent}>
              <View style={styles.tabEmptyState}>
                <Users size={48} color="#9ca3af" />
                <Text style={styles.tabEmptyTitle}>No followers yet</Text>
                <Text style={styles.tabEmptyText}>
                  Share your profile to grow your network.
                </Text>
              </View>
            </View>
          )}
        </NeuCard>

        <View style={{ height: 120 }} />
      </ScrollView>

      <InterestsModal
        isOpen={showInterestsModal}
        currentInterests={editableInterests}
        onClose={() => setShowInterestsModal(false)}
        onSave={(nextInterests) => {
          setEditableInterests(nextInterests);
          if (user) {
            setUser({ ...user, interests: nextInterests });
          }
        }}
      />
    </Screen>
  );
}

const getStyles = (theme) =>
  StyleSheet.create({
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
    profileCard: {
      padding: 24,
      alignItems: "center",
      marginBottom: 16,
    },
    avatarContainer: {
      marginBottom: 16,
    },
    avatar: {
      width: 112,
      height: 112,
      borderRadius: 56,
    },
    avatarPlaceholder: {
      width: 112,
      height: 112,
      borderRadius: 56,
      alignItems: "center",
      justifyContent: "center",
    },
    displayName: {
      fontSize: 20,
      fontWeight: "800",
      fontFamily: "SpaceGrotesk_700Bold",
      color: theme.colors.text,
      marginBottom: 4,
    },
    username: {
      fontSize: 14,
      fontWeight: "500",
      color: theme.colors.brand,
      marginBottom: 12,
    },
    bio: {
      fontSize: 14,
      color: theme.colors.textMuted,
      textAlign: "center",
      marginBottom: 16,
    },
    metaInfoContainer: {
      gap: 8,
      marginBottom: 20,
    },
    metaInfoItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    metaEmoji: {
      fontSize: 16,
    },
    metaInfoText: {
      fontSize: 14,
      color: theme.colors.textMuted,
    },
    tabsContainer: {
      padding: 4,
      flexDirection: "row",
      gap: 4,
      marginBottom: 16,
    },
    tabButton: {
      flex: 1,
      alignItems: "center",
      paddingVertical: 10,
      borderRadius: 12,
    },
    tabButtonActive: {
      backgroundColor: theme.colors.surface,
      shadowColor: "#c5cad4",
      shadowOffset: { width: 2, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 4,
      elevation: 4,
    },
    tabButtonText: {
      fontSize: 13,
      fontWeight: "600",
      color: theme.colors.textSubtle,
    },
    tabButtonTextActive: {
      color: theme.colors.brand,
    },
    contentCard: {
      padding: 20,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 12,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.8,
      color: theme.colors.textSubtle,
    },
    editButton: {
      paddingVertical: 6,
      paddingHorizontal: 12,
    },
    editButtonText: {
      fontSize: 13,
      fontWeight: "600",
      color: theme.colors.brand,
    },
    interestsContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginBottom: 20,
    },
    interestPill: {
      backgroundColor: theme.colors.surface,
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 16,
    },
    interestPillActive: {
      backgroundColor: theme.colors.brand,
    },
    interestPillText: {
      fontSize: 13,
      fontWeight: "600",
      color: theme.colors.textMuted,
    },
    interestPillTextActive: {
      color: theme.colors.surface,
    },
    emptyInterests: {
      padding: 24,
      alignItems: "center",
      borderRadius: 20,
      marginBottom: 20,
    },
    emptyInterestsText: {
      fontSize: 14,
      color: theme.colors.textSubtle,
      textAlign: "center",
    },
    divider: {
      height: 1,
      backgroundColor: "#d1d5db",
      marginVertical: 20,
    },
    statsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
    },
    statCard: {
      flex: 1,
      minWidth: "45%",
      padding: 16,
      alignItems: "center",
    },
    statValue: {
      fontSize: 24,
      fontWeight: "800",
      fontFamily: "SpaceGrotesk_700Bold",
      color: theme.colors.text,
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 11,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.8,
      color: theme.colors.textSubtle,
    },
    tabContent: {
      minHeight: 300,
    },
    tabEmptyState: {
      alignItems: "center",
      paddingVertical: 40,
      gap: 12,
    },
    tabEmptyTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: theme.colors.text,
    },
    tabEmptyText: {
      fontSize: 14,
      color: theme.colors.textSubtle,
      textAlign: "center",
      marginBottom: 16,
    },
    eventsGrid: {
      gap: 12,
    },
    eventMiniCard: {
      padding: 16,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    eventMiniImagePlaceholder: {
      width: 56,
      height: 56,
      borderRadius: 16,
      backgroundColor: theme.colors.surface,
      alignItems: "center",
      justifyContent: "center",
    },
    eventMiniTitle: {
      fontSize: 14,
      fontWeight: "700",
      color: theme.colors.text,
    },
    eventMiniVenue: {
      fontSize: 12,
      color: theme.colors.textSubtle,
    },
    modalBackdrop: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
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
  });
