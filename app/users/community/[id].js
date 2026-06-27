import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  StatusBar,
  Image,
  Alert,
  Linking,
  Modal,
  ScrollView,
  Pressable,
  Dimensions,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";

const STATUS_BAR_HEIGHT = Platform.OS === "android" ? StatusBar.currentHeight || 24 : 44;
const SCREEN_HEIGHT = Dimensions.get("window").height;
import {
  Send, Info, Users, Paperclip, X, FileText,
  Mic, Smile, ChevronLeft, UserPlus,
} from "lucide-react-native";
import { Share } from "react-native";
import { useTheme } from "../../../theme/ThemeProvider";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { radius, spacing } from "../../../theme/tokens.js";
import { getUserToken } from "../../../lib/auth";
import { API_URL } from "../../../lib/config";
import * as FileSystem from "expo-file-system/legacy";
import { getSocket, disconnectSocket, joinCommunity, onMessage, offMessage } from "../../../lib/socket";

const EMOJI_REACTIONS = ["❤️", "😂", "😮", "😢", "🔥", "👏"];
const QUICK_EMOJIS = ["😊", "😂", "❤️", "🔥", "👍", "🎉", "😮", "🙏", "💯", "🤔", "😍", "✨"];
const AVATAR_COLORS = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#F7DC6F", "#DDA0DD", "#FFB347", "#87CEEB"];

const getAvatarColor = (name) => {
  const hash = (name || "").split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
};

const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

function LinkPreview({ url, theme, isMe = false, compact = false }) {
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`${API_URL}/meta/og?url=${encodeURIComponent(url)}`);
        if (res.ok && alive) {
          const data = await res.json();
          setMeta(data);
        }
      } catch { /* silent */ } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [url]);

  const bg = isMe ? "rgba(26,26,20,0.12)" : "rgba(255,255,255,0.14)";
  const border = isMe ? "rgba(26,26,20,0.18)" : "rgba(255,255,255,0.22)";
  const titleColor = isMe ? "#1A1A14" : "#fff";
  const descColor = isMe ? "rgba(26,26,20,0.65)" : "rgba(255,255,255,0.7)";
  const domainColor = isMe ? "rgba(26,26,20,0.45)" : "rgba(255,255,255,0.5)";
  const urlColor = isMe ? theme.colors.text : theme.colors.brand;

  if (loading) {
    return (
      <View style={[lpStyles.container, { backgroundColor: bg, borderColor: border }]}>
        <ActivityIndicator size="small" color={isMe ? "rgba(26,26,20,0.4)" : "rgba(255,255,255,0.5)"} />
      </View>
    );
  }

  if (!meta) {
    return (
      <TouchableOpacity onPress={() => Linking.openURL(url)}>
        <Text style={{ color: urlColor, fontSize: 13, textDecorationLine: "underline", marginTop: 4 }} numberOfLines={1}>{url}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[lpStyles.container, { backgroundColor: bg, borderColor: border }]}
      onPress={() => Linking.openURL(url)}
      activeOpacity={0.85}
    >
      {meta.image && !compact ? (
        <Image source={{ uri: meta.image }} style={lpStyles.image} resizeMode="cover" />
      ) : null}
      <View style={lpStyles.textBlock}>
        {meta.title ? <Text style={[lpStyles.title, { color: titleColor }]} numberOfLines={2}>{meta.title}</Text> : null}
        {meta.description && !compact ? <Text style={[lpStyles.desc, { color: descColor }]} numberOfLines={2}>{meta.description}</Text> : null}
        <Text style={[lpStyles.domain, { color: domainColor }]} numberOfLines={1}>{meta.url || url}</Text>
      </View>
    </TouchableOpacity>
  );
}

const lpStyles = StyleSheet.create({
  container: {
    borderRadius: radius.md,
    borderWidth: 1,
    overflow: "hidden",
    marginTop: 6,
  },
  image: {
    width: "100%",
    height: 130,
  },
  textBlock: {
    padding: 10,
    gap: 2,
  },
  title: {
    fontSize: 13,
    fontWeight: "700",
  },
  desc: {
    fontSize: 12,
    lineHeight: 17,
  },
  domain: {
    fontSize: 11,
    marginTop: 4,
  },
});

function EventCard({ eventId, theme }) {
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`${API_URL}/events/${eventId}`);
        if (res.ok && alive) {
          const data = await res.json();
          setEvent(data.event || data);
        }
      } catch { /* silent */ } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [eventId]);

  const handlePress = () => Linking.openURL(`https://try-unihub.click/event/${eventId}`);

  if (loading) {
    return (
      <View style={[evStyles.container, { backgroundColor: theme.colors.surfaceMuted, borderColor: theme.colors.border }]}>
        <ActivityIndicator size="small" color={theme.colors.brand} style={{ margin: 8 }} />
      </View>
    );
  }

  if (!event) {
    return (
      <TouchableOpacity style={[evStyles.container, { backgroundColor: theme.colors.surfaceMuted, borderColor: theme.colors.border }]} onPress={handlePress}>
        <Text style={[evStyles.fallbackText, { color: theme.colors.brand }]}>📅 Shared an event — tap to view</Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[evStyles.container, { backgroundColor: theme.colors.surfaceMuted, borderColor: theme.colors.border }]}
      onPress={handlePress}
      activeOpacity={0.85}
    >
      {event.image && (
        <Image source={{ uri: event.image }} style={evStyles.image} resizeMode="cover" />
      )}
      <View style={evStyles.body}>
        <Text style={[evStyles.title, { color: theme.colors.text }]} numberOfLines={2}>
          {event.name || event.title}
        </Text>
        {event.date ? (
          <Text style={[evStyles.meta, { color: theme.colors.textSubtle }]}>
            📅 {new Date(event.date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
          </Text>
        ) : null}
        {event.venue ? (
          <Text style={[evStyles.meta, { color: theme.colors.textSubtle }]} numberOfLines={1}>📍 {event.venue}</Text>
        ) : null}
        <Text style={[evStyles.cta, { color: theme.colors.brand }]}>View Event Details →</Text>
      </View>
    </TouchableOpacity>
  );
}

const evStyles = StyleSheet.create({
  container: {
    borderRadius: radius.md,
    borderWidth: 1,
    overflow: "hidden",
    marginTop: 6,
  },
  image: {
    width: "100%",
    height: 120,
  },
  body: {
    padding: 10,
    gap: 3,
  },
  title: {
    fontSize: 13,
    fontWeight: "700",
  },
  meta: {
    fontSize: 12,
  },
  cta: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
  },
  fallbackText: {
    fontSize: 13,
    fontWeight: "600",
    padding: 12,
  },
});

function extractUrls(text) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text?.match(urlRegex) || [];
}

export default function CommunityChatScreen() {
  const { id: communityId } = useLocalSearchParams();
  const router = useRouter();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const [community, setCommunity] = useState(null);
  const [posts, setPosts] = useState([]);

  const handleInvite = useCallback(async () => {
    if (!community) return;
    const isPrivate = community.isPrivate || community.visibility === "private";
    const deepLink = `https://try-unihub.click/join/community/${communityId}`;
    if (isPrivate && community.accessCode) {
      Alert.alert(
        "Invite to Community",
        `Share the access code below:\n\n${community.accessCode}\n\nOr share the join link:`,
        [
          { text: "Copy Code", onPress: () => {
            Share.share({ message: `Join "${community.name}" on UniHub!\nCode: ${community.accessCode}\n${deepLink}` });
          }},
          { text: "Share Link", onPress: () => Share.share({ message: `Join "${community.name}" on UniHub!\n${deepLink}`, url: deepLink }) },
          { text: "Cancel", style: "cancel" },
        ]
      );
    } else {
      Share.share({ message: `Join "${community.name}" on UniHub!\n${deepLink}`, url: deepLink });
    }
  }, [community, communityId]);
  const [content, setContent] = useState("");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [imageUri, setImageUri] = useState(null);
  const [imageMimeType, setImageMimeType] = useState(null);
  const [fileUri, setFileUri] = useState(null);
  const [fileName, setFileName] = useState(null);
  const [fileType, setFileType] = useState(null);
  const [fileSize, setFileSize] = useState(null);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [reactionTarget, setReactionTarget] = useState(null);
  const [reactions, setReactions] = useState({});
  const [composerLinkUrl, setComposerLinkUrl] = useState(null);
  const [linkPreviewDismissed, setLinkPreviewDismissed] = useState(false);

  const flatListRef = useRef(null);

  useEffect(() => {
    const urls = extractUrls(content);
    if (urls.length > 0 && urls[0] !== composerLinkUrl) {
      setComposerLinkUrl(urls[0]);
      setLinkPreviewDismissed(false);
    } else if (urls.length === 0) {
      setComposerLinkUrl(null);
      setLinkPreviewDismissed(false);
    }
  }, [content]);

  const handlePickImage = async () => {
    try {
      const ImagePicker = require("expo-image-picker");
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert("Permission Required", "Permission to access the photo library is required.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });
      if (!result.canceled && result.assets?.length > 0) {
        setImageUri(result.assets[0].uri);
        setImageMimeType(result.assets[0].mimeType || null);
        setFileUri(null); setFileName(null); setFileType(null); setFileSize(null);
      }
    } catch (e) {
      Alert.alert("Module Missing", "The native Image Picker module could not be found. Please rebuild your app.");
    }
  };

  const handlePickDocument = async () => {
    try {
      const DocumentPicker = require("expo-document-picker");
      const result = await DocumentPicker.getDocumentAsync({ type: "*/*", copyToCacheDirectory: true });
      if (!result.canceled && result.assets?.length > 0) {
        const asset = result.assets[0];
        setFileUri(asset.uri); setFileName(asset.name);
        setFileType(asset.mimeType || "file"); setFileSize(asset.size);
        setImageUri(null);
      }
    } catch (e) {
      Alert.alert("Module Missing", "The native Document Picker module could not be found. Please rebuild your app.");
    }
  };

  const handleAttachmentPress = () => {
    Alert.alert("Add Attachment", "Choose an attachment type:", [
      { text: "Upload Photo", onPress: handlePickImage },
      { text: "Upload File / Document", onPress: handlePickDocument },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const clearAttachment = () => {
    setImageUri(null); setImageMimeType(null); setFileUri(null);
    setFileName(null); setFileType(null); setFileSize(null);
  };

  const uploadFileToServer = async (uri, isImage) => {
    const mimeType = isImage
      ? (imageMimeType || "image/jpeg")
      : (fileType || "application/octet-stream");
    const endpoint = isImage ? `${API_URL}/upload/image` : `${API_URL}/upload/file`;
    const token = await getUserToken();
    const res = await FileSystem.uploadAsync(endpoint, uri, {
      httpMethod: "POST",
      uploadType: 1,
      fieldName: "file",
      mimeType,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (res.status < 200 || res.status >= 300) {
      let errMsg = `Upload failed (${res.status})`;
      try { const b = JSON.parse(res.body); errMsg = b.error || b.msg || errMsg; } catch {}
      throw new Error(errMsg);
    }
    return JSON.parse(res.body);
  };

  const handleOpenFile = async (url) => {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) await Linking.openURL(url);
      else {
        const Sharing = require("expo-sharing");
        await Sharing.shareAsync(url);
      }
    } catch {
      Alert.alert("Cannot Open File", "Could not open or share the file.");
    }
  };

  useEffect(() => {
    if (!communityId) return;
    let alive = true;

    const loadData = async () => {
      try {
        const token = await getUserToken();
        if (!token) { router.replace("/users/signin"); return; }

        const userRes = await fetch(`${API_URL}/user/details`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_token: token }),
        });
        if (userRes.ok && alive) setUser(await userRes.json());

        const commRes = await fetch(`${API_URL}/community/details/${communityId}`);
        if (commRes.ok && alive) setCommunity(await commRes.json());
        else { router.replace("/users/community"); return; }

        const postsRes = await fetch(`${API_URL}/community/posts/${communityId}?parentPostId=null`);
        if (postsRes.ok && alive) setPosts((await postsRes.json()).reverse());
      } catch (e) {
        console.error("Error loading chat data:", e);
      } finally {
        if (alive) setLoading(false);
      }
    };

    loadData();

    // Socket.IO real-time — connect after loading user token
    let socketConnected = false;
    getUserToken().then((token) => {
      if (!token || !alive) return;
      const sock = getSocket(token);
      socketConnected = true;

      sock.on("connect", () => joinCommunity(communityId));
      if (sock.connected) joinCommunity(communityId);

      const handleNewMessage = (msg) => {
        if (!alive) return;
        setPosts((prev) => {
          // Avoid duplicates by _id
          if (msg._id && prev.some((p) => p._id === msg._id)) return prev;
          return [...prev, msg];
        });
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      };
      onMessage(handleNewMessage);

      return () => {
        offMessage(handleNewMessage);
        disconnectSocket();
      };
    });

    // Fallback poll every 8s for environments without Socket.IO
    const intervalId = setInterval(async () => {
      try {
        const postsRes = await fetch(`${API_URL}/community/posts/${communityId}?parentPostId=null`);
        if (postsRes.ok && alive) setPosts((await postsRes.json()).reverse());
      } catch { /* silent */ }
    }, 8000);

    return () => {
      alive = false;
      clearInterval(intervalId);
      if (socketConnected) disconnectSocket();
    };
  }, [communityId]);

  const handleSend = async () => {
    if ((!content.trim() && !imageUri && !fileUri) || sending || uploadingAttachment || !user) return;
    setSending(true);
    let uploadedImageUrl = "";
    let uploadedFileUrl = "";
    let finalFileName = fileName;
    let finalFileType = fileType;
    let finalFileSize = fileSize;

    try {
      if (imageUri) {
        setUploadingAttachment(true);
        const uploadResult = await uploadFileToServer(imageUri, true);
        uploadedImageUrl = uploadResult.url || uploadResult.secure_url || uploadResult.imageUrl || "";
        setUploadingAttachment(false);
      } else if (fileUri) {
        setUploadingAttachment(true);
        const uploadResult = await uploadFileToServer(fileUri, false);
        uploadedFileUrl = uploadResult.url || uploadResult.secure_url || "";
        finalFileName = uploadResult.original_filename || fileName;
        finalFileType = uploadResult.resource_type || fileType;
        finalFileSize = uploadResult.bytes || fileSize;
        setUploadingAttachment(false);
      }

      const token = await getUserToken();
      const res = await fetch(`${API_URL}/community/post/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          content: content.trim(),
          image: uploadedImageUrl || "",
          fileUrl: uploadedFileUrl || null,
          fileName: finalFileName || null,
          fileType: finalFileType || null,
          fileSize: finalFileSize || null,
          communityId,
          authorId: user._id,
          authorType: user.role === "ADMIN" ? "Admin" : "User",
          authorName: user.username || "user",
          authorAvatar: user.avatar || null,
        }),
      });

      if (res.ok) {
        setContent("");
        clearAttachment();
        setComposerLinkUrl(null);
        setLinkPreviewDismissed(false);
        const postsRes = await fetch(`${API_URL}/community/posts/${communityId}?parentPostId=null`);
        if (postsRes.ok) {
          setPosts((await postsRes.json()).reverse());
          setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        }
      } else {
        const errorData = await res.json();
        Alert.alert("Error", errorData.msg || "Failed to send message");
      }
    } catch (e) {
      Alert.alert("Error", e?.message || "An error occurred while sending your message.");
    } finally {
      setSending(false);
      setUploadingAttachment(false);
    }
  };

  const handleAddReaction = (postId, emoji) => {
    setReactions((prev) => {
      const postReactions = prev[postId] || {};
      const count = postReactions[emoji] || 0;
      return { ...prev, [postId]: { ...postReactions, [emoji]: count + 1 } };
    });
    setReactionTarget(null);
  };

  const postsWithSeparators = useMemo(() => {
    const result = [];
    posts.forEach((post, index) => {
      const prev = posts[index - 1];
      if (!prev || new Date(prev.createdAt).toDateString() !== new Date(post.createdAt).toDateString()) {
        result.push({ _id: `sep-${post._id}`, type: "separator", date: post.createdAt });
      }
      result.push({ ...post, type: "message" });
    });
    return result;
  }, [posts]);

  const renderMessage = useCallback(({ item }) => {
    if (item.type === "separator") {
      return (
        <View style={styles.dateSeparator}>
          <View style={[styles.dateSeparatorLine, { backgroundColor: theme.colors.border }]} />
          <View style={[styles.dateSeparatorPill, { backgroundColor: theme.colors.surfaceMuted, borderColor: theme.colors.border }]}>
            <Text style={[styles.dateSeparatorText, { color: theme.colors.textSubtle }]}>{formatDate(item.date)}</Text>
          </View>
          <View style={[styles.dateSeparatorLine, { backgroundColor: theme.colors.border }]} />
        </View>
      );
    }

    const isMe = user && String(item.authorId) === String(user._id);
    const urls = extractUrls(item.content);
    const postReactions = reactions[item._id] || {};
    const hasReactions = Object.keys(postReactions).some((e) => postReactions[e] > 0);
    const avatarColor = getAvatarColor(item.authorName);

    return (
      <View style={[styles.messageRow, isMe ? styles.myMessageRow : styles.otherMessageRow]}>
        {!isMe && (
          <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
            {item.authorAvatar ? (
              <Image source={{ uri: item.authorAvatar }} style={styles.avatarImg} />
            ) : (
              <Text style={styles.avatarText}>
                {(item.authorName || "?").substring(0, 2).toUpperCase()}
              </Text>
            )}
          </View>
        )}

        <View style={[styles.messageBubbleContainer, isMe && { alignItems: "flex-end" }]}>
          {!isMe && (
            <Text style={[styles.authorName, { color: avatarColor }]}>{item.authorName}</Text>
          )}

          <TouchableOpacity
            activeOpacity={0.85}
            onLongPress={(e) => setReactionTarget({ id: item._id, pageY: e.nativeEvent.pageY })}
            style={[
              styles.messageBubble,
              isMe
                ? styles.myBubble
                : [styles.otherBubble, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }],
            ]}
          >
            {item.image ? (
              <TouchableOpacity onPress={() => handleOpenFile(item.image)} style={styles.imageContainer}>
                <Image source={{ uri: item.image }} style={styles.chatImage} resizeMode="cover" />
              </TouchableOpacity>
            ) : null}

            {item.eventId ? (
              <EventCard eventId={item.eventId} theme={theme} />
            ) : null}

            {item.fileUrl ? (
              <TouchableOpacity
                style={[styles.fileCard, { backgroundColor: isMe ? "rgba(26,26,20,0.12)" : theme.colors.surfaceMuted }]}
                onPress={() => handleOpenFile(item.fileUrl)}
              >
                <View style={[styles.fileIconCircle, { backgroundColor: isMe ? "rgba(26,26,20,0.18)" : theme.colors.brandTint }]}>
                  <FileText size={18} color={isMe ? "#1A1A14" : theme.colors.brand} />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={[styles.fileName, { color: isMe ? "#1A1A14" : theme.colors.text }]} numberOfLines={1}>
                    {item.fileName || "Attached Document"}
                  </Text>
                  <Text style={[styles.fileType, { color: isMe ? "rgba(26,26,20,0.55)" : theme.colors.textSubtle }]}>
                    {item.fileType || "File"} · Tap to open
                  </Text>
                </View>
              </TouchableOpacity>
            ) : null}

            {item.content ? (
              <Text style={[styles.messageText, { color: isMe ? "#1A1A14" : theme.colors.text }]}>
                {item.content}
              </Text>
            ) : null}

            {urls.length > 0 && (
              <LinkPreview url={urls[0]} theme={theme} isMe={isMe} />
            )}
          </TouchableOpacity>

          {hasReactions && (
            <View style={[styles.reactionsRow, isMe && { justifyContent: "flex-end" }]}>
              {Object.entries(postReactions).filter(([, c]) => c > 0).map(([emoji, count]) => (
                <TouchableOpacity
                  key={emoji}
                  style={[styles.reactionBubble, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                  onPress={() => handleAddReaction(item._id, emoji)}
                >
                  <Text style={styles.reactionEmoji}>{emoji}</Text>
                  {count > 1 && <Text style={[styles.reactionCount, { color: theme.colors.textMuted }]}>{count}</Text>}
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Text style={[styles.messageTime, { color: theme.colors.textSubtle, textAlign: isMe ? "right" : "left" }]}>
            {new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.quickReactBtn}
          onPress={(e) => setReactionTarget(reactionTarget?.id === item._id ? null : { id: item._id, pageY: e.nativeEvent.pageY })}
        >
          <Smile size={14} color={theme.colors.textSubtle} />
        </TouchableOpacity>
      </View>
    );
  }, [user, reactions, reactionTarget, theme]);

  if (loading) {
    return (
      <View style={[styles.center, { flex: 1, backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.brand} />
      </View>
    );
  }

  const hasTextOrAttachment = content.trim().length > 0 || imageUri || fileUri;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.navSurface, paddingTop: insets.top + 10 }]}>
        <TouchableOpacity style={styles.headerBack} onPress={() => router.back()}>
          <ChevronLeft size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {community?.name}
          </Text>
          <View style={styles.headerSubRow}>
            <Users size={11} color="rgba(255,255,255,0.5)" />
            <Text style={styles.headerSub}>
              {community?.members?.length || 0} members
            </Text>
          </View>
        </View>
        <View style={{ flexDirection: "row", gap: 4 }}>
          <TouchableOpacity style={styles.infoBtn} onPress={handleInvite}>
            <UserPlus size={18} color="rgba(255,255,255,0.8)" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.infoBtn}
            onPress={() => router.push(`/users/community/${communityId}/info`)}
          >
            <Info size={18} color="rgba(255,255,255,0.8)" />
          </TouchableOpacity>
        </View>
      </View>
      {/* Lime accent line */}
      <View style={{ height: 2.5, backgroundColor: theme.colors.brand }} />

      {/* Reaction emoji picker — floats near the long-pressed message */}
      <Modal
        visible={!!reactionTarget}
        transparent
        animationType="fade"
        onRequestClose={() => setReactionTarget(null)}
      >
        <Pressable style={styles.reactionOverlay} onPress={() => setReactionTarget(null)}>
          <View
            style={[
              styles.emojiPickerFloating,
              {
                top: Math.max(60, Math.min((reactionTarget?.pageY ?? 300) - 70, SCREEN_HEIGHT - 80)),
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
            onStartShouldSetResponder={() => true}
          >
            {EMOJI_REACTIONS.map((emoji) => (
              <TouchableOpacity
                key={emoji}
                style={styles.emojiPickerBtn}
                onPress={() => handleAddReaction(reactionTarget?.id, emoji)}
              >
                <Text style={styles.emojiPickerEmoji}>{emoji}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity onPress={() => setReactionTarget(null)} style={styles.emojiPickerClose}>
              <X size={14} color={theme.colors.textSubtle} />
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === "ios" ? insets.top + 76 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={postsWithSeparators}
          keyExtractor={(item) => item._id}
          renderItem={renderMessage}
          contentContainerStyle={styles.chatContent}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={[styles.emptyIconWrap, { backgroundColor: theme.colors.brandTint }]}>
                <Text style={{ fontSize: 40 }}>💬</Text>
              </View>
              <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>Start the convo!</Text>
              <Text style={[styles.emptyText, { color: theme.colors.textSubtle }]}>
                Be the first to say something to this community. Everyone's waiting! 🎉
              </Text>
            </View>
          }
        />

        {/* Attachment preview */}
        {(imageUri || fileUri) && (
          <View style={[styles.previewContainer, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border }]}>
            <View style={[styles.previewWrapper, { backgroundColor: theme.colors.surfaceMuted, borderColor: theme.colors.border }]}>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.previewImage} />
              ) : (
                <View style={styles.previewFileIcon}>
                  <FileText size={22} color={theme.colors.brand} />
                  <Text style={[styles.previewFileName, { color: theme.colors.text }]} numberOfLines={1}>
                    {fileName}
                  </Text>
                </View>
              )}
              <TouchableOpacity
                style={[styles.closePreviewBtn, { backgroundColor: "rgba(0,0,0,0.45)" }]}
                onPress={clearAttachment}
              >
                <X size={13} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Compose-time link preview (WhatsApp-style) */}
        {composerLinkUrl && !linkPreviewDismissed && !imageUri && !fileUri && (
          <View style={[styles.composerLinkContainer, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border }]}>
            <View style={{ flex: 1 }}>
              <LinkPreview url={composerLinkUrl} theme={theme} isMe={false} compact />
            </View>
            <TouchableOpacity
              style={[styles.composerLinkDismiss, { backgroundColor: theme.colors.surfaceMuted }]}
              onPress={() => setLinkPreviewDismissed(true)}
            >
              <X size={13} color={theme.colors.textSubtle} />
            </TouchableOpacity>
          </View>
        )}

        {/* Emoji quick-insert bar */}
        {showEmojiPicker && (
          <View style={[styles.emojiInsertBar, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border }]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 4, paddingHorizontal: 12 }}>
              {QUICK_EMOJIS.map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  style={[styles.emojiInsertItem, { backgroundColor: theme.colors.surfaceMuted }]}
                  onPress={() => setContent((c) => c + emoji)}
                >
                  <Text style={{ fontSize: 24 }}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Composer */}
        <View style={[styles.composer, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border, paddingBottom: Math.max(insets.bottom, 10) }]}>
          <TouchableOpacity style={[styles.composerIconBtn, { backgroundColor: theme.colors.surfaceMuted }]} onPress={handleAttachmentPress} disabled={uploadingAttachment}>
            <Paperclip size={19} color={theme.colors.textSubtle} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.composerIconBtn, { backgroundColor: showEmojiPicker ? theme.colors.brandTint : theme.colors.surfaceMuted }]}
            onPress={() => setShowEmojiPicker((v) => !v)}
          >
            <Smile size={19} color={showEmojiPicker ? theme.colors.brand : theme.colors.textSubtle} />
          </TouchableOpacity>
          <TextInput
            style={[styles.input, {
              color: theme.colors.text,
              backgroundColor: theme.colors.surfaceMuted,
              borderColor: theme.colors.border,
            }]}
            placeholder={uploadingAttachment ? "Uploading…" : "Message the community…"}
            placeholderTextColor={theme.colors.textSubtle}
            value={content}
            onChangeText={setContent}
            multiline
            maxHeight={100}
            editable={!uploadingAttachment}
          />
          {hasTextOrAttachment ? (
            <TouchableOpacity
              style={[styles.sendBtn, { backgroundColor: theme.colors.brand }]}
              onPress={handleSend}
              disabled={sending || uploadingAttachment}
            >
              {sending || uploadingAttachment ? (
                <ActivityIndicator size="small" color="#1A1A14" />
              ) : (
                <Send size={17} color="#1A1A14" />
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.sendBtn, { backgroundColor: theme.colors.surfaceMuted }]}
              onLongPress={() => Alert.alert("Voice Note", "Hold to record voice note (coming soon)")}
            >
              <Mic size={18} color={theme.colors.brand} />
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingBottom: 14,
    gap: 10,
  },
  headerBack: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  headerCenter: {
    flex: 1,
    gap: 3,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "SpaceGrotesk_700Bold",
    letterSpacing: -0.2,
    color: "#fff",
  },
  headerSubRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  headerSub: {
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
    fontFamily: "PlusJakartaSans_400Regular",
  },
  infoBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  reactionOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  emojiPickerFloating: {
    position: "absolute",
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 40,
    borderWidth: 1,
    gap: 4,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
  },
  emojiPickerBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
  },
  emojiPickerEmoji: {
    fontSize: 24,
  },
  emojiPickerClose: {
    marginLeft: "auto",
    padding: 8,
  },
  chatContent: {
    paddingHorizontal: spacing.page,
    paddingVertical: 16,
    paddingBottom: 8,
    gap: 10,
  },
  dateSeparator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginVertical: 6,
  },
  dateSeparatorLine: {
    flex: 1,
    height: 1,
  },
  dateSeparatorPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: radius.xxl,
    borderWidth: 1,
  },
  dateSeparatorText: {
    fontSize: 11,
    fontWeight: "600",
    fontFamily: "PlusJakartaSans_600SemiBold",
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    maxWidth: "88%",
  },
  myMessageRow: {
    alignSelf: "flex-end",
    flexDirection: "row-reverse",
  },
  otherMessageRow: {
    alignSelf: "flex-start",
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  avatarImg: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
  },
  avatarText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#fff",
    fontFamily: "SpaceGrotesk_700Bold",
  },
  messageBubbleContainer: {
    flex: 1,
    gap: 4,
  },
  authorName: {
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 2,
    fontFamily: "PlusJakartaSans_700Bold",
  },
  messageBubble: {
    borderRadius: radius.xl,
    paddingVertical: 10,
    paddingHorizontal: 14,
    maxWidth: "100%",
  },
  myBubble: {
    backgroundColor: "#C8E630",
    borderBottomRightRadius: 5,
    shadowColor: "#C8E630",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  otherBubble: {
    borderWidth: 1,
    borderBottomLeftRadius: 5,
  },
  imageContainer: {
    borderRadius: radius.md,
    overflow: "hidden",
    width: 220,
  },
  chatImage: {
    width: 220,
    height: 200,
  },
  fileCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radius.md,
    padding: 10,
  },
  fileIconCircle: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  fileName: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "PlusJakartaSans_600SemiBold",
  },
  fileType: {
    fontSize: 11,
    marginTop: 2,
    fontFamily: "PlusJakartaSans_400Regular",
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: "PlusJakartaSans_400Regular",
  },
  reactionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
  },
  reactionBubble: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.xxl,
    borderWidth: 1,
  },
  reactionEmoji: {
    fontSize: 14,
  },
  reactionCount: {
    fontSize: 12,
    fontWeight: "700",
    fontFamily: "PlusJakartaSans_700Bold",
  },
  quickReactBtn: {
    padding: 4,
    marginBottom: 22,
    opacity: 0.5,
  },
  messageTime: {
    fontSize: 11,
    fontFamily: "PlusJakartaSans_400Regular",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    paddingHorizontal: 40,
    gap: 14,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: radius.xl,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    fontFamily: "SpaceGrotesk_700Bold",
    letterSpacing: -0.3,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    fontFamily: "PlusJakartaSans_400Regular",
    lineHeight: 21,
  },
  previewContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  previewWrapper: {
    borderRadius: radius.lg,
    overflow: "hidden",
    borderWidth: 1,
    position: "relative",
    alignSelf: "flex-start",
  },
  previewImage: {
    width: 80,
    height: 80,
  },
  previewFileIcon: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
  },
  previewFileName: {
    fontSize: 13,
    fontWeight: "600",
    maxWidth: 160,
  },
  closePreviewBtn: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  composerLinkContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 4,
    borderTopWidth: 1,
    gap: 8,
  },
  composerLinkDismiss: {
    width: 26,
    height: 26,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  emojiInsertBar: {
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  emojiInsertItem: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    gap: 8,
    paddingBottom: Platform.OS === "ios" ? 28 : 10,
  },
  composerIconBtn: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
  },
  input: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radius.xxl,
    fontSize: 15,
    borderWidth: 1,
    minHeight: 38,
    fontFamily: "PlusJakartaSans_400Regular",
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
});
