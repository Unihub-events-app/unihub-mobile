import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from "react-native";
import { Calendar, Clock, MapPin, Download, CheckCircle2 } from "lucide-react-native";
import { NeuCard } from "./NeuCard";
import { LinearGradient } from "expo-linear-gradient";
import { Image as ExpoImage } from "expo-image";

export function TicketCard({ ticket, event }) {
  const [showQR, setShowQR] = useState(false);

  const getStatusIcon = () => {
    if (ticket.entry) {
      return <CheckCircle2 size={18} color="#16a34a" />;
    }
    return <Clock size={18} color="#6b7280" />;
  };

  const getStatusText = () => {
    if (ticket.entry) {
      return <Text style={styles.checkedInText}>Checked In</Text>;
    }
    return <Text style={styles.notCheckedInText}>Not Checked In</Text>;
  };

  const ticketId = ticket.ticketId || ticket._id || "N/A";

  return (
    <NeuCard style={styles.container}>
      {/* Event Header */}
      <LinearGradient
        colors={["#667eea", "#764ba2"]}
        style={styles.header}
      >
        {event.profile && (
          <ExpoImage
            source={{ uri: event.profile }}
            style={styles.headerImage}
            contentFit="cover"
          />
        )}
        <View style={styles.headerOverlay} />
        <View style={styles.headerContent}>
          <Text style={styles.eventName} numberOfLines={1}>
            {event.name}
          </Text>
          <Text style={styles.ticketIdText}>
            Ticket ID: {ticketId.substring(0, 12)}...
          </Text>
        </View>
      </LinearGradient>

      {/* Ticket Body */}
      <View style={styles.body}>
        {/* Event Details */}
        <View style={styles.details}>
          <View style={styles.detailRow}>
            <Calendar size={18} color="#6b7280" />
            <Text style={styles.detailText}>{event.date}</Text>
          </View>
          <View style={styles.detailRow}>
            <Clock size={18} color="#6b7280" />
            <Text style={styles.detailText}>{event.time}</Text>
          </View>
          <View style={styles.detailRow}>
            <MapPin size={18} color="#6b7280" />
            <Text style={styles.detailText} numberOfLines={1}>
              {event.venue}
            </Text>
          </View>
        </View>

        {/* Ticket Type & Status */}
        <View style={styles.statusContainer}>
          <View>
            <Text style={styles.ticketTypeLabel}>Ticket Type</Text>
            <Text style={styles.ticketType}>
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
          <View style={styles.qrContainer}>
            <View style={styles.qrPlaceholder}>
              <Text style={styles.qrPlaceholderText}>QR Code</Text>
            </View>
            <Text style={styles.qrNote}>
              Show this QR code at the event entrance
            </Text>
            <TouchableOpacity
              style={styles.hideQrButton}
              onPress={() => setShowQR(false)}
            >
              <Text style={styles.hideQrText}>Hide QR Code</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.showQrButton}
            onPress={() => setShowQR(true)}
          >
            <Text style={styles.showQrText}>Show QR Code</Text>
          </TouchableOpacity>
        )}

        {/* Download Button */}
        <TouchableOpacity style={styles.downloadButton}>
          <Download size={18} color="#4b5563" />
          <Text style={styles.downloadText}>Download Ticket</Text>
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
    opacity: 0.3,
  },
  headerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.25)",
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
    color: "white",
  },
  ticketIdText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    marginTop: 4,
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
    color: "#4b5563",
  },
  statusContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    marginBottom: 16,
  },
  ticketTypeLabel: {
    fontSize: 12,
    color: "#6b7280",
  },
  ticketType: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  checkedInText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#16a34a",
  },
  notCheckedInText: {
    fontSize: 14,
    color: "#6b7280",
  },
  qrContainer: {
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginBottom: 12,
  },
  qrPlaceholder: {
    width: 224,
    height: 224,
    backgroundColor: "white",
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
    color: "#6b7280",
  },
  qrNote: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 12,
    fontWeight: "500",
  },
  hideQrButton: {
    marginTop: 12,
  },
  hideQrText: {
    fontSize: 14,
    color: "#667eea",
    fontWeight: "600",
  },
  showQrButton: {
    backgroundColor: "#667eea",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  showQrText: {
    color: "white",
    fontSize: 14,
    fontWeight: "700",
  },
  downloadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#f3f4f6",
    paddingVertical: 12,
    borderRadius: 12,
  },
  downloadText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#4b5563",
  },
});
