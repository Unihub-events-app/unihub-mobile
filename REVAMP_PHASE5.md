# UniHub Mobile — Phase 5 Spec: Remaining Screens

All changes follow the established token system:
- `radius`: xs:6, sm:10, md:16, lg:20, xl:28, xxl:36, full:9999
- `spacing.page`: 18 (horizontal page padding)
- Fonts: SpaceGrotesk_700Bold (headings), PlusJakartaSans family (body)
- All hardcoded `"#1A1A14"` on brand backgrounds → `theme.colors.textOnBrand`
- All hardcoded `"#3D9E4A"` → `theme.colors.success`
- All `PageLoader` → `SkeletonLoader` with appropriate variant
- All buttons → `radius.xxl` (pill shape)
- All icon containers → `radius.md` or `radius.full`
- All card containers → `radius.lg` or `radius.xl`

---

## 1. `app/(app)/notifications/index.js` — Notification List

**Current issues:**
- Uses `PageLoader` instead of `SkeletonLoader`
- `"#3D9E4A"` hardcoded in `getNotificationMeta` for ticket/payout types
- `fontWeight: "800"` on `headerTitle` (should be `"700"`)
- `headerTitle` 28px → should be 32px with `letterSpacing: -0.5, lineHeight: 38`
- Missing eyebrow label above title
- `markAllBtn`: `borderRadius: 12` → `radius.xxl`
- `card`: `borderRadius: 18` → `radius.lg`
- `iconWrap`: `borderRadius: 14` → `radius.md`
- `emptyState`: `borderRadius: 24` → `radius.xl`
- `scrollContainer.paddingHorizontal: 16` → `spacing.page`
- `NotificationCard` uses old `Animated` API → migrate to Reanimated v2 `useSharedValue`

**Specific changes:**

```js
// 1. Import changes
import { Screen, NeuInset, SkeletonLoader } from "../../../components/index.js";
import { radius, spacing } from "../../../theme/tokens.js";

// 2. Loading state
if (loading) return (
  <Screen padded>
    <SkeletonLoader variant="text" />
    <SkeletonLoader variant="card" count={4} />
  </Screen>
);

// 3. getNotificationMeta — replace hardcoded green
case "ticket_purchase": return { ..., color: theme.colors.success, ... };
case "payout_approved":
case "payout_completed": return { ..., color: theme.colors.success, ... };
// NOTE: getNotificationMeta is called outside the component so can't access theme.
// Solution: change function signature to getNotificationMeta(type, successColor)
// and pass theme.colors.success from the NotificationCard component.

// 4. Header
<Text style={styles.headerEyebrow}>Activity</Text>
<Text style={styles.headerTitle}>Notifications</Text>

// 5. NotificationCard — migrate to Reanimated v2
import Reanimated, { useSharedValue, useAnimatedStyle, withSpring } from "react-native-reanimated";
// Remove old Animated import, replace with Reanimated.View + useSharedValue

// 6. StyleSheet fixes
headerEyebrow: { fontSize: 11, fontWeight: "700", fontFamily: "PlusJakartaSans_700Bold",
  color: theme.colors.textSubtle, textTransform: "uppercase", letterSpacing: 1.2,
  marginBottom: 4, lineHeight: 16 },
headerTitle: { fontSize: 32, fontWeight: "700", fontFamily: "SpaceGrotesk_700Bold",
  letterSpacing: -0.5, lineHeight: 38, marginBottom: 24 },
markAllBtn: { ..., borderRadius: radius.xxl, borderWidth: 1 },
card: { borderRadius: radius.lg, borderWidth: 1, overflow: "hidden" },
iconWrap: { width: 42, height: 42, borderRadius: radius.md, ... },
emptyState: { ..., borderRadius: radius.xl, ... },
scrollContainer: { paddingHorizontal: spacing.page, paddingTop: 24, paddingBottom: 24 },
```

---

## 2. `app/(app)/notifications/[id].js` — Notification Detail

**Current issues:**
- Uses `PageLoader` instead of `SkeletonLoader`
- `sectionButton`: `borderRadius: 12` → `radius.xxl` (pill)
- `sectionButtonText`: `color: "#1A1A14"` → `theme.colors.textOnBrand`
- `actionButton`: `borderRadius: 10` → `radius.xxl`
- `actionButtonText`: `color: "#1A1A14"` → `theme.colors.textOnBrand`
- `metaIcon`: `borderRadius: 10` → `radius.full`
- `bannerWrap`: `borderRadius: 12` → `radius.md`
- `sectionImage`: `borderRadius: 10` → `radius.md`
- `title`: `fontWeight: "900"` → `"700"`, 26px → 28px, `lineHeight: 34`
- `sectionHeader`: `fontWeight: "800"` → `"700"`, add `fontFamily: "SpaceGrotesk_700Bold"`
- `scrollContent.paddingHorizontal: 20` → `spacing.page`

**Specific changes:**

```js
// 1. Import changes
import { Screen, NeuCard, BackButton, SkeletonLoader } from "../../../components/index.js";
import { radius, spacing } from "../../../theme/tokens.js";

// 2. Loading state
if (loading) return (
  <Screen padded>
    <SkeletonLoader variant="text" />
    <SkeletonLoader variant="card" />
    <SkeletonLoader variant="row" count={4} />
  </Screen>
);

// 3. JSX inline color fixes
// sectionButton ExternalLink icon: color="#1A1A14" → color={theme.colors.textOnBrand}
// actionButton ExternalLink icon: color="#1A1A14" → color={theme.colors.textOnBrand}

// 4. StyleSheet fixes
title: { fontSize: 28, fontWeight: "700", fontFamily: "SpaceGrotesk_700Bold",
  lineHeight: 34, letterSpacing: -0.4, marginBottom: 20 },
metaIcon: { width: 34, height: 34, borderRadius: radius.full, ... },
bannerWrap: { borderRadius: radius.md, overflow: "hidden", borderWidth: 1, marginBottom: 24 },
sectionImage: { width: "100%", height: 180, borderRadius: radius.md },
sectionButton: { ..., paddingVertical: 14, paddingHorizontal: 28,
  borderRadius: radius.xxl, ... },
sectionButtonText: { color: "#1A1A14", ... }, // already inline, fix JSX not style
sectionHeader: { fontSize: 20, fontWeight: "700", fontFamily: "SpaceGrotesk_700Bold",
  lineHeight: 26, marginTop: 8 },
actionButton: { ..., paddingVertical: 12, paddingHorizontal: 20, borderRadius: radius.xxl },
scrollContent: { paddingHorizontal: spacing.page, paddingBottom: 24 },
```

---

## 3. `app/(app)/past-events.js` — Past Events

**Current issues:**
- Uses `ActivityIndicator` loading → replace with `SkeletonLoader`
- Uses inline `NeuInset` empty state → replace with `EmptyState` component
- `headerTitle`: 28px, `fontWeight: "800"` → 32px, `"700"`, add `lineHeight: 38`, add eyebrow
- `eventCard`: `borderRadius: 20` → `radius.xl`
- `pastBadge`: `borderRadius: 10` → `radius.xxl`
- `categoryBadge`: `borderRadius: 10` → `radius.xxl`
- `viewBtn`: `borderRadius: 12` → `radius.xxl`
- `viewBtnText`: `color: "#1A1A14"` → `theme.colors.textOnBrand`
- JSX `Ticket` icon: `color="#1A1A14"` → `color={theme.colors.textOnBrand}`
- `cancelBtn`: `borderRadius: 12` → `radius.xxl`
- `scrollContainer.paddingHorizontal: 16` → `spacing.page`
- Add spring press animation to each event card using Reanimated v2
- Add `EmptyState` import and replace NeuInset empty state

**Specific changes:**

```js
// 1. Imports
import { Screen, NeuInset, SkeletonLoader, EmptyState } from "../../components/index.js";
import { radius, spacing } from "../../theme/tokens.js";
import Reanimated, { useSharedValue, useAnimatedStyle, withSpring } from "react-native-reanimated";

// 2. Loading state
if (loading) return (
  <Screen padded>
    <SkeletonLoader variant="text" />
    <SkeletonLoader variant="card" count={3} />
  </Screen>
);

// 3. Empty state
{pastEvents.length === 0 ? (
  <EmptyState
    emoji="🎟️"
    title="No past events"
    subtitle="Events you've attended will show up here after they end."
  />
) : ( ... )}

// 4. Event card — wrap each card in animated pressable
function PastEventCard({ event, onPress, onCancel, cancelling, theme }) {
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Reanimated.View style={anim}>
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.98, { damping: 20, stiffness: 400 }); }}
        onPressOut={() => { scale.value = withSpring(1.0, { damping: 20, stiffness: 400 }); }}
        onPress={onPress}
        style={[styles.eventCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
      >
        ...
      </Pressable>
    </Reanimated.View>
  );
}

// 5. StyleSheet fixes
scrollContainer: { paddingTop: 24, paddingBottom: 24, paddingHorizontal: spacing.page },
headerEyebrow: { fontSize: 11, fontWeight: "700", ..., color: theme.colors.textSubtle,
  textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 4 },
headerTitle: { fontSize: 32, fontWeight: "700", fontFamily: "SpaceGrotesk_700Bold",
  color: theme.colors.text, marginBottom: 24, lineHeight: 38, letterSpacing: -0.5 },
eventCard: { borderRadius: radius.xl, borderWidth: 1, overflow: "hidden" },
pastBadge: { ..., borderRadius: radius.xxl },
categoryBadge: { ..., borderRadius: radius.xxl },
viewBtn: { ..., borderRadius: radius.xxl },
viewBtnText: { ..., color: "#1A1A14" }, // textOnBrand inline in JSX
cancelBtn: { ..., borderRadius: radius.xxl },
```

---

## 4. `event/[eventId]/manage.js` — Event Management

**Current issues (highest priority — organiser-facing):**
- No `radius`/`spacing` token imports
- ~15 occurrences of `"#3D9E4A"` hardcoded
- Back button and all action buttons need pill radius
- Inline toast at bottom has hardcoded colors
- `fontWeight: "800"` used on section headers → `"700"`
- Missing `SkeletonLoader` loading state (uses `ActivityIndicator`)
- No Reanimated animations on tab buttons or action rows

**Specific changes:**

```js
// 1. Imports
import { radius, spacing } from "../../../theme/tokens.js";
import { SkeletonLoader } from "../../../components/index.js"; // if already imported
import Reanimated, { useSharedValue, useAnimatedStyle, withSpring } from "react-native-reanimated";

// 2. Replace all "#3D9E4A" → theme.colors.success (use replace_all: true)

// 3. Key StyleSheet changes (search current file for these values):
// - Back button borderRadius: 12 → radius.xxl
// - Tab buttons borderRadius: 10/12 → radius.xxl (active tab pill)
// - Action buttons (approve/reject/check-in): borderRadius: 10/12 → radius.xxl
// - Stat cards: borderRadius: 16/18 → radius.lg
// - Progress bar container: borderRadius: 999 → radius.full
// - Progress fill: borderRadius: 999 → radius.full
// - Info cards: borderRadius: 14/16 → radius.md
// - Avatar circles: borderRadius: 999 → radius.full
// - Toast: borderRadius: 12/14 → radius.md
// - scrollContainer padding → spacing.page

// 4. Inline JSX color fixes
// All UserCheck icons with color="#3D9E4A" → color={theme.colors.success}
// All CheckCircle icons with color="#3D9E4A" → color={theme.colors.success}
// bulkBtnText color="#3D9E4A" → color={theme.colors.success}
// progress fill backgroundColor="#3D9E4A" → theme.colors.success
// participantAvatarText when checked in → theme.colors.success

// 5. Toast — replace inline toast with Toast component
import { Toast } from "../../../components/index.js";
// Add at bottom of Screen before closing tag:
<Toast
  visible={!!message.text}
  message={message.text}
  type={message.type || "info"}
  onDismiss={() => setMessage({ type: "", text: "" })}
/>
```

---

## 5. `event/[eventId]/registration.js` — Event Registration

**Current issues:**
- No token imports
- `"#3D9E4A"` hardcoded at line 122 (success state color)
- Back button and submit button are square-cornered
- Form inputs use plain borders with hardcoded values
- Loading: `ActivityIndicator` → `SkeletonLoader`

**Specific changes:**

```js
// 1. Imports
import { radius, spacing } from "../../../theme/tokens.js";

// 2. Replace "#3D9E4A" → theme.colors.success (line 122 inline style)

// 3. Key StyleSheet changes (read file for current values before editing):
// - Back button: borderRadius → radius.xxl
// - Submit CTA button: borderRadius → radius.xxl
// - Form input fields: borderRadius → radius.lg, borderWidth: 1
// - Success/result card: borderRadius → radius.xl
// - Alert/error box: borderRadius → radius.md
// - scrollContainer paddingHorizontal → spacing.page
// - Header title: fontWeight "800" → "700", 28px → 32px

// 4. Success state icon
// <CheckCircle color="#3D9E4A"> → color={theme.colors.success}
```

---

## 6. `event/[eventId]/payment.js` — Payment Screen

**Current issues:**
- `"#3D9E4A"` hardcoded (line 235 — success confirmation icon)
- `"#1A1A14"` possibly on CTA buttons
- No token imports

**Specific changes:**

```js
// 1. Imports
import { radius, spacing } from "../../../theme/tokens.js";

// 2. Replace "#3D9E4A" → theme.colors.success

// 3. Key StyleSheet changes (read file before editing):
// - CTA pay button: borderRadius → radius.xxl
// - Card containers: borderRadius → radius.xl or radius.lg
// - Info boxes: borderRadius → radius.md
// - scrollContainer paddingHorizontal → spacing.page
// - Any "#1A1A14" on brand-colored backgrounds → theme.colors.textOnBrand
```

---

## 7. `users/community/[id].js` — Community Chat

**Current issues:**
- This is a chat screen — most of the UI is message bubbles, not standard page components
- Has `LinkPreview` with hardcoded rgba colors instead of theme tokens
- Send button and action buttons need pill treatment
- No token imports

**Note:** Community chat has a fundamentally different layout (FlatList of messages, pinned input bar). The changes here are lighter-touch:

**Specific changes:**

```js
// 1. Imports
import { radius, spacing } from "../../../theme/ThemeProvider"; // wrong path
// Correct: import { radius, spacing } from "../../../theme/tokens";

// 2. Key changes:
// - Input bar container: borderRadius → radius.xxl (pill input)
// - Send button: borderRadius → radius.full (circle)
// - Attachment/action buttons: borderRadius → radius.full
// - Message bubble own: borderRadius → radius.xl with bottom-right flat (radius.sm)
// - Message bubble other: borderRadius → radius.xl with bottom-left flat (radius.sm)
// - Reaction pills: borderRadius → radius.xxl
// - Link preview card: borderRadius → radius.md
// - Modal containers: borderRadius top → radius.xl
// - Member list items: no change needed (already row layout)
// - Info modal: borderRadius → radius.xl

// 3. No hardcoded "#3D9E4A" in this file (from grep output) — skip color fixes
```

---

## 8. Wallet EmptyState Wire-Up

**File:** `app/(app)/wallet.js`

**Issue:** `EmptyState` is imported but never rendered when the transaction list is empty.

**Fix — find the transaction list render and add empty state:**

```js
// Find the section that maps transactions. When transactions array is empty:
{transactions.length === 0 ? (
  <EmptyState
    emoji="💸"
    title="No transactions yet"
    subtitle="Your withdrawals and payouts will appear here."
  />
) : (
  transactions.map((tx) => ( ... ))
)}
```

---

## 9. Push Notification Permission Check on Mount

**File:** `users/notification-settings.js`

**Issue:** `pushEnabled` is always initialized to `false`. If the user already granted permission in a previous session, the banner shows "Enable push notifications" even though they're already enabled.

**Fix:**

```js
// Add to useEffect that loads prefs:
import * as Notifications from "expo-notifications"; // may need installing

const checkPushStatus = async () => {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status === "granted") setPushEnabled(true);
  } catch {}
};

useEffect(() => {
  loadPrefs();
  checkPushStatus();
}, []);
```

---

## Build Order

Work through screens in this order (dependency-free within each group):

**Group A — Quick wins (token imports + color fixes only):**
1. `notifications/index.js`
2. `notifications/[id].js`
3. `past-events.js`
4. `event/registration.js`
5. `event/payment.js`

**Group B — Moderate (new component wiring + animations):**
6. `event/manage.js` (Toast wire-up + Reanimated tabs)
7. `wallet.js` EmptyState wire-up
8. `notification-settings.js` permission check

**Group C — Structural (chat screen layout changes):**
9. `users/community/[id].js`

---

## Tokens Quick Reference

```js
radius:  { xs:6, sm:10, md:16, lg:20, xl:28, xxl:36, full:9999 }
spacing: { page:18, xs:4, sm:8, md:12, lg:16, xl:24, xxl:32 }

// Section identity colors (for eyebrows/active elements):
// Notifications → theme.colors.brand (lime) — same as Dashboard
// Past Events   → theme.colors.accentLibrary (coral)
// Manage        → theme.colors.accentWallet (amber) — organizer context

// Spring presets:
snappy: { damping: 20, stiffness: 400 }
smooth: { damping: 22, stiffness: 280 }
bouncy: { damping: 14, stiffness: 260 }
```
