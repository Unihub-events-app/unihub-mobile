import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Platform,
  StatusBar,
  Image,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Camera, Check } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../theme/ThemeProvider.js";
import { getUserToken } from "../../lib/auth.js";
import { API_URL } from "../../lib/config.js";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";

const STATUS_BAR_HEIGHT = Platform.OS === "android" ? StatusBar.currentHeight || 24 : 44;

export default function OnboardingPhoto() {
  const router = useRouter();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [photo, setPhoto] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") { Alert.alert("Permission required", "Please allow photo access."); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]) setPhoto(result.assets[0]);
  };

  const handleFinish = async () => {
    if (!photo) { router.replace("/(app)/dashboard"); return; }
    setError("");
    setUploading(true);
    try {
      const token = await getUserToken();
      const uploadRes = await FileSystem.uploadAsync(`${API_URL}/upload/image`, photo.uri, {
        httpMethod: "POST",
        uploadType: 1,
        fieldName: "file",
        mimeType: photo.mimeType || "image/jpeg",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (uploadRes.status >= 200 && uploadRes.status < 300) {
        const uploadData = JSON.parse(uploadRes.body);
        const avatarUrl = uploadData.url || uploadData.secure_url || uploadData.imageUrl;
        if (avatarUrl) {
          const updateRes = await fetch(`${API_URL}/user/update`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ avatar: avatarUrl, user_token: token }),
          });
          if (!updateRes.ok) {
            setError("Photo saved but profile update failed. You can set it from settings.");
          }
        } else {
          setError("Upload succeeded but no URL returned. Try again from settings.");
        }
      } else {
        const errData = JSON.parse(uploadRes.body || "{}");
        setError(errData.msg || "Upload failed. You can add a photo from settings.");
        setUploading(false);
        return;
      }
    } catch (err) {
      console.error("[photo-upload] threw:", err?.message, err);
      setError("Upload failed. You can add a photo from settings.");
      setUploading(false);
      return;
    } finally {
      setUploading(false);
    }
    router.replace("/(app)/dashboard");
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { paddingTop: STATUS_BAR_HEIGHT + 20 }]}>
        <View style={[styles.iconWrap, { backgroundColor: theme.colors.brandTint }]}>
          <Camera size={24} color={theme.colors.brand} />
        </View>
        <Text style={[styles.title, { color: theme.colors.text }]}>Add a profile photo</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
          Help others recognize you at events. You can skip this and add it later.
        </Text>
        <View style={[styles.progressBar, { backgroundColor: theme.colors.surfaceMuted }]}>
          <View style={[styles.progressFill, { backgroundColor: theme.colors.brand, width: "100%" }]} />
        </View>
        <Text style={[styles.stepLabel, { color: theme.colors.textSubtle }]}>Step 3 of 3</Text>
      </View>

      <View style={styles.photoSection}>
        <Pressable onPress={pickPhoto} style={[styles.photoCircle, {
          backgroundColor: photo ? "transparent" : theme.colors.surfaceMuted,
          borderColor: photo ? theme.colors.brand : theme.colors.border,
          borderStyle: photo ? "solid" : "dashed",
        }]}>
          {photo ? (
            <>
              <Image source={{ uri: photo.uri }} style={styles.photoImg} />
              <View style={[styles.editOverlay, { backgroundColor: "rgba(0,0,0,0.35)" }]}>
                <Camera size={22} color="#fff" />
              </View>
            </>
          ) : (
            <>
              <Camera size={36} color={theme.colors.textSubtle} />
              <Text style={[styles.photoHint, { color: theme.colors.textSubtle }]}>Tap to choose</Text>
            </>
          )}
        </Pressable>
        {photo && (
          <View style={[styles.photoBadge, { backgroundColor: "rgba(61,158,74,0.12)" }]}>
            <Check size={14} color="#3D9E4A" />
            <Text style={[styles.photoBadgeText, { color: "#3D9E4A" }]}>Photo selected</Text>
          </View>
        )}
      </View>

      <View style={{ flex: 1 }} />

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) + 8, borderTopColor: theme.colors.border }]}>
        {error ? <Text style={[styles.error, { color: "#f59e0b" }]}>{error}</Text> : null}
        <Pressable
          onPress={handleFinish}
          disabled={uploading}
          style={[styles.continueBtn, { backgroundColor: theme.colors.brand, opacity: uploading ? 0.8 : 1 }]}
        >
          {uploading ? (
            <ActivityIndicator size="small" color="#1A1A14" />
          ) : (
            <Text style={styles.continueBtnText}>{photo ? "Finish Setup" : "Skip for now"}</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 8,
    alignItems: "flex-start",
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    fontFamily: "SpaceGrotesk_700Bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: "PlusJakartaSans_400Regular",
    lineHeight: 22,
    marginBottom: 20,
  },
  progressBar: {
    width: "100%",
    height: 4,
    borderRadius: 2,
    marginBottom: 6,
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  stepLabel: {
    fontSize: 12,
    fontFamily: "PlusJakartaSans_500Medium",
  },
  photoSection: {
    alignItems: "center",
    paddingTop: 40,
    gap: 16,
  },
  photoCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    gap: 8,
  },
  photoImg: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  editOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  photoHint: {
    fontSize: 13,
    fontFamily: "PlusJakartaSans_400Regular",
  },
  photoBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 100,
  },
  photoBadgeText: {
    fontSize: 13,
    fontFamily: "PlusJakartaSans_600SemiBold",
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    gap: 10,
  },
  error: {
    fontSize: 13,
    fontFamily: "PlusJakartaSans_500Medium",
    textAlign: "center",
  },
  continueBtn: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 18,
  },
  continueBtnText: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "PlusJakartaSans_700Bold",
    color: "#1A1A14",
  },
});
