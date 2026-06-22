import React, { useEffect, useState, useRef } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
  Linking,
} from "react-native";
import { Send, Info, Users, ShieldAlert, Paperclip, X, FileText, Image as ImageIcon } from "lucide-react-native";
import { Screen, BackButton, NeuCard, NeuInset } from "../../../components";
import { useTheme } from "../../../theme/ThemeProvider";
import { getUserToken } from "../../../lib/auth";
import { API_URL } from "../../../lib/config";

export default function CommunityChatScreen() {
  const { id: communityId } = useLocalSearchParams();
  const router = useRouter();
  const { theme } = useTheme();
  
  const [community, setCommunity] = useState(null);
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState("");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Attachment states
  const [imageUri, setImageUri] = useState(null);
  const [fileUri, setFileUri] = useState(null);
  const [fileName, setFileName] = useState(null);
  const [fileType, setFileType] = useState(null);
  const [fileSize, setFileSize] = useState(null);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);

  const flatListRef = useRef(null);

  const handlePickImage = async () => {
    try {
      const ImagePicker = require("expo-image-picker");
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert("Permission Required", "Permission to access the photo library is required.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImageUri(result.assets[0].uri);
        setFileUri(null);
        setFileName(null);
        setFileType(null);
        setFileSize(null);
      }
    } catch (e) {
      console.error("Image picker error:", e);
      Alert.alert(
        "Module Missing",
        "The native Image Picker module could not be found. Please rebuild your mobile app (e.g., using `npx expo run:ios` or `npx expo run:android`) to link the new native libraries."
      );
    }
  };

  const handlePickDocument = async () => {
    try {
      const DocumentPicker = require("expo-document-picker");
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setFileUri(asset.uri);
        setFileName(asset.name);
        setFileType(asset.mimeType || "file");
        setFileSize(asset.size);
        setImageUri(null);
      }
    } catch (e) {
      console.error("Document picker error:", e);
      Alert.alert(
        "Module Missing",
        "The native Document Picker module could not be found. Please rebuild your mobile app (e.g., using `npx expo run:ios` or `npx expo run:android`) to link the new native libraries."
      );
    }
  };

  const handleAttachmentPress = () => {
    Alert.alert(
      "Add Attachment",
      "Choose an attachment type:",
      [
        { text: "Upload Photo", onPress: handlePickImage },
        { text: "Upload File / Document", onPress: handlePickDocument },
        { text: "Cancel", style: "cancel" }
      ]
    );
  };

  const clearAttachment = () => {
    setImageUri(null);
    setFileUri(null);
    setFileName(null);
    setFileType(null);
    setFileSize(null);
  };

  const uploadFileToServer = async (uri, isImage) => {
    const fd = new FormData();
    const uriParts = uri.split('/');
    const name = uriParts[uriParts.length - 1] || (isImage ? 'image.jpg' : 'file');
    const type = isImage ? 'image/jpeg' : (fileType || 'application/octet-stream');

    fd.append("file", {
      uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
      name: name,
      type: type,
    });

    const endpoint = isImage ? `${API_URL}/upload/image` : `${API_URL}/upload/file`;
    const res = await fetch(endpoint, {
      method: "POST",
      body: fd,
    });

    if (!res.ok) {
      throw new Error(`Upload failed with status ${res.status}`);
    }

    return await res.json();
  };

  const handleOpenFile = async (url) => {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        const Sharing = require("expo-sharing");
        await Sharing.shareAsync(url);
      }
    } catch (e) {
      console.error("Error opening/sharing file:", e);
      Alert.alert(
        "Cannot Open File",
        "Could not open or share the file. If you haven't rebuilt the app after installing new packages, please run `npx expo run:ios` or `npx expo run:android`."
      );
    }
  };

  useEffect(() => {
    if (!communityId) return;
    let alive = true;

    const loadData = async () => {
      try {
        const token = await getUserToken();
        if (!token) {
          router.replace("/users/signin");
          return;
        }

        // Fetch User Details
        const userRes = await fetch(`${API_URL}/user/details`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_token: token }),
        });
        let userData = null;
        if (userRes.ok) {
          userData = await userRes.json();
          if (alive) setUser(userData);
        }

        // Fetch Community Details
        const commRes = await fetch(`${API_URL}/community/details/${communityId}`);
        if (commRes.ok) {
          const commData = await commRes.json();
          if (alive) setCommunity(commData);
        } else {
          router.replace("/users/community");
          return;
        }

        // Fetch Posts
        const postsRes = await fetch(`${API_URL}/community/posts/${communityId}?parentPostId=null`);
        if (postsRes.ok) {
          const postsData = await postsRes.json();
          // Backend returns newest first or oldest first. We reverse if needed to show newest at bottom.
          // Usually, chat shows newest at bottom, so let's check sorting. If new_post returns posts, we reverse it so FlatList renders correctly.
          if (alive) setPosts(postsData.reverse());
        }
      } catch (e) {
        console.error("Error loading chat data:", e);
      } finally {
        if (alive) setLoading(false);
      }
    };

    loadData();

    // Polling fallback to check for new messages every 4 seconds
    const intervalId = setInterval(async () => {
      try {
        const postsRes = await fetch(`${API_URL}/community/posts/${communityId}?parentPostId=null`);
        if (postsRes.ok && alive) {
          const postsData = await postsRes.json();
          setPosts(postsData.reverse());
        }
      } catch (e) {
        // silent
      }
    }, 4000);

    return () => {
      alive = false;
      clearInterval(intervalId);
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
      // 1. Upload attachment if one exists
      if (imageUri) {
        setUploadingAttachment(true);
        const uploadResult = await uploadFileToServer(imageUri, true);
        uploadedImageUrl = uploadResult.url;
        setUploadingAttachment(false);
      } else if (fileUri) {
        setUploadingAttachment(true);
        const uploadResult = await uploadFileToServer(fileUri, false);
        uploadedFileUrl = uploadResult.url;
        finalFileName = uploadResult.original_filename || fileName;
        finalFileType = uploadResult.resource_type || fileType;
        finalFileSize = uploadResult.bytes || fileSize;
        setUploadingAttachment(false);
      }

      // 2. Submit the post
      const token = await getUserToken();
      const res = await fetch(`${API_URL}/community/post/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
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
        // Reload posts
        const postsRes = await fetch(`${API_URL}/community/posts/${communityId}?parentPostId=null`);
        if (postsRes.ok) {
          const postsData = await postsRes.json();
          setPosts(postsData.reverse());
          setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        }
      } else {
        const errorData = await res.json();
        Alert.alert("Error", errorData.msg || "Failed to send message");
      }
    } catch (e) {
      console.error("Failed to send message:", e);
      Alert.alert("Error", "An error occurred while sending your message.");
    } finally {
      setSending(false);
      setUploadingAttachment(false);
    }
  };

  const renderMessage = ({ item }) => {
    const isMe = user && String(item.authorId) === String(user._id);

    return (
      <View style={[styles.messageRow, isMe ? styles.myMessageRow : styles.otherMessageRow]}>
        {!isMe && (
          <View style={[styles.avatar, { backgroundColor: theme.colors.surfaceElevated }]}>
            {item.authorAvatar ? (
              <Image source={{ uri: item.authorAvatar }} style={styles.avatarImg} />
            ) : (
              <Text style={[styles.avatarText, { color: theme.colors.brand }]}>
                {item.authorName?.substring(0, 2).toUpperCase()}
              </Text>
            )}
          </View>
        )}
        <View style={styles.messageBubbleContainer}>
          {!isMe && <Text style={[styles.authorName, { color: theme.colors.textSubtle }]}>{item.authorName}</Text>}
          <View
            style={[
              styles.messageBubble,
              {
                backgroundColor: isMe ? theme.colors.brand : theme.colors.surfaceMuted,
                borderColor: theme.colors.border,
                borderWidth: isMe ? 0 : 1,
              },
            ]}
          >
            {item.image ? (
              <TouchableOpacity
                onPress={() => handleOpenFile(item.image)}
                style={styles.imageContainer}
              >
                <Image source={{ uri: item.image }} style={styles.chatImage} resizeMode="cover" />
              </TouchableOpacity>
            ) : null}

            {item.fileUrl ? (
              <TouchableOpacity
                style={[
                  styles.fileCard,
                  {
                    backgroundColor: isMe ? "rgba(255,255,255,0.15)" : theme.colors.surface,
                    borderColor: theme.colors.border,
                  },
                ]}
                onPress={() => handleOpenFile(item.fileUrl)}
              >
                <FileText size={22} color={isMe ? "#ffffff" : theme.colors.brand} />
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text
                    style={{ fontSize: 13, fontWeight: "600", color: isMe ? "#ffffff" : theme.colors.text }}
                    numberOfLines={1}
                  >
                    {item.fileName || "Attached Document"}
                  </Text>
                  <Text style={{ fontSize: 10, color: isMe ? "rgba(255,255,255,0.7)" : theme.colors.textMuted }}>
                    {item.fileType || "File"}
                  </Text>
                </View>
              </TouchableOpacity>
            ) : null}

            {item.content ? (
              <Text style={{ fontSize: 15, color: isMe ? "#ffffff" : theme.colors.text, marginTop: (item.image || item.fileUrl) ? 6 : 0 }}>
                {item.content}
              </Text>
            ) : null}
          </View>
          <Text style={[styles.messageTime, { color: theme.colors.textSubtle, textAlign: isMe ? "right" : "left" }]}>
            {new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </Text>
        </View>
      </View>
    );
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

  return (
    <Screen scrollable={false} padded={false}>
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
          <BackButton label="Back" />
          <View style={styles.headerInfo}>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]} numberOfLines={1}>
              {community?.name}
            </Text>
            <View style={styles.membersCount}>
              <Users size={12} color={theme.colors.textMuted} style={{ marginRight: 4 }} />
              <Text style={{ fontSize: 12, color: theme.colors.textMuted }}>
                {community?.members?.length || 0} members
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.infoBtn, { backgroundColor: theme.colors.surfaceMuted, borderColor: theme.colors.border }]}
            onPress={() => router.push(`/users/community/${communityId}/info`)}
          >
            <Info size={20} color={theme.colors.text} />
          </TouchableOpacity>
        </View>

        {/* Chat Messages */}
        <FlatList
          ref={flatListRef}
          data={posts}
          keyExtractor={(item) => item._id}
          renderItem={renderMessage}
          contentContainerStyle={styles.chatContent}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <NeuInset style={styles.emptyState}>
              <Users size={40} color={theme.colors.textSubtle} />
              <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>No Messages Yet</Text>
              <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>
                Start the conversation by sending the first message.
              </Text>
            </NeuInset>
          }
        />

        {/* Attachment Preview (if any) */}
        {(imageUri || fileUri) && (
          <View style={[styles.previewContainer, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border }]}>
            <View style={[styles.previewWrapper, { backgroundColor: theme.colors.surfaceMuted, borderColor: theme.colors.border }]}>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.previewImage} />
              ) : (
                <View style={styles.previewFileIcon}>
                  <FileText size={24} color={theme.colors.brand} />
                  <Text style={[styles.previewFileName, { color: theme.colors.text }]} numberOfLines={1}>
                    {fileName}
                  </Text>
                </View>
              )}
              <TouchableOpacity style={[styles.closePreviewBtn, { backgroundColor: theme.colors.border }]} onPress={clearAttachment}>
                <X size={16} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Message Input Composer */}
        <View style={[styles.composer, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border }]}>
          <TouchableOpacity
            style={styles.attachBtn}
            onPress={handleAttachmentPress}
            disabled={uploadingAttachment}
          >
            <Paperclip size={20} color={theme.colors.textSubtle} />
          </TouchableOpacity>
          <TextInput
            style={[
              styles.input,
              {
                color: theme.colors.text,
                backgroundColor: theme.colors.surfaceMuted,
                borderColor: theme.colors.border,
              },
            ]}
            placeholder={uploadingAttachment ? "Uploading..." : "Type a message..."}
            placeholderTextColor={theme.colors.textSubtle}
            value={content}
            onChangeText={setContent}
            multiline
            editable={!uploadingAttachment}
          />
          <TouchableOpacity
            style={[
              styles.sendBtn,
              { backgroundColor: theme.colors.brand },
              (!content.trim() && !imageUri && !fileUri) && { opacity: 0.6 },
            ]}
            onPress={handleSend}
            disabled={(!content.trim() && !imageUri && !fileUri) || sending || uploadingAttachment}
          >
            {sending || uploadingAttachment ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Send size={18} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
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
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "SpaceGrotesk_700Bold",
  },
  membersCount: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  infoBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  chatContent: {
    padding: 16,
    paddingBottom: 24,
    gap: 16,
  },
  messageRow: {
    flexDirection: "row",
    gap: 10,
    maxWidth: "85%",
  },
  myMessageRow: {
    alignSelf: "flex-end",
    flexDirection: "row-reverse",
  },
  otherMessageRow: {
    alignSelf: "flex-start",
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImg: {
    width: "100%",
    height: "100%",
  },
  avatarText: {
    fontSize: 12,
    fontWeight: "700",
  },
  messageBubbleContainer: {
    gap: 4,
  },
  authorName: {
    fontSize: 12,
    fontFamily: "PlusJakartaSans_500Medium",
    marginLeft: 4,
  },
  messageBubble: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  messageTime: {
    fontSize: 10,
    fontFamily: "PlusJakartaSans_400Regular",
    marginHorizontal: 4,
  },
  emptyState: {
    marginVertical: 40,
    padding: 40,
    alignItems: "center",
    borderRadius: 24,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
  },
  composer: {
    flexDirection: "row",
    padding: 12,
    alignItems: "center",
    borderTopWidth: 1,
    gap: 12,
  },
  input: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 15,
    maxHeight: 100,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  attachBtn: {
    padding: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  imageContainer: {
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 4,
    maxWidth: 240,
    maxHeight: 180,
  },
  chatImage: {
    width: 240,
    height: 180,
  },
  fileCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 200,
    maxWidth: 240,
    marginBottom: 4,
  },
  previewContainer: {
    padding: 10,
    borderTopWidth: 1,
    flexDirection: "row",
  },
  previewWrapper: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    position: "relative",
    flex: 1,
  },
  previewImage: {
    width: 60,
    height: 60,
    borderRadius: 6,
  },
  previewFileIcon: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 8,
  },
  previewFileName: {
    fontSize: 13,
    fontWeight: "500",
    flex: 1,
  },
  closePreviewBtn: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
});
