import { useEffect, useState } from "react";
import { Linking, ScrollView, StyleSheet, Text, View } from "react-native";
import Constants from "expo-constants";
import { ArrowDownToLine, RefreshCw, AlertCircle } from "lucide-react-native";
import { Screen, NeuCard, PrimaryButton } from "../../components/index.js";
import { useTheme } from "../../theme/ThemeProvider.js";
import {
  checkForGithubUpdate,
} from "../../components/GitHubUpdater.js";

export default function UpdatesScreen() {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const repo = Constants.expoConfig?.extra?.githubRepo || "";
  const currentVersion = Constants.expoConfig?.version || "0.0.0";
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");
  const [latest, setLatest] = useState(null);
  const [downloadUrl, setDownloadUrl] = useState("");
  const [hasUpdate, setHasUpdate] = useState(false);

  const runCheck = async () => {
    setChecking(true);
    setError("");
    try {
      const result = await checkForGithubUpdate(repo, currentVersion);
      setHasUpdate(result.hasUpdate);
      setLatest(result.release);
      setDownloadUrl(result.downloadUrl);
    } catch {
      setError("Unable to reach GitHub Releases right now.");
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    runCheck();
  }, [repo, currentVersion]);

  const openDownload = async () => {
    const url = downloadUrl || latest?.html_url;
    if (url) {
      await Linking.openURL(url);
    }
  };

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Updates</Text>
        <Text style={styles.pageSubtitle}>
          UniHub checks GitHub Releases for new Android APKs.
        </Text>

        <NeuCard style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={[styles.iconWrap, { backgroundColor: theme.colors.brandTint }]}>
              <RefreshCw size={18} color={theme.colors.brand} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.summaryTitle}>Current version</Text>
              <Text style={styles.summaryValue}>{currentVersion}</Text>
            </View>
            <PrimaryButton
              label={checking ? "Checking..." : "Check Now"}
              onPress={runCheck}
              fullWidth={false}
            />
          </View>
        </NeuCard>

        {error ? (
          <NeuCard style={styles.alertCard}>
            <View style={styles.alertRow}>
              <AlertCircle size={18} color={theme.colors.error} />
              <Text style={{ color: theme.colors.error, flex: 1 }}>{error}</Text>
            </View>
          </NeuCard>
        ) : null}

        <NeuCard style={styles.releaseCard}>
          <Text style={styles.releaseLabel}>Latest GitHub Release</Text>
          {latest ? (
            <>
              <Text style={styles.releaseTitle}>{latest.name || latest.tag_name || "Release"}</Text>
              <Text style={styles.releaseMeta}>
                {hasUpdate ? "Update available" : "You are up to date"}
              </Text>
              {latest.body ? <Text style={styles.releaseBody}>{latest.body}</Text> : null}
              <View style={styles.releaseActions}>
                <PrimaryButton
                  label="Open Release"
                  variant="subtle"
                  onPress={openDownload}
                  fullWidth={false}
                  style={styles.actionButton}
                />
                <PrimaryButton
                  label="Download APK"
                  icon={<ArrowDownToLine size={18} color="#fff" />}
                  onPress={openDownload}
                  fullWidth={false}
                  style={styles.actionButton}
                />
              </View>
            </>
          ) : (
            <Text style={styles.releaseBody}>
              Press "Check Now" to look for the latest APK release on GitHub.
            </Text>
          )}
        </NeuCard>
      </ScrollView>
    </Screen>
  );
}

const getStyles = (theme) =>
  StyleSheet.create({
    scrollContainer: {
      paddingTop: 24,
      paddingBottom: 32,
      paddingHorizontal: 18,
      gap: 16,
    },
    pageTitle: {
      fontSize: 28,
      fontWeight: "800",
      color: theme.colors.text,
      fontFamily: "SpaceGrotesk_700Bold",
    },
    pageSubtitle: {
      fontSize: 15,
      lineHeight: 22,
      color: theme.colors.textMuted,
      marginBottom: 4,
    },
    summaryCard: {
      padding: 18,
    },
    summaryRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
    },
    summaryTitle: {
      fontSize: 12,
      fontWeight: "700",
      color: theme.colors.textSubtle,
      textTransform: "uppercase",
      letterSpacing: 0.8,
    },
    summaryValue: {
      fontSize: 18,
      fontWeight: "800",
      color: theme.colors.text,
      marginTop: 2,
    },
    alertCard: {
      padding: 16,
    },
    alertRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    releaseCard: {
      padding: 18,
      gap: 10,
    },
    releaseLabel: {
      fontSize: 12,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.8,
      color: theme.colors.textSubtle,
    },
    releaseTitle: {
      fontSize: 20,
      fontWeight: "800",
      color: theme.colors.text,
    },
    releaseMeta: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.colors.brand,
    },
    releaseBody: {
      fontSize: 14,
      lineHeight: 22,
      color: theme.colors.textMuted,
    },
    releaseActions: {
      flexDirection: "row",
      gap: 12,
      marginTop: 6,
    },
    actionButton: {
      flex: 1,
    },
  });
