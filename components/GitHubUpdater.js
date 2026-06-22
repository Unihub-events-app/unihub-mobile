import { useEffect, useMemo, useState } from "react";
import { Linking, StyleSheet, Text, View } from "react-native";
import Constants from "expo-constants";
import { ArrowDownToLine, RefreshCw } from "lucide-react-native";
import { ModalShell } from "./ModalShell";
import { PrimaryButton } from "./PrimaryButton";
import { useTheme } from "../theme/ThemeProvider";
import {
  fetchLatestGithubRelease,
  getReleaseDownloadUrl,
  getReleaseVersion,
  isNewerVersion,
} from "../lib/githubRelease.mjs";

function useAppReleaseInfo() {
  const repo = Constants.expoConfig?.extra?.githubRepo || "";
  const currentVersion = Constants.expoConfig?.version || "0.0.0";

  return useMemo(
    () => ({
      repo,
      currentVersion,
    }),
    [repo, currentVersion]
  );
}

async function openReleaseUrl(url) {
  if (!url) return;
  await Linking.openURL(url);
}

export function GitHubUpdater() {
  const { theme } = useTheme();
  const { repo, currentVersion } = useAppReleaseInfo();
  const [visible, setVisible] = useState(false);
  const [release, setRelease] = useState(null);
  const [downloadUrl, setDownloadUrl] = useState("");

  useEffect(() => {
    let alive = true;

    const checkForUpdate = async () => {
      if (!repo) return;
      try {
        const latestRelease = await fetchLatestGithubRelease(repo);
        if (!alive || !latestRelease) return;

        const latestVersion = getReleaseVersion(latestRelease);
        const url = getReleaseDownloadUrl(latestRelease);
        if (latestVersion && isNewerVersion(latestVersion, currentVersion)) {
          setRelease(latestRelease);
          setDownloadUrl(url);
          setVisible(true);
        }
      } catch (error) {
        if (__DEV__) {
          console.warn("GitHub release check failed:", error);
        }
      }
    };

    checkForUpdate();

    return () => {
      alive = false;
    };
  }, [repo, currentVersion]);

  if (!visible) {
    return null;
  }

  const latestVersion = release ? getReleaseVersion(release) : "";

  return (
    <ModalShell
      visible={visible}
      title="Update available"
      subtitle={
        latestVersion
          ? `${latestVersion} is ready to install from GitHub Releases.`
          : "A newer release is available."
      }
      onClose={() => setVisible(false)}
      maxWidth={480}
      footer={
        <View style={styles.footer}>
          <PrimaryButton
            label="Later"
            variant="subtle"
            onPress={() => setVisible(false)}
            fullWidth={false}
            style={styles.footerButton}
          />
          <PrimaryButton
            label="Download Now"
            icon={<ArrowDownToLine size={18} color="#fff" />}
            onPress={() => openReleaseUrl(downloadUrl || release?.html_url)}
            fullWidth={false}
            style={styles.footerButton}
          />
        </View>
      }
    >
      <View style={styles.body}>
        <View style={[styles.iconWrap, { backgroundColor: theme.colors.brandTint }]}>
          <RefreshCw size={24} color={theme.colors.brand} />
        </View>
        <Text style={[styles.meta, { color: theme.colors.textSubtle }]}>
          Current version {currentVersion}
        </Text>
        {release?.name ? (
          <Text style={[styles.releaseName, { color: theme.colors.text }]}>{release.name}</Text>
        ) : null}
        {release?.body ? (
          <Text style={[styles.releaseBody, { color: theme.colors.textMuted }]} numberOfLines={6}>
            {release.body}
          </Text>
        ) : (
          <Text style={[styles.releaseBody, { color: theme.colors.textMuted }]}>
            The latest APK is available on GitHub Releases.
          </Text>
        )}
      </View>
    </ModalShell>
  );
}

export async function checkForGithubUpdate(repo, currentVersion) {
  if (!repo) return { hasUpdate: false, release: null, downloadUrl: "" };
  const release = await fetchLatestGithubRelease(repo);
  const latestVersion = getReleaseVersion(release);
  const hasUpdate = Boolean(latestVersion && isNewerVersion(latestVersion, currentVersion));
  return {
    hasUpdate,
    release,
    downloadUrl: getReleaseDownloadUrl(release),
    latestVersion,
  };
}

const styles = StyleSheet.create({
  body: {
    gap: 12,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  meta: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  releaseName: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "800",
  },
  releaseBody: {
    fontSize: 14,
    lineHeight: 22,
  },
  footer: {
    flexDirection: "row",
    gap: 12,
  },
  footerButton: {
    flex: 1,
  },
});
