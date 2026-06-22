export function normalizeVersion(version) {
  return String(version || "")
    .trim()
    .replace(/^v/i, "");
}

function toParts(version) {
  return normalizeVersion(version)
    .split(".")
    .map((part) => Number.parseInt(part, 10))
    .map((part) => (Number.isFinite(part) ? part : 0));
}

export function compareVersions(a, b) {
  const left = toParts(a);
  const right = toParts(b);
  const length = Math.max(left.length, right.length);

  for (let index = 0; index < length; index += 1) {
    const leftPart = left[index] ?? 0;
    const rightPart = right[index] ?? 0;
    if (leftPart > rightPart) return 1;
    if (leftPart < rightPart) return -1;
  }

  return 0;
}

export function isNewerVersion(latestVersion, currentVersion) {
  return compareVersions(latestVersion, currentVersion) > 0;
}

export function getReleaseVersion(release) {
  return release?.tag_name || release?.name || "";
}

export function getReleaseDownloadUrl(release) {
  if (!release) return "";
  const asset = Array.isArray(release.assets) ? release.assets[0] : null;
  return asset?.browser_download_url || release.html_url || "";
}

export async function fetchLatestGithubRelease(repo) {
  if (!repo) return null;

  const response = await fetch(`https://api.github.com/repos/${repo}/releases/latest`, {
    headers: {
      Accept: "application/vnd.github+json",
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub release lookup failed (${response.status})`);
  }

  return response.json();
}
