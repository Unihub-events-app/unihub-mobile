import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Platform,
  StatusBar,
  Animated,
  Vibration,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { CameraView, useCameraPermissions } from "expo-camera";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  QrCode,
  RefreshCcw,
} from "lucide-react-native";
import { useTheme } from "../../../theme/ThemeProvider.js";
import { API_URL } from "../../../lib/config.js";
import { getUserToken } from "../../../lib/auth.js";

const STATUS_BAR_HEIGHT = Platform.OS === "android" ? StatusBar.currentHeight || 24 : 44;

export default function ScanEventScreen() {
  const { eventId } = useLocalSearchParams();
  const router = useRouter();
  const { theme } = useTheme();

  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(true);
  const [result, setResult] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const lastScanned = useRef(null);
  const resultOpacity = useRef(new Animated.Value(0)).current;

  const showResult = (data) => {
    setResult(data);
    setScanning(false);
    Animated.timing(resultOpacity, { toValue: 1, duration: 250, useNativeDriver: true }).start();
    if (data.success) Vibration.vibrate([0, 80, 60, 80]);
    else Vibration.vibrate(400);
  };

  const reset = () => {
    lastScanned.current = null;
    setResult(null);
    setProcessing(false);
    setScanning(true);
    Animated.timing(resultOpacity, { toValue: 0, duration: 150, useNativeDriver: true }).start();
  };

  const handleBarCodeScanned = async ({ data }) => {
    if (!scanning || processing || data === lastScanned.current) return;
    lastScanned.current = data;
    setProcessing(true);
    setScanning(false);
    try {
      const token = await getUserToken();
      const res = await fetch(`${API_URL}/event/checkin-qr`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ event_id: eventId, qr_data: data, user_token: token }),
      });
      const json = await res.json();
      if (res.ok) {
        showResult({ success: true, name: json.name || "Attendee", message: json.msg || "Checked in successfully!" });
      } else {
        showResult({ success: false, name: null, message: json.msg || "Invalid ticket or already checked in." });
      }
    } catch {
      showResult({ success: false, name: null, message: "Network error. Try again." });
    } finally {
      setProcessing(false);
    }
  };

  // Permission not yet determined
  if (!permission) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator color={theme.colors.brand} size="large" />
        <Text style={[styles.permText, { color: theme.colors.textMuted }]}>Requesting camera access…</Text>
      </View>
    );
  }

  // Permission denied
  if (!permission.granted) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <QrCode size={48} color={theme.colors.textSubtle} />
        <Text style={[styles.permTitle, { color: theme.colors.text }]}>Camera Permission Needed</Text>
        <Text style={[styles.permText, { color: theme.colors.textMuted }]}>
          {permission.canAskAgain
            ? "Allow camera access to scan QR codes."
            : "Enable camera access in your device settings."}
        </Text>
        {permission.canAskAgain && (
          <Pressable onPress={requestPermission} style={[styles.backBtn2, { backgroundColor: theme.colors.brand }]}>
            <Text style={styles.backBtn2Text}>Grant Permission</Text>
          </Pressable>
        )}
        <Pressable onPress={() => router.back()} style={[styles.backBtn2, { backgroundColor: theme.colors.surfaceMuted, marginTop: 8 }]}>
          <Text style={[styles.backBtn2Text, { color: theme.colors.text }]}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        onCameraReady={() => setCameraReady(true)}
        onBarcodeScanned={scanning && cameraReady ? handleBarCodeScanned : undefined}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
      />

      {/* Loading indicator until camera is ready */}
      {!cameraReady && (
        <View style={[StyleSheet.absoluteFillObject, styles.centered]}>
          <ActivityIndicator color="white" size="large" />
          <Text style={[styles.permText, { color: "rgba(255,255,255,0.7)", marginTop: 12 }]}>Starting camera…</Text>
        </View>
      )}

      {/* Overlay UI */}
      <View style={[StyleSheet.absoluteFillObject, { zIndex: 1 }]} pointerEvents="box-none">
        {/* Dark overlay with cut-out */}
        <View style={styles.overlay} pointerEvents="none">
          <View style={[styles.overlayTop, { backgroundColor: "rgba(0,0,0,0.6)" }]} />
          <View style={styles.overlayMiddle}>
            <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)" }} />
            <View style={styles.viewfinder}>
              <View style={[styles.corner, styles.cornerTL, { borderColor: theme.colors.brand }]} />
              <View style={[styles.corner, styles.cornerTR, { borderColor: theme.colors.brand }]} />
              <View style={[styles.corner, styles.cornerBL, { borderColor: theme.colors.brand }]} />
              <View style={[styles.corner, styles.cornerBR, { borderColor: theme.colors.brand }]} />
            </View>
            <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)" }} />
          </View>
          <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)" }} />
        </View>

        {/* Header */}
        <View style={[styles.header, { paddingTop: STATUS_BAR_HEIGHT + 8 }]}>
          <Pressable onPress={() => router.back()} style={styles.heroPill} hitSlop={8}>
            <ArrowLeft size={18} color="white" />
            <Text style={styles.heroPillText}>Back</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Scan Ticket</Text>
          <View style={{ width: 80 }} />
        </View>

        {!result && !processing && cameraReady && (
          <View style={styles.hintRow}>
            <Text style={styles.hintText}>Point camera at a QR code</Text>
          </View>
        )}

        {processing && (
          <View style={styles.hintRow}>
            <ActivityIndicator size="small" color={theme.colors.brand} />
            <Text style={[styles.hintText, { marginLeft: 8 }]}>Verifying…</Text>
          </View>
        )}

        {result && (
          <Animated.View style={[styles.resultSheet, { backgroundColor: theme.colors.surface, opacity: resultOpacity }]}>
            <View style={[styles.resultIconWrap, { backgroundColor: result.success ? "rgba(61,158,74,0.14)" : "rgba(220,38,38,0.12)" }]}>
              {result.success
                ? <CheckCircle size={40} color="#3D9E4A" />
                : <XCircle size={40} color="#DC2626" />}
            </View>
            <Text style={[styles.resultTitle, { color: result.success ? "#3D9E4A" : "#DC2626" }]}>
              {result.success ? "Check-in Successful!" : "Check-in Failed"}
            </Text>
            {result.name && (
              <Text style={[styles.resultName, { color: theme.colors.text }]}>{result.name}</Text>
            )}
            <Text style={[styles.resultMessage, { color: theme.colors.textMuted }]}>{result.message}</Text>
            <Pressable onPress={reset} style={[styles.scanNextBtn, { backgroundColor: theme.colors.brand }]}>
              <RefreshCcw size={16} color="#1A1A14" />
              <Text style={styles.scanNextText}>Scan Next</Text>
            </Pressable>
          </Animated.View>
        )}
      </View>
    </View>
  );
}

const VIEWFINDER_SIZE = 260;
const CORNER_SIZE = 26;
const CORNER_WIDTH = 3;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 16,
  },
  permTitle: {
    fontSize: 20,
    fontWeight: "800",
    fontFamily: "SpaceGrotesk_700Bold",
    textAlign: "center",
  },
  permText: {
    fontSize: 14,
    fontFamily: "PlusJakartaSans_400Regular",
    textAlign: "center",
    lineHeight: 21,
  },
  backBtn2: {
    marginTop: 8,
    paddingHorizontal: 28,
    paddingVertical: 13,
    borderRadius: 14,
  },
  backBtn2Text: {
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "PlusJakartaSans_700Bold",
    color: "#1A1A14",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  overlayTop: {
    height: "35%",
  },
  overlayMiddle: {
    flexDirection: "row",
    height: VIEWFINDER_SIZE,
  },
  viewfinder: {
    width: VIEWFINDER_SIZE,
    height: VIEWFINDER_SIZE,
  },
  corner: {
    position: "absolute",
    width: CORNER_SIZE,
    height: CORNER_SIZE,
  },
  cornerTL: { top: 0, left: 0, borderTopWidth: CORNER_WIDTH, borderLeftWidth: CORNER_WIDTH, borderTopLeftRadius: 6 },
  cornerTR: { top: 0, right: 0, borderTopWidth: CORNER_WIDTH, borderRightWidth: CORNER_WIDTH, borderTopRightRadius: 6 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: CORNER_WIDTH, borderLeftWidth: CORNER_WIDTH, borderBottomLeftRadius: 6 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: CORNER_WIDTH, borderRightWidth: CORNER_WIDTH, borderBottomRightRadius: 6 },
  header: {
    position: "absolute",
    top: 0, left: 0, right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  heroPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    borderRadius: 100,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  heroPillText: {
    fontSize: 13,
    fontWeight: "700",
    fontFamily: "PlusJakartaSans_700Bold",
    color: "white",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "PlusJakartaSans_700Bold",
    color: "white",
  },
  hintRow: {
    position: "absolute",
    bottom: "18%",
    left: 0, right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  hintText: {
    fontSize: 14,
    fontFamily: "PlusJakartaSans_500Medium",
    color: "rgba(255,255,255,0.75)",
    textAlign: "center",
  },
  resultSheet: {
    position: "absolute",
    bottom: 0, left: 0, right: 0,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 28,
    paddingBottom: Platform.OS === "ios" ? 44 : 28,
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 20,
  },
  resultIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  resultTitle: {
    fontSize: 22,
    fontWeight: "900",
    fontFamily: "SpaceGrotesk_700Bold",
    textAlign: "center",
  },
  resultName: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "PlusJakartaSans_700Bold",
    textAlign: "center",
  },
  resultMessage: {
    fontSize: 14,
    fontFamily: "PlusJakartaSans_400Regular",
    textAlign: "center",
    lineHeight: 21,
  },
  scanNextBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 16,
  },
  scanNextText: {
    fontSize: 15,
    fontWeight: "700",
    fontFamily: "PlusJakartaSans_700Bold",
    color: "#1A1A14",
  },
});
