# UniHub Mobile — Full UI/UX Audit
> Generated: 2026-06-25 | Grade: B+ | Status: PRE-PRODUCTION

---

## Executive Summary

The app has strong bones — a cohesive brand system, solid dark mode, and good typography choices. The recent Duolingo-style layout revamp and dark mode overhaul are clear improvements. However, **critical issues with accessibility, form feedback, spacing inconsistencies, and missing UI states** block production readiness.

**Overall Grade: B+** (becomes A with P0+P1 fixes)

### Top 5 Critical Issues
1. **White text on lime (`#C8E630`) backgrounds in multiple places** — WCAG violation
2. **40+ hardcoded colors outside the theme system** — makes theming fragile and creates bugs
3. **Form validation feedback is missing or inconsistent** across signup, wallet, community
4. **Empty states and loading skeletons missing** on Dashboard, Wallet, Community
5. **Touch targets below 44×44px minimum** (e.g. search clear button at ~16×16px)

---

## Screen-by-Screen Analysis

---

### Dashboard (`app/(app)/dashboard.js`)

**What's working:**
- Personalized greeting with user's name
- Category pills with clear active/inactive state (lime underline)
- Live indicator (red pulse dot) is visually clear
- Featured hero card with gradient overlay — readable text
- "For You" badge adds relevance signal
- EventListRow horizontal layout is compact and scannable

**Problems:**

| Issue | Severity | Detail |
|-------|----------|--------|
| Button text color hardcoded as `"#1A1A14"` (not `theme.colors.text`) | MEDIUM | Breaks if the dark card needs different color |
| `EventListRow` price badge text uses `#F0EFE0` on lime | HIGH | `#F0EFE0` on `#C8E630` = ~3.4:1 — fails WCAG AA. Must use `#1A1A14` |
| Section spacing inconsistent: featured card `marginBottom: 20`, sections use 32 | LOW | Standardize to 28px gap between all major sections |
| Empty state only shows big emoji, no consistent component | MEDIUM | Should use shared `<EmptyState />` with title + subtitle + CTA |
| No skeleton loader during event fetch (just `PageLoader`) | MEDIUM | Shows blank screen during loading — jarring |
| Typography hierarchy unclear: section titles 17px but page title 28–32px | LOW | Missing mid-level heading (22px SpaceGrotesk for sub-headers) |
| Create event button ChevronRight icon may render white on lime | HIGH | Verify icon color passes contrast check |

**Changes needed:**
- [ ] Change all `"#1A1A14"` hardcodes in button/badge text to `theme.colors.textOnBrand` (new token)
- [ ] Ensure `EventListRow` price badge always uses `#1A1A14` text
- [ ] Add `<SkeletonLoader count={4} variant="row" />` while events fetch
- [ ] Standardize section gap to `gap: 28`
- [ ] Extract empty state to shared component

---

### Event Library (`app/(app)/event-library.js`)

**What's working:**
- Underline tab bar (Upcoming/Past) is clean and modern
- Sub-toggle pills (Events/My Tickets) are clear
- "Happening Now" section with live pulse is visually distinct
- Ticket badge count on header

**Problems:**

| Issue | Severity | Detail |
|-------|----------|--------|
| Active tab text hardcoded `"#1A1A14"` | MEDIUM | Should use `theme.colors.textOnBrand` |
| Section title has no `marginBottom` after center-alignment | LOW | Missing 20px breathing room below title |
| Live pulse is static (no animation) | LOW | Dashboard has animated pulse — borrow that |
| Empty state CTA button is inline Pressable, not PrimaryButton | MEDIUM | Code duplication, styling inconsistency |
| Inactive tab text only differs in color (not size/weight) | LOW | Weak differentiation — dim to 13px or lighter weight |

**Changes needed:**
- [ ] Animate the live pulse dot (reuse dashboard animation)
- [ ] Replace inline empty state button with `<PrimaryButton />`
- [ ] Add `marginBottom: 20` to section titles
- [ ] Reduce inactive tab font size to 14px for hierarchy

---

### Community (`app/(app)/community.js`)

**What's working:**
- Community card design (banner + scrim + overlay badges) is polished
- Private badge and member count pill are well-placed
- Create community multi-step modal flow is thoughtful

**Problems:**

| Issue | Severity | Detail |
|-------|----------|--------|
| TextInput used directly for community name/desc (not TextField component) | HIGH | No focus states, no error feedback, visually inconsistent |
| Private code input doesn't match TextField design | HIGH | Visual inconsistency with rest of app |
| Icon selection grid (56×56 boxes) has no border on unselected state | MEDIUM | Affordance is invisible — users can't tell what's tappable |
| Modal doesn't account for safe area at top | MEDIUM | On notched devices (iPhone X+), content can overlap camera notch |
| Community emoji placeholder too faint in dark mode (opacity 0.5) | LOW | Use `theme.colors.textMuted` with full opacity instead |
| "Open Chat" button color conflicts with "Join" button on same card | MEDIUM | Use consistent color per action type (primary=lime, secondary=outline) |
| Image upload "coming soon" alert is placeholder, not real UI | HIGH | Missing feature that blocks community creation UX |
| No loading indicator when submitting community creation | MEDIUM | Users don't know if action is in progress |

**Changes needed:**
- [ ] Replace all `TextInput` elements with `<TextField />` in community modals
- [ ] Add 1px `theme.colors.border` border around unselected icon options
- [ ] Add `paddingTop: insets.top + 12` to modal container
- [ ] Replace "Open Chat" with an outline variant button to visually distinguish from primary action
- [ ] Add loading state (`isSubmitting` → disable button + show spinner)

---

### Notifications (`app/(app)/notifications/index.js`)

**What's working:**
- Notification card design is sophisticated — unread stripe, type icon, time, action row
- Spring animation on press is delightful
- "Mark all read" is well-placed
- NEW/EARLIER section split is clear

**Problems:**

| Issue | Severity | Detail |
|-------|----------|--------|
| Unread background difference between light/dark mode is imperceptible (0.06 vs 0.07) | MEDIUM | Increase light mode to 0.12 minimum for clear unread signal |
| Notification type colors hardcoded (e.g. `"#3D9E4A"`) not in theme | MEDIUM | These may fail contrast on surfaceMuted in dark mode |
| "Read full message →" uses a string arrow, not an icon | LOW | Use `<ChevronRight size={12} />` — symbol rendering varies by device |
| Banner image shows nothing if missing — no placeholder | MEDIUM | Add fallback `View` with `theme.colors.surfaceElevated` background |
| Type label color uses hex strings that may have contrast issues on surfaceMuted | HIGH | Run WCAG check for all 17 notification type colors |
| `${color}30` opacity trick assumes hex — breaks with RGB colors | LOW | Convert to explicit `rgba()` or `theme.colors.brandTint` |

**Changes needed:**
- [ ] Increase unread highlight opacity in light mode to 0.12
- [ ] Add banner image fallback View with icon placeholder
- [ ] Replace arrow string with `<ChevronRight />` icon
- [ ] Run WCAG contrast check on all 17 notification type colors
- [ ] Add all notification type colors to `theme/tokens.js`

---

### Notification Detail (`app/(app)/notifications/[id].js`)

**What's working:**
- Comprehensive layout (meta, title, banner, sections, buttons)
- Dark `#1A1A14` text on lime action buttons — correct

**Problems:**

| Issue | Severity | Detail |
|-------|----------|--------|
| `ExternalLink` icon color hardcoded `"#1A1A14"` not using variable | LOW | Should match button text color from same scope |
| Button section assumes all buttons are lime — secondary actions need outline | MEDIUM | Add `variant` field to button data and render accordingly |

---

### Past Events (`app/(app)/past-events.js`)

**What's working:**
- Cover images with top-right "Past" badge
- "View Ticket" and "Remove" action buttons are well-spaced
- Category badge uses brandTint appropriately

**Problems:**

| Issue | Severity | Detail |
|-------|----------|--------|
| "View Ticket" is an inline Pressable, not `<PrimaryButton />` | MEDIUM | Style inconsistency across screens |
| During cancellation, "Remove" text stays visible alongside ActivityIndicator | HIGH | UX confusion — either hide text or replace with "Cancelling…" |
| Card spacing `marginBottom: 16` vs dashboard's 28 | LOW | Inconsistent vertical rhythm |
| Placeholder icon color `textSubtle` may be too faint on surfaceMuted | LOW | Use `textMuted` (one step darker) for placeholder icons |
| "Remove" button has no disabled background defined | LOW | When disabled, should show clearly inactive state |

**Changes needed:**
- [ ] Replace "View Ticket" with `<PrimaryButton />`
- [ ] On cancel press, replace button text with "Cancelling…" + spinner
- [ ] Standardize card `marginBottom` to 16 (pick one, enforce everywhere)

---

### Profile (`app/(app)/profile.js`)

**What's working:**
- Hero avatar header
- Stats row with dividers
- Interest pills

**Problems:**

| Issue | Severity | Detail |
|-------|----------|--------|
| Edit button icon uses `textMuted` color — too invisible | MEDIUM | Change to `theme.colors.brand` — users need to notice it |
| Stats row separator is an empty `View`, not a visual line | LOW | Add 1px height, `backgroundColor: theme.colors.border` |
| Following/Followers tabs exist but data is non-functional | HIGH | Shows empty state with no action — misleading |
| No profile completeness indicator | MEDIUM | Users don't know what to fill in |

**Changes needed:**
- [ ] Edit button icon → `theme.colors.brand`
- [ ] Stats separator → 1px border line
- [ ] Following/Followers: either show data or hide tabs with "coming soon" label

---

### Settings (`app/(app)/settings.js`)

**What's working:**
- `SettingsItem` component is well-animated
- Icon containers use brandTint background
- Section organization is logical

**Problems:**

| Issue | Severity | Detail |
|-------|----------|--------|
| Security section icon color `"#6366f1"` hardcoded — not in theme | HIGH | Breaks dark/light mode theming |
| Notification Settings and Privacy Settings are linked but screens may be incomplete | MEDIUM | See sub-screen issues below |
| No "Delete Account" option | HIGH | Required for app store compliance (Apple guideline 5.1.1) |
| No "Help & Support" item | MEDIUM | Users need a way to get help |
| No "About / Version" item | LOW | Standard settings screen expectation |

**Changes needed:**
- [ ] Add `theme.colors.accentPurple = "#6366f1"` to tokens.js
- [ ] Add "Delete Account" (destructive) item with confirmation dialog
- [ ] Add "Help & Support" → links to support email or web page
- [ ] Add "App Version" display item

---

### Notification Settings (`app/users/notification-settings.js`)

**Problems:**
- Needs full review (file exists but may be minimal stub)
- Must show toggle per notification type (events, communities, follows, payouts, announcements)
- Should persist preferences

---

### Privacy Settings (`app/users/privacy-settings.js`)

**Problems:**
- Must include: Profile visibility, Who can follow me, Who can see my events, Blocked users
- Needs confirmation dialogs for sensitive changes

---

### Profile Edit (`app/users/profile-edit.js`)

**Problems:**
- Avatar photo upload must work (or be clearly marked as "coming soon")
- All form fields must use `<TextField />` with validation
- Must show save feedback (success toast or checkmark)

---

### Auth: Sign In (`app/(auth)/signin.js`)

**What's working:**
- OTP field focus management on input
- Feature carousel on first step
- Multi-step flow with step indicators

**Problems:**

| Issue | Severity | Detail |
|-------|----------|--------|
| No success animation on login | LOW | Static text change — add a checkmark scale animation |
| Error messages may not all be consistently styled | MEDIUM | Audit all error paths for consistent red text + icon |
| Forgot password link — verify full reset flow works | HIGH | Critical path, must work end to end |

---

### Auth: Sign Up (`app/(auth)/signup.js`)

**What's working:**
- Password strength indicator
- Username availability check
- Terms of service checkbox

**Problems:**

| Issue | Severity | Detail |
|-------|----------|--------|
| No visual feedback while username availability checking | MEDIUM | Show loading spinner next to input during debounced check |
| No onboarding interests step | HIGH | Users go straight to dashboard with no preferences set |
| No profile photo upload in signup | MEDIUM | First impression of profile is blank avatar |
| Form step indicator may not be visible in current code | MEDIUM | Verify step badges render correctly |

---

### Event Detail (`app/event/[eventId].js`)

**What's working:**
- Hero image with gradient overlay
- Ticket type cards with selection state
- CTA button at bottom

**Problems:**

| Issue | Severity | Detail |
|-------|----------|--------|
| Free tickets show empty string for price, not "Free" | HIGH | Confuses users — should show "Free" label |
| Unselected ticket has no indicator (empty circle) | MEDIUM | Only shows checkmark when selected — no affordance when unselected |
| Sold-out tickets are pressable with only 0.55 opacity | HIGH | Must be non-interactive (`pointerEvents: 'none'`) with 0.4 opacity |
| Hero shows blank if image fails to load | MEDIUM | Add fallback gradient + event name text |
| No "X people are going" social proof | LOW | Missed opportunity for FOMO |

**Changes needed:**
- [ ] Show "Free" label for `isFree` tickets
- [ ] Add RadioButton empty circle for unselected tickets
- [ ] Disable sold-out tickets: `pointerEvents="none"` + opacity 0.4
- [ ] Add `onError` fallback on hero Image component

---

### Event Manage (`app/event/[eventId]/manage.js`)

**Problems:**
- Check-in tab exists but no QR scanner — stub state is fine if labeled "Coming Soon"
- Attendee tab must load real data with clear empty state
- Bulk approve/reject missing — single row approve only
- Settings tab appears minimal

---

### Event Payment (`app/event/[eventId]/payment.js`)

**Problems:**
- Insufficient balance state must show top-up CTA button, not just error text
- Payment method toggle (wallet vs Paystack) must be clearly distinct
- Loading state during payment processing must disable all buttons

---

### Event Registration (`app/event/[eventId]/registration.js`)

**Problems:**
- Custom question fields must validate required fields before submit
- Multi-page registration (if applicable) needs step indicator
- Confirmation screen after successful registration must show ticket + confetti/celebration

---

### Wallet (`app/(app)/wallet.js`)

**What's working:**
- Premium dark balance card design
- Stats row (available, locked, earned)
- Transaction history

**Problems:**

| Issue | Severity | Detail |
|-------|----------|--------|
| No wallet top-up / add money flow | CRITICAL | Users can't add money to wallet |
| Bank selection uses TextInput, not a Picker/Dropdown | HIGH | Users must type bank name — error-prone |
| Transaction list has no filter or date sorting | MEDIUM | Long history becomes unusable |
| "Locked" balance has no tooltip/explanation | MEDIUM | Users confused about what locked means |
| Withdraw button disabled if no balance — no explanation shown | MEDIUM | Show "Add funds to withdraw" text |
| Insufficient UI for withdrawal states (pending/failed) | MEDIUM | Status indicators needed per transaction |

**Changes needed:**
- [ ] Add wallet top-up flow (Paystack payment to add balance)
- [ ] Replace bank TextInput with a scrollable bank Picker modal
- [ ] Add info tooltip (i) icon next to "Locked" balance
- [ ] Add date filter pills to transaction history

---

### Verify (`app/(app)/verify.js`)

**Problems:**
- Currently shows "Coming Soon" placeholder
- Either implement (OTP email/phone verification) or remove from tab bar until ready
- Placeholder screens hurt professional impression

---

### Community Detail (`app/users/community/[id].js`)

**What's working:**
- Emoji reactions
- Emoji insert bar
- OG link preview

**Problems:**

| Issue | Severity | Detail |
|-------|----------|--------|
| Voice note is a stub (no recording) | MEDIUM | Remove UI or clearly mark as "coming soon" |
| Media sharing (images) not implemented | HIGH | Community feels text-only |
| No message pagination (loads all messages) | MEDIUM | Performance issue with long histories |
| No pinned message at top | LOW | Useful for announcements |
| Link color uses custom `#99f6e4` in some places | MEDIUM | Should use `theme.colors.brand` |

---

## Component Analysis

---

### Typography System

**Current type scale (reconstructed from audit):**

| Role | Font | Size | Weight | Assessment |
|------|------|------|--------|------------|
| Page title | SpaceGrotesk | 28–32 | 800 | ✅ Good |
| Section title | SpaceGrotesk | 17 | 800 | ✅ Good |
| Card title | SpaceGrotesk | 15–20 | 700 | ⚠️ Range too wide |
| Body | PlusJakartaSans | 13–15 | 400–600 | ⚠️ Inconsistent |
| Label/badge | PlusJakartaSans | 11–13 | 600–700 | ⚠️ Inconsistent |
| Caption | PlusJakartaSans | 11–12 | 400 | ✅ Good |

**Problems:**
- 3px size differences between body levels (13/14/15) are too subtle
- `lineHeight` not set on many text components — causes clipping on Android
- Limelight font used in contexts beyond its intended role (onboarding branding)

**Recommended strict type scale:**
```
H1:     SpaceGrotesk  32px  800   (page headers)
H2:     SpaceGrotesk  26px  800   (section openers)
H3:     SpaceGrotesk  20px  700   (card headlines)
SubH:   SpaceGrotesk  17px  700   (section labels)
Body:   PlusJakartaSans 15px 500  (default body)
Small:  PlusJakartaSans 13px 500  (supporting text)
Caption:PlusJakartaSans 11px 400  (metadata, timestamps)
```
All text should have `lineHeight: fontSize * 1.5`.

---

### Color System

**Critical violations found:**

| Location | Background | Current Text | Contrast Ratio | Required |
|----------|-----------|--------------|----------------|----------|
| `EventListRow` price badge | `#C8E630` (lime) | `#F0EFE0` | ~3.4:1 ❌ | `#1A1A14` (14.4:1) |
| Various badge components | `#C8E630` (lime) | `#FFFFFF` | 1.4:1 ❌ | `#1A1A14` |
| Settings security icon | — | `"#6366f1"` hardcoded | N/A | `theme.colors.accentPurple` |
| Notification type colors | `surfaceMuted` | Various hex | Unverified | WCAG AA needed |

**Hardcoded values that should be in theme:**
```javascript
// Add to theme/tokens.js:
textOnBrand:    "#1A1A14",     // text on lime backgrounds (already doc'd, not in tokens)
textOnDark:     "#F0EFE0",     // text on dark navSurface cards
accentPurple:   "#6366f1",     // settings/security accent
accentRed:      "#ef4444",     // notification type: alert
accentGreen:    "#3D9E4A",     // notification type: success
accentBlue:     "#3B82F6",     // notification type: info
accentOrange:   "#F59E0B",     // notification type: warning
```

---

### Button Components

**Problems:**
- `PrimaryButton` hardcodes `"#1A1A14"` for primary text — should be `theme.colors.textOnBrand`
- Disabled state only uses opacity 0.55 — no clear "inactive" visual
- Dozens of inline `Pressable` buttons throughout the app bypass `PrimaryButton`

**Rules to enforce:**
- All buttons must be `<PrimaryButton variant="..." />`
- No inline `Pressable` with custom background+text colors
- Disabled state: opacity 0.4 + pointer-events none

---

### Form Inputs

**Problems:**
- `community.js` uses raw `TextInput` (no focus ring, no error state, no label)
- `wallet.js` uses `TextInput` for bank name (should be a picker)
- No consistent `validationState: 'error' | 'success' | 'pending'` on `TextField`
- No helper text under required fields

**Enforcement rule:** Never use `<TextInput />` directly. Always use `<TextField />`.

---

### Cards

**Problems:**
- `NeuCard` shadow opacity 0.06 is barely visible on light mode
- Past events cards styled differently from dashboard event rows — inconsistent
- No "elevated" card variant for featured/hero content

**Add to `NeuCard`:**
- `variant="elevated"` → `shadowOpacity: 0.12`, `shadowRadius: 16`
- `variant="flat"` → no shadow, only border

---

### Empty States

**Current:** 3 different inline implementations (emoji-only, NeuInset+emoji, nothing)

**Target:** Single shared component:
```jsx
<EmptyState
  emoji="🎟️"
  title="No tickets yet"
  subtitle="Register for an event to see tickets here"
  action={<PrimaryButton label="Browse Events" onPress={...} />}
/>
```

Use on: Dashboard (no events), Event Library (no tickets/events), Community (no communities), Wallet (no transactions), Profile (no events).

---

### Loading States

**Missing skeletons on:**
- Dashboard event list
- Event Library list
- Community list
- Wallet transaction list
- Profile event history tabs

**Create:** `<SkeletonRow />` and `<SkeletonCard />` using animated opacity pulse (0.4 → 0.9 → 0.4).

---

### Modals

**Problems:**
- No consistent modal wrapper component
- Some modals lack close button (X top-right)
- Safe area handling varies
- No backdrop blur or consistent overlay opacity

**Create:** `<AppModal title="" onClose={} isVisible={}>` with:
- `backgroundColor: theme.colors.surface`
- Close button top-right (X icon, `theme.colors.textSubtle`)
- Safe area padding via `useSafeAreaInsets()`
- Backdrop: `rgba(0,0,0,0.5)`

---

### Accessibility

| Issue | Severity |
|-------|----------|
| Touch targets under 44×44px (clear button in search = ~16×16) | HIGH |
| Icons without `accessibilityLabel` | HIGH |
| Color-only error states (no icon alongside red text) | MEDIUM |
| OTP input fields have no screen reader labels | HIGH |
| No `accessibilityRole` on custom buttons | MEDIUM |

**Quick wins:**
- Add `hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}` to all small icon buttons
- Add `accessibilityLabel="Clear search"` etc. to icon-only buttons
- Add error icon (`AlertCircle`) alongside all red error texts

---

## Cross-Cutting Issues

### 1. Spacing Chaos

| Context | Margin/Gap used |
|---------|----------------|
| Dashboard sections | 32px |
| Community sections | 24px |
| Past events cards | 16px |
| Modal padding | 20–24px |
| Button height | 44–52px |

**Fix:** Define and enforce:
```javascript
// theme/tokens.js
spacing: {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48
}
```
Use `theme.spacing.xl` for section gaps, `theme.spacing.lg` for card gaps.

---

### 2. Error UX Pattern

3 different patterns in use:
- `Alert.alert()` — Past Events
- State-based inline message — Community  
- TextField error prop — Auth

**Pick one for non-form errors:** Use a `Toast` component (bottom-of-screen, auto-dismiss, color-coded).

---

### 3. Hardcoded Colors Count

~40 instances of `"#1A1A14"`, ~15 of `"#F0EFE0"`, ~20 `rgba(200,230,48,…)` variants.

None of these exist in `theme/tokens.js`. **Every one is a fragile dependency.** Add them as named tokens so a theme change touches one file.

---

## Priority Fix List

### P0 — Must fix before launch (~8 hours)

| # | Fix | File(s) | Time |
|---|-----|---------|------|
| 1 | Fix all white/light text on lime backgrounds → `#1A1A14` | Dashboard, EventListRow, buttons, badges | 2h |
| 2 | Add named tokens to theme/tokens.js (textOnBrand, accentColors) | theme/tokens.js | 1h |
| 3 | Add `hitSlop` to all small icon buttons (<44px touch target) | Dashboard search clear, notification icons, etc. | 1h |
| 4 | Fix sold-out tickets: non-interactive + 0.4 opacity | event/[eventId].js | 30m |
| 5 | Show "Free" label on free tickets | event/[eventId].js | 15m |
| 6 | Fix cancellation UX: hide Remove text, show "Cancelling…" | past-events.js | 30m |
| 7 | Add Delete Account option in Settings (required for App Store) | settings.js | 1h |
| 8 | Fix `#6366f1` hardcode in Settings | settings.js | 15m |

### P1 — Should fix for polished launch (~15 hours)

| # | Fix | File(s) | Time |
|---|-----|---------|------|
| 1 | Replace all `TextInput` with `<TextField />` in community modals | community.js | 2h |
| 2 | Add loading skeleton to Dashboard, Event Library, Wallet | 3 files | 3h |
| 3 | Create shared `<EmptyState />` component and use it everywhere | New component + 5 screens | 2h |
| 4 | Add modal safe area handling | community.js, modals | 1h |
| 5 | Fix notification unread highlight contrast (0.06 → 0.12 in light) | notifications/index.js | 30m |
| 6 | Add notification banner image placeholder | notifications/index.js | 1h |
| 7 | Replace inline Pressable buttons with PrimaryButton throughout | All screens | 3h |
| 8 | Add lineHeight to all Text components | All screens | 1h |
| 9 | Add profile edit photo upload or stub "Coming Soon" | profile-edit.js | 1h |
| 10 | Add wallet top-up flow | wallet.js | 2h |

### P2 — Nice to have (polish sprint)

| # | Fix | Time |
|---|-----|------|
| 1 | Success animations on auth (checkmark scale, confetti) | 2h |
| 2 | Add accessibilityLabel to all interactive elements | 3h |
| 3 | Animate live pulse on Event Library (match Dashboard) | 1h |
| 4 | Add RadioButton empty circle on unselected event tickets | 1h |
| 5 | Add type scale constants (H1-Caption) to tokens.js | 1h |
| 6 | Add `<AppModal />` wrapper used by all modals | 2h |
| 7 | Image `onError` fallback on all event/community images | 2h |
| 8 | Standardize spacing to `theme.spacing.*` scale | 3h |
| 9 | Add wallet "locked" explanation tooltip | 1h |
| 10 | Add social proof ("X people going") on event detail | 1h |

---

## Testing Checklist (Before Launch)

- [ ] All text on lime (`#C8E630`) is dark (#1A1A14) — test both modes
- [ ] All buttons have minimum 44×44 touch target
- [ ] Forms show inline error when submitted empty
- [ ] All screens render on iPhone SE (375px wide)
- [ ] Dark mode toggle updates every element
- [ ] Screen reader (VoiceOver/TalkBack) can navigate all interactive elements
- [ ] Images fail gracefully (disconnect network, refresh)
- [ ] Wallet functions on insufficient balance
- [ ] Sold-out tickets cannot be selected
- [ ] App works on slow 3G (throttled in DevTools)
