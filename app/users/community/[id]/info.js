import React, { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Image } from "react-native";
import { Info, Shield, Users, BookOpen } from "lucide-react-native";
import { Screen, BackButton, NeuCard } from "../../../../components";
import { useTheme } from "../../../../theme/ThemeProvider";
import { getUserToken } from "../../../../lib/auth";
import { API_URL } from "../../../../lib/config";

export default function CommunityInfoScreen() {
  const { id: communityId } = useLocalSearchParams();
  const router = useRouter();
  const { theme } = useTheme();

  const [community, setCommunity] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!communityId) return;
    let alive = true;

    const loadInfo = async () => {
      try {
        const token = await getUserToken();
        if (!token) {
          router.replace("/users/signin");
          return;
        }

        const res = await fetch(`${API_URL}/community/details/${communityId}`);
        if (!res.ok) {
          router.back();
          return;
        }
        const data = await res.json();
        if (alive) setCommunity(data);

        // Fetch Member details
        if (data.members && data.members.length > 0) {
          const promises = data.members.map(async (mId) => {
            const mRes = await fetch(`${API_URL}/user/profile/${mId}`);
            if (mRes.ok) return await mRes.json();
            return null;
          });
          const resolved = await Promise.all(promises);
          if (alive) setMembers(resolved.filter((m) => m !== null));
        }
      } catch (e) {
        console.error("Error loading community info:", e);
      } finally {
        if (alive) setLoading(false);
      }
    };

    loadInfo();
    return () => {
      alive = false;
    };
  }, [communityId]);

  if (loading) {
    return (
      <Screen scrollable={false}>
        <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
          <ActivityIndicator size="large" color={theme.colors.brand} />
        </View>
      </Screen>
    );
  }

  const rulesList = community?.rules ? (typeof community.rules === "string" ? community.rules.split("\n").filter(Boolean) : community.rules) : [];

  return (
    <Screen padded={false}>
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        {/* Header */}
        <View style={styles.header}>
          <BackButton label="Chat" />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Main profile card */}
          <NeuCard style={[styles.mainCard, { backgroundColor: theme.colors.surface }]}>
            <View style={[styles.avatarPlaceholder, { backgroundColor: theme.colors.surfaceElevated }]}>
              {community?.profileImage ? (
                <Image source={{ uri: community.profileImage }} style={styles.avatarImg} />
              ) : (
                <Text style={[styles.avatarText, { color: theme.colors.brand }]}>
                  {community?.name?.substring(0, 2).toUpperCase()}
                </Text>
              )}
            </View>
            <Text style={[styles.name, { color: theme.colors.text }]}>{community?.name}</Text>
            <View style={[styles.badge, { backgroundColor: theme.colors.surfaceElevated }]}>
              <Text style={[styles.badgeText, { color: theme.colors.textSubtle }]}>
                {community?.category || "General"}
              </Text>
            </View>
            <Text style={[styles.desc, { color: theme.colors.textMuted }]}>
              {community?.description || "No description provided."}
            </Text>
          </NeuCard>

          {/* Rules Section */}
          {rulesList.length > 0 ? (
            <View style={styles.section}>
              <View style={styles.sectionTitleRow}>
                <BookOpen size={18} color={theme.colors.brand} />
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Rules</Text>
              </View>
              <NeuCard style={[styles.card, { backgroundColor: theme.colors.surface }]}>
                {rulesList.map((rule, idx) => (
                  <View key={idx} style={[styles.ruleItem, idx > 0 && { borderTopWidth: 1, borderTopColor: theme.colors.border }]}>
                    <Text style={[styles.ruleNum, { color: theme.colors.brand }]}>{idx + 1}</Text>
                    <Text style={[styles.ruleText, { color: theme.colors.textMuted }]}>{rule}</Text>
                  </View>
                ))}
              </NeuCard>
            </View>
          ) : null}

          {/* Members List */}
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <Users size={18} color={theme.colors.brand} />
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Members ({members.length})
              </Text>
            </View>
            <NeuCard style={[styles.card, { backgroundColor: theme.colors.surface }]}>
              {members.map((member, idx) => (
                <View
                  key={member._id}
                  style={[
                    styles.memberItem,
                    idx > 0 && { borderTopWidth: 1, borderTopColor: theme.colors.border },
                  ]}
                >
                  <View style={[styles.memberAvatar, { backgroundColor: theme.colors.surfaceElevated }]}>
                    {member.avatar ? (
                      <Image source={{ uri: member.avatar }} style={styles.avatarImg} />
                    ) : (
                      <Text style={[styles.memberAvatarText, { color: theme.colors.brand }]}>
                        {member.username?.substring(0, 2).toUpperCase()}
                      </Text>
                    )}
                  </View>
                  <View style={styles.memberInfo}>
                    <Text style={[styles.memberName, { color: theme.colors.text }]}>
                      {member.name || member.username}
                    </Text>
                    <Text style={[styles.memberUsername, { color: theme.colors.textSubtle }]}>
                      @{member.username}
                    </Text>
                  </View>
                  {String(community?.creator?._id || community?.creator) === String(member._id) ? (
                    <View style={[styles.creatorBadge, { backgroundColor: "rgba(59, 130, 246, 0.15)" }]}>
                      <Text style={{ fontSize: 10, color: theme.colors.brand, fontWeight: "700" }}>
                        CREATOR
                      </Text>
                    </View>
                  ) : null}
                </View>
              ))}
            </NeuCard>
          </View>
        </ScrollView>
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
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 20,
  },
  mainCard: {
    padding: 24,
    alignItems: "center",
  },
  avatarPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    overflow: "hidden",
  },
  avatarImg: {
    width: "100%",
    height: "100%",
  },
  avatarText: {
    fontSize: 28,
    fontWeight: "800",
  },
  name: {
    fontSize: 22,
    fontWeight: "800",
    fontFamily: "SpaceGrotesk_700Bold",
    marginBottom: 8,
    textAlign: "center",
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 16,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  desc: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  section: {
    gap: 10,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "SpaceGrotesk_700Bold",
  },
  card: {
    padding: 8,
  },
  ruleItem: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
  },
  ruleNum: {
    fontSize: 15,
    fontWeight: "800",
  },
  ruleText: {
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  memberItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 12,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  memberAvatarText: {
    fontSize: 13,
    fontWeight: "700",
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 14,
    fontWeight: "700",
  },
  memberUsername: {
    fontSize: 12,
  },
  creatorBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
});
