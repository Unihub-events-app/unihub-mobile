import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
} from "react-native";
import { X, CheckSquare, Users } from "lucide-react-native";
import { getUserToken } from "../lib/auth";
import { API_URL } from "../lib/config";
import { postJson } from "../lib/api";

const ShareToCommunityModal = ({ isOpen, onClose, eventData }) => {
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [selectedCommunities, setSelectedCommunities] = useState([]);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchUserCommunities();
    }
  }, [isOpen]);

  const fetchUserCommunities = async () => {
    try {
      setLoading(true);
      const token = await getUserToken();
      const userRes = await postJson("/user/details", { user_token: token });
      if (userRes.ok) {
        const userData = await userRes.json();
        const communitiesRes = await fetch(`${API_URL}/community/user/${userData._id}`);
        if (communitiesRes.ok) {
          const userCommunities = await communitiesRes.json();
          setCommunities(userCommunities);
        }
      }
    } catch (error) {
      console.error("Error fetching communities:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCommunity = (communityId) => {
    setSelectedCommunities((prev) =>
      prev.includes(communityId)
        ? prev.filter((id) => id !== communityId)
        : [...prev, communityId]
    );
  };

  const handleShare = async () => {
    if (selectedCommunities.length === 0) {
      setMessage({ type: "error", text: "Please select at least one community" });
      setTimeout(() => setMessage(null), 2000);
      return;
    }

    try {
      setSharing(true);
      const token = await getUserToken();
      const userRes = await postJson("/user/details", { user_token: token });
      if (!userRes.ok) throw new Error("Failed to fetch user details");
      const userData = await userRes.json();

      const sharePromises = selectedCommunities.map(async (communityId) => {
        const priceText =
          eventData.price === 0 || eventData.price === "0"
            ? "Free"
            : `₦${parseInt(eventData.price).toLocaleString()}`;
        const descriptionText = eventData.description
          ? eventData.description.substring(0, 150) +
            (eventData.description.length > 150 ? "..." : "")
          : "";
        const content = `🎉 ${eventData.name}\n\n📅 ${eventData.date} at ${eventData.time}\n📍 ${eventData.venue}\n💰 ${priceText}\n\n${descriptionText}`;

        const response = await postJson("/community/post/create", {
          content,
          image: eventData.cover || eventData.profile || "",
          communityId,
          authorId: userData._id,
          authorType: userData.role === "ADMIN" ? "Admin" : "User",
          authorName: userData.displayName || userData.username || userData.name,
          authorAvatar: userData.avatar || null,
          eventId: eventData.event_id || eventData._id,
        });
        return response.ok;
      });

      const results = await Promise.all(sharePromises);
      const successCount = results.filter((r) => r).length;

      if (successCount > 0) {
        setMessage({
          type: "success",
          text: `Event shared to ${successCount} ${successCount === 1 ? "community" : "communities"}!`,
        });
        setTimeout(() => {
          setMessage(null);
          onClose();
        }, 2000);
      } else {
        throw new Error("Failed to share to communities");
      }
    } catch (error) {
      console.error("Error sharing event:", error);
      setMessage({ type: "error", text: "Failed to share event. Please try again." });
      setTimeout(() => setMessage(null), 2000);
    } finally {
      setSharing(false);
    }
  };

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay} onTouchEnd={onClose}>
        <View style={styles.container} onTouchEnd={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={styles.title}>Share to Communities</Text>
              <Text style={styles.subtitle}>Select communities to share this event</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          <View style={styles.content}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3b82f6" />
                <Text style={styles.loadingText}>Loading communities...</Text>
              </View>
            ) : communities.length === 0 ? (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconContainer}>
                  <Users size={40} color="#6b7280" />
                </View>
                <Text style={styles.emptyTitle}>No communities found</Text>
                <Text style={styles.emptySubtitle}>Join communities to share events with them</Text>
              </View>
            ) : (
              <>
                <ScrollView style={styles.communitiesList} showsVerticalScrollIndicator={false}>
                  {communities.map((community) => {
                    const isSelected = selectedCommunities.includes(community._id);
                    return (
                      <TouchableOpacity
                        key={community._id}
                        onPress={() => toggleCommunity(community._id)}
                        style={[
                          styles.communityItem,
                          {
                            borderColor: isSelected ? "#3b82f6" : "#e5e7eb",
                            backgroundColor: isSelected ? "#eff6ff" : "#fff",
                          },
                        ]}
                      >
                        <View style={styles.communityAvatarContainer}>
                          {community.profileImage &&
                          (community.profileImage.startsWith("http") ||
                            community.profileImage.startsWith("/")) ? (
                            <Image
                              source={{ uri: community.profileImage }}
                              style={styles.communityAvatar}
                            />
                          ) : (
                            <Text style={styles.communityAvatarText}>
                              {community.profileImage || "🏛️"}
                            </Text>
                          )}
                        </View>
                        <View style={styles.communityInfo}>
                          <Text style={styles.communityName}>{community.name}</Text>
                          <Text style={styles.communityRole}>
                            {community.role || "member"}
                          </Text>
                        </View>
                        {isSelected && (
                          <View style={styles.checkContainer}>
                            <CheckSquare size={20} color="#fff" />
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
                {message && (
                  <View
                    style={[
                      styles.messageContainer,
                      {
                        backgroundColor:
                          message.type === "error" ? "#fef2f2" : "#f0fdf4",
                        borderColor:
                          message.type === "error" ? "#fecaca" : "#bbf7d0",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.messageText,
                        {
                          color: message.type === "error" ? "#dc2626" : "#16a34a",
                        },
                      ]}
                    >
                      {message.text}
                    </Text>
                  </View>
                )}
              </>
            )}
          </View>
          <View style={styles.footer}>
            <TouchableOpacity
              onPress={onClose}
              style={styles.cancelButton}
              disabled={sharing}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleShare}
              disabled={sharing || selectedCommunities.length === 0}
              style={[
                styles.shareButton,
                {
                  opacity:
                    sharing || selectedCommunities.length === 0 ? 0.5 : 1,
                },
              ]}
            >
              {sharing ? (
                <View style={styles.sharingContainer}>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={styles.shareButtonText}>Sharing...</Text>
                </View>
              ) : (
                <Text style={styles.shareButtonText}>
                  Share to {selectedCommunities.length || ""} {selectedCommunities.length === 1 ? "Community" : "Communities"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  container: {
    backgroundColor: "#fff",
    borderRadius: 24,
    width: "100%",
    maxWidth: 400,
    overflow: "hidden",
  },
  header: {
    padding: 24,
    backgroundColor: "#3b82f6",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerContent: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
  subtitle: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 14,
    marginTop: 4,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 24,
  },
  loadingContainer: {
    paddingVertical: 48,
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: "#6b7280",
  },
  emptyContainer: {
    paddingVertical: 48,
    alignItems: "center",
    gap: 12,
  },
  emptyIconContainer: {
    width: 64,
    height: 64,
    backgroundColor: "#f3f4f6",
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4b5563",
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
  },
  communitiesList: {
    maxHeight: 320,
  },
  communityItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    marginBottom: 8,
  },
  communityAvatarContainer: {
    width: 48,
    height: 48,
    backgroundColor: "#3b82f6",
    borderRadius: 12,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  communityAvatar: {
    width: "100%",
    height: "100%",
  },
  communityAvatarText: {
    fontSize: 20,
  },
  communityInfo: {
    flex: 1,
  },
  communityName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  communityRole: {
    fontSize: 12,
    color: "#6b7280",
    textTransform: "capitalize",
  },
  checkContainer: {
    width: 24,
    height: 24,
    backgroundColor: "#3b82f6",
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
  },
  messageContainer: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 16,
    marginBottom: 8,
  },
  messageText: {
    fontSize: 14,
    fontWeight: "500",
  },
  footer: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4b5563",
  },
  shareButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: "#3b82f6",
    borderRadius: 12,
    alignItems: "center",
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  sharingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
});

export default ShareToCommunityModal;
