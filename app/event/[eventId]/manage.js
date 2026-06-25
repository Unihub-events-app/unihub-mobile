import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  StatusBar,
  Switch,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  Users,
  Settings,
  CheckCircle,
  XCircle,
  Trash2,
  AlertTriangle,
  Edit3,
  CalendarX,
  UserCheck,
  UserX,
  BarChart3,
  QrCode,
  Banknote,
  Megaphone,
  Download,
  Copy,
} from "lucide-react-native";
import { useTheme } from "../../../theme/ThemeProvider.js";
import { radius, spacing } from "../../../theme/tokens.js";
import { Toast, SkeletonLoader, Screen } from "../../../components/index.js";
import { API_URL } from "../../../lib/config.js";
import { getUserToken } from "../../../lib/auth.js";

const STATUS_BAR_HEIGHT = Platform.OS === "android" ? StatusBar.currentHeight || 24 : 44;
const TABS = ["Overview", "Attendees", "Check-in", "Pending", "Analytics", "Settings"];

export default function ManageEventScreen() {
  const { eventId } = useLocalSearchParams();
  const router = useRouter();
  const { theme } = useTheme();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Overview");
  const [processingId, setProcessingId] = useState(null);
  const [checkingInId, setCheckingInId] = useState(null);
  const [message, setMessage] = useState({ type: "", text: "" });

  const fetchEvent = useCallback(async () => {
    try {
      const token = await getUserToken();
      const res = await fetch(`${API_URL}/event/getevent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event_id: eventId }),
      });
      if (res.ok) {
        const data = await res.json();
        setEvent(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => { fetchEvent(); }, [fetchEvent]);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 3000);
  };

  const handleApprove = async (participantId) => {
    setProcessingId(participantId);
    try {
      const token = await getUserToken();
      const res = await fetch(`${API_URL}/registration/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ event_id: eventId, participant_id: participantId, user_token: token }),
      });
      if (res.ok) {
        showMessage("success", "Participant approved!");
        fetchEvent();
      } else {
        showMessage("error", "Failed to approve participant.");
      }
    } catch {
      showMessage("error", "Network error.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (participantId) => {
    setProcessingId(participantId);
    try {
      const token = await getUserToken();
      const res = await fetch(`${API_URL}/registration/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ event_id: eventId, participant_id: participantId, user_token: token }),
      });
      if (res.ok) {
        showMessage("success", "Participant rejected.");
        fetchEvent();
      } else {
        showMessage("error", "Failed to reject participant.");
      }
    } catch {
      showMessage("error", "Network error.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleRemoveParticipant = (participantId, name) => {
    Alert.alert(
      "Remove Attendee",
      `Remove ${name} from this event?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            setProcessingId(participantId);
            try {
              const token = await getUserToken();
              const res = await fetch(`${API_URL}/event/manage-participant`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                  event_id: eventId,
                  participant_id: participantId,
                  action: "remove",
                  user_token: token,
                }),
              });
              if (res.ok) {
                showMessage("success", "Attendee removed.");
                fetchEvent();
              } else {
                showMessage("error", "Failed to remove attendee.");
              }
            } catch {
              showMessage("error", "Network error.");
            } finally {
              setProcessingId(null);
            }
          },
        },
      ]
    );
  };

  const handleCheckIn = async (participantId, name) => {
    setCheckingInId(participantId);
    try {
      const token = await getUserToken();
      const res = await fetch(`${API_URL}/event/checkin`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ event_id: eventId, participant_id: participantId, user_token: token }),
      });
      if (res.ok) {
        showMessage("success", `${name} checked in!`);
        fetchEvent();
      } else {
        showMessage("error", "Check-in failed.");
      }
    } catch {
      showMessage("error", "Network error.");
    } finally {
      setCheckingInId(null);
    }
  };

  const handleCancelEvent = () => {
    Alert.alert(
      "Cancel Event",
      "Are you sure you want to cancel this event? All attendees will be notified and refunded.",
      [
        { text: "No, keep it", style: "cancel" },
        {
          text: "Cancel Event",
          style: "destructive",
          onPress: async () => {
            try {
              const token = await getUserToken();
              const res = await fetch(`${API_URL}/event/cancel`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ event_id: eventId, user_token: token }),
              });
              if (res.ok) {
                showMessage("success", "Event cancelled.");
                setTimeout(() => router.replace("/(app)/dashboard"), 1500);
              } else {
                showMessage("error", "Failed to cancel event.");
              }
            } catch {
              showMessage("error", "Network error.");
            }
          },
        },
      ]
    );
  };

  const handleDeleteEvent = () => {
    Alert.alert(
      "Delete Event",
      "This will permanently delete the event and all associated data. This cannot be undone.",
      [
        { text: "No, keep it", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const token = await getUserToken();
              const res = await fetch(`${API_URL}/event/delete`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ event_id: eventId, user_token: token }),
              });
              if (res.ok) {
                router.replace("/(app)/dashboard");
              } else {
                showMessage("error", "Failed to delete event.");
              }
            } catch {
              showMessage("error", "Network error.");
            }
          },
        },
      ]
    );
  };

  const styles = getStyles(theme);

  if (loading) {
    return (
      <Screen padded>
        <SkeletonLoader variant="text" />
        <SkeletonLoader variant="card" count={3} />
        <SkeletonLoader variant="row" count={4} />
      </Screen>
    );
  }

  if (!event) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.errorText, { color: theme.colors.error }]}>Event not found</Text>
      </View>
    );
  }

  const attendees = event.participants || [];
  const pendingList = event.pendingParticipants || [];
  const capacity = event.capacity || 0;
  const attendeeCount = attendees.length;
  const capacityPct = capacity > 0 ? Math.min(1, attendeeCount / capacity) : 0;

  const renderOverview = () => (
    <View style={styles.tabContent}>
      {/* Cover */}
      {event.cover && (
        <View style={styles.coverWrap}>
          <Image source={{ uri: event.cover }} style={styles.coverImg} resizeMode="cover" />
        </View>
      )}

      {/* Stats */}
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <Users size={20} color={theme.colors.brand} />
          <Text style={[styles.statVal, { color: theme.colors.text }]}>{attendeeCount}</Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSubtle }]}>Attendees</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <BarChart3 size={20} color={theme.colors.brand} />
          <Text style={[styles.statVal, { color: theme.colors.text }]}>
            {capacity > 0 ? `${Math.round(capacityPct * 100)}%` : "∞"}
          </Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSubtle }]}>Capacity</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <UserCheck size={20} color="#f59e0b" />
          <Text style={[styles.statVal, { color: theme.colors.text }]}>{pendingList.length}</Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSubtle }]}>Pending</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <QrCode size={20} color={theme.colors.success} />
          <Text style={[styles.statVal, { color: theme.colors.text }]}>
            {attendees.filter((p) => p.checkedIn).length}
          </Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSubtle }]}>Checked In</Text>
        </View>
      </View>

      {/* Capacity bar */}
      {capacity > 0 && (
        <View style={[styles.capacityCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <View style={styles.capacityRow}>
            <Text style={[styles.capacityLabel, { color: theme.colors.textSubtle }]}>CAPACITY</Text>
            <Text style={[styles.capacityFraction, { color: theme.colors.text }]}>{attendeeCount}/{capacity}</Text>
          </View>
          <View style={[styles.progressBg, { backgroundColor: theme.colors.surfaceMuted }]}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.round(capacityPct * 100)}%`,
                  backgroundColor: capacityPct >= 1 ? theme.colors.error : theme.colors.brand,
                },
              ]}
            />
          </View>
        </View>
      )}

      {/* Event info */}
      <View style={[styles.infoCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <View style={styles.infoRow}>
          <Text style={[styles.infoKey, { color: theme.colors.textSubtle }]}>Date</Text>
          <Text style={[styles.infoVal, { color: theme.colors.text }]}>{event.date}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={[styles.infoKey, { color: theme.colors.textSubtle }]}>Time</Text>
          <Text style={[styles.infoVal, { color: theme.colors.text }]}>{event.time || "TBA"}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={[styles.infoKey, { color: theme.colors.textSubtle }]}>Venue</Text>
          <Text style={[styles.infoVal, { color: theme.colors.text }]}>{event.venue}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={[styles.infoKey, { color: theme.colors.textSubtle }]}>Visibility</Text>
          <Text style={[styles.infoVal, { color: theme.colors.text }]}>{event.visibility || "public"}</Text>
        </View>
        {event.accessCode && (
          <View style={styles.infoRow}>
            <Text style={[styles.infoKey, { color: theme.colors.textSubtle }]}>Access Code</Text>
            <Text style={[styles.infoVal, { color: theme.colors.brand }]}>{event.accessCode}</Text>
          </View>
        )}
      </View>

      {/* Quick Actions */}
      <Pressable
        onPress={() => router.push(`/event/${eventId}/announce`)}
        style={[styles.announceBtn, { backgroundColor: theme.colors.brand }]}
      >
        <Megaphone size={18} color={theme.colors.textOnBrand} />
        <Text style={[styles.announceBtnText, { color: theme.colors.textOnBrand }]}>Send Announcement</Text>
      </Pressable>
    </View>
  );

  const handleExportAttendees = async () => {
    try {
      const token = await getUserToken();
      const res = await fetch(`${API_URL}/event/export-guests`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ event_id: eventId, user_token: token }),
      });
      if (!res.ok) { showMessage("error", "Export failed."); return; }
      const blob = await res.text();
      const FileSystem = require("expo-file-system");
      const Sharing = require("expo-sharing");
      const fileUri = FileSystem.documentDirectory + `attendees_${eventId}.csv`;
      await FileSystem.writeAsStringAsync(fileUri, blob, { encoding: FileSystem.EncodingType.UTF8 });
      await Sharing.shareAsync(fileUri, { mimeType: "text/csv", dialogTitle: "Export Attendees" });
    } catch {
      showMessage("error", "Export failed. Try again.");
    }
  };

  const renderAttendees = () => (
    <View style={styles.tabContent}>
      {attendees.length > 0 && (
        <Pressable
          onPress={handleExportAttendees}
          style={[styles.exportBtn, { backgroundColor: theme.colors.surfaceMuted, borderColor: theme.colors.border }]}
        >
          <Download size={16} color={theme.colors.textMuted} />
          <Text style={[styles.exportBtnText, { color: theme.colors.textMuted }]}>Export CSV</Text>
        </Pressable>
      )}
      {attendees.length === 0 ? (
        <View style={[styles.emptyCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <Users size={36} color={theme.colors.textSubtle} />
          <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>No attendees yet</Text>
        </View>
      ) : (
        attendees.map((p, i) => (
          <View key={p.id || i} style={[styles.participantCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <View style={[styles.participantAvatar, { backgroundColor: theme.colors.brandTint }]}>
              <Text style={[styles.participantAvatarText, { color: theme.colors.brand }]}>
                {(p.name || p.username || "?").substring(0, 2).toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.participantName, { color: theme.colors.text }]}>{p.name || p.username || "Attendee"}</Text>
              {p.email && (
                <Text style={[styles.participantEmail, { color: theme.colors.textMuted }]}>{p.email}</Text>
              )}
              {p.checkedIn && (
                <View style={styles.checkedInBadge}>
                  <CheckCircle size={10} color={theme.colors.success} />
                  <Text style={[styles.checkedInText, { color: theme.colors.success }]}>Checked in</Text>
                </View>
              )}
            </View>
            <Pressable
              onPress={() => handleRemoveParticipant(p.id || p.userId, p.name || p.username || "this attendee")}
              hitSlop={6}
            >
              {processingId === (p.id || p.userId) ? (
                <ActivityIndicator size="small" color={theme.colors.error} />
              ) : (
                <UserX size={18} color={theme.colors.error} />
              )}
            </Pressable>
          </View>
        ))
      )}
    </View>
  );

  const renderPending = () => {
    const [selectedIds, setSelectedIds] = React.useState([]);
    const [bulkProcessing, setBulkProcessing] = React.useState(false);

    const toggleSelect = (uid) => setSelectedIds((prev) =>
      prev.includes(uid) ? prev.filter((x) => x !== uid) : [...prev, uid]
    );
    const selectAll = () => setSelectedIds(pendingList.map((p) => p.userId));
    const clearSelected = () => setSelectedIds([]);

    const handleBulkAction = async (action) => {
      if (!selectedIds.length) return;
      setBulkProcessing(true);
      for (const uid of selectedIds) {
        action === "approve" ? await handleApprove(uid) : await handleReject(uid);
      }
      setBulkProcessing(false);
      setSelectedIds([]);
    };

    return (
      <View style={styles.tabContent}>
        {pendingList.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <UserCheck size={36} color={theme.colors.textSubtle} />
            <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>No pending requests</Text>
          </View>
        ) : (
          <>
            {/* Bulk action bar */}
            <View style={[styles.bulkBar, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <Pressable onPress={selectedIds.length === pendingList.length ? clearSelected : selectAll} style={styles.bulkSelectAll}>
                <View style={[styles.checkbox, {
                  borderColor: selectedIds.length === pendingList.length ? theme.colors.brand : theme.colors.border,
                  backgroundColor: selectedIds.length === pendingList.length ? theme.colors.brand : "transparent",
                }]}>
                  {selectedIds.length === pendingList.length && <CheckCircle size={12} color={theme.colors.textOnBrand} />}
                </View>
                <Text style={[styles.bulkSelectText, { color: theme.colors.textMuted }]}>
                  {selectedIds.length > 0 ? `${selectedIds.length} selected` : "Select all"}
                </Text>
              </Pressable>
              {selectedIds.length > 0 && (
                <View style={styles.bulkBtns}>
                  {bulkProcessing ? (
                    <ActivityIndicator size="small" color={theme.colors.brand} />
                  ) : (
                    <>
                      <Pressable
                        onPress={() => handleBulkAction("approve")}
                        style={[styles.bulkApprove, { backgroundColor: theme.colors.successTint }]}
                      >
                        <UserCheck size={14} color={theme.colors.success} />
                        <Text style={[styles.bulkBtnText, { color: theme.colors.success }]}>Approve ({selectedIds.length})</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => handleBulkAction("reject")}
                        style={[styles.bulkReject, { backgroundColor: "rgba(220,38,38,0.1)" }]}
                      >
                        <UserX size={14} color={theme.colors.error} />
                        <Text style={[styles.bulkBtnText, { color: theme.colors.error }]}>Reject ({selectedIds.length})</Text>
                      </Pressable>
                    </>
                  )}
                </View>
              )}
            </View>

            {pendingList.map((p, i) => (
              <Pressable
                key={p.userId || i}
                onPress={() => toggleSelect(p.userId)}
                style={[styles.participantCard, {
                  backgroundColor: selectedIds.includes(p.userId) ? theme.colors.brandTint : theme.colors.surface,
                  borderColor: selectedIds.includes(p.userId) ? theme.colors.brand : theme.colors.border,
                }]}
              >
                <View style={[styles.checkbox, {
                  borderColor: selectedIds.includes(p.userId) ? theme.colors.brand : theme.colors.border,
                  backgroundColor: selectedIds.includes(p.userId) ? theme.colors.brand : "transparent",
                }]}>
                  {selectedIds.includes(p.userId) && <CheckCircle size={12} color={theme.colors.textOnBrand} />}
                </View>
                <View style={[styles.participantAvatar, { backgroundColor: "rgba(245,158,11,0.12)" }]}>
                  <Text style={[styles.participantAvatarText, { color: "#f59e0b" }]}>
                    {(p.name || p.username || "?").substring(0, 2).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.participantName, { color: theme.colors.text }]}>{p.name || p.username || "User"}</Text>
                  {p.email && (
                    <Text style={[styles.participantEmail, { color: theme.colors.textMuted }]}>{p.email}</Text>
                  )}
                </View>
                <View style={styles.pendingActions}>
                  {processingId === p.userId ? (
                    <ActivityIndicator size="small" color={theme.colors.brand} />
                  ) : (
                    <>
                      <Pressable
                        onPress={(e) => { e.stopPropagation?.(); handleApprove(p.userId); }}
                        style={[styles.approveBtn, { backgroundColor: theme.colors.successTint }]}
                        hitSlop={4}
                      >
                        <UserCheck size={16} color={theme.colors.success} />
                      </Pressable>
                      <Pressable
                        onPress={(e) => { e.stopPropagation?.(); handleReject(p.userId); }}
                        style={[styles.rejectBtn, { backgroundColor: "rgba(220,38,38,0.1)" }]}
                        hitSlop={4}
                      >
                        <UserX size={16} color={theme.colors.error} />
                      </Pressable>
                    </>
                  )}
                </View>
              </Pressable>
            ))}
          </>
        )}
      </View>
    );
  };

  const handleDuplicateEvent = () => {
    Alert.alert(
      "Duplicate Event",
      "Create a copy of this event with the same details?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Duplicate",
          onPress: async () => {
            try {
              const token = await getUserToken();
              const res = await fetch(`${API_URL}/event/duplicate`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ event_id: eventId, user_token: token }),
              });
              const data = await res.json();
              if (res.ok) {
                showMessage("success", "Event duplicated!");
                if (data.event_id) router.push(`/event/${data.event_id}/manage`);
              } else {
                showMessage("error", data.msg || "Duplication failed.");
              }
            } catch {
              showMessage("error", "Network error.");
            }
          },
        },
      ]
    );
  };

  const renderSettings = () => (
    <View style={styles.tabContent}>
      {/* Duplicate Event */}
      <View style={[styles.dangerCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <Text style={[styles.dangerTitle, { color: theme.colors.text }]}>Event Actions</Text>
        <Pressable
          style={[styles.dangerBtn, { borderColor: "#6366f1", backgroundColor: "rgba(99,102,241,0.08)" }]}
          onPress={handleDuplicateEvent}
        >
          <Copy size={18} color="#6366f1" />
          <View style={{ flex: 1 }}>
            <Text style={[styles.dangerBtnTitle, { color: "#6366f1" }]}>Duplicate Event</Text>
            <Text style={[styles.dangerBtnSub, { color: theme.colors.textMuted }]}>
              Create a copy with the same details
            </Text>
          </View>
        </Pressable>
      </View>

      <View style={[styles.dangerCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <Text style={[styles.dangerTitle, { color: theme.colors.text }]}>Danger Zone</Text>
        <Text style={[styles.dangerSub, { color: theme.colors.textMuted }]}>
          These actions are irreversible. Proceed with caution.
        </Text>

        <Pressable
          style={[styles.dangerBtn, { borderColor: "#f59e0b", backgroundColor: "rgba(245,158,11,0.08)" }]}
          onPress={handleCancelEvent}
        >
          <CalendarX size={18} color="#f59e0b" />
          <View style={{ flex: 1 }}>
            <Text style={[styles.dangerBtnTitle, { color: "#f59e0b" }]}>Cancel Event</Text>
            <Text style={[styles.dangerBtnSub, { color: theme.colors.textMuted }]}>
              Notify attendees and process refunds
            </Text>
          </View>
        </Pressable>

        <Pressable
          style={[styles.dangerBtn, { borderColor: theme.colors.error, backgroundColor: "rgba(220,38,38,0.08)" }]}
          onPress={handleDeleteEvent}
        >
          <Trash2 size={18} color={theme.colors.error} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.dangerBtnTitle, { color: theme.colors.error }]}>Delete Event</Text>
            <Text style={[styles.dangerBtnSub, { color: theme.colors.textMuted }]}>
              Permanently remove all event data
            </Text>
          </View>
        </Pressable>
      </View>
    </View>
  );

  const checkedInCount = attendees.filter((p) => p.checkedIn).length;

  const renderCheckIn = () => (
    <View style={styles.tabContent}>
      {/* QR Scanner launch button */}
      <Pressable
        onPress={() => router.push(`/event/${eventId}/scan`)}
        style={[styles.scanQrBtn, { backgroundColor: theme.colors.brand }]}
      >
        <QrCode size={20} color={theme.colors.textOnBrand} />
        <Text style={[styles.scanQrBtnText, { color: theme.colors.textOnBrand }]}>Scan QR Code</Text>
      </Pressable>

      <View style={[styles.checkInHeader, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.checkInCount, { color: theme.colors.text }]}>{checkedInCount} / {attendees.length}</Text>
          <Text style={[styles.checkInLabel, { color: theme.colors.textMuted }]}>attendees checked in</Text>
        </View>
        <View style={[styles.checkInProgress, { backgroundColor: theme.colors.surfaceMuted }]}>
          <View style={[styles.checkInProgressBar, {
            backgroundColor: theme.colors.brand,
            width: attendees.length > 0 ? `${Math.round((checkedInCount / attendees.length) * 100)}%` : "0%",
          }]} />
        </View>
      </View>

      {attendees.length === 0 ? (
        <View style={[styles.emptyCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <UserCheck size={36} color={theme.colors.textSubtle} />
          <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>No attendees yet</Text>
        </View>
      ) : (
        attendees.map((p, i) => {
          const pid = p.id || p.userId;
          const name = p.name || p.username || "Attendee";
          return (
            <View key={pid || i} style={[styles.participantCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <View style={[styles.participantAvatar, {
                backgroundColor: p.checkedIn ? theme.colors.successTint : theme.colors.brandTint,
              }]}>
                <Text style={[styles.participantAvatarText, { color: p.checkedIn ? theme.colors.success : theme.colors.brand }]}>
                  {name.substring(0, 2).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.participantName, { color: theme.colors.text }]}>{name}</Text>
                {p.email ? <Text style={[styles.participantEmail, { color: theme.colors.textMuted }]}>{p.email}</Text> : null}
                {p.checkedIn ? (
                  <View style={styles.checkedInBadge}>
                    <CheckCircle size={10} color={theme.colors.success} />
                    <Text style={[styles.checkedInText, { color: theme.colors.success }]}>Checked in</Text>
                  </View>
                ) : null}
              </View>
              {!p.checkedIn ? (
                <Pressable
                  onPress={() => handleCheckIn(pid, name)}
                  disabled={checkingInId === pid}
                  style={[styles.checkInBtn, { backgroundColor: theme.colors.brand }]}
                >
                  {checkingInId === pid
                    ? <ActivityIndicator size="small" color={theme.colors.textOnBrand} />
                    : <Text style={styles.checkInBtnText}>Check In</Text>}
                </Pressable>
              ) : (
                <View style={[styles.checkInDone, { backgroundColor: theme.colors.successTint }]}>
                  <CheckCircle size={14} color={theme.colors.success} />
                </View>
              )}
            </View>
          );
        })
      )}
    </View>
  );

  const renderAnalytics = () => {
    const totalRevenue = attendees.reduce((sum, p) => sum + (Number(p.amountPaid) || 0), 0);
    const checkInRate = attendees.length > 0 ? Math.round((checkedInCount / attendees.length) * 100) : 0;
    const ticketBreakdown = {};
    attendees.forEach((p) => {
      const type = p.ticketType || "General";
      if (!ticketBreakdown[type]) ticketBreakdown[type] = { count: 0, revenue: 0 };
      ticketBreakdown[type].count += 1;
      ticketBreakdown[type].revenue += Number(p.amountPaid) || 0;
    });
    return (
      <View style={styles.tabContent}>
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Users size={20} color={theme.colors.brand} />
            <Text style={[styles.statVal, { color: theme.colors.text }]}>{attendees.length}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSubtle }]}>Total Registered</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <QrCode size={20} color={theme.colors.success} />
            <Text style={[styles.statVal, { color: theme.colors.text }]}>{checkedInCount}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSubtle }]}>Checked In</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <BarChart3 size={20} color="#6366f1" />
            <Text style={[styles.statVal, { color: theme.colors.text }]}>{checkInRate}%</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSubtle }]}>Check-in Rate</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Banknote size={20} color="#f59e0b" />
            <Text style={[styles.statVal, { color: theme.colors.text }]}>₦{totalRevenue.toLocaleString()}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSubtle }]}>Revenue</Text>
          </View>
        </View>

        {/* Check-in rate bar */}
        <View style={[styles.capacityCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <View style={styles.capacityRow}>
            <Text style={[styles.capacityLabel, { color: theme.colors.textSubtle }]}>CHECK-IN RATE</Text>
            <Text style={[styles.capacityFraction, { color: theme.colors.text }]}>{checkedInCount}/{attendees.length}</Text>
          </View>
          <View style={[styles.progressBg, { backgroundColor: theme.colors.surfaceMuted }]}>
            <View style={[styles.progressFill, { width: `${checkInRate}%`, backgroundColor: theme.colors.success }]} />
          </View>
        </View>

        {/* Ticket type breakdown */}
        {Object.keys(ticketBreakdown).length > 0 && (
          <View style={[styles.infoCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Text style={[styles.capacityLabel, { color: theme.colors.textSubtle, marginBottom: 12 }]}>TICKET BREAKDOWN</Text>
            {Object.entries(ticketBreakdown).map(([type, data]) => (
              <View key={type} style={{ marginBottom: 10 }}>
                <View style={styles.capacityRow}>
                  <Text style={[styles.infoKey, { color: theme.colors.text }]}>{type}</Text>
                  <Text style={[styles.infoVal, { color: theme.colors.textSubtle }]}>
                    {data.count} sold · ₦{data.revenue.toLocaleString()}
                  </Text>
                </View>
                <View style={[styles.progressBg, { backgroundColor: theme.colors.surfaceMuted, marginTop: 6 }]}>
                  <View style={[styles.progressFill, {
                    width: attendees.length > 0 ? `${Math.round((data.count / attendees.length) * 100)}%` : "0%",
                    backgroundColor: theme.colors.brand,
                  }]} />
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const tabContent = {
    Overview: renderOverview,
    Attendees: renderAttendees,
    "Check-in": renderCheckIn,
    Pending: renderPending,
    Analytics: renderAnalytics,
    Settings: renderSettings,
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={[styles.header, { paddingTop: STATUS_BAR_HEIGHT + 12 }]}>
        <Pressable onPress={() => router.back()} style={[styles.backPill, { backgroundColor: theme.colors.surfaceMuted }]} hitSlop={8}>
          <ArrowLeft size={18} color={theme.colors.text} />
        </Pressable>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]} numberOfLines={1}>{event.name}</Text>
          <Text style={[styles.headerSub, { color: theme.colors.textSubtle }]}>Manage Event</Text>
        </View>
      </View>

      <Toast
        visible={!!message.text}
        message={message.text}
        type={message.type || "info"}
        onDismiss={() => setMessage({ type: "", text: "" })}
      />

      {/* Tab bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabBar}
      >
        {TABS.map((tab) => (
          <Pressable
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[
              styles.tab,
              activeTab === tab
                ? { backgroundColor: theme.colors.brand }
                : { backgroundColor: theme.colors.surfaceMuted, borderColor: theme.colors.border, borderWidth: 1 },
            ]}
          >
            <Text style={[styles.tabText, { color: activeTab === tab ? theme.colors.textOnBrand : theme.colors.textSubtle }]}>
              {tab}
              {tab === "Pending" && pendingList.length > 0 ? ` (${pendingList.length})` : ""}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Tab content */}
      <ScrollView
        contentContainerStyle={{ paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        {tabContent[activeTab]?.()}
      </ScrollView>
    </View>
  );
}

const getStyles = (theme) => StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    fontSize: 16,
    fontFamily: "PlusJakartaSans_600SemiBold",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backPill: {
    width: 40,
    height: 40,
    borderRadius: radius.xxl,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    fontFamily: "PlusJakartaSans_700Bold",
  },
  headerSub: {
    fontSize: 12,
    fontFamily: "PlusJakartaSans_400Regular",
    marginTop: 1,
  },
  tabBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.xxl,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "700",
    fontFamily: "PlusJakartaSans_700Bold",
  },
  tabContent: {
    paddingHorizontal: spacing.page,
    paddingVertical: 16,
    gap: 12,
  },
  coverWrap: {
    borderRadius: radius.lg,
    overflow: "hidden",
    height: 160,
  },
  coverImg: {
    width: "100%",
    height: "100%",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  statCard: {
    flex: 1,
    minWidth: "44%",
    padding: 16,
    borderRadius: radius.lg,
    borderWidth: 1,
    alignItems: "center",
    gap: 6,
  },
  statVal: {
    fontSize: 24,
    fontWeight: "700",
    fontFamily: "SpaceGrotesk_700Bold",
  },
  statLabel: {
    fontSize: 11,
    fontFamily: "PlusJakartaSans_500Medium",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  capacityCard: {
    padding: 16,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: 10,
  },
  capacityRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  capacityLabel: {
    fontSize: 10,
    fontWeight: "800",
    fontFamily: "PlusJakartaSans_700Bold",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  capacityFraction: {
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "SpaceGrotesk_700Bold",
  },
  progressBg: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  infoCard: {
    padding: 16,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: 12,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  infoKey: {
    fontSize: 13,
    fontFamily: "PlusJakartaSans_500Medium",
  },
  infoVal: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "PlusJakartaSans_600SemiBold",
    flex: 1,
    textAlign: "right",
  },
  emptyCard: {
    padding: 40,
    borderRadius: radius.lg,
    borderWidth: 1,
    alignItems: "center",
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "PlusJakartaSans_400Regular",
  },
  participantCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: 12,
  },
  participantAvatar: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  participantAvatarText: {
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "SpaceGrotesk_700Bold",
  },
  participantName: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "PlusJakartaSans_600SemiBold",
  },
  participantEmail: {
    fontSize: 12,
    fontFamily: "PlusJakartaSans_400Regular",
    marginTop: 2,
  },
  checkedInBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  checkedInText: {
    fontSize: 11,
    fontWeight: "600",
    fontFamily: "PlusJakartaSans_600SemiBold",
  },
  bulkBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: 10,
    flexWrap: "wrap",
    gap: 8,
  },
  bulkSelectAll: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  bulkSelectText: {
    fontSize: 13,
    fontFamily: "PlusJakartaSans_500Medium",
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  bulkBtns: {
    flexDirection: "row",
    gap: 8,
  },
  bulkApprove: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: radius.xxl,
  },
  bulkReject: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: radius.xxl,
  },
  bulkBtnText: {
    fontSize: 12,
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontWeight: "600",
  },
  pendingActions: {
    flexDirection: "row",
    gap: 8,
  },
  approveBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  rejectBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  dangerCard: {
    padding: 20,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: 14,
  },
  dangerTitle: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "SpaceGrotesk_700Bold",
  },
  dangerSub: {
    fontSize: 13,
    fontFamily: "PlusJakartaSans_400Regular",
    lineHeight: 19,
  },
  dangerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  dangerBtnTitle: {
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "PlusJakartaSans_700Bold",
  },
  dangerBtnSub: {
    fontSize: 12,
    fontFamily: "PlusJakartaSans_400Regular",
    marginTop: 2,
  },
  exportBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 11,
    borderRadius: radius.xxl,
    borderWidth: 1,
    marginBottom: 12,
  },
  exportBtnText: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "PlusJakartaSans_600SemiBold",
  },
  announceBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: radius.xxl,
    marginTop: 4,
  },
  announceBtnText: {
    fontSize: 15,
    fontWeight: "700",
    fontFamily: "PlusJakartaSans_700Bold",
  },
  scanQrBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: radius.xxl,
    marginBottom: 12,
  },
  scanQrBtnText: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "PlusJakartaSans_700Bold",
  },
  checkInHeader: {
    padding: 16,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  checkInCount: {
    fontSize: 22,
    fontWeight: "700",
    fontFamily: "SpaceGrotesk_700Bold",
  },
  checkInLabel: {
    fontSize: 12,
    fontFamily: "PlusJakartaSans_400Regular",
    marginTop: 2,
  },
  checkInProgress: {
    width: 80,
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  checkInProgressBar: {
    height: "100%",
    borderRadius: 4,
  },
  checkInBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.xxl,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 72,
  },
  checkInBtnText: {
    fontSize: 12,
    fontWeight: "700",
    fontFamily: "PlusJakartaSans_700Bold",
    color: theme.colors.textOnBrand,
  },
  checkInDone: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
});
