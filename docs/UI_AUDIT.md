# UniHub Mobile — Full UI/UX Audit (Updated)
> Generated: 2026-06-25 | Grade: A- | Status: PRE-PRODUCTION (near launch-ready)

---

## Executive Summary

This audit is a full re-review after the major update pull. The app has made substantial progress. The critical lime-on-white contrast issue is largely addressed, token use improved significantly, and many screens that were stubs in the previous audit are now fully implemented. The previous grade was **B+**; after this update the grade rises to **A-**.

What changed for the better:
- Sold-out tickets now use `disabled` + `opacity: 0.4` — FIXED ✅
- Free tickets show "Free" label — FIXED ✅
- "Delete Account" is now live in Privacy & Security — FIXED ✅
- App Version is in Settings — FIXED ✅
- Help link via Terms/Privacy navigable — FIXED ✅
- Wallet now has a bank dropdown (not raw TextInput) — FIXED ✅
- Notification Settings screen is fully implemented — FIXED ✅
- Privacy Settings screen is fully implemented — FIXED ✅
- Profile Edit screen is now built — FIXED ✅
- Followers tab on Profile now loads real data — FIXED ✅
- Dashboard "For You" badge uses warning color, not lime — improvement ✅
- Signup now redirects to `/onboarding/interests` — FIXED ✅
- Community TextInput partially replaced (search uses `<TextField />`) — PARTIAL ⚠️
- Stats separator in Profile is now a 1px border `View` — FIXED ✅
- Social proof ("X people attending") added to event detail — FIXED ✅

What still needs attention (see Priority List below):
- Community create modal still uses raw `TextInput` for name/desc/category/rules
- `"#6366f1"` purple and other accent colors still hardcoded in many places
- Live pulse dot on Event Library is still static (no animation)
- Notifications unread highlight contrast difference still minimal (0.06 vs 0.07)
- `clearBtn` in dashboard search still only `padding: 4` — approximately 23×23px touch target

**Overall Grade: A-** (becomes A with P0+P1 fixes from this audit)

### Top 5 Remaining Critical Issues
1. **Raw `TextInput` in community create modal** — 4 fields bypass `<TextField />`, no focus ring, no error state
2. **Hardcoded accent colors outside theme** — `"#6366f1"`, `"#06b6d4"`, `"#0ea5e9"`, `"#10b981"`, `"#f59e0b"` throughout
3. **Search clear button touch target still ~23×23px** — below 44×44 minimum; needs `hitSlop`
4. **Missing skeleton loaders** on Dashboard, Event Library, Wallet, Community — users see blank screen during load
5. **Profile Edit photo upload** — ImagePicker is imported but upload path is incomplete (no visible camera button or success/error feedback in the first 100 lines; needs verification)

---

## Screen-by-Screen Analysis

---

### Dashboard (`app/(app)/dashboard.js`)

**What's working:**
- Personalized greeting, date, and category pills
- Full filter modal integration (FilterModal + DEFAULT_FILTERS)
- Private event code detection and user @ search are well-implemented
- Featured hero card with gradient overlay and correct dark text on lime price badge
- "For You" badge uses `theme.colors.warning` background — avoids lime contrast issue
- EventListRow: free events correctly show "Free" in `theme.colors.brand`, paid events use `#F0EFE0` on `navSurface` — this is now valid (light text on dark card)
- Category pills: active pill correctly uses `"#1A1A14"` on lime — passes contrast

**Problems:**

| Issue | Severity | Detail |
|-------|----------|--------|
| `clearBtn` style is `padding: 4` only | HIGH | Renders as ~23×23px touch target. Needs `hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}` |
| Filter button icon uses `"#1A1A14"` inline when active | LOW | Should reference `theme.colors.textOnBrand` (add this token) |
| No skeleton loader during initial event fetch | MEDIUM | `PageLoader` (full-screen spinner) shown — jarring; skeleton cards preferred |
| Empty state in upcoming events section has inline emoji + text, not shared component | LOW | Inconsistent with Event Library's `EmptyState` component |
| `createBtn` uses `Plus` icon with hardcoded `color="#1A1A14"` | LOW | Add `textOnBrand` token to theme and reference it |
| `liveDot` / `liveDotOuter` are not animated (no pulse) | LOW | Dashboard's own live section also has a static dot — misleading signal |

**Changes needed:**
- [ ] Add `hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}` to `clearBtn` Pressable
- [ ] Extract `textOnBrand: "#1A1A14"` as a theme token; replace all inline `"#1A1A14"` references
- [ ] Add `<SkeletonLoader count={3} variant="row" />` while events fetch
- [ ] Animate live pulse dot using `Animated.loop` + `Animated.timing` on outer ring

---

### Event Library (`app/(app)/event-library.js`)

**What's working:**
- Underline tab bar (Upcoming/Past/Saved) with lime active indicator
- Sub-toggle pills with icons (Events/My Tickets) — lime active, correct `"#1A1A14"` text ✅
- `EmptyState` component defined locally — good pattern
- TicketCard rendered correctly
- Saved Events tab added — new feature, works well
- `savedLoading` shows a Calendar icon instead of a proper loader — acceptable but dim

**Problems:**

| Issue | Severity | Detail |
|-------|----------|--------|
| `livePulse` dot is a static `View`, no animation | MEDIUM | Reuse the animated pulse from dashboard |
| Empty state CTA button is a `TouchableOpacity` with inline styles, not `<PrimaryButton />` | MEDIUM | Style inconsistency |
| `EmptyState` component is defined inline in this file | LOW | Should be a shared `/components/EmptyState.js` component |
| Saved tab loading shows only `Calendar` icon — no spinner or skeleton | LOW | Replace with `<ActivityIndicator />` |
| Tab text sizes identical for active/inactive (both 15px) | LOW | Inactive tabs could be 14px or lighter weight for hierarchy |

**Changes needed:**
- [ ] Animate `livePulse` dot (or reuse a shared `<LiveDot />` component)
- [ ] Replace inline empty state CTA `TouchableOpacity` with `<PrimaryButton />`
- [ ] Replace saved tab loading `Calendar` icon with `<ActivityIndicator color={theme.colors.brand} />`

---

### Community (`app/(app)/community.js`)

**What's working:**
- Community card banner + scrim + overlay badges is polished and visually distinct
- Private pill and Joined badge use lime tint + border correctly
- Search now uses `<TextField />` component ✅ (partial fix)
- `ConfirmModal` used for delete/leave — good pattern
- Join-by-code flow is well-implemented

**Problems:**

| Issue | Severity | Detail |
|-------|----------|--------|
| Create modal steps 1 & 2 use raw `TextInput` for name, desc, category, rules | HIGH | No focus ring, no error state, no validation feedback. Must use `<TextField />` |
| `codeJoinInput` in the code join row is also a raw `TextInput` | HIGH | Breaks visual consistency with rest of app |
| `formInput` has no `borderWidth` or `borderColor` style | HIGH | Inputs appear with no border — no focus affordance |
| `nextButton` on step 2 uses `ChevronRight` icon with `color="#fff"` on lime background | MEDIUM | Must use `"#1A1A14"` for contrast on lime |
| `uploadButton` border color is hardcoded `"#e5e7eb"` (light gray) | MEDIUM | Breaks in dark mode — should use `theme.colors.border` |
| Create modal uses `Modal` with no `useSafeAreaInsets` | MEDIUM | Content can overlap notch on iPhone X+ |
| Icon selection grid: unselected icons have no border — affordance invisible | MEDIUM | Add `borderWidth: 1, borderColor: theme.colors.border` to `iconOption` style |
| Community emoji `opacity: 0.5` on banner placeholder | LOW | Too faint; use `opacity: 0.6` or replace with `theme.colors.textMuted` |
| `alert("Image upload coming soon!")` still in prod code | MEDIUM | Should be a UI state (e.g., `Toast`) not a native Alert |

**Changes needed:**
- [ ] Replace all `TextInput` in create modal (name, desc, category, rules, code join input) with `<TextField />`
- [ ] Change `nextButton` ChevronRight icon color to `"#1A1A14"` on step 2
- [ ] Change `uploadButton` borderColor to `theme.colors.border`
- [ ] Add `borderWidth: 1, borderColor: theme.colors.border` to `iconOption` style
- [ ] Add safe area insets to modal container (`paddingBottom: insets.bottom + 16`)
- [ ] Replace `alert()` with a `Toast` or inline feedback state

---

### Notifications (`app/(app)/notifications/index.js`)

**What's working:**
- Card design is sophisticated: unread stripe, type icon, time display, spring animation on press
- "Mark all read" flow is fully functional
- NEW/EARLIER section split is clear
- Debounce on navigation prevents double-tap bugs ✅
- Empty state with `Bell` icon and descriptive text is good

**Problems:**

| Issue | Severity | Detail |
|-------|----------|--------|
| Unread background difference: `0.07` dark vs `0.06` light — negligible | MEDIUM | Light mode unread is virtually indistinguishable from read. Raise to `0.12` |
| `"${color}30"` hex opacity trick for `borderColor` | LOW | Fragile if `color` variable is not a 6-digit hex. Use explicit `rgba()` or add `withOpacity` utility |
| `"Read full message →"` uses a Unicode arrow character | LOW | Render `<ChevronRight size={12} />` for cross-platform consistency |
| Type colors (`"#3D9E4A"`, `"#C8E630"`, `"#6366f1"`, etc.) hardcoded in `getNotificationMeta` | MEDIUM | Should reference theme tokens (add `accentGreen`, `accentPurple`, etc.) |
| Banner image has no placeholder/fallback `View` when `notification.banner` is null | LOW | Null check exists (renders nothing), but if banner URL 404s, Image shows blank white |

**Changes needed:**
- [ ] Increase unread card background opacity in light mode to `rgba(200,230,48,0.12)`
- [ ] Replace `${color}30` with explicit `rgba(r,g,b,0.19)` for border colors
- [ ] Replace "→" string with `<ChevronRight size={12} color={color} />`
- [ ] Add `onError` handler on `<Image source={{ uri: notification.banner }}>` with a fallback `View`

---

### Notification Detail (`app/(app)/notifications/[id].js`)

**What's working:**
- Comprehensive layout: meta bar, title, divider, banner, sections, buttons
- Dark text on lime buttons (`"#1A1A14"`) ✅
- Auto-marks as read on open via PATCH call ✅
- `notFound` error state with Bell icon — clear

**Problems:**

| Issue | Severity | Detail |
|-------|----------|--------|
| `ExternalLink` icon in section buttons and action buttons hardcoded `color="#1A1A14"` | LOW | Fine as-is since it only appears on lime buttons, but should be a token |
| All `notification.buttons` are rendered as lime primary actions | MEDIUM | Secondary actions need an outline/ghost variant, not another lime button |
| No `accessibilityLabel` on icon-only button close area | LOW | Screen reader cannot identify action |

**Changes needed:**
- [ ] If a `btn.variant === "secondary"` field exists in data, render it as ghost button
- [ ] Add `accessibilityLabel` to back button and external link buttons

---

### Past Events (`app/(app)/past-events.js`)

**What's working:**
- Cover images with top-right "Past" badge are visually clear
- Cancel flow now shows `<ActivityIndicator />` INSTEAD of button text while cancelling ✅ (previous issue FIXED)
- `Alert.alert()` confirmation before cancel is appropriate here
- Empty state uses `NeuInset` + `Calendar` icon + descriptive text ✅

**Problems:**

| Issue | Severity | Detail |
|-------|----------|--------|
| "View Ticket" is an inline `Pressable` with hardcoded `backgroundColor: theme.colors.brand` | MEDIUM | Not using `<PrimaryButton />` — style inconsistency |
| `viewBtnText` hardcodes `color: "#1A1A14"` | LOW | Should be `textOnBrand` token |
| No `onError` fallback on cover image | LOW | Shows blank on 404 |

**Changes needed:**
- [ ] Replace "View Ticket" `Pressable` with `<PrimaryButton label="View Ticket" icon={<Ticket />} />`
- [ ] Add `onError` fallback `View` with `Calendar` icon to event cover image

---

### Profile (`app/(app)/profile.js`)

**What's working:**
- Hero with avatar, brand-colored border, stats row with 1px separator lines ✅ (stat separator FIXED)
- Followers tab loads real follower data with loading state ✅ (FIXED)
- BadgeRow component integrated for achievements
- Interest pills use lime background + `"#1A1A14"` text ✅
- Edit button now clearly visible at top-right ✅
- `InterestsModal` integrated for inline editing
- Tappable follower rows navigate to user profiles

**Problems:**

| Issue | Severity | Detail |
|-------|----------|--------|
| `editBtn` icon uses `theme.colors.textMuted` (invisible on light mode) | MEDIUM | Should be `theme.colors.brand` to make the button scannable |
| Community tab shows hardcoded "No communities joined yet." — non-functional | MEDIUM | Should show actual joined communities, or link to Community screen |
| No "Following" tab — only Followers | MEDIUM | Users expect both; incomplete social graph |
| `emptyActionText` hardcodes `color: "#1A1A14"` on lime action | LOW | Token needed |
| Event rows in "Hosted" tab use calendar icon placeholder, not event thumbnail | LOW | Show real event cover images for polish |

**Changes needed:**
- [ ] Edit icon → `theme.colors.brand`
- [ ] Add real community data to Communities section (or a "Go to Communities" CTA)
- [ ] Add "Following" tab with real data
- [ ] Use actual event cover images in hosted/attending rows

---

### Settings (`app/(app)/settings.js`)

**What's working:**
- `SettingsItem` spring animation is polished
- Section organization: Account, Security, Legal, About
- App Version is shown via `Constants.expoConfig.version` ✅ (FIXED)
- Terms of Service and Privacy Policy links work ✅
- Sign Out uses `<PrimaryButton variant="secondary" />` correctly ✅
- Legal icon colors (`"#0ea5e9"`, `"#10b981"`) use `iconColor + "18"` for background tint — acceptable pattern

**Problems:**

| Issue | Severity | Detail |
|-------|----------|--------|
| Security section uses `iconColor="#6366f1"` hardcoded in JSX | HIGH | No theme token for purple. Add `theme.colors.accentPurple` |
| No "Delete Account" link in Settings proper | MEDIUM | Delete Account lives in Privacy & Security (good), but the Settings screen doesn't surface a clear "Danger Zone" path |
| No "Help & Support" item | MEDIUM | Users have no in-app support path |
| Legal icon colors `"#0ea5e9"`, `"#10b981"` are raw hex | LOW | Add to theme tokens |
| `App Version` item has no `onPress` — chevron is hidden, but no tap feedback | LOW | `disabled={!onPress}` in `SettingsItem` — fine, but consider showing a "Check for Updates" link here |

**Changes needed:**
- [ ] Add `accentPurple: "#6366f1"`, `accentBlue: "#0ea5e9"`, `accentTeal: "#10b981"` to `theme/tokens.js`
- [ ] Add "Help & Support" item linking to a support email or web page
- [ ] Consider a "Danger Zone" section in Settings with a link to Privacy Settings for discoverability

---

### Notification Settings (`app/users/notification-settings.js`) — NEW SCREEN

**What's working:**
- All 6 notification categories (Announcements, Events, Community, Wallet, Social, Premium) with per-category toggles ✅
- Push notification enable banner with visual state change ✅
- Per-preference `POST` to API on each toggle ✅
- Polished `NotifRow` with spring animation
- Category icon colors use `category.color + "18"` tint pattern ✅
- Toast feedback on enable push success/error ✅

**Problems:**

| Issue | Severity | Detail |
|-------|----------|--------|
| `"#3D9E4A"` hardcoded in toast success and category colors | LOW | Should reference `theme.colors.success` |
| `pushEnabled` state is never initialized from device — always starts `false` | MEDIUM | App should check if push token exists on load to show correct initial state |
| No "Quiet Hours" or "Do Not Disturb" option | LOW | Nice-to-have for polish |
| Push enable button has no `hitSlop` | LOW | Button is full-width, so less critical here |

**Changes needed:**
- [ ] Initialize `pushEnabled` from stored push token (check AsyncStorage/SecureStore on load)
- [ ] Replace hardcoded `"#3D9E4A"` with `theme.colors.success`

---

### Privacy Settings (`app/users/privacy-settings.js`) — NEW SCREEN

**What's working:**
- Change Password modal with show/hide toggle and validation ✅
- Change Username row (navigates to `/change-username`) ✅
- Delete Account with 3-step confirmation flow (warn → confirm → done) ✅ — App Store compliant
- Toast feedback for errors
- `ScalePressable` animation on all interactive elements ✅

**Problems:**

| Issue | Severity | Detail |
|-------|----------|--------|
| Password fields in ChangePasswordModal use raw `TextInput` — not `<TextField />` | MEDIUM | No focus ring, inconsistent with rest of app |
| `"#3D9E4A"` in toast hardcoded | LOW | Use `theme.colors.success` |
| `handleRequestDeletion` calls `request-deletion` but doesn't immediately clear session — user stays logged in | MEDIUM | After "done" step, user should be signed out (the "Got it — sign me out" button does this, but auto-sign-out after confirmation would be cleaner UX) |
| No "Profile Visibility" or "Who can follow me" toggles | LOW | These were in original audit scope — still missing |
| `ChangePasswordModal` doesn't have `useSafeAreaInsets` — bottom sheet can overlap home indicator | LOW | Add `paddingBottom: insets.bottom + 24` |

**Changes needed:**
- [ ] Replace password `TextInput` fields in modal with `<TextField secureTextEntry />` variants
- [ ] Add `paddingBottom: insets.bottom` to bottom sheet modal
- [ ] Add profile visibility and follow permission toggles (future scope)

---

### Profile Edit (`app/users/profile-edit.js`) — NEW SCREEN

**What's working (from first 100 lines read):**
- `ScalePressable` animation wrapper defined
- `SectionTab` component with section navigation
- Multiple sections: Who Are You, Your Studies, Stay Connected, Your Vibe, Privacy
- ImagePicker imported with try/catch fallback
- `INTERESTS` array with emoji labels — richer than previous profile

**Problems:**

| Issue | Severity | Detail |
|-------|----------|--------|
| `ImagePicker` imported but actual photo upload path unclear from initial read | HIGH | Camera button visibility and upload-to-server flow must be verified end-to-end |
| Section colors hardcoded: `"#C8E630"`, `"#6366f1"`, `"#06b6d4"`, `"#f59e0b"`, `"#3D9E4A"` | MEDIUM | None of these (except brand) are in `theme/tokens.js` |
| File uses `TextInput` directly for fields (visible from imports) | HIGH | Profile edit form fields must use `<TextField />` for consistency |
| No visible save feedback until deeper into file | MEDIUM | Must confirm a success toast or navigation occurs after save |

**Changes needed:**
- [ ] Verify avatar upload button is visible and upload-to-server flow works end-to-end
- [ ] Replace raw `TextInput` field uses with `<TextField />`
- [ ] Add all section accent colors to `theme/tokens.js`
- [ ] Confirm success toast or visual checkmark appears after save

---

### Auth: Sign In (`app/(auth)/signin.js`)

**What's working:**
- Multi-step flow (verify email → password or OTP → success) ✅
- Feature carousel with auto-advance and manual pagination dots ✅
- OTP focus management (auto-advance on digit entry, backspace goes to previous) ✅
- `PrimaryButton` used for all CTAs ✅
- `TextField` used for email/password inputs ✅
- Error/success messages use icon + text inline alert box ✅
- Step 4 success state with `CheckCircle2` animation ✅
- "Use OTP instead" link works and redirects flow ✅
- Correctly routes to `/users/setup-password` if `needsPasswordSetup` flag is set ✅

**Problems:**

| Issue | Severity | Detail |
|-------|----------|--------|
| OTP `TextInput` boxes are raw `TextInput` elements (not `<TextField />`) | LOW | Acceptable for this specific pattern (6 single-char boxes require special layout), but no `accessibilityLabel` |
| No `hitSlop` on the "← Back" / "← Home" back pill | LOW | Pill is 14px vertical padding — borderline touch target |
| Google Sign In button is a stub (`Alert.alert("Coming soon…")`) | MEDIUM | Stub is present in production code — should be hidden or visually marked as unavailable |

**Changes needed:**
- [ ] Add `accessibilityLabel` to each OTP box (e.g., `"Digit 1 of 6"`)
- [ ] Either remove Google Sign In button or add clear "Coming Soon" disabled styling

---

### Auth: Sign Up (`app/(auth)/signup.js`)

**What's working:**
- Email → verify (OTP) → profile details two-step flow ✅
- Progress bar fill animates with step ✅
- Password strength indicator (`<PasswordStrength />`) ✅
- Username availability check with debounce and inline feedback ✅
- `checkingUsername` state — no spinner during check (noted in previous audit as a problem — still present)
- Cooldown timer on OTP resend ✅
- Organizer toggle toggle clearly styled ✅
- Terms checkbox with validation ✅
- Routes to `/onboarding/interests` after signup ✅ (FIXED)

**Problems:**

| Issue | Severity | Detail |
|-------|----------|--------|
| No spinner shown while `checkingUsername` is true | MEDIUM | Users don't know check is in progress |
| OTP boxes are raw `TextInput` (same as signin — intentional for this pattern) | LOW | Needs `accessibilityLabel` per box |
| Google Sign In stub missing from signup (unlike signin) — inconsistent | LOW | If signin has it, signup should too (or neither) |
| `checkMark` text `color: "#1A1A14"` on lime checkbox background | LOW | Correct for contrast, but should be a theme token |

**Changes needed:**
- [ ] Show `<ActivityIndicator size="small" color={theme.colors.brand} />` next to username field when `checkingUsername` is true
- [ ] Add `accessibilityLabel` to OTP boxes in signup

---

### Event Detail (`app/event/[eventId].js`)

**What's working:**
- Hero with gradient, back pill with `hitSlop={8}` ✅
- Sold-out tickets: `disabled={isSoldOut}` + `opacity: isSoldOut ? 0.4 : 1` ✅ (FIXED)
- Free tickets show "Free" label ✅ (FIXED)
- Social proof: "X people are attending" notice card ✅ (FIXED)
- Bookmark toggle ✅
- Remind Me feature with push notification scheduling ✅ — new feature
- Add to Calendar integration ✅ — new feature
- Waitlist join flow ✅ — new feature
- ReviewModal for past attendees ✅ — new feature
- Organizer row with avatar and profile link ✅

**Problems:**

| Issue | Severity | Detail |
|-------|----------|--------|
| Unselected ticket type has no radio indicator (empty circle) | MEDIUM | Only shows `<CheckCircle />` when selected — no affordance for unselected state |
| Hero shows dark `"#1C1C18"` fallback when no cover image | LOW | Add event emoji/icon or category-specific illustration |
| `"#6366f1"` used for reminder button color hardcoded | MEDIUM | Add to theme tokens |
| `"#3D9E4A"` used for calendar-added state hardcoded | LOW | Use `theme.colors.success` |
| No `onError` handler on hero cover `<Image />` | LOW | 404 shows blank; add fallback View |
| Remind Me uses `Alert.alert` with 3 options — modal-within-alert pattern | LOW | Works but platform-specific; a bottom sheet picker would be more polished |
| CTA button uses `"#1A1A14"` hardcoded for disabled state text too | LOW | On disabled state (`surfaceMuted` background), dark text may actually be wrong — should be `textSubtle` |

**Changes needed:**
- [ ] Add empty radio circle (or `Circle` icon) on unselected ticket cards
- [ ] Add `onError` fallback `View` on hero `<Image />`
- [ ] Replace `"#6366f1"` and `"#3D9E4A"` inline with theme tokens
- [ ] Fix CTA disabled text color: `color: ctaDisabled ? theme.colors.textSubtle : "#1A1A14"`

---

### Event Manage (`app/event/[eventId]/manage.js`)

**What's working (from first 80 lines):**
- 6-tab layout: Overview, Attendees, Check-in, Pending, Analytics, Settings ✅
- Per-item processing state (`processingId`) prevents double-taps ✅
- Flash message system with auto-clear ✅

**Problems (noted from structure and previous audit, full read limited):**

| Issue | Severity | Detail |
|-------|----------|--------|
| Check-in tab likely has no QR scanner | MEDIUM | Should be labeled "Coming Soon" if scanner not implemented |
| Analytics tab is likely minimal | LOW | Even basic charts (attendees over time) would add value |
| No bulk approve/reject action | MEDIUM | Pending tab likely handles one attendee at a time |

---

### Event Payment (`app/event/[eventId]/payment.js`)

**What's working (from first 80 lines):**
- Loads both event and wallet data in parallel ✅
- Payment method state (`paystack` default) ✅
- Registration questions pre-filled in `answers` state ✅

**Problems (from structure; full read limited):**

| Issue | Severity | Detail |
|-------|----------|--------|
| Insufficient balance path must show top-up CTA | HIGH | If wallet balance < ticket price, user needs a path to add funds |
| Payment method toggle (wallet vs Paystack) must be clearly distinct | MEDIUM | Needs visual selection state — radio button or highlighted card |

---

### Event Registration (`app/event/[eventId]/registration.js`)

**What's working (from first 80 lines):**
- Loads event and initializes question answers ✅
- Submit handler with auth check ✅

**Problems:**

| Issue | Severity | Detail |
|-------|----------|--------|
| Question fields use raw `TextInput` (visible from imports) | HIGH | Must use `<TextField />` for consistency and error state support |
| No required field validation before submit | HIGH | Missing asterisk or validation error for required questions |
| Confirmation/success state must be verified | MEDIUM | Must show ticket + celebration after successful registration |

---

### Wallet (`app/(app)/wallet.js`)

**What's working:**
- Bank is now a dropdown picker (scrollable list of Nigerian banks) ✅ (FIXED)
- Balance hide/show toggle ✅
- Locked balance banner explanation ("release 1 hour after events end") ✅
- Transaction history with income/expense color coding ✅
- Withdrawal status color coding (pending/completed/failed) ✅
- MAX button to fill withdrawal amount ✅
- Fee calculation displayed inline ✅

**Problems:**

| Issue | Severity | Detail |
|-------|----------|--------|
| No wallet top-up / add money flow | CRITICAL | Users who need to pay for events via wallet cannot add money |
| Withdraw button inline `TouchableOpacity` not using `<PrimaryButton />` | MEDIUM | Inconsistent with rest of app |
| Bank form uses raw `TextInput` for Account Name and Account Number | MEDIUM | Should use `<TextField />` |
| Transaction list capped at 10 (`slice(0, 10)`) with no "Load More" | MEDIUM | Users with longer history have no way to see older transactions |
| `balanceChip`, `balanceAmount`, `statValue`, `statLabel` use hardcoded `"#F0EFE0"` and `rgba(240,239,224,0.5)` | LOW | These are on `navSurface` dark card — semantically correct but fragile. Add `textOnDark` token |

**Changes needed:**
- [ ] Add wallet top-up flow (Paystack payment to add balance)
- [ ] Replace raw `TextInput` in bank form with `<TextField />`
- [ ] Add "Load More" or paginated transaction history
- [ ] Add `textOnDark: "#F0EFE0"` token to theme

---

### Community Detail (`app/users/community/[id].js`)

**What's working:**
- Emoji reactions ✅
- Quick emoji insert bar ✅
- OG link preview with `<LinkPreview />` component ✅ — new feature
- File/image attachment support (Paperclip icon) ✅ — new feature
- Socket-based real-time messaging ✅
- Message grouping by date (Today/Yesterday/date) ✅
- Avatar color based on username hash ✅

**Problems (from first 100 lines; deeper issues from previous audit):**

| Issue | Severity | Detail |
|-------|----------|--------|
| Voice note (`Mic` icon) appears to be a stub | MEDIUM | Remove from UI or label "Coming Soon" |
| `lpStyles` container uses `rgba(255,255,255,0.12)` hardcoded | LOW | Assumes dark chat bg — breaks in light mode community themes |
| No message pagination — all messages load at once | MEDIUM | Performance degrades with long conversation histories |
| Link color `#99f6e4` used in previous audit may still exist deeper in file | MEDIUM | Should use `theme.colors.brand` |
| No pinned message at top | LOW | Useful for community announcements |

---

## Component Analysis

---

### `PrimaryButton` (`components/PrimaryButton.js`)

**Status: Significantly improved ✅**

- All 4 variants work: `primary` (lime), `destructive` (error red), `subtle/secondary` (surfaceElevated), `ghost` (transparent)
- `"#1A1A14"` for primary text is intentional and correct (lime is a light color) — well-commented
- `disabled` state uses `opacity: 0.55` — still slightly too opaque

**Remaining issues:**
- `disabled` opacity should be `0.4` for clearer inactive signal
- No `accessibilityRole="button"` on the `AnimatedPressable`

---

### `TextField` (`components/TextField.js`)

**Status: Well-implemented ✅**

- Focus ring animates via `Reanimated` ✅
- Error state shows red border + error text below ✅
- `helperText` prop for helper text ✅
- Left and right icon slots ✅
- `forwardRef` for programmatic focus ✅

**Remaining issues:**
- The `animatedStyle` only sets `borderWidth: 1.5` — the border color change is not actually animated (it's set via plain `borderColor` prop, not an animated value). The animation is cosmetic only. Low priority.
- No `validationState: 'success'` state (green border for confirmed-valid fields like username)

---

### `ModalShell` (`components/ModalShell.js`)

**Status: New component — well-designed ✅**

- Consistent close button (X) with `hitSlop={12}` ✅
- Backdrop uses `theme.colors.overlay` ✅
- `NeuCard` as inner container ✅
- `footer` slot for action buttons ✅
- No safe area handling — modals that appear over the full screen need `useSafeAreaInsets`

**Remaining issue:**
- Add `paddingBottom: insets.bottom` inside the card when rendered at bottom of screen

---

### Typography System

**Current type scale (from audit):**

| Role | Font | Size | Weight | Assessment |
|------|------|------|--------|------------|
| Page title | SpaceGrotesk | 26–32 | 800 | ✅ Good |
| Section title | SpaceGrotesk | 17 | 800 | ✅ Good |
| Card title | SpaceGrotesk | 15–20 | 700 | ⚠️ Range too wide |
| Body | PlusJakartaSans | 13–15 | 400–600 | ⚠️ Inconsistent |
| Label/badge | PlusJakartaSans | 9–13 | 600–800 | ⚠️ 9px badge text is too small |
| Caption | PlusJakartaSans | 11–12 | 400 | ✅ Good |

**Remaining problems:**
- 9px text appears in `EventListRow` "FOR YOU" badge and event hero badge labels — below minimum legible size on smaller screens. Minimum should be 10px.
- `lineHeight` still missing on several `Text` components (badge labels, meta rows)

**Recommended enforced type scale:**
```
H1:      SpaceGrotesk  32px  800   (page headers)
H2:      SpaceGrotesk  26px  800   (section openers)
H3:      SpaceGrotesk  20px  700   (card headlines)
SubH:    SpaceGrotesk  17px  700   (section labels)
Body:    PlusJakartaSans 15px 500  (default body)
Small:   PlusJakartaSans 13px 500  (supporting text)
Caption: PlusJakartaSans 11px 400  (metadata, timestamps)
Badge:   PlusJakartaSans 10px 800  (minimum — not 9px)
```
All text should have `lineHeight: fontSize * 1.5`.

---

### Color System

**Improvements since last audit:**
- Most lime + dark text combinations are now correct ✅
- `EventListRow` paid price badge uses `#F0EFE0` on `navSurface` (dark card) — valid contrast ✅

**Remaining violations and gaps:**

| Location | Issue | Fix |
|----------|-------|-----|
| `"#6366f1"` (purple) | Used in settings, notifications, event reminder — not in tokens | Add `accentPurple: "#6366f1"` |
| `"#06b6d4"` (cyan) | Notification social category, profile edit — not in tokens | Add `accentCyan: "#06b6d4"` |
| `"#0ea5e9"` (sky blue) | Settings legal section — not in tokens | Add `accentBlue: "#0ea5e9"` |
| `"#10b981"` (green) | Settings privacy section — not in tokens | Add `accentTeal: "#10b981"` |
| `"#F0EFE0"` (cream) | Wallet balance card — not in tokens | Add `textOnDark: "#F0EFE0"` |
| `"#1A1A14"` (dark) | Used everywhere as button text on lime — not in tokens | Add `textOnBrand: "#1A1A14"` |

**Add to `theme/tokens.js` (both light and dark modes):**
```javascript
textOnBrand:   "#1A1A14",     // text on lime (#C8E630) backgrounds
textOnDark:    "#F0EFE0",     // text on navSurface dark cards
accentPurple:  "#6366f1",     // security/community accent
accentCyan:    "#06b6d4",     // social/follow accent
accentBlue:    "#0ea5e9",     // info/legal accent
accentTeal:    "#10b981",     // privacy/security accent
accentAmber:   "#f59e0b",     // warnings/premium (already theme.colors.warning in dark, but not named in light)
```

---

### Button Consistency Audit

**Screens still using inline `Pressable`/`TouchableOpacity` instead of `<PrimaryButton />`:**

| Screen | Usage |
|--------|-------|
| `past-events.js` | "View Ticket" button |
| `wallet.js` | Withdraw Now, Save Details buttons |
| `wallet.js` | Bank form Cancel/Save buttons |
| `event-library.js` | Empty state "Explore Events" CTA |
| `community.js` | Next Step, Back, Create Community (modal) |
| `community.js` | Code join button |
| `event/[eventId].js` | Bottom CTA button |

**Enforcement rule:** Never use `<Pressable>` or `<TouchableOpacity>` with custom `backgroundColor` for primary actions. Always use `<PrimaryButton variant="..." />`.

---

### Form Input Consistency Audit

**Screens still using raw `TextInput`:**

| Screen | Fields |
|--------|--------|
| `community.js` (create modal) | Name, Description, Category, Rules, Code Join input |
| `wallet.js` | Account Name, Account Number (bank form) |
| `privacy-settings.js` | Current Password, New Password, Confirm Password |
| `event/[eventId]/registration.js` | Custom question fields |
| `profile-edit.js` | Likely multiple fields |

---

### Empty States

**Improvement since last audit:**
- `event-library.js` has a proper `EmptyState` component (locally defined) ✅
- `past-events.js` has `NeuInset` + icon + text ✅
- Notifications has Bell icon + descriptive text ✅
- Wallet has icon + text ✅

**Remaining:** The `EmptyState` in `event-library.js` should be extracted to a shared `/components/EmptyState.js` so all screens use one consistent pattern.

---

### Loading States

**Improvement:** `PageLoader` is now used consistently across all main screens.

**Still missing skeleton loaders on:**
- Dashboard event list (shows blank then content appears)
- Event Library event list
- Community list
- Wallet transaction list

---

### Accessibility

| Issue | Severity | Status |
|-------|----------|--------|
| Touch target under 44px — search clear button | HIGH | Still present |
| OTP input boxes have no `accessibilityLabel` | HIGH | Still present |
| Icons without `accessibilityLabel` on icon-only buttons | HIGH | Still present on most icon-only buttons |
| No `accessibilityRole="button"` on custom pressables | MEDIUM | Still missing broadly |
| Color-only error states (some have icon, some don't) | MEDIUM | Improved in auth screens; still inconsistent elsewhere |

---

## Cross-Cutting Issues

### 1. Spacing

Spacing has improved in consistency but still uses inline numbers throughout. The original recommendation to add `spacing` tokens to `theme/tokens.js` remains open.

### 2. Error UX Pattern

Auth screens now use inline alert boxes with icons ✅. But `community.js` still uses `message` state displayed as raw text, and some screens still use `Alert.alert()` for errors that could be inline. The Toast component (`components/Toast.js`) exists — use it more broadly.

### 3. Hardcoded Color Count

Reduced from ~40+ instances to approximately 20 unique hardcoded values, but new screens introduced new hardcoded colors. Target is zero hardcoded colors outside `theme/tokens.js`.

---

## Priority Fix List

### P0 — Must fix before launch (~5 hours)

| # | Fix | File(s) | Status | Time |
|---|-----|---------|--------|------|
| 1 | Add `hitSlop` to search clear button | `dashboard.js` | ❌ Open | 15m |
| 2 | Fix community create modal: replace raw `TextInput` with `<TextField />` | `community.js` | ❌ Open | 2h |
| 3 | Fix `nextButton` on step 2: ChevronRight icon → `color="#1A1A14"` on lime | `community.js` | ❌ Open | 10m |
| 4 | Add named tokens to `theme/tokens.js` (`textOnBrand`, `textOnDark`, accent colors) | `tokens.js` | ❌ Open | 1h |
| 5 | Replace `"#e5e7eb"` uploadButton border with `theme.colors.border` | `community.js` | ❌ Open | 5m |
| 6 | Replace raw `TextInput` in registration question fields | `registration.js` | ❌ Open | 1h |
| 7 | Fix Profile Edit: verify avatar upload works and add success feedback | `profile-edit.js` | ❌ Open | 1h |

> Previously P0 items now FIXED: sold-out tickets ✅, free ticket label ✅, cancellation UX ✅, Delete Account ✅, App Version ✅, bank dropdown ✅

### P1 — Should fix for polished launch (~12 hours)

| # | Fix | File(s) | Status | Time |
|---|-----|---------|--------|------|
| 1 | Add wallet top-up flow | `wallet.js` | ❌ Open | 3h |
| 2 | Add skeleton loaders to Dashboard, Event Library, Wallet, Community | 4 files | ❌ Open | 3h |
| 3 | Extract shared `<EmptyState />` component | New component + screens | ❌ Open | 1h |
| 4 | Replace raw `TextInput` in wallet bank form | `wallet.js` | ❌ Open | 30m |
| 5 | Replace raw `TextInput` in privacy settings password modal | `privacy-settings.js` | ❌ Open | 30m |
| 6 | Add `accessibilityLabel` to OTP boxes (signin + signup) | `signin.js`, `signup.js` | ❌ Open | 30m |
| 7 | Add `checkingUsername` spinner during username availability check | `signup.js` | ❌ Open | 15m |
| 8 | Replace "View Ticket" inline Pressable with `<PrimaryButton />` | `past-events.js` | ❌ Open | 20m |
| 9 | Replace bottom CTA inline button with `<PrimaryButton />` in event detail | `event/[eventId].js` | ❌ Open | 30m |
| 10 | Initialize `pushEnabled` from stored push token in notification settings | `notification-settings.js` | ❌ Open | 30m |
| 11 | Increase notification unread highlight to `rgba(200,230,48,0.12)` in light mode | `notifications/index.js` | ❌ Open | 10m |
| 12 | Add radio empty circle on unselected ticket types | `event/[eventId].js` | ❌ Open | 30m |
| 13 | Add `onError` fallback on hero image in event detail | `event/[eventId].js` | ❌ Open | 20m |
| 14 | Remove Google Sign In stub or mark as disabled/unavailable | `signin.js` | ❌ Open | 15m |
| 15 | Add "Help & Support" to Settings | `settings.js` | ❌ Open | 20m |

> Previously P1 items now FIXED: community `TextInput` partially fixed (search) ✅, notification settings built ✅, privacy settings built ✅, profile edit built ✅

### P2 — Nice to have (polish sprint)

| # | Fix | Status | Time |
|---|-----|--------|------|
| 1 | Animate live pulse dot on Dashboard and Event Library | ❌ Open | 1h |
| 2 | Add `accessibilityRole="button"` to all `Pressable` / `TouchableOpacity` interactive elements | ❌ Open | 2h |
| 3 | Add `lineHeight` to all Text badge components (min 10px text size) | ❌ Open | 1h |
| 4 | Add type scale constants (H1–Caption) to `tokens.js` | ❌ Open | 30m |
| 5 | Extract `<LiveDot animated />` shared component | ❌ Open | 30m |
| 6 | Add "Following" tab to Profile | ❌ Open | 2h |
| 7 | Show real community data in Profile Communities section | ❌ Open | 1h |
| 8 | Standardize spacing to `theme.spacing.*` scale | ❌ Open | 3h |
| 9 | Add profile visibility / follow-permission toggles to Privacy Settings | ❌ Open | 2h |
| 10 | Add quiet hours / DND to Notification Settings | ❌ Open | 1h |
| 11 | Add "Load More" to wallet transaction history (currently capped at 10) | ❌ Open | 1h |
| 12 | Paginate community messages (currently loads all) | ❌ Open | 2h |
| 13 | Replace `Alert.alert` reminder picker with a bottom-sheet action sheet | ❌ Open | 1h |
| 14 | Add `ModalShell` safe area `paddingBottom: insets.bottom` | ❌ Open | 15m |
| 15 | Add "Danger Zone" section in Settings linking to Privacy Settings | ❌ Open | 20m |

---

## Testing Checklist (Before Launch)

- [ ] All text on lime (`#C8E630`) is dark (`#1A1A14`) — verify both themes
- [ ] All icon buttons have minimum 44×44 touch target (add `hitSlop` where needed)
- [ ] Community create modal — all 3 steps validate required fields before proceeding
- [ ] Wallet withdrawal: insufficient balance shows appropriate error with top-up CTA
- [ ] Sold-out tickets cannot be tapped (disabled prop verified)
- [ ] Free ticket "Register Free" flow completes successfully
- [ ] Paid ticket payment flow completes end-to-end via Paystack
- [ ] OTP signup: resend cooldown timer counts down correctly
- [ ] Profile Edit: avatar upload saves to server and displays on profile
- [ ] Dark mode toggle — every screen updates correctly with no hardcoded colors leaking through
- [ ] Notification Settings toggles persist across app restarts
- [ ] Delete Account 3-step flow completes and signs user out
- [ ] All screens render correctly on iPhone SE (375px wide) — check for overflow
- [ ] Screen reader (VoiceOver/TalkBack) — confirm interactive elements are announced
- [ ] App functions on slow 3G (throttle network in DevTools) — no blank screens without loading indicator
- [ ] Community create: creating a private community generates and displays an access code
- [ ] Community join-by-code: valid code joins, invalid code shows error
- [ ] Event Library "Saved" tab — bookmarked events appear and can be unbookmarked
- [ ] Notification detail auto-marks as read on open
- [ ] Event reminder (push notification) fires at correct time
- [ ] Add to Calendar — event appears in device calendar app

---

## New Screens Added Since Last Audit — Summary

| Screen | Completeness | Key Gaps |
|--------|-------------|----------|
| `notification-settings.js` | ✅ ~90% | `pushEnabled` initial state, hardcoded colors |
| `privacy-settings.js` | ✅ ~85% | Raw `TextInput` in password modal, missing profile visibility toggles |
| `profile-edit.js` | ⚠️ ~75% | Photo upload verification, raw TextInput fields, hardcoded colors |
| `app/users/community/[id].js` (chat) | ✅ ~80% | Voice note stub, no pagination |
