import { useTheme } from "../../theme/ThemeProvider.js";
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  Image,
  Platform,
  StatusBar,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  Users,
  Plus,
  ChevronRight,
  ChevronLeft,
  Search,
  AddUser,
  CheckSquare,
  LogOut,
  Delete,
  Lock,
  Upload,
} from "lucide-react-native";
import {
  Screen,
  NeuCard,
  NeuInset,
  ConfirmModal,
  TextField,
  SkeletonLoader,
  Toast,
} from "../../components/index";
import { radius, spacing } from "../../theme/tokens";
import CommunityAvatar from "../../components/CommunityAvatar";
import { API_URL } from "../../lib/config";
import { getUserToken } from "../../lib/auth";
import * as FileSystem from "expo-file-system/legacy";
import { authenticatedFetch } from "../../lib/api";

let ImagePicker = null;
try { ImagePicker = require("expo-image-picker"); } catch {}

const COMMUNITY_STEP_NAMES = ["Identity", "Details", "Icon"];
const COMMUNITY_CATEGORIES = [
  "Tech", "Music", "Sports", "Art", "Science", "Business",
  "Gaming", "Health", "Food", "Travel", "Politics", "Education",
  "Fashion", "Film", "Literature", "Dance", "Comedy", "Other",
];

const PRESET_ICONS = [
  "🏛️",
  "🏀",
  "🎨",
  "🔬",
  "🎵",
  "📚",
  "💻",
  "🎭",
  "🌱",
  "🚀",
  "💼",
  "🎮",
  "⚽",
  "🍔",
  "🎬",
  "🎤",
];

const CommunityCard = ({
  community,
  isMember,
  isCreator,
  onJoin,
  onEnter,
  onLeave,
  onDelete,
  recentMessage,
  recentMessageAuthorName,
  isPrivateJoinable,
}) => {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const isPrivate = community.isPrivate;
  const memberCount = (community.members || []).length;
  const hasImageUrl = community.profileImage?.startsWith?.("http");

  const handleCardClick = () => {
    if (isMember) return onEnter(community._id);
    if (isPrivate && !isPrivateJoinable) return;
    onJoin(community._id, isPrivate);
  };

  return (
    <TouchableOpacity
      style={[styles.communityCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
      onPress={handleCardClick}
      activeOpacity={0.93}
    >
      {/* Banner */}
      <View style={styles.cardBanner}>
        {hasImageUrl ? (
          <Image source={{ uri: community.profileImage }} style={styles.cardBannerImg} resizeMode="cover" />
        ) : (
          <View style={[styles.cardBannerPlaceholder, { backgroundColor: theme.colors.navSurface }]}>
            <Text style={styles.cardBannerEmoji}>{community.profileImage || "🏛️"}</Text>
          </View>
        )}
        {hasImageUrl && <View style={styles.cardBannerScrim} />}
        {hasImageUrl && <View style={styles.cardBannerBlur} />}
        <View style={styles.cardBannerContent}>
          <View style={{ flex: 1 }}>
            <Text
              style={[styles.cardBannerTitle, { color: hasImageUrl ? "#fff" : "#374151" }]}
              numberOfLines={1}
            >{community.name}</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
              <View style={[styles.membersPill, !hasImageUrl && { backgroundColor: theme.colors.surfaceMuted }]}>
                <Users size={10} color={hasImageUrl ? "rgba(255,255,255,0.7)" : theme.colors.textSubtle} />
                <Text style={[styles.membersPillText, !hasImageUrl && { color: theme.colors.textSubtle }]}>
                  {memberCount} {memberCount === 1 ? "member" : "members"}
                </Text>
              </View>
              {isPrivate && (
                <View style={styles.privatePill}>
                  <Lock size={9} color={theme.colors.brand} />
                  <Text style={styles.privatePillText}>Private</Text>
                </View>
              )}
            </View>
          </View>
          {isMember && (
            <View style={styles.joinedBadge}>
              <Text style={styles.joinedBadgeText}>✓ Joined</Text>
            </View>
          )}
        </View>
      </View>

      {/* Body */}
      <View style={styles.cardBody}>
        {isMember && recentMessage ? (
          <View style={[styles.recentMessage, { backgroundColor: theme.colors.surfaceMuted }]}>
            <Text style={[styles.recentMessageAuthor, { color: theme.colors.brand }]} numberOfLines={1}>
              {recentMessageAuthorName || "Someone"}
            </Text>
            <Text style={[styles.recentMessageText, { color: theme.colors.textMuted }]} numberOfLines={1}>
              {recentMessage.image && !recentMessage.content ? "📷 Photo" : recentMessage.content}
            </Text>
          </View>
        ) : (
          <Text style={[styles.communityDescription, { color: theme.colors.textSubtle }]} numberOfLines={2}>
            {community.description || "No description yet."}
          </Text>
        )}

        <View style={styles.communityActions}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              isMember
                ? { backgroundColor: theme.colors.surfaceMuted }
                : isPrivate && !isPrivateJoinable
                ? { backgroundColor: theme.colors.surfaceMuted, opacity: 0.5 }
                : { backgroundColor: theme.colors.brand },
            ]}
            onPress={(e) => {
              e.stopPropagation();
              if (isMember) return onEnter(community._id);
              if (isPrivate && !isPrivateJoinable) return;
              onJoin(community._id, isPrivate);
            }}
            disabled={isPrivate && !isPrivateJoinable && !isMember}
          >
            {isMember ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Text style={[styles.actionButtonText, { color: theme.colors.brand }]}>Open Chat</Text>
                <ChevronRight size={14} color={theme.colors.brand} />
              </View>
            ) : isPrivate && !isPrivateJoinable ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Lock size={12} color={theme.colors.textSubtle} />
                <Text style={[styles.actionButtonText, { color: theme.colors.textSubtle }]}>Private</Text>
              </View>
            ) : (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Text style={[styles.actionButtonText, { color: theme.colors.textOnBrand }]}>Join Community</Text>
                <Plus size={13} color={theme.colors.textOnBrand} />
              </View>
            )}
          </TouchableOpacity>
          {isCreator ? (
            <TouchableOpacity
              style={[styles.iconAction, { backgroundColor: "rgba(239,68,68,0.1)" }]}
              onPress={(e) => {
                e.stopPropagation();
                onDelete({ type: "delete", id: community._id, name: community.name });
              }}
            >
              <Delete size={16} color="#ef4444" />
            </TouchableOpacity>
          ) : isMember ? (
            <TouchableOpacity
              style={[styles.iconAction, { backgroundColor: theme.colors.surfaceMuted }]}
              onPress={(e) => {
                e.stopPropagation();
                onLeave({ type: "leave", id: community._id, name: community.name });
              }}
            >
              <LogOut size={16} color={theme.colors.textSubtle} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const UserCard = ({ user, onFollow, onUnfollow, isFollowing, isFriend, router }) => {
  const { theme } = useTheme();
  return (
    <TouchableOpacity
      style={{
        flexDirection: "row", alignItems: "center", gap: 14,
        padding: 14, borderRadius: 20,
        backgroundColor: theme.colors.surface,
        borderWidth: 1, borderColor: theme.colors.border,
      }}
      onPress={() => router.push(`/users/u/${user._id}`)}
      activeOpacity={0.85}
    >
      <View style={{
        width: 52, height: 52, borderRadius: 26,
        backgroundColor: theme.colors.brandTint,
        alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        {user.avatar ? (
          <Text style={{ fontSize: 22, fontWeight: "700", color: theme.colors.text }}>
            {user.username?.charAt(0).toUpperCase()}
          </Text>
        ) : (
          <Users size={22} color={theme.colors.textSubtle} />
        )}
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontSize: 15, fontWeight: "700", fontFamily: "SpaceGrotesk_700Bold", color: theme.colors.text }} numberOfLines={1}>
          {user.username || "User"}
        </Text>
        <Text style={{ fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.7, color: theme.colors.textSubtle, marginTop: 2 }}>
          {user.role}
        </Text>
        {user.bio && (
          <Text style={{ fontSize: 12, color: theme.colors.textSubtle, marginTop: 3 }} numberOfLines={1}>
            {user.bio}
          </Text>
        )}
      </View>
      <TouchableOpacity
        style={{
          paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12,
          backgroundColor: isFriend ? "rgba(61,158,74,0.12)" : isFollowing ? theme.colors.surfaceMuted : theme.colors.brand,
          borderWidth: isFriend || isFollowing ? 1 : 0,
          borderColor: isFriend ? theme.colors.success : theme.colors.border,
        }}
        onPress={(e) => { e.stopPropagation(); isFollowing ? onUnfollow(user._id) : onFollow(user._id); }}
      >
        <Text style={{ fontSize: 12, fontWeight: "700", fontFamily: "PlusJakartaSans_700Bold", color: isFriend ? theme.colors.success : isFollowing ? theme.colors.brand : "#1A1A14" }}>
          {isFriend ? "Friends" : isFollowing ? "Following" : "Follow"}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

export default function CommunityScreen() {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("communities");
  const [communities, setCommunities] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateConfirm, setShowCreateConfirm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [createStep, setCreateStep] = useState(1);
  const isSubmittingRef = useRef(false);

  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newRules, setNewRules] = useState("");
  const [newImage, setNewImage] = useState("🏛️");
  const [isCustomImage, setIsCustomImage] = useState(false);
  const [newIsPrivate, setNewIsPrivate] = useState(false);
  const [privateCodeInput, setPrivateCodeInput] = useState("");
  const [isJoiningByCode, setIsJoiningByCode] = useState(false);
  const [searchedPrivateCommunity, setSearchedPrivateCommunity] =
    useState(null);
  const [searchingCode, setSearchingCode] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [message, setMessage] = useState(null);
  const insets = useSafeAreaInsets();
  const [confirmModal, setConfirmModal] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recentMessages, setRecentMessages] = useState({});
  const [recentMessageAuthors, setRecentMessageAuthors] = useState({});

  const fetchUserDetails = async (token) => {
    try {
      const res = await fetch(`${API_URL}/user/details`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_token: token }),
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        return data;
      }
    } catch (e) {
      console.error(e);
    }
    return null;
  };

  const fetchCommunities = async (currentUser) => {
    try {
      const publicRes = await fetch(`${API_URL}/community/all`);
      const publicData = publicRes.ok ? await publicRes.json() : [];
      let userCommunities = [];
      const uid = currentUser?._id || user?._id;
      if (uid) {
        const userRes = await fetch(`${API_URL}/community/user/${uid}`);
        if (userRes.ok) {
          userCommunities = await userRes.json();
        }
      }
      const merged = [...publicData];
      for (const uc of userCommunities) {
        if (!merged.some((c) => c._id === uc._id)) {
          merged.push(uc);
        }
      }
      setCommunities(merged);
      return merged;
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
    return [];
  };

  const fetchRecentMessages = async (communityList, currentUser) => {
    if (!currentUser) return;
    const userId = String(currentUser._id);
    const joined = communityList.filter((c) => {
      const creatorId = c.creator?._id
        ? String(c.creator._id)
        : String(c.creator);
      return (
        creatorId === userId ||
        (c.members || []).some((m) => String(m) === userId)
      );
    });

    const results = {};
    await Promise.all(
      joined.map(async (c) => {
        try {
          const res = await fetch(
            `${API_URL}/community/posts/${c._id}?parentPostId=null&limit=1`,
          );
          if (res.ok) {
            const posts = await res.json();
            if (posts.length > 0) {
              const sorted = posts
                .slice()
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
              results[c._id] = sorted[0];
            }
          }
        } catch (e) {
          /* silent */
        }
      }),
    );
    setRecentMessages(results);
  };

  const searchUsers = async (query) => {
    try {
      const res = await fetch(`${API_URL}/social/search?query=${query}`);
      if (res.ok) {
        const data = await res.json();
        const filtered = data.filter((u) => u._id !== user?._id);
        setUsers(filtered);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const resetCreateForm = () => {
    setNewName("");
    setNewDesc("");
    setNewCategory("");
    setNewRules("");
    setNewImage("🏛️");
    setIsCustomImage(false);
    setNewIsPrivate(false);
    setCreateStep(1);
    setShowCreateConfirm(false);
  };

  const handleUploadCommunityImage = async () => {
    if (!ImagePicker) {
      alert("Image picker not available. Please rebuild the app.");
      return;
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      alert("Permission to access photos is required.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    setIsUploading(true);
    try {
      const token = await getUserToken();
      const res = await FileSystem.uploadAsync(`${API_URL}/upload/image`, asset.uri, {
        httpMethod: "POST",
        uploadType: 1,
        fieldName: "file",
        mimeType: asset.mimeType || "image/jpeg",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.status >= 200 && res.status < 300) {
        const data = JSON.parse(res.body);
        const url = data.url || data.secure_url;
        if (url) {
          setNewImage(url);
          setIsCustomImage(true);
        } else {
          alert("Upload succeeded but no URL returned.");
        }
      } else {
        alert("Image upload failed. Please try again.");
      }
    } catch {
      alert("Upload error. Check your connection.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreate = async () => {
    if (!user || isUploading || isProcessing || createStep !== 3) return;
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsProcessing(true);
    try {
      const token = await getUserToken();
      const res = await authenticatedFetch("/community/create", {
        method: "POST",
        body: JSON.stringify({
          name: newName,
          description: newDesc,
          profileImage: newImage,
          category: newCategory,
          isPrivate: newIsPrivate,
          rules: newRules.split("\n").filter((rule) => rule.trim() !== ""),
          user_token: token,
          userId: user._id,
          organizerId: user._id,
          ownerId: user._id,
          user: user._id,
          id: user._id,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setShowCreateModal(false);
        resetCreateForm();
        fetchCommunities();
        fetchUserDetails(token);
        if (newIsPrivate && data.community?.accessCode) {
          setMessage({
            type: "success",
            text: `Private community created! Access code: ${data.community.accessCode}`,
          });
        } else {
          setMessage({
            type: "success",
            text: "Community created successfully",
          });
        }
      } else {
        const data = await res.json();
        setMessage({
          type: "error",
          text: data.msg || "Failed to create community",
        });
      }
    } catch (e) {
      console.error(e);
      setMessage({ type: "error", text: "Error creating community" });
    } finally {
      setIsProcessing(false);
      isSubmittingRef.current = false;
    }
  };

  const handleJoinByCode = async (codeParam = null) => {
    const code = (codeParam || privateCodeInput).trim().toUpperCase();
    if (!code || !/^UHB-C-\d{3}-\d{3}-\d{3}$/.test(code)) {
      setMessage({
        type: "error",
        text: "Enter a valid code (e.g. UHB-C-001-042-387)",
      });
      return;
    }
    setIsJoiningByCode(true);
    try {
      const token = await getUserToken();
      const res = await fetch(`${API_URL}/community/join-by-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ accessCode: code, user_token: token, userId: user?._id }),
      });
      const data = await res.json();
      if (res.ok) {
        setPrivateCodeInput("");
        setSearchTerm("");
        await fetchCommunities();
        if (user?._id) await fetchRecentMessages(communities, user);
        setMessage({
          type: "success",
          text: `Joined ${data.community?.name || "community"}!`,
        });
      } else {
        setMessage({
          type: "error",
          text: data.msg || "Invalid or unknown access code",
        });
      }
    } catch (e) {
      console.error(e);
      setMessage({ type: "error", text: "Error joining community" });
    } finally {
      setIsJoiningByCode(false);
    }
  };

  const handleJoin = async (communityId) => {
    try {
      const token = await getUserToken();
      const res = await fetch(`${API_URL}/community/join/${communityId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ user_token: token, userId: user?._id }),
      });
      const data = await res.json();
      if (res.ok) {
        setCommunities((prev) =>
          prev.map((c) => {
            if (c._id === communityId) {
              const newMembers = c.members ? [...c.members] : [];
              if (user?._id && !newMembers.includes(user._id)) {
                newMembers.push(user._id);
              }
              return { ...c, members: newMembers };
            }
            return c;
          }),
        );
        setMessage({ type: "success", text: "Joined community successfully" });
      } else {
        setMessage({
          type: "error",
          text: data.msg || "Failed to join community",
        });
      }
    } catch (e) {
      console.error(e);
      setMessage({ type: "error", text: "Error joining community" });
    }
  };

  const handleFollow = async (targetUserId) => {
    try {
      const res = await authenticatedFetch("/social/follow", {
        method: "POST",
        body: JSON.stringify({
          targetUserId,
          user_token: await getUserToken(),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setUser((prev) => ({
          ...prev,
          following: [...(prev.following || []), targetUserId],
          friends: data.isFriend
            ? [...(prev.friends || []), targetUserId]
            : prev.friends || [],
        }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUnfollow = async (targetUserId) => {
    try {
      const res = await authenticatedFetch("/social/unfollow", {
        method: "POST",
        body: JSON.stringify({
          targetUserId,
          user_token: await getUserToken(),
        }),
      });
      if (res.ok) {
        setUser((prev) => ({
          ...prev,
          following: (prev.following || []).filter((id) => id !== targetUserId),
          friends: (prev.friends || []).filter((id) => id !== targetUserId),
        }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleLeave = async () => {
    if (!confirmModal) return;
    setIsProcessing(true);
    try {
      const res = await authenticatedFetch(
        `/community/leave/${confirmModal.id}`,
        {
          method: "POST",
        },
      );
      if (res.ok) {
        setCommunities((prev) =>
          prev.map((c) => {
            if (c._id === confirmModal.id) {
              return { ...c, members: c.members.filter((m) => m !== user._id) };
            }
            return c;
          }),
        );
        setMessage({ type: "success", text: "Left community successfully" });
      } else {
        const data = await res.json();
        setMessage({
          type: "error",
          text: data.msg || "Failed to leave community",
        });
      }
    } catch (e) {
      console.error(e);
      setMessage({ type: "error", text: "Error leaving community" });
    } finally {
      setIsProcessing(false);
      setConfirmModal(null);
    }
  };

  const handleDeleteCommunity = async () => {
    if (!confirmModal) return;
    setIsProcessing(true);
    try {
      const res = await authenticatedFetch(`/community/${confirmModal.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setCommunities((prev) => prev.filter((c) => c._id !== confirmModal.id));
        setMessage({ type: "success", text: "Community deleted successfully" });
      } else {
        const data = await res.json();
        setMessage({
          type: "error",
          text: data.msg || "Failed to delete community",
        });
      }
    } catch (e) {
      console.error(e);
      setMessage({ type: "error", text: "Error deleting community" });
    } finally {
      setIsProcessing(false);
      setConfirmModal(null);
    }
  };

  useEffect(() => {
    const init = async () => {
      const token = await getUserToken();
      if (!token) {
        router.push("/(auth)/signin");
        return;
      }
      const fetchedUser = await fetchUserDetails(token);
      if (fetchedUser) {
        const fetchedCommunities = await fetchCommunities(fetchedUser);
        if (fetchedCommunities.length > 0) {
          await fetchRecentMessages(fetchedCommunities, fetchedUser);
        }
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (activeTab === "users" && searchTerm.length > 2) {
      const timeout = setTimeout(() => searchUsers(searchTerm), 500);
      return () => clearTimeout(timeout);
    }
  }, [searchTerm, activeTab]);

  useEffect(() => {
    const term = searchTerm.trim();
    if (
      activeTab === "communities" &&
      /^UHB-C-\d{3}-\d{3}-\d{3}$/i.test(term)
    ) {
      const fetchPrivate = async () => {
        setSearchingCode(true);
        try {
          const res = await fetch(
            `${API_URL}/community/code/${term.toUpperCase()}`,
            {
              headers: {
                Authorization: `Bearer ${await getUserToken()}`,
              },
            },
          );
          if (res.ok) {
            const data = await res.json();
            setSearchedPrivateCommunity(data);
          } else {
            setSearchedPrivateCommunity(null);
          }
        } catch (e) {
          console.error(e);
          setSearchedPrivateCommunity(null);
        } finally {
          setSearchingCode(false);
        }
      };
      fetchPrivate();
    } else {
      setSearchedPrivateCommunity(null);
    }
  }, [searchTerm, activeTab]);

  if (loading) {
    return (
      <Screen padded>
        <View style={{ gap: 6, marginBottom: 28, marginTop: 8 }}>
          <View style={{ width: 80,  height: 11, borderRadius: radius.xs, backgroundColor: "#e5e7eb", opacity: 0.7 }} />
          <View style={{ width: 160, height: 30, borderRadius: radius.sm, backgroundColor: "#e5e7eb", opacity: 0.7 }} />
        </View>
        <SkeletonLoader variant="card" count={3} />
      </Screen>
    );
  }

  const isCodeSearch = /^UHB-C-\d{3}-\d{3}-\d{3}$/i.test(searchTerm.trim());
  const filteredCommunities =
    isCodeSearch && searchedPrivateCommunity
      ? [searchedPrivateCommunity]
      : communities.filter((c) =>
          c.name.toLowerCase().includes(searchTerm.toLowerCase()),
        );
  const userId = user?._id ? String(user._id) : null;
  const joinedCommunities = filteredCommunities.filter((c) => {
    const creatorId = c.creator?._id
      ? String(c.creator._id)
      : String(c.creator);
    return (
      userId &&
      (creatorId === userId ||
        (c.members || []).some((m) => String(m) === userId))
    );
  });
  const publicCommunities = filteredCommunities.filter((c) => {
    const creatorId = c.creator?._id
      ? String(c.creator._id)
      : String(c.creator);
    const isMember =
      userId &&
      (creatorId === userId ||
        (c.members || []).some((m) => String(m) === userId));
    if (isMember) return false;
    // Only show private communities in Discover if user searched by code
    if (c.isPrivate && !isCodeSearch) return false;
    return true;
  });

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerLabel}>Discover</Text>
          <Text style={styles.headerTitle}>
            {activeTab === "communities" ? "Communities" : "People"}
          </Text>
          <Text style={styles.headerSubtitle}>
            {activeTab === "communities"
              ? "Join groups that match your interests"
              : "Connect with students and organizers"}
          </Text>
        </View>

        <View style={styles.tabsContainer}>
          <View style={styles.tabs}>
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === "communities" && styles.activeTab,
              ]}
              onPress={() => setActiveTab("communities")}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "communities" && styles.activeTabText,
                ]}
              >
                Communities
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === "users" && styles.activeTab]}
              onPress={() => setActiveTab("users")}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "users" && styles.activeTabText,
                ]}
              >
                People
              </Text>
            </TouchableOpacity>
          </View>
          {activeTab === "communities" && (
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => setShowCreateModal(true)}
            >
              <Plus size={20} color="#1A1A14" style={{ marginRight: 4 }} />
              <Text style={styles.createButtonText}>Create Community</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.searchSection}>
          <TextField
            placeholder={
              activeTab === "communities"
                ? "Search communities or paste UHB-C-... code"
                : "Search users by name..."
            }
            value={searchTerm}
            onChangeText={setSearchTerm}
            onSubmitEditing={() => {
              if (activeTab === "communities" && /^UHB-C-/i.test(searchTerm)) {
                setPrivateCodeInput(searchTerm.toUpperCase());
                handleJoinByCode();
                setSearchTerm("");
              }
            }}
            leftIcon={<Search size={18} color={theme.colors.textSubtle} />}
          />
        </View>
        {activeTab === "communities" &&
          /^UHB-C-/i.test(searchTerm) &&
          !isCodeSearch && (
            <NeuInset style={styles.codeJoinContainer}>
              <Text style={styles.codeJoinLabel}>🔒 Private Code</Text>
              <TextInput
                style={styles.codeJoinInput}
                value={privateCodeInput}
                onChangeText={setPrivateCodeInput}
                placeholder="Enter access code"
                autoCapitalize="characters"
              />
              <TouchableOpacity
                style={[
                  styles.codeJoinButton,
                  isJoiningByCode && { opacity: 0.5 },
                ]}
                onPress={() => handleJoinByCode()}
                disabled={isJoiningByCode}
              >
                {isJoiningByCode ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.codeJoinButtonText}>Join</Text>
                )}
              </TouchableOpacity>
            </NeuInset>
          )}

        {activeTab === "communities" ? (
          <View style={styles.communitiesContainer}>
            {isCodeSearch && searchingCode && (
              <View style={styles.searchingContainer}>
                <Text style={styles.searchingText}>
                  Searching for private community...
                </Text>
              </View>
            )}
            {isCodeSearch && !searchingCode && !searchedPrivateCommunity && (
              <View style={styles.notFoundContainer}>
                <Text style={styles.notFoundText}>
                  No private community found with code "
                  {searchTerm.toUpperCase()}".
                </Text>
              </View>
            )}
            {joinedCommunities.length > 0 && (
              <View style={[styles.section, { marginTop: 6 }]}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Joined</Text>
                  <View style={styles.sectionCount}>
                    <Text style={styles.sectionCountText}>
                      {joinedCommunities.length}
                    </Text>
                  </View>
                </View>
                <View style={styles.communitiesGrid}>
                  {joinedCommunities.map((community) => (
                    <View key={community._id} style={styles.communityGridItem}>
                      <CommunityCard
                        community={community}
                        isMember={true}
                        isCreator={
                          userId &&
                          String(
                            community.creator?._id || community.creator,
                          ) === userId
                        }
                        recentMessage={recentMessages[community._id]}
                        recentMessageAuthorName={
                          recentMessages[community._id]?.authorName || "Someone"
                        }
                        onJoin={handleJoin}
                        onEnter={(id) => router.push(`/users/community/${id}`)}
                        onLeave={setConfirmModal}
                        onDelete={setConfirmModal}
                        isPrivateJoinable={community.isPrivate && isCodeSearch}
                      />
                    </View>
                  ))}
                </View>
              </View>
            )}
            {publicCommunities.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>
                    {isCodeSearch ? "Search Result" : "Discover"}
                  </Text>
                  <View style={styles.sectionCount}>
                    <Text style={styles.sectionCountText}>
                      {publicCommunities.length}
                    </Text>
                  </View>
                </View>
                <View style={styles.communitiesGrid}>
                  {publicCommunities.map((community) => (
                    <View key={community._id} style={styles.communityGridItem}>
                      <CommunityCard
                        community={community}
                        isMember={false}
                        isCreator={
                          userId &&
                          String(
                            community.creator?._id || community.creator,
                          ) === userId
                        }
                        onJoin={handleJoin}
                        onEnter={(id) => router.push(`/users/community/${id}`)}
                        onLeave={setConfirmModal}
                        onDelete={setConfirmModal}
                        isPrivateJoinable={community.isPrivate && isCodeSearch}
                      />
                    </View>
                  ))}
                </View>
              </View>
            )}
            {filteredCommunities.length === 0 && !searchingCode && (
              <View style={styles.notFoundContainer}>
                <Text style={styles.notFoundText}>No communities found.</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.usersContainer}>
            {users.length > 0 ? (
              <View style={styles.usersGrid}>
                {users.map((u) => (
                  <View key={u._id} style={styles.userGridItem}>
                    <UserCard
                      user={u}
                      router={router}
                      onFollow={handleFollow}
                      onUnfollow={handleUnfollow}
                      isFollowing={user?.following?.includes(u._id)}
                      isFriend={user?.friends?.includes(u._id)}
                    />
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.notFoundContainer}>
                <Text style={styles.notFoundText}>
                  {searchTerm.length > 2
                    ? "No users found."
                    : "Type at least 3 characters to search."}
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      <Modal visible={showCreateModal} transparent={false} animationType="slide" statusBarTranslucent>
        <View style={[styles.cmScreen, { backgroundColor: theme.colors.background }]}>
          {/* Header */}
          <View style={[styles.cmHeader, { paddingTop: insets.top + 12, backgroundColor: theme.colors.navSurface }]}>
            <TouchableOpacity
              style={styles.cmBackBtn}
              onPress={() => {
                if (createStep > 1) setCreateStep(s => s - 1);
                else { setShowCreateModal(false); resetCreateForm(); }
              }}
            >
              <ChevronLeft size={22} color={theme.colors.text} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cmStepLabel, { color: theme.colors.brand }]}>Step {createStep} of 3</Text>
              <Text style={[styles.cmStepName, { color: theme.colors.text }]}>{COMMUNITY_STEP_NAMES[createStep - 1]}</Text>
            </View>
            <View style={styles.cmPills}>
              {[1, 2, 3].map(s => (
                <View key={s} style={[
                  styles.cmPill,
                  s === createStep && styles.cmPillActive,
                  s < createStep && styles.cmPillDone,
                  s > createStep && styles.cmPillTodo,
                ]} />
              ))}
            </View>
          </View>

          {/* Progress bar */}
          <View style={[styles.cmProgressTrack, { backgroundColor: theme.colors.border }]}>
            <View style={[styles.cmProgressFill, { width: `${(createStep / 3) * 100}%`, backgroundColor: theme.colors.brand }]} />
          </View>

          {/* Step content */}
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.cmContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Step 1: Identity */}
            {createStep === 1 && (
              <View style={styles.cmStepBody}>
                <View style={styles.cmField}>
                  <Text style={[styles.cmLabel, { color: theme.colors.textMuted }]}>Community Name</Text>
                  <TextInput
                    style={[styles.cmInput, { color: theme.colors.text, backgroundColor: theme.colors.surfaceMuted, borderColor: theme.colors.border }]}
                    value={newName}
                    onChangeText={setNewName}
                    placeholder="e.g. Tech Enthusiasts Club"
                    placeholderTextColor={theme.colors.textSubtle}
                  />
                </View>
                <View style={styles.cmField}>
                  <Text style={[styles.cmLabel, { color: theme.colors.textMuted }]}>Description</Text>
                  <TextInput
                    style={[styles.cmInput, styles.cmTextArea, { color: theme.colors.text, backgroundColor: theme.colors.surfaceMuted, borderColor: theme.colors.border }]}
                    value={newDesc}
                    onChangeText={setNewDesc}
                    placeholder="What's this community about?"
                    placeholderTextColor={theme.colors.textSubtle}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>
              </View>
            )}

            {/* Step 2: Details */}
            {createStep === 2 && (
              <View style={styles.cmStepBody}>
                <View style={styles.cmField}>
                  <Text style={[styles.cmLabel, { color: theme.colors.textMuted }]}>Category</Text>
                  <TouchableOpacity
                    style={[styles.cmDropdownBtn, { backgroundColor: theme.colors.surfaceMuted, borderColor: theme.colors.border }]}
                    onPress={() => setShowCategoryDropdown(v => !v)}
                  >
                    <Text style={newCategory ? [styles.cmDropdownText, { color: theme.colors.text }] : [styles.cmDropdownText, { color: theme.colors.textSubtle }]}>
                      {newCategory || "Select a category"}
                    </Text>
                    <ChevronRight size={16} color={theme.colors.textSubtle} style={{ transform: [{ rotate: showCategoryDropdown ? "270deg" : "90deg" }] }} />
                  </TouchableOpacity>
                  {showCategoryDropdown && (
                    <NeuInset style={styles.cmDropdown}>
                      {COMMUNITY_CATEGORIES.map(c => (
                        <TouchableOpacity
                          key={c}
                          style={[styles.cmDropdownItem, { borderBottomColor: theme.colors.border }, newCategory === c && { backgroundColor: theme.colors.brandTint }]}
                          onPress={() => { setNewCategory(c); setShowCategoryDropdown(false); }}
                        >
                          <Text style={[styles.cmDropdownItemText, { color: theme.colors.text }, newCategory === c && { color: theme.colors.brand, fontWeight: "700" }]}>{c}</Text>
                        </TouchableOpacity>
                      ))}
                    </NeuInset>
                  )}
                </View>

                <View style={styles.cmField}>
                  <Text style={[styles.cmLabel, { color: theme.colors.textMuted }]}>
                    Rules <Text style={[styles.cmOptional, { color: theme.colors.textSubtle }]}>(optional)</Text>
                  </Text>
                  <TextInput
                    style={[styles.cmInput, styles.cmTextArea, { color: theme.colors.text, backgroundColor: theme.colors.surfaceMuted, borderColor: theme.colors.border }]}
                    value={newRules}
                    onChangeText={setNewRules}
                    placeholder={"One rule per line:\n• Be respectful\n• No spam"}
                    placeholderTextColor={theme.colors.textSubtle}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>

                <TouchableOpacity
                  style={[styles.cmPrivateRow, { borderColor: newIsPrivate ? theme.colors.brand : theme.colors.border, backgroundColor: newIsPrivate ? theme.colors.brandTint : theme.colors.surfaceMuted }]}
                  onPress={() => setNewIsPrivate(v => !v)}
                >
                  <Lock size={18} color={newIsPrivate ? theme.colors.brand : theme.colors.textSubtle} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cmPrivateTitle, { color: newIsPrivate ? theme.colors.brand : theme.colors.text }]}>Private Community</Text>
                    <Text style={[styles.cmPrivateSub, { color: theme.colors.textSubtle }]}>Members join via invite code only</Text>
                  </View>
                  <View style={[styles.cmToggle, { backgroundColor: newIsPrivate ? theme.colors.brand : theme.colors.border }]}>
                    <View style={[styles.cmToggleThumb, { transform: [{ translateX: newIsPrivate ? 18 : 2 }] }]} />
                  </View>
                </TouchableOpacity>
              </View>
            )}

            {/* Step 3: Icon */}
            {createStep === 3 && (
              <View style={styles.cmStepBody}>
                <View style={styles.cmField}>
                  <Text style={[styles.cmLabel, { color: theme.colors.textMuted }]}>Choose an Icon</Text>
                  <View style={styles.cmIconGrid}>
                    {PRESET_ICONS.map(icon => (
                      <TouchableOpacity
                        key={icon}
                        style={[styles.cmIconOpt, { backgroundColor: theme.colors.surfaceMuted, borderColor: theme.colors.border }, newImage === icon && { backgroundColor: theme.colors.brandTint, borderColor: theme.colors.brand, borderWidth: 2 }]}
                        onPress={() => { setNewImage(icon); setIsCustomImage(false); }}
                      >
                        <Text style={styles.cmIconEmoji}>{icon}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.cmUploadBtn, { borderColor: theme.colors.border, opacity: isUploading ? 0.5 : 1 }]}
                  onPress={handleUploadCommunityImage}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <ActivityIndicator size="small" color={theme.colors.brand} />
                  ) : (
                    <Upload size={18} color={theme.colors.brand} />
                  )}
                  <Text style={[styles.cmUploadText, { color: theme.colors.brand }]}>
                    {isUploading ? "Uploading…" : isCustomImage ? "Change Image" : "Upload Custom Image"}
                  </Text>
                </TouchableOpacity>

                <View style={[styles.cmPreviewCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                  <View style={[styles.cmPreviewIcon, { backgroundColor: theme.colors.navSurface, overflow: "hidden" }]}>
                    {isCustomImage && newImage?.startsWith("http") ? (
                      <Image source={{ uri: newImage }} style={{ width: "100%", height: "100%", borderRadius: radius.md }} resizeMode="cover" />
                    ) : (
                      <Text style={{ fontSize: 34 }}>{newImage}</Text>
                    )}
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={[styles.cmPreviewName, { color: theme.colors.text }]} numberOfLines={1}>
                      {newName || "Community Name"}
                    </Text>
                    <Text style={[styles.cmPreviewCat, { color: theme.colors.brand }]}>
                      {newCategory || "Category"}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Navigation */}
          <View style={[styles.cmNavRow, { borderTopColor: theme.colors.border, backgroundColor: theme.colors.background, paddingBottom: insets.bottom + 8 }]}>
            <TouchableOpacity
              style={styles.cmNavGhost}
              onPress={() => {
                if (createStep > 1) setCreateStep(s => s - 1);
                else { setShowCreateModal(false); resetCreateForm(); }
              }}
            >
              <ChevronLeft size={18} color={theme.colors.brand} />
              <Text style={[styles.cmNavGhostText, { color: theme.colors.brand }]}>{createStep === 1 ? "Cancel" : "Back"}</Text>
            </TouchableOpacity>

            {createStep < 3 ? (
              <TouchableOpacity
                style={[styles.cmNavPrimary, { backgroundColor: theme.colors.brand }, ((createStep === 1 && !newName.trim()) || (createStep === 2 && !newCategory.trim())) && { opacity: 0.4 }]}
                onPress={() => setCreateStep(s => Math.min(3, s + 1))}
                disabled={(createStep === 1 && !newName.trim()) || (createStep === 2 && !newCategory.trim())}
              >
                <Text style={styles.cmNavPrimaryText}>Next Step</Text>
                <ChevronRight size={18} color="#1A1A14" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.cmNavPrimary, { backgroundColor: theme.colors.brand }, isProcessing && { opacity: 0.5 }]}
                onPress={handleCreate}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator size="small" color="#1A1A14" />
                ) : (
                  <>
                    <Text style={styles.cmNavPrimaryText}>Create Community</Text>
                    <CheckSquare size={18} color="#1A1A14" />
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>

      {confirmModal && (
        <ConfirmModal
          visible={true}
          title={
            confirmModal.type === "delete"
              ? "Delete Community?"
              : "Leave Community?"
          }
          message={
            confirmModal.type === "delete"
              ? `Are you sure you want to delete "${confirmModal.name}"? This action cannot be undone.`
              : `Are you sure you want to leave "${confirmModal.name}"?`
          }
          confirmText={confirmModal.type === "delete" ? "Delete" : "Leave"}
          onConfirm={
            confirmModal.type === "delete" ? handleDeleteCommunity : handleLeave
          }
          onCancel={() => setConfirmModal(null)}
          isDestructive={confirmModal.type === "delete"}
        />
      )}
      <Toast
        visible={!!message?.text}
        message={message?.text}
        type={message?.type || "info"}
        onDismiss={() => setMessage(null)}
      />
    </Screen>
  );
}

const getStyles = (theme) => StyleSheet.create({
  container: {
    paddingTop: 24,
    paddingBottom: 120,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    paddingTop: 24,
    paddingBottom: 120,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  header: {
    marginBottom: 20,
  },
  headerLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    color: theme.colors.accentCommunity,
    marginBottom: 4,
    fontFamily: "PlusJakartaSans_700Bold",
    lineHeight: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "700",
    fontFamily: "SpaceGrotesk_700Bold",
    color: theme.colors.text,
    marginBottom: 4,
    letterSpacing: -0.5,
    lineHeight: 38,
  },
  headerSubtitle: {
    fontSize: 14,
    color: theme.colors.textSubtle,
    fontFamily: "PlusJakartaSans_400Regular",
  },
  tabsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  tabs: {
    flexDirection: "row",
    backgroundColor: theme.colors.surface,
    padding: 5,
    borderRadius: radius.xl,
    gap: 4,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  tab: {
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: radius.xxl,
  },
  activeTab: {
    backgroundColor: theme.colors.accentCommunity,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.textSubtle,
    fontFamily: "PlusJakartaSans_600SemiBold",
  },
  activeTabText: {
    color: "#fff",
    fontFamily: "PlusJakartaSans_700Bold",
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 9,
    paddingHorizontal: 16,
    backgroundColor: theme.colors.brand,
    borderRadius: radius.xxl,
    gap: 4,
  },
  createButtonText: {
    color: theme.colors.textOnBrand,
    fontSize: 13,
    fontWeight: "700",
    fontFamily: "PlusJakartaSans_700Bold",
  },
  searchContainer: {
    position: "relative",
    marginBottom: 16,
  },
  searchIcon: {
    position: "absolute",
    left: 16,
    top: 14,
  },
  searchInput: {
    width: "100%",
    paddingLeft: 48,
    paddingRight: 16,
    paddingVertical: 12,
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    fontSize: 16,
    color: theme.colors.text,
  },
  codeJoinContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
    padding: 12,
  },
  codeJoinLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.brand,
  },
  codeJoinInput: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.text,
  },
  codeJoinButton: {
    paddingVertical: 9,
    paddingHorizontal: 18,
    backgroundColor: theme.colors.brand,
    borderRadius: radius.xxl,
  },
  codeJoinButtonText: {
    color: theme.colors.textOnBrand,
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "PlusJakartaSans_700Bold",
  },
  communitiesContainer: {
    gap: 24,
  },
  usersContainer: {},
  searchingContainer: {
    alignItems: "center",
    paddingVertical: 48,
  },
  searchingText: {
    fontSize: 14,
    color: theme.colors.textSubtle,
  },
  notFoundContainer: {
    alignItems: "center",
    paddingVertical: 48,
  },
  notFoundText: {
    fontSize: 14,
    color: theme.colors.textSubtle,
    textAlign: "center",
  },
  section: {
    gap: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    fontFamily: "SpaceGrotesk_700Bold",
    color: theme.colors.text,
    letterSpacing: -0.3,
  },
  sectionCount: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: theme.colors.surface,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sectionCountText: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.textSubtle,
  },
  communitiesGrid: {
    gap: 16,
  },
  usersGrid: {
    gap: 16,
  },
  communityGridItem: {
    width: "100%",
  },
  userGridItem: {
    width: "100%",
  },
  communityCard: {
    borderRadius: radius.xl,
    overflow: "hidden",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 6,
  },
  cardBanner: {
    height: 124,
    position: "relative",
  },
  cardBannerImg: {
    width: "100%",
    height: "100%",
  },
  cardBannerPlaceholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  cardBannerEmoji: {
    fontSize: 52,
    opacity: 0.5,
  },
  cardBannerScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.28)",
  },
  cardBannerBlur: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: "rgba(10,10,10,0.45)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  cardBannerContent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 14,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
  },
  cardBannerTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: "#fff",
    fontFamily: "SpaceGrotesk_700Bold",
    letterSpacing: -0.4,
  },
  membersPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  membersPillText: {
    fontSize: 11,
    color: "rgba(255,255,255,0.88)",
    fontWeight: "600",
    fontFamily: "PlusJakartaSans_600SemiBold",
  },
  privatePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(200,230,48,0.22)",
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: "rgba(200,230,48,0.45)",
  },
  privatePillText: {
    fontSize: 11,
    color: "#C8E630",
    fontWeight: "700",
    fontFamily: "PlusJakartaSans_700Bold",
  },
  joinedBadge: {
    backgroundColor: "rgba(200,230,48,0.22)",
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "rgba(200,230,48,0.45)",
  },
  joinedBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#C8E630",
    fontFamily: "PlusJakartaSans_700Bold",
  },
  cardBody: {
    padding: 14,
    gap: 12,
  },
  communityDescription: {
    fontSize: 13,
    lineHeight: 19,
    fontFamily: "PlusJakartaSans_400Regular",
  },
  recentMessage: {
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 12,
    gap: 2,
  },
  recentMessageAuthor: {
    fontSize: 11,
    fontWeight: "700",
    fontFamily: "PlusJakartaSans_700Bold",
  },
  recentMessageText: {
    fontSize: 13,
    fontFamily: "PlusJakartaSans_400Regular",
  },
  communityActions: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: radius.xxl,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: "700",
    fontFamily: "PlusJakartaSans_700Bold",
  },
  iconAction: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  userCard: {
    padding: 20,
    alignItems: "center",
  },
  userAvatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 999,
    backgroundColor: theme.colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  userAvatarPlaceholder: {
    fontSize: 32,
    fontWeight: "700",
    color: theme.colors.textSubtle,
  },
  userName: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.text,
    marginBottom: 4,
  },
  userRole: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
    color: theme.colors.textSubtle,
    marginBottom: 8,
  },
  userBio: {
    fontSize: 14,
    color: theme.colors.textSubtle,
    textAlign: "center",
    marginBottom: 16,
  },
  userFollowContainer: {
    width: "100%",
  },
  followButton: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: theme.colors.brand,
  },
  followButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1A1A14",
  },
  followingButton: {
    backgroundColor: theme.colors.surface,
  },
  followingButtonText: {
    color: theme.colors.brand,
  },
  friendButton: {
    backgroundColor: "rgba(61,158,74,0.12)",
  },
  friendButtonText: {
    color: theme.colors.success,
  },
  cmScreen: {
    flex: 1,
  },
  cmHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 14,
    gap: 12,
  },
  cmBackBtn: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    backgroundColor: "rgba(128,128,128,0.12)",
  },
  cmStepLabel: {
    fontSize: 11,
    fontWeight: "700",
    fontFamily: "PlusJakartaSans_700Bold",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 2,
  },
  cmStepName: {
    fontSize: 20,
    fontWeight: "800",
    fontFamily: "SpaceGrotesk_700Bold",
    letterSpacing: -0.3,
  },
  cmPills: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  cmPill: {
    height: 8,
    borderRadius: 4,
  },
  cmPillActive: {
    width: 28,
    backgroundColor: theme.colors.brand,
  },
  cmPillDone: {
    width: 16,
    backgroundColor: theme.colors.brand,
    opacity: 0.5,
  },
  cmPillTodo: {
    width: 16,
    backgroundColor: theme.colors.border,
  },
  cmProgressTrack: {
    height: 3,
    borderRadius: 2,
  },
  cmProgressFill: {
    height: "100%",
    borderRadius: 2,
  },
  cmContent: {
    padding: 24,
  },
  cmStepBody: {
    gap: 20,
  },
  cmField: {
    gap: 8,
  },
  cmLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  cmOptional: {
    fontSize: 12,
    fontWeight: "400",
  },
  cmInput: {
    width: "100%",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderRadius: 16,
    fontSize: 16,
    fontFamily: "PlusJakartaSans_400Regular",
  },
  cmTextArea: {
    height: 110,
    textAlignVertical: "top",
  },
  cmDropdownBtn: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderRadius: 16,
  },
  cmDropdownText: {
    fontSize: 16,
  },
  cmDropdown: {
    marginTop: 6,
    borderRadius: 12,
    overflow: "hidden",
    maxHeight: 220,
  },
  cmDropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  cmDropdownItemText: {
    fontSize: 14,
  },
  cmPrivateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  cmPrivateTitle: {
    fontSize: 15,
    fontWeight: "700",
    fontFamily: "PlusJakartaSans_700Bold",
    marginBottom: 2,
  },
  cmPrivateSub: {
    fontSize: 12,
  },
  cmToggle: {
    width: 42,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
  },
  cmToggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#fff",
  },
  cmIconGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  cmIconOpt: {
    width: 58,
    height: 58,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  cmIconEmoji: {
    fontSize: 28,
  },
  cmUploadBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 13,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: "dashed",
  },
  cmUploadText: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "PlusJakartaSans_600SemiBold",
  },
  cmPreviewCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 4,
  },
  cmPreviewIcon: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  cmPreviewName: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "SpaceGrotesk_700Bold",
  },
  cmPreviewCat: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  cmNavRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  cmNavGhost: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  cmNavGhostText: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "PlusJakartaSans_600SemiBold",
  },
  cmNavPrimary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: radius.xxl,
  },
  cmNavPrimaryText: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "PlusJakartaSans_700Bold",
    color: "#1A1A14",
  },
});
