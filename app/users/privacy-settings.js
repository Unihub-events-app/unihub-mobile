import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  Platform,
  StatusBar,
  Animated,
  Alert,
  Modal,
  TouchableWithoutFeedback,
} from "react-native";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  ShieldCheck,
  Lock,
  AtSign,
  Trash2,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  X,
} from "lucide-react-native";
import { useTheme } from "../../theme/ThemeProvider.js";
import { radius, spacing } from "../../theme/tokens.js";
import { API_URL } from "../../lib/config.js";
import { getUserToken } from "../../lib/auth.js";
import { useSessionStore } from "../../lib/auth.js";

const STATUS_BAR_HEIGHT = Platform.OS === "android" ? StatusBar.currentHeight || 24 : 44;

function ScalePressable({ onPress, style, children, disabled }) {
  const scale = useRef(new Animated.Value(1)).current;
  const pressIn = () =>
    Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 40 }).start();
  const pressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 25 }).start();
  return (
    <Pressable onPress={onPress} onPressIn={pressIn} onPressOut={pressOut} disabled={disabled}>
      <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>
    </Pressable>
  );
}

function SecurityRow({ icon: Icon, iconColor, label, desc, onPress }) {
  const { theme } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;
  const pressIn = () =>
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 40 }).start();
  const pressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 25 }).start();

  return (
    <Pressable onPress={onPress} onPressIn={pressIn} onPressOut={pressOut}>
      <Animated.View style={[styles.secRow, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, transform: [{ scale }] }]}>
        <View style={[styles.secRowIcon, { backgroundColor: (iconColor || theme.colors.brand) + "18" }]}>
          <Icon size={20} color={iconColor || theme.colors.brand} />
        </View>
        <View style={styles.secRowMeta}>
          <Text style={[styles.secRowLabel, { color: theme.colors.text }]}>{label}</Text>
          <Text style={[styles.secRowDesc, { color: theme.colors.textMuted }]}>{desc}</Text>
        </View>
        <ChevronRight size={18} color={theme.colors.textSubtle} />
      </Animated.View>
    </Pressable>
  );
}

function ChangePasswordModal({ visible, onClose, theme }) {
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const showMsg = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: "", text: "" }), 3000);
  };

  const handleChange = async () => {
    if (!currentPw || !newPw || !confirmPw) { showMsg("error", "Fill all fields."); return; }
    if (newPw !== confirmPw) { showMsg("error", "New passwords don't match."); return; }
    if (newPw.length < 8) { showMsg("error", "Password must be at least 8 characters."); return; }

    setSaving(true);
    try {
      const token = await getUserToken();
      const res = await fetch(`${API_URL}/user/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ user_token: token, currentPassword: currentPw, newPassword: newPw }),
      });
      if (res.ok) {
        showMsg("success", "Password changed!");
        setTimeout(() => { onClose(); setCurrentPw(""); setNewPw(""); setConfirmPw(""); }, 1200);
      } else {
        const data = await res.json().catch(() => ({}));
        showMsg("error", data.msg || "Incorrect current password.");
      }
    } catch {
      showMsg("error", "Network error.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={[styles.modalOverlay, { backgroundColor: theme.colors.overlay }]}>
          <TouchableWithoutFeedback>
            <View style={[styles.modalSheet, { backgroundColor: theme.colors.surface }]}>
              <View style={styles.modalHandle} />
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Change Password</Text>
                <Pressable onPress={onClose} hitSlop={8}>
                  <X size={20} color={theme.colors.textSubtle} />
                </Pressable>
              </View>

              {msg.text ? (
                <View style={[styles.modalToast, {
                  backgroundColor: msg.type === "error" ? "rgba(220,38,38,0.1)" : "rgba(61,158,74,0.1)",
                  borderColor: msg.type === "error" ? theme.colors.error : theme.colors.success,
                }]}>
                  {msg.type === "error"
                    ? <AlertCircle size={13} color={theme.colors.error} />
                    : <CheckCircle size={13} color={theme.colors.success} />}
                  <Text style={{ fontSize: 13, fontFamily: "PlusJakartaSans_500Medium", color: msg.type === "error" ? theme.colors.error : theme.colors.success, flex: 1 }}>
                    {msg.text}
                  </Text>
                </View>
              ) : null}

              <View style={styles.modalFields}>
                <View>
                  <Text style={[styles.fieldLabel, { color: theme.colors.textSubtle }]}>Current Password</Text>
                  <View style={[styles.pwField, { borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceMuted }]}>
                    <TextInput
                      style={[styles.pwInput, { color: theme.colors.text }]}
                      value={currentPw}
                      onChangeText={setCurrentPw}
                      secureTextEntry={!showCurrent}
                      placeholder="••••••••"
                      placeholderTextColor={theme.colors.textSubtle}
                    />
                    <Pressable onPress={() => setShowCurrent((v) => !v)} hitSlop={6}>
                      {showCurrent ? <EyeOff size={16} color={theme.colors.textSubtle} /> : <Eye size={16} color={theme.colors.textSubtle} />}
                    </Pressable>
                  </View>
                </View>

                <View>
                  <Text style={[styles.fieldLabel, { color: theme.colors.textSubtle }]}>New Password</Text>
                  <View style={[styles.pwField, { borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceMuted }]}>
                    <TextInput
                      style={[styles.pwInput, { color: theme.colors.text }]}
                      value={newPw}
                      onChangeText={setNewPw}
                      secureTextEntry={!showNew}
                      placeholder="Min. 8 characters"
                      placeholderTextColor={theme.colors.textSubtle}
                    />
                    <Pressable onPress={() => setShowNew((v) => !v)} hitSlop={6}>
                      {showNew ? <EyeOff size={16} color={theme.colors.textSubtle} /> : <Eye size={16} color={theme.colors.textSubtle} />}
                    </Pressable>
                  </View>
                </View>

                <View>
                  <Text style={[styles.fieldLabel, { color: theme.colors.textSubtle }]}>Confirm New Password</Text>
                  <View style={[styles.pwField, { borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceMuted }]}>
                    <TextInput
                      style={[styles.pwInput, { color: theme.colors.text }]}
                      value={confirmPw}
                      onChangeText={setConfirmPw}
                      secureTextEntry
                      placeholder="••••••••"
                      placeholderTextColor={theme.colors.textSubtle}
                    />
                  </View>
                </View>
              </View>

              <ScalePressable
                onPress={handleChange}
                style={[styles.modalSubmitBtn, { backgroundColor: theme.colors.brand, opacity: saving ? 0.7 : 1 }]}
                disabled={saving}
              >
                {saving
                  ? <ActivityIndicator size="small" color="#1A1A14" />
                  : <Text style={styles.modalSubmitText}>Update Password</Text>}
              </ScalePressable>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

export default function PrivacySettingsScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const clearSession = useSessionStore((state) => state.clearSession);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [deleteStep, setDeleteStep] = useState(null); // null | "warn" | "confirm" | "done"
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const showMsg = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: "", text: "" }), 3500);
  };

  const handleRequestDeletion = async () => {
    setDeleteLoading(true);
    try {
      const token = await getUserToken();
      const res = await fetch(`${API_URL}/user/request-deletion`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ user_token: token }),
      });
      if (res.ok) {
        setDeleteStep("done");
      } else {
        const data = await res.json().catch(() => ({}));
        showMsg("error", data.msg || "Failed to schedule deletion.");
        setDeleteStep(null);
      }
    } catch {
      showMsg("error", "Network error. Try again.");
      setDeleteStep(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: STATUS_BAR_HEIGHT + 12, backgroundColor: theme.colors.background, borderBottomColor: theme.colors.border }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: theme.colors.surfaceMuted }]} hitSlop={8}>
          <ArrowLeft size={18} color={theme.colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Privacy & Security</Text>
        <View style={{ width: 40 }} />
      </View>

      {msg.text ? (
        <View style={[styles.toast, {
          backgroundColor: msg.type === "error" ? "rgba(220,38,38,0.1)" : "rgba(61,158,74,0.1)",
          borderColor: msg.type === "error" ? theme.colors.error : theme.colors.success,
        }]}>
          {msg.type === "error"
            ? <AlertCircle size={14} color={theme.colors.error} />
            : <CheckCircle size={14} color={theme.colors.success} />}
          <Text style={[styles.toastText, { color: msg.type === "error" ? theme.colors.error : theme.colors.success }]}>{msg.text}</Text>
        </View>
      ) : null}

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <Text style={[styles.sectionLabel, { color: theme.colors.textSubtle }]}>ACCOUNT</Text>
        <SecurityRow
          icon={KeyRound}
          iconColor="#6366f1"
          label="Change Password"
          desc="Use a strong password with letters and numbers."
          onPress={() => setShowPasswordModal(true)}
        />
        <SecurityRow
          icon={AtSign}
          iconColor={theme.colors.brand}
          label="Change Username"
          desc="14-day cooldown applies between changes."
          onPress={() => router.push("/(app)/change-username")}
        />

        <Text style={[styles.sectionLabel, { color: theme.colors.textSubtle, marginTop: 8 }]}>DANGER ZONE</Text>
        <Pressable onPress={() => setDeleteStep("warn")}>
          <View style={[styles.deleteCard, { backgroundColor: "rgba(220,38,38,0.06)", borderColor: "rgba(220,38,38,0.25)" }]}>
            <View style={[styles.deleteIconWrap, { backgroundColor: "rgba(220,38,38,0.12)" }]}>
              <Trash2 size={20} color="#DC2626" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.deleteTitle]}>Delete Account</Text>
              <Text style={[styles.deleteSub, { color: theme.colors.textMuted }]}>
                Permanently delete your UniHub account. Cannot be undone after 7 days.
              </Text>
            </View>
            <ChevronRight size={16} color="#DC2626" />
          </View>
        </Pressable>

        <View style={{ height: 60 }} />
      </ScrollView>

      <ChangePasswordModal
        visible={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        theme={theme}
      />

      {/* Delete Step 1: Warning */}
      <Modal visible={deleteStep === "warn"} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setDeleteStep(null)}>
          <View style={[styles.modalOverlay, { backgroundColor: theme.colors.overlay }]}>
            <TouchableWithoutFeedback>
              <View style={[styles.deleteModal, { backgroundColor: theme.colors.surface }]}>
                <View style={[styles.deleteModalIcon, { backgroundColor: "rgba(220,38,38,0.12)" }]}>
                  <Trash2 size={32} color="#DC2626" />
                </View>
                <Text style={[styles.deleteModalTitle, { color: theme.colors.text }]}>Delete your account?</Text>
                <Text style={[styles.deleteModalBody, { color: theme.colors.textMuted }]}>
                  This permanently deletes everything — your profile, events, communities, wallet balance, and all data.{" "}
                  <Text style={{ fontWeight: "700" }}>This cannot be undone after 7 days.</Text>
                </Text>
                <View style={styles.deleteModalBtns}>
                  <ScalePressable
                    onPress={() => setDeleteStep(null)}
                    style={[styles.deleteModalBtn, { backgroundColor: theme.colors.surfaceMuted }]}
                  >
                    <Text style={[styles.deleteModalBtnText, { color: theme.colors.text }]}>Cancel</Text>
                  </ScalePressable>
                  <ScalePressable
                    onPress={() => setDeleteStep("confirm")}
                    style={[styles.deleteModalBtn, { backgroundColor: "rgba(220,38,38,0.12)", borderWidth: 1, borderColor: "#DC2626" }]}
                  >
                    <Text style={[styles.deleteModalBtnText, { color: "#DC2626" }]}>Continue</Text>
                  </ScalePressable>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Delete Step 2: Confirm */}
      <Modal visible={deleteStep === "confirm"} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setDeleteStep(null)}>
          <View style={[styles.modalOverlay, { backgroundColor: theme.colors.overlay }]}>
            <TouchableWithoutFeedback>
              <View style={[styles.deleteModal, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.deleteModalTitle, { color: "#DC2626" }]}>Are you absolutely sure?</Text>
                <Text style={[styles.deleteModalBody, { color: theme.colors.textMuted }]}>
                  Tap <Text style={{ fontWeight: "800" }}>"Delete my account"</Text> to confirm. Your account will be scheduled for permanent deletion in 7 days.
                </Text>
                <View style={styles.deleteModalBtns}>
                  <ScalePressable
                    onPress={() => setDeleteStep(null)}
                    style={[styles.deleteModalBtn, { backgroundColor: theme.colors.surfaceMuted }]}
                  >
                    <Text style={[styles.deleteModalBtnText, { color: theme.colors.text }]}>Cancel</Text>
                  </ScalePressable>
                  <ScalePressable
                    onPress={handleRequestDeletion}
                    style={[styles.deleteModalBtn, { backgroundColor: "#DC2626", opacity: deleteLoading ? 0.7 : 1 }]}
                    disabled={deleteLoading}
                  >
                    {deleteLoading
                      ? <ActivityIndicator size="small" color="#fff" />
                      : <Text style={[styles.deleteModalBtnText, { color: "#fff" }]}>Delete my account</Text>}
                  </ScalePressable>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Delete Step 3: Done */}
      <Modal visible={deleteStep === "done"} transparent animationType="fade">
        <View style={[styles.modalOverlay, { backgroundColor: theme.colors.overlay }]}>
          <View style={[styles.deleteModal, { backgroundColor: theme.colors.surface }]}>
            <View style={[styles.deleteModalIcon, { backgroundColor: "rgba(220,38,38,0.12)" }]}>
              <CheckCircle size={32} color="#DC2626" />
            </View>
            <Text style={[styles.deleteModalTitle, { color: theme.colors.text }]}>Deletion Scheduled</Text>
            <Text style={[styles.deleteModalBody, { color: theme.colors.textMuted }]}>
              Your account is scheduled for permanent deletion in{" "}
              <Text style={{ fontWeight: "800" }}>7 days</Text>. If you change your mind, just sign back in before then.
            </Text>
            <ScalePressable
              style={[styles.deleteModalFullBtn, { backgroundColor: "#DC2626" }]}
              onPress={() => {
                setDeleteStep(null);
                clearSession();
                router.replace("/(auth)/signin");
              }}
            >
              <Text style={[styles.deleteModalBtnText, { color: "#fff" }]}>Got it — sign me out</Text>
            </ScalePressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: radius.xxl,
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    fontFamily: "PlusJakartaSans_700Bold",
  },
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
  scroll: {
    paddingHorizontal: spacing.page,
    paddingVertical: 16,
    gap: 10,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "800",
    fontFamily: "PlusJakartaSans_700Bold",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  secRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  secRowIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  secRowMeta: { flex: 1 },
  secRowLabel: {
    fontSize: 15,
    fontWeight: "700",
    fontFamily: "PlusJakartaSans_700Bold",
    marginBottom: 2,
  },
  secRowDesc: {
    fontSize: 12,
    fontFamily: "PlusJakartaSans_400Regular",
  },
  deleteCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  deleteIconWrap: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteTitle: {
    fontSize: 15,
    fontWeight: "700",
    fontFamily: "PlusJakartaSans_700Bold",
    color: "#DC2626",
    marginBottom: 2,
  },
  deleteSub: {
    fontSize: 12,
    fontFamily: "PlusJakartaSans_400Regular",
  },

  /* Modals */
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  modalSheet: {
    width: "100%",
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: 24,
    gap: 16,
    paddingBottom: 40,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(0,0,0,0.15)",
    alignSelf: "center",
    marginBottom: 4,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    fontFamily: "SpaceGrotesk_700Bold",
  },
  modalFields: { gap: 14 },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    fontFamily: "PlusJakartaSans_700Bold",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  pwField: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  pwInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: "PlusJakartaSans_400Regular",
  },
  modalToast: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  modalSubmitBtn: {
    paddingVertical: 14,
    borderRadius: radius.xxl,
    alignItems: "center",
  },
  modalSubmitText: {
    fontSize: 15,
    fontWeight: "800",
    fontFamily: "PlusJakartaSans_700Bold",
    color: "#1A1A14",
  },

  /* Delete modals */
  deleteModal: {
    margin: 24,
    borderRadius: radius.xl,
    padding: 28,
    gap: 16,
    alignItems: "center",
    maxWidth: 360,
    width: "100%",
  },
  deleteModalIcon: {
    width: 64,
    height: 64,
    borderRadius: radius.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteModalTitle: {
    fontSize: 20,
    fontWeight: "900",
    fontFamily: "SpaceGrotesk_700Bold",
    textAlign: "center",
  },
  deleteModalBody: {
    fontSize: 14,
    fontFamily: "PlusJakartaSans_400Regular",
    lineHeight: 21,
    textAlign: "center",
  },
  deleteModalBtns: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
  },
  deleteModalBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: radius.xxl,
    alignItems: "center",
  },
  deleteModalBtnText: {
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "PlusJakartaSans_700Bold",
  },
  deleteModalFullBtn: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: radius.xxl,
    alignItems: "center",
  },
});
