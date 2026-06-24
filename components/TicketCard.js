import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Calendar, Clock, MapPin, Download, CheckCircle2 } from "lucide-react-native";
import { NeuCard } from "./NeuCard";
import { LinearGradient } from "expo-linear-gradient";
import { Image as ExpoImage } from "expo-image";
import { useTheme } from "../theme/ThemeProvider";

export function TicketCard({ ticket, event }) {
  const { theme } = useTheme();
  const [showQR, setShowQR] = useState(false);

  const getStatusIcon = () => {
    if (ticket.entry) {
      return <CheckCircle2 size={18} color={theme.colors.success} />;
    }
    return <Clock size={18} color={theme.colors.textSubtle} />;
  };

  const getStatusText = () => {
    if (ticket.entry) {
      return <Text style={[styles.checkedInText, { color: theme.colors.success }]}>Checked In</Text>;
    }
    return <Text style={[styles.notCheckedInText, { color: theme.colors.textSubtle }]}>Not Checked In</Text>;
  };

  const ticketId = ticket.ticketId || ticket._id || "N/A";

  return (
    <NeuCard style={styles.container}>
      {/* Event Header */}
      <LinearGradient colors={["#2A2A22", "#1C1C18"]} style={styles.header}>
        {event.profile && (
          <ExpoImage
            source={{ uri: event.profile }}
            style={styles.headerImage}
            contentFit="cover"
          />
        )}
        <View style={styles.headerOverlay} />
        <View style={styles.headerContent}>
          <Text style={styles.eventName} numberOfLines={1}>{event.name}</Text>
          <Text style={styles.ticketIdText}>Ticket ID: {ticketId.substring(0, 12)}...</Text>
        </View>
      </LinearGradient>

      {/* Ticket Body */}
      <View style={[styles.body, { backgroundColor: theme.colors.surface }]}>
        {/* Event Details */}
        <View style={styles.details}>
          <View style={styles.detailRow}>
            <Calendar size={18} color={theme.colors.textSubtle} />
            <Text style={[styles.detailText, { color: theme.colors.textMuted }]}>{event.date}</Text>
          </View>
          <View style={styles.detailRow}>
            <Clock size={18} color={theme.colors.textSubtle} />
            <Text style={[styles.detailText, { color: theme.colors.textMuted }]}>{event.time}</Text>
          </View>
          <View style={styles.detailRow}>
            <MapPin size={18} color={theme.colors.textSubtle} />
            <Text style={[styles.detailText, { color: theme.colors.textMuted }]} numberOfLines={1}>
              {event.venue}
            </Text>
          </View>
        </View>

        {/* Ticket Type & Status */}
        <View style={[styles.statusContainer, { backgroundColor: theme.colors.surfaceMuted, borderColor: theme.colors.border }]}>
          <View>
            <Text style={[styles.ticketTypeLabel, { color: theme.colors.textSubtle }]}>Ticket Type</Text>
            <Text style={[styles.ticketType, { color: theme.colors.text }]}>
              {ticket.ticketType || "General Admission"}
            </Text>
          </View>
          <View style={styles.statusRow}>
            {getStatusIcon()}
            {getStatusText()}
          </View>
        </View>

        {/* QR Code Section */}
        {showQR ? (
          <View style={[styles.qrContainer, { backgroundColor: theme.colors.surfaceMuted }]}>
            <View style={[styles.qrPlaceholder, { backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.qrPlaceholderText, { color: theme.colors.textSubtle }]}>QR Code</Text>
            </View>
            <Text style={[styles.qrNote, { color: theme.colors.textSubtle }]}>
              Show this QR code at the event entrance
            </Text>
            <TouchableOpacity style={styles.hideQrButton} onPress={() => setShowQR(false)}>
              <Text style={[styles.hideQrText, { color: theme.colors.brand }]}>Hide QR Code</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.showQrButton, { backgroundColor: theme.colors.brand }]}
            onPress={() => setShowQR(true)}
          >
            <Text style={styles.showQrText}>Show QR Code</Text>
          </TouchableOpacity>
        )}

        {/* Download Button */}
        <TouchableOpacity style={[styles.downloadButton, { backgroundColor: theme.colors.surfaceMuted, borderColor: theme.colors.border }]}>
          <Download size={18} color={theme.colors.textMuted} />
          <Text style={[styles.downloadText, { color: theme.colors.textMuted }]}>Download Ticket</Text>
        </TouchableOpacity>
      </View>
    </NeuCard>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
  },
  header: {
    height: 128,
    position: "relative",
  },
  headerImage: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.35,
  },
  headerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.20)",
  },
  headerContent: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
  },
  eventName: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "SpaceGrotesk_700Bold",
    color: "white",
  },
  ticketIdText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.75)",
    marginTop: 4,
    fontFamily: "PlusJakartaSans_400Regular",
  },
  body: {
    padding: 16,
  },
  details: {
    gap: 8,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    fontFamily: "PlusJakartaSans_400Regular",
  },
  statusContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  ticketTypeLabel: {
    fontSize: 12,
    fontFamily: "PlusJakartaSans_400Regular",
  },
  ticketType: {
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "PlusJakartaSans_700Bold",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  checkedInText: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "PlusJakartaSans_600SemiBold",
  },
  notCheckedInText: {
    fontSize: 14,
    fontFamily: "PlusJakartaSans_400Regular",
  },
  qrContainer: {
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginBottom: 12,
  },
  qrPlaceholder: {
    width: 224,
    height: 224,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  qrPlaceholderText: {
    fontSize: 16,
    fontFamily: "PlusJakartaSans_400Regular",
  },
  qrNote: {
    fontSize: 12,
    marginTop: 12,
    fontWeight: "500",
    fontFamily: "PlusJakartaSans_500Medium",
  },
  hideQrButton: {
    marginTop: 12,
  },
  hideQrText: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "PlusJakartaSans_600SemiBold",
  },
  showQrButton: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  showQrText: {
    color: "#1A1A14",
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "PlusJakartaSans_700Bold",
  },
  downloadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  downloadText: {
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "PlusJakartaSans_700Bold",
  },
});
