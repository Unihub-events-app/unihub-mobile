import assert from "node:assert/strict";
import {
  compareVersions,
  getReleaseDownloadUrl,
  getReleaseVersion,
  isNewerVersion,
  normalizeVersion,
} from "../lib/githubRelease.mjs";

assert.equal(isNewerVersion("v0.1.1", "v0.1.0"), true);
assert.equal(isNewerVersion("v0.1.0", "v0.1.0"), false);
assert.equal(isNewerVersion("v0.1.0", "v0.2.0"), false);
assert.equal(normalizeVersion("v1.2.3"), "1.2.3");
assert.equal(compareVersions("v1.3.0", "1.2.9"), 1);
assert.equal(compareVersions("1.2.0", "1.2.0"), 0);
assert.equal(compareVersions("1.1.9", "1.2.0"), -1);
assert.equal(
  getReleaseVersion({ tag_name: "v1.0.0", name: "Release 1.0.0" }),
  "v1.0.0"
);
assert.equal(
  getReleaseDownloadUrl({
    html_url: "https://github.com/example/releases/tag/v1.0.0",
    assets: [{ browser_download_url: "https://download.example/app.apk" }],
  }),
  "https://download.example/app.apk"
);
