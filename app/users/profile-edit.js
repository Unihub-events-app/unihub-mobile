import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Image,
  Platform,
  StatusBar,
  Alert,
  Animated,
} from "react-native";
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  Camera,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  Sparkles,
  GraduationCap,
  MapPin,
  Phone,
  Heart,
  ShieldCheck,
  AtSign,
  Check,
  X,
} from "lucide-react-native";
import { useTheme } from "../../theme/ThemeProvider.js";
import { radius, spacing } from "../../theme/tokens.js";
import { API_URL } from "../../lib/config.js";
import { getUserToken } from "../../lib/auth.js";

let ImagePicker = null;
try { ImagePicker = require("expo-image-picker"); } catch {}

const STATUS_BAR_HEIGHT = Platform.OS === "android" ? StatusBar.currentHeight || 24 : 44;

const INTERESTS = [
  { label: "Technology", emoji: "💻" },
  { label: "Music", emoji: "🎵" },
  { label: "Sports", emoji: "⚽" },
  { label: "Art", emoji: "🎨" },
  { label: "Business", emoji: "💼" },
  { label: "Science", emoji: "🔬" },
  { label: "Gaming", emoji: "🎮" },
  { label: "Health", emoji: "🏃" },
  { label: "Food", emoji: "🍕" },
  { label: "Travel", emoji: "✈️" },
  { label: "Politics", emoji: "🗳️" },
  { label: "Education", emoji: "📚" },
  { label: "Fashion", emoji: "👗" },
  { label: "Photography", emoji: "📸" },
  { label: "Film", emoji: "🎬" },
  { label: "Literature", emoji: "📖" },
  { label: "Dance", emoji: "💃" },
  { label: "Comedy", emoji: "😂" },
];

const LEVELS = ["100 Level", "200 Level", "300 Level", "400 Level", "500 Level", "Postgraduate", "PhD"];

const SECTIONS = [
  { id: "profile", label: "Who Are You?", emoji: "✨", color: "#C8E630" },
  { id: "academic", label: "Your Studies", emoji: "🎓", color: "#6366f1" },
  { id: "contact", label: "Stay Connected", emoji: "📱", color: "#06b6d4" },
  { id: "interests", label: "Your Vibe", emoji: "🔥", color: "#f59e0b" },
  { id: "privacy", label: "Privacy", emoji: "🛡️", color: "#3D9E4A" },
];

function ScalePressable({ onPress, style, children, disabled }) {
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => { scale.value = withSpring(0.94, { damping: 20, stiffness: 400 }); }}
      onPressOut={() => { scale.value = withSpring(1.0, { damping: 20, stiffness: 400 }); }}
      disabled={disabled}
    >
      <Reanimated.View style={[style, anim]}>{children}</Reanimated.View>
    </Pressable>
  );
}

function SectionTab({ section, active, onPress }) {
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => { scale.value = withSpring(0.9, { damping: 20, stiffness: 400 }); }}
      onPressOut={() => { scale.value = withSpring(1.0, { damping: 22, stiffness: 280 }); }}
    >
      <Reanimated.View
        style={[
          styles.sectionTab,
          active && { backgroundColor: section.color + "22", borderColor: section.color },
          anim,
        ]}
      >
        <Text style={styles.sectionTabEmoji}>{section.emoji}</Text>
        <Text style={[styles.sectionTabLabel, active && { color: section.color }]}>
          {section.label.split(" ")[0]}
        </Text>
      </Reanimated.View>
    </Pressable>
  );
}

function FunField({ label, hint, children, done }) {
  const { theme } = useTheme();
  return (
    <View style={styles.funField}>
      <View style={styles.funFieldHeader}>
        <Text style={[styles.funFieldLabel, { color: theme.colors.textSubtle }]}>{label}</Text>
        {done && <CheckCircle size={14} color={theme.colors.success} />}
      </View>
      {hint && <Text style={[styles.funFieldHint, { color: theme.colors.textSubtle }]}>{hint}</Text>}
      {children}
    </View>
  );
}

function InterestPill({ interest, active, onPress }) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => { scale.value = withSpring(0.92, { damping: 20, stiffness: 600 }); }}
      onPressOut={() => { scale.value = withSpring(1.0, { damping: 20, stiffness: 600 }); }}
    >
      <Reanimated.View
        style={[
          styles.interestPill,
          { backgroundColor: theme.colors.surfaceMuted, borderColor: theme.colors.border },
          active && { backgroundColor: theme.colors.brand, borderColor: theme.colors.brand },
          anim,
        ]}
      >
        <Text style={styles.interestPillEmoji}>{interest.emoji}</Text>
        <Text style={[styles.interestPillText, { color: theme.colors.textMuted }, active && { color: theme.colors.textOnBrand, fontWeight: "700" }]}>
          {interest.label}
        </Text>
        {active && <Check size={12} color={theme.colors.textOnBrand} />}
      </Reanimated.View>
    </Pressable>
  );
}

export default function ProfileEditScreen() {
  const router = useRouter();
  const { theme } = useTheme();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [universities, setUniversities] = useState([]);
  const [showUniversityDropdown, setShowUniversityDropdown] = useState(false);
  const [showLevelDropdown, setShowLevelDropdown] = useState(false);
  const [activeSection, setActiveSection] = useState("profile");

  const saveScale = useRef(new Animated.Value(1)).current;
  const headerAnim = useRef(new Animated.Value(0)).current;

  const [form, setForm] = useState({
    avatar: "",
    displayName: "",
    bio: "",
    location: "",
    country: "",
    interests: [],
    timezone: "",
    publicProfile: true,
    hideStats: false,
    university: "",
    levelOfStudy: "",
    department: "",
    phoneNumber: "",
  });

  const completionScore = (() => {
    let score = 0;
    if (form.avatar) score += 20;
    if (form.displayName) score += 20;
    if (form.bio) score += 15;
    if (form.university) score += 15;
    if (form.interests.length >= 3) score += 15;
    if (form.location || form.phoneNumber) score += 15;
    return score;
  })();

  useEffect(() => {
    Animated.timing(headerAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    const load = async () => {
      try {
        const token = await getUserToken();
        if (!token) { router.push("/(auth)/signin"); return; }
        const res = await fetch(`${API_URL}/user/details`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ user_token: token }),
        });
        if (res.ok) {
          const u = await res.json();
          setForm({
            avatar: u.avatar || "",
            displayName: u.displayName || u.username || "",
            bio: u.bio || "",
            location: u.location || "",
            country: u.country || "",
            interests: u.interests || [],
            timezone: u.timezone || "",
            publicProfile: u.publicProfile ?? true,
            hideStats: u.hideStats ?? false,
            university: u.university || "",
            levelOfStudy: u.levelOfStudy || "",
            department: u.department || "",
            phoneNumber: u.phoneNumber || "",
          });
          if (u.country) fetchUniversities(u.country);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const fetchUniversities = async (country) => {
    if (!country) return;
    try {
      const res = await fetch(`${API_URL}/universities/${encodeURIComponent(country)}`);
      if (res.ok) {
        const data = await res.json();
        setUniversities(Array.isArray(data) ? data.map((u) => (typeof u === "string" ? u : u.name)) : []);
      }
    } catch {}
  };

  const handleAvatarUpload = async () => {
    if (!ImagePicker) { Alert.alert("Not available", "Image picker not available."); return; }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") { Alert.alert("Permission required", "Allow access to your photos to change your avatar."); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (result.canceled) return;
    setUploadingAvatar(true);
    try {
      const token = await getUserToken();
      const asset = result.assets[0];
      const fd = new FormData();
      fd.append("file", { uri: asset.uri, name: "avatar.jpg", type: asset.mimeType || "image/jpeg" });
      const res = await fetch(`${API_URL}/upload/image`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      });
      if (res.ok) {
        const data = await res.json();
        const url = data.url || data.secure_url || data.imageUrl;
        if (url) setForm((prev) => ({ ...prev, avatar: url }));
        else showMsg("error", "Upload returned no URL.");
      } else {
        showMsg("error", "Avatar upload failed.");
      }
    } catch {
      showMsg("error", "Upload error. Check connection.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const toggleInterest = (label) => {
    setForm((prev) => ({
      ...prev,
      interests: prev.interests.includes(label)
        ? prev.interests.filter((i) => i !== label)
        : [...prev.interests, label],
    }));
  };

  const showMsg = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 3000);
  };

  const handleSave = async () => {
    Animated.sequence([
      Animated.spring(saveScale, { toValue: 0.92, useNativeDriver: true, speed: 40 }),
      Animated.spring(saveScale, { toValue: 1, useNativeDriver: true, speed: 20 }),
    ]).start();
    setSaving(true);
    try {
      const token = await getUserToken();
      const res = await fetch(`${API_URL}/user/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          user_token: token,
          profile: {
            avatar: form.avatar,
            displayName: form.displayName,
            bio: form.bio,
            location: form.location,
            country: form.country,
            interests: form.interests,
            timezone: form.timezone,
            publicProfile: form.publicProfile,
            hideStats: form.hideStats,
            university: form.university,
            levelOfStudy: form.levelOfStudy,
            department: form.department,
            phoneNumber: form.phoneNumber,
          },
        }),
      });
      if (res.ok) {
        showMsg("success", "Profile updated! 🎉");
        setTimeout(() => router.back(), 1200);
      } else {
        showMsg("error", "Failed to save changes.");
      }
    } catch {
      showMsg("error", "Network error.");
    } finally {
      setSaving(false);
    }
  };

  const initials = (form.displayName || "?").substring(0, 2).toUpperCase();
  const currentSection = SECTIONS.find((s) => s.id === activeSection);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.brand} />
        <Text style={[styles.loadingText, { color: theme.colors.textSubtle }]}>Loading your profile…</Text>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>

      {/* ── HERO HEADER ── */}
      <Animated.View
        style={[
          styles.hero,
          { backgroundColor: theme.colors.navSurface, opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] },
        ]}
      >
        <View style={[styles.heroTopRow, { paddingTop: STATUS_BAR_HEIGHT + 8 }]}>
          <Pressable onPress={() => router.back()} style={styles.heroBack} hitSlop={8}>
            <ArrowLeft size={20} color="#fff" />
          </Pressable>
          <Text style={styles.heroTitle}>Edit Profile</Text>
          <ScalePressable onPress={handleSave} style={styles.saveBtn} disabled={saving}>
            {saving ? (
              <ActivityIndicator size="small" color={theme.colors.textOnBrand} />
            ) : (
              <Animated.View style={{ transform: [{ scale: saveScale }] }}>
                <Text style={styles.saveBtnText}>Save ✓</Text>
              </Animated.View>
            )}
          </ScalePressable>
        </View>

        {/* Avatar + completion */}
        <View style={styles.heroBody}>
          <Pressable onPress={handleAvatarUpload} style={styles.avatarWrap}>
            {uploadingAvatar ? (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <ActivityIndicator color={theme.colors.brand} />
              </View>
            ) : form.avatar ? (
              <Image source={{ uri: form.avatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>
            )}
            <View style={styles.cameraIcon}>
              <Camera size={15} color="#1A1A14" />
            </View>
          </Pressable>

          <View style={styles.heroInfo}>
            <Text style={styles.heroName} numberOfLines={1}>
              {form.displayName || "Your Name"}
            </Text>
            <Text style={styles.heroHint}>Tap photo to change</Text>
            {/* Completion bar */}
            <View style={styles.completionRow}>
              <View style={[styles.completionBar, { backgroundColor: "rgba(255,255,255,0.15)" }]}>
                <View
                  style={[
                    styles.completionFill,
                    { width: `${completionScore}%`, backgroundColor: theme.colors.brand },
                  ]}
                />
              </View>
              <Text style={styles.completionPct}>{completionScore}%</Text>
              <Text style={styles.completionLabel}>complete</Text>
            </View>
          </View>
        </View>
      </Animated.View>

      {/* ── TOAST ── */}
      {message.text ? (
        <View
          style={[
            styles.toast,
            {
              backgroundColor: message.type === "error" ? "rgba(220,38,38,0.1)" : theme.colors.brandTint,
              borderColor: message.type === "error" ? theme.colors.error : theme.colors.success,
            },
          ]}
        >
          {message.type === "error"
            ? <AlertCircle size={14} color={theme.colors.error} />
            : <CheckCircle size={14} color={theme.colors.success} />}
          <Text style={[styles.toastText, { color: message.type === "error" ? theme.colors.error : theme.colors.success }]}>
            {message.text}
          </Text>
        </View>
      ) : null}

      {/* ── SECTION TABS ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.tabsRow, { borderBottomColor: theme.colors.border }]}
        contentContainerStyle={styles.tabsRowContent}
      >
        {SECTIONS.map((s) => (
          <SectionTab
            key={s.id}
            section={s}
            active={activeSection === s.id}
            onPress={() => setActiveSection(s.id)}
          />
        ))}
      </ScrollView>

      {/* ── SECTION HEADER ── */}
      <View style={[styles.sectionBanner, { backgroundColor: (currentSection?.color || "#C8E630") + "14" }]}>
        <Text style={styles.sectionBannerEmoji}>{currentSection?.emoji}</Text>
        <Text style={[styles.sectionBannerTitle, { color: currentSection?.color }]}>
          {currentSection?.label}
        </Text>
        {activeSection === "interests" && (
          <Text style={[styles.sectionBannerCount, { color: theme.colors.textSubtle }]}>
            {form.interests.length} picked
          </Text>
        )}
      </View>

      {/* ── SCROLLABLE CONTENT ── */}
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* ─ Profile Section ─ */}
        {activeSection === "profile" && (
          <View style={styles.sectionContent}>
            <FunField label="Display Name" done={!!form.displayName}>
              <View style={[styles.inputWrap, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
                <Sparkles size={16} color={theme.colors.brand} style={styles.inputIcon} />
                <TextInput
                  style={[styles.inputInner, { color: theme.colors.text }]}
                  value={form.displayName}
                  onChangeText={(v) => setForm((p) => ({ ...p, displayName: v }))}
                  placeholder="How you appear to others"
                  placeholderTextColor={theme.colors.textSubtle}
                />
              </View>
            </FunField>

            <FunField label="Bio" hint="Tell people what makes you interesting." done={!!form.bio}>
              <View style={[styles.inputWrap, styles.textareaWrap, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
                <TextInput
                  style={[styles.inputInner, styles.textarea, { color: theme.colors.text }]}
                  value={form.bio}
                  onChangeText={(v) => setForm((p) => ({ ...p, bio: v }))}
                  placeholder="Tell people about yourself..."
                  placeholderTextColor={theme.colors.textSubtle}
                  multiline
                  numberOfLines={4}
                />
              </View>
              {form.bio.length > 0 && (
                <Text style={[styles.charCount, { color: theme.colors.textSubtle }]}>{form.bio.length} chars</Text>
              )}
            </FunField>

            <FunField label="Location" done={!!form.location}>
              <View style={[styles.inputWrap, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
                <MapPin size={16} color="#06b6d4" style={styles.inputIcon} />
                <TextInput
                  style={[styles.inputInner, { color: theme.colors.text }]}
                  value={form.location}
                  onChangeText={(v) => setForm((p) => ({ ...p, location: v }))}
                  placeholder="City, Country"
                  placeholderTextColor={theme.colors.textSubtle}
                />
              </View>
            </FunField>

            <ScalePressable
              style={[styles.changeUsernameCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
              onPress={() => router.push("/(app)/change-username")}
            >
              <AtSign size={18} color={theme.colors.brand} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.changeUsernameTitle, { color: theme.colors.text }]}>Change Username</Text>
                <Text style={[styles.changeUsernameSub, { color: theme.colors.textSubtle }]}>14-day cooldown applies</Text>
              </View>
              <Text style={[styles.changeUsernameArrow, { color: theme.colors.textSubtle }]}>→</Text>
            </ScalePressable>
          </View>
        )}

        {/* ─ Academic Section ─ */}
        {activeSection === "academic" && (
          <View style={styles.sectionContent}>
            <FunField label="University" done={!!form.university}>
              <Pressable
                style={[styles.inputWrap, styles.dropdownTrigger, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}
                onPress={() => setShowUniversityDropdown((v) => !v)}
              >
                <GraduationCap size={16} color="#6366f1" style={styles.inputIcon} />
                <Text style={[styles.dropdownText, { color: form.university ? theme.colors.text : theme.colors.textSubtle }]}>
                  {form.university || "Select or type university"}
                </Text>
                <ChevronDown size={16} color={theme.colors.textSubtle} style={{ transform: [{ rotate: showUniversityDropdown ? "180deg" : "0deg" }] }} />
              </Pressable>
              {showUniversityDropdown && universities.length > 0 && (
                <View style={[styles.dropdownList, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                  <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
                    {universities.map((u) => (
                      <Pressable
                        key={u}
                        style={[styles.dropdownItem, { borderBottomColor: theme.colors.border }]}
                        onPress={() => { setForm((p) => ({ ...p, university: u })); setShowUniversityDropdown(false); }}
                      >
                        <Text style={[styles.dropdownItemText, { color: theme.colors.text }]}>{u}</Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              )}
              {universities.length === 0 && (
                <View style={[styles.inputWrap, { marginTop: 8, borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
                  <TextInput
                    style={[styles.inputInner, { color: theme.colors.text }]}
                    value={form.university}
                    onChangeText={(v) => setForm((p) => ({ ...p, university: v }))}
                    placeholder="Type your university"
                    placeholderTextColor={theme.colors.textSubtle}
                  />
                </View>
              )}
            </FunField>

            <FunField label="Level of Study" done={!!form.levelOfStudy}>
              <Pressable
                style={[styles.inputWrap, styles.dropdownTrigger, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}
                onPress={() => setShowLevelDropdown((v) => !v)}
              >
                <Text style={[styles.dropdownText, { color: form.levelOfStudy ? theme.colors.text : theme.colors.textSubtle }]}>
                  {form.levelOfStudy || "Select level"}
                </Text>
                <ChevronDown size={16} color={theme.colors.textSubtle} />
              </Pressable>
              {showLevelDropdown && (
                <View style={[styles.dropdownList, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                  {LEVELS.map((l) => (
                    <Pressable
                      key={l}
                      style={[styles.dropdownItem, { borderBottomColor: theme.colors.border }]}
                      onPress={() => { setForm((p) => ({ ...p, levelOfStudy: l })); setShowLevelDropdown(false); }}
                    >
                      <Text style={[styles.dropdownItemText, { color: theme.colors.text }]}>{l}</Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </FunField>

            <FunField label="Department / Faculty" done={!!form.department}>
              <View style={[styles.inputWrap, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
                <TextInput
                  style={[styles.inputInner, { color: theme.colors.text }]}
                  value={form.department}
                  onChangeText={(v) => setForm((p) => ({ ...p, department: v }))}
                  placeholder="e.g. Computer Science"
                  placeholderTextColor={theme.colors.textSubtle}
                />
              </View>
            </FunField>
          </View>
        )}

        {/* ─ Contact Section ─ */}
        {activeSection === "contact" && (
          <View style={styles.sectionContent}>
            <FunField label="Phone Number" done={!!form.phoneNumber}>
              <View style={[styles.inputWrap, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
                <Phone size={16} color="#06b6d4" style={styles.inputIcon} />
                <TextInput
                  style={[styles.inputInner, { color: theme.colors.text }]}
                  value={form.phoneNumber}
                  onChangeText={(v) => setForm((p) => ({ ...p, phoneNumber: v }))}
                  placeholder="+234 800 000 0000"
                  placeholderTextColor={theme.colors.textSubtle}
                  keyboardType="phone-pad"
                />
              </View>
            </FunField>

            <View style={[styles.infoCard, { backgroundColor: theme.colors.brandTint, borderColor: theme.colors.brand + "44" }]}>
              <Sparkles size={16} color={theme.colors.brand} />
              <Text style={[styles.infoCardText, { color: theme.colors.text }]}>
                Your phone number is only used for account security and will never be shared publicly.
              </Text>
            </View>
          </View>
        )}

        {/* ─ Interests Section ─ */}
        {activeSection === "interests" && (
          <View style={styles.sectionContent}>
            <View style={styles.interestsTip}>
              <Heart size={14} color="#f59e0b" />
              <Text style={[styles.interestsTipText, { color: theme.colors.textMuted }]}>
                Pick at least 3 to personalise your event feed.
              </Text>
            </View>

            <View style={styles.pillsGrid}>
              {INTERESTS.map((interest) => {
                const active = form.interests.includes(interest.label);
                return (
                  <InterestPill
                    key={interest.label}
                    interest={interest}
                    active={active}
                    onPress={() => toggleInterest(interest.label)}
                  />
                );
              })}
            </View>

            {form.interests.length > 0 && (
              <View style={[styles.interestsSummary, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <Text style={[styles.interestsSummaryTitle, { color: theme.colors.text }]}>
                  Your picks ({form.interests.length})
                </Text>
                <Text style={[styles.interestsSummaryList, { color: theme.colors.textMuted }]}>
                  {form.interests.join(" · ")}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* ─ Privacy Section ─ */}
        {activeSection === "privacy" && (
          <View style={styles.sectionContent}>
            <View style={[styles.privacyCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <View style={styles.privacyCardHeader}>
                <ShieldCheck size={18} color={theme.colors.success} />
                <Text style={[styles.privacyCardTitle, { color: theme.colors.text }]}>Public Profile</Text>
                <Switch
                  value={form.publicProfile}
                  onValueChange={(v) => setForm((p) => ({ ...p, publicProfile: v }))}
                  trackColor={{ false: theme.colors.border, true: theme.colors.brand }}
                  thumbColor="#fff"
                  style={styles.switchControl}
                />
              </View>
              <Text style={[styles.privacyCardSub, { color: theme.colors.textMuted }]}>
                {form.publicProfile
                  ? "Anyone can find and view your profile page."
                  : "Your profile is hidden from others."}
              </Text>
              <View style={[styles.privacyStatus, { backgroundColor: form.publicProfile ? theme.colors.brandTint : "rgba(220,38,38,0.10)" }]}>
                <Text style={{ fontSize: 11, fontFamily: "PlusJakartaSans_700Bold", fontWeight: "700", color: form.publicProfile ? theme.colors.success : theme.colors.error }}>
                  {form.publicProfile ? "🟢  VISIBLE TO EVERYONE" : "🔴  PRIVATE"}
                </Text>
              </View>
            </View>

            <View style={[styles.privacyCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <View style={styles.privacyCardHeader}>
                <Text style={{ fontSize: 18 }}>👁️</Text>
                <Text style={[styles.privacyCardTitle, { color: theme.colors.text }]}>Hide Stats</Text>
                <Switch
                  value={form.hideStats}
                  onValueChange={(v) => setForm((p) => ({ ...p, hideStats: v }))}
                  trackColor={{ false: theme.colors.border, true: theme.colors.brand }}
                  thumbColor="#fff"
                  style={styles.switchControl}
                />
              </View>
              <Text style={[styles.privacyCardSub, { color: theme.colors.textMuted }]}>
                {form.hideStats
                  ? "Follower and following counts are hidden."
                  : "Your follower and following counts are visible."}
              </Text>
            </View>
          </View>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: {
    fontSize: 14,
    fontFamily: "PlusJakartaSans_400Regular",
    marginTop: 8,
  },

  /* Hero */
  hero: {
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 16,
  },
  heroBack: {
    width: 38,
    height: 38,
    borderRadius: radius.xxl,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroTitle: {
    fontSize: 17,
    fontWeight: "700",
    fontFamily: "PlusJakartaSans_700Bold",
    color: "#fff",
  },
  saveBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: radius.xxl,
    backgroundColor: "#C8E630",
    minWidth: 76,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "PlusJakartaSans_700Bold",
    color: "#1A1A14",
  },

  heroBody: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  avatarWrap: { position: "relative" },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: radius.xl,
    overflow: "hidden",
    borderWidth: 3,
    borderColor: "#C8E630",
  },
  avatarPlaceholder: {
    backgroundColor: "rgba(200,230,48,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: {
    fontSize: 26,
    fontWeight: "800",
    fontFamily: "SpaceGrotesk_700Bold",
    color: "#C8E630",
  },
  cameraIcon: {
    position: "absolute",
    bottom: -4,
    right: -4,
    width: 28,
    height: 28,
    borderRadius: radius.full,
    backgroundColor: "#C8E630",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#1C1C18",
  },
  heroInfo: { flex: 1, gap: 4 },
  heroName: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "SpaceGrotesk_700Bold",
    color: "#fff",
  },
  heroHint: {
    fontSize: 11,
    fontFamily: "PlusJakartaSans_400Regular",
    color: "rgba(255,255,255,0.55)",
  },
  completionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },
  completionBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  completionFill: {
    height: "100%",
    borderRadius: 3,
  },
  completionPct: {
    fontSize: 12,
    fontWeight: "800",
    fontFamily: "PlusJakartaSans_700Bold",
    color: "#C8E630",
  },
  completionLabel: {
    fontSize: 11,
    fontFamily: "PlusJakartaSans_400Regular",
    color: "rgba(255,255,255,0.50)",
  },

  /* Toast */
  toast: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    marginTop: 10,
    padding: 12,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  toastText: {
    fontSize: 13,
    fontFamily: "PlusJakartaSans_500Medium",
    flex: 1,
  },

  /* Section tabs */
  tabsRow: {
    borderBottomWidth: 1,
  },
  tabsRowContent: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  sectionTab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.xxl,
    borderWidth: 1.5,
    borderColor: "transparent",
    backgroundColor: "transparent",
  },
  sectionTabEmoji: { fontSize: 15 },
  sectionTabLabel: {
    fontSize: 13,
    fontWeight: "700",
    fontFamily: "PlusJakartaSans_700Bold",
    color: "#7A7A65",
  },

  /* Section banner */
  sectionBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  sectionBannerEmoji: { fontSize: 18 },
  sectionBannerTitle: {
    fontSize: 15,
    fontWeight: "800",
    fontFamily: "PlusJakartaSans_700Bold",
    flex: 1,
  },
  sectionBannerCount: {
    fontSize: 12,
    fontFamily: "PlusJakartaSans_500Medium",
  },

  /* Scroll content */
  scroll: {
    paddingHorizontal: spacing.page,
    paddingTop: 4,
  },
  sectionContent: { gap: 16, paddingTop: 8 },

  /* Fun fields */
  funField: { gap: 8 },
  funFieldHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  funFieldLabel: {
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "PlusJakartaSans_700Bold",
    color: "#7A7A65",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  funFieldHint: {
    fontSize: 12,
    fontFamily: "PlusJakartaSans_400Regular",
    color: "#7A7A65",
    marginTop: -4,
  },

  /* Inputs */
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 2,
    gap: 10,
  },
  textareaWrap: {
    alignItems: "flex-start",
    paddingVertical: 10,
  },
  inputIcon: { flexShrink: 0 },
  inputInner: {
    flex: 1,
    fontSize: 15,
    fontFamily: "PlusJakartaSans_400Regular",
    paddingVertical: 12,
  },
  textarea: {
    height: 90,
    textAlignVertical: "top",
    paddingTop: 2,
  },
  charCount: {
    fontSize: 11,
    fontFamily: "PlusJakartaSans_400Regular",
    textAlign: "right",
    marginTop: -4,
  },

  dropdownTrigger: {
    paddingVertical: 14,
  },
  dropdownText: {
    flex: 1,
    fontSize: 15,
    fontFamily: "PlusJakartaSans_400Regular",
  },
  dropdownList: {
    borderWidth: 1,
    borderRadius: radius.md,
    marginTop: 4,
    overflow: "hidden",
  },
  dropdownItem: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  dropdownItemText: {
    fontSize: 14,
    fontFamily: "PlusJakartaSans_400Regular",
  },

  /* Change username card */
  changeUsernameCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginTop: 4,
  },
  changeUsernameTitle: {
    fontSize: 15,
    fontWeight: "700",
    fontFamily: "PlusJakartaSans_700Bold",
  },
  changeUsernameSub: {
    fontSize: 12,
    fontFamily: "PlusJakartaSans_400Regular",
    marginTop: 2,
  },
  changeUsernameArrow: {
    fontSize: 18,
    fontFamily: "PlusJakartaSans_700Bold",
  },

  /* Info card */
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    marginTop: 4,
  },
  infoCardText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "PlusJakartaSans_400Regular",
    lineHeight: 19,
  },

  /* Interests */
  interestsTip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  interestsTipText: {
    fontSize: 13,
    fontFamily: "PlusJakartaSans_400Regular",
  },
  pillsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  interestPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.xxl,
    borderWidth: 1,
  },
  interestPillEmoji: { fontSize: 14 },
  interestPillText: {
    fontSize: 13,
    fontWeight: "500",
    fontFamily: "PlusJakartaSans_500Medium",
    color: "#4A4A3A",
  },
  interestPillTextActive: { color: "#1A1A14", fontWeight: "700" },
  interestsSummary: {
    marginTop: 12,
    padding: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: 4,
  },
  interestsSummaryTitle: {
    fontSize: 13,
    fontWeight: "700",
    fontFamily: "PlusJakartaSans_700Bold",
  },
  interestsSummaryList: {
    fontSize: 12,
    fontFamily: "PlusJakartaSans_400Regular",
    lineHeight: 18,
  },

  /* Privacy */
  privacyCard: {
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: 18,
    gap: 10,
  },
  privacyCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  privacyCardTitle: {
    fontSize: 15,
    fontWeight: "700",
    fontFamily: "PlusJakartaSans_700Bold",
    flex: 1,
  },
  switchControl: { flexShrink: 0 },
  privacyCardSub: {
    fontSize: 13,
    fontFamily: "PlusJakartaSans_400Regular",
    lineHeight: 18,
  },
  privacyStatus: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.sm,
    alignSelf: "flex-start",
  },
});
