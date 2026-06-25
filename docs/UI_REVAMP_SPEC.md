# UniHub Mobile — Complete UI/UX Revamp Specification
> Version 1.0 | June 2026 | Status: PRE-BUILD

---

## 0. Intent & Design Philosophy

UniHub is a social events platform for university students. Events are exciting, spontaneous, communal. The app should feel the same way — alive, warm, bold, and fun. The current UI is competent but anonymous. It could be any app. After this revamp, it should feel unmistakably like UniHub.

**The three emotional targets:**

| Feeling | How we get there |
|---------|-----------------|
| **Energetic** | Large expressive typography, strong contrast, motion that responds to touch |
| **Original** | An unexpected color system, organic shapes, editorial layout moments |
| **Premium-accessible** | Generous whitespace, consistent spacing, smooth animations — feels expensive without being cold |

**What the reference images teach us:**

- **RouteMind** — full-bleed photography as a first-class design material; minimal chrome lets content breathe; bold wordmark typography creates personality
- **TripGlide** — warm personalization ("Hello, Vanessa") makes users feel seen; horizontal category pills + stacked hero cards are the most scannable event layout possible; clean bottom sheet patterns for detail content
- **Interests screen** — multi-color selected states on pill grids create delight; the randomness feels playful, not chaotic
- **Wallet app** — organic blob/liquid shapes break the grid in the best way; an app that dares to do something unusual with a hero element is memorable
- **My Trips** — social proof ("10 your friends have been there") woven directly into cards; the orange/cream palette is warm and inviting, not sterile
- **UniLearn** — tight information hierarchy within cards; progress visualization that motivates; bold color blocks per category give quick scanability

**Core design decisions:**

1. **Typography does the heavy lifting.** Big, bold, expressive headers replace the current medium-weight everything.
2. **Cards have personality.** Not all cards are the same. Hero cards are full-bleed with gradient. Content cards have visible images. List rows are tight and efficient.
3. **Color means something.** Each section of the app has a tint identity. Events = lime. Community = violet. Wallet = amber. Library = coral. Profile = sky.
4. **Motion is purposeful.** Spring physics on all interactions. Cards scale on press. Modals slide with momentum. Nothing happens instantly.
5. **Whitespace is structure.** We stop fighting whitespace and start using it as a design element.

---

## 1. Typography System

### Font Stack (no changes to installed fonts)

```
Display:  SpaceGrotesk_800ExtraBold   — hero moments, page titles
Heading:  SpaceGrotesk_700Bold        — section titles, card headlines
Body:     PlusJakartaSans_500Medium   — default body copy
Strong:   PlusJakartaSans_700Bold     — labels, prices, emphasis
Fine:     PlusJakartaSans_400Regular  — captions, metadata
Brand:    Limelight_400Regular        — reserved for the UniHub wordmark only
```

### Type Scale (strict — no deviations)

| Token | Family | Size | Weight | Line Height | Use |
|-------|--------|------|--------|-------------|-----|
| `display` | SpaceGrotesk | 40px | 800 | 44px | Splash, onboarding hero text |
| `h1` | SpaceGrotesk | 32px | 800 | 38px | Page-level headings (Dashboard "Good morning") |
| `h2` | SpaceGrotesk | 26px | 700 | 32px | Section openers ("Upcoming Events") |
| `h3` | SpaceGrotesk | 20px | 700 | 26px | Card headlines, modal titles |
| `h4` | SpaceGrotesk | 17px | 700 | 22px | Sub-section labels, list group headers |
| `body` | PlusJakartaSans | 15px | 500 | 22px | Default body copy |
| `bodySmall` | PlusJakartaSans | 13px | 500 | 19px | Supporting text, descriptions |
| `label` | PlusJakartaSans | 12px | 700 | 16px | Pill labels, badges, tab text |
| `caption` | PlusJakartaSans | 11px | 400 | 15px | Timestamps, metadata, secondary info |
| `price` | SpaceGrotesk | 22px | 800 | 26px | Ticket prices, wallet balance inline |
| `balanceLarge` | SpaceGrotesk | 38px | 800 | 42px | Wallet hero balance |

**Rules:**
- Every `Text` component must specify `lineHeight`. No exceptions.
- Letter spacing: `-0.5` on `display`, `h1`, `h2`. `0` everywhere else.
- No mixing font families within a single text element.
- `letterSpacing: 0.8` on all-caps `label` tokens used as section dividers.

---

## 2. Color System

### Brand Identity

The lime (`#C8E630`) stays. It's unique and distinctive. But we build a richer system around it.

### New Token Architecture

```javascript
// theme/tokens.js — complete replacement

export const palette = {
  // Brand
  lime:       "#C8E630",   // primary brand
  limeDark:   "#A8C420",   // pressed/active state
  limeSoft:   "#D8F040",   // hover/highlight
  limeTint10: "rgba(200,230,48,0.10)",
  limeTint18: "rgba(200,230,48,0.18)",
  limeTint30: "rgba(200,230,48,0.30)",

  // Section identity accents
  violet:     "#7C3AED",   // community / social
  violetSoft: "#EDE9FE",   // light tint
  violetTint: "rgba(124,58,237,0.12)",

  coral:      "#F97316",   // event library / CTAs in warm contexts
  coralSoft:  "#FFF7ED",
  coralTint:  "rgba(249,115,22,0.12)",

  amber:      "#F59E0B",   // wallet / transactions
  amberSoft:  "#FFFBEB",
  amberTint:  "rgba(245,158,11,0.12)",

  sky:        "#0EA5E9",   // profile / informational
  skySoft:    "#F0F9FF",
  skyTint:    "rgba(14,165,233,0.12)",

  // Semantic
  success:    "#22C55E",
  successTint:"rgba(34,197,94,0.12)",
  warning:    "#F59E0B",
  error:      "#EF4444",
  errorTint:  "rgba(239,68,68,0.12)",

  // Neutral
  ink:        "#0F0F0D",   // deepest dark (replaces 1A1A14 as pure bg)
  ink90:      "#1A1A14",
  ink80:      "#2A2A20",
  ink60:      "#4A4A38",
  ink40:      "#7A7A62",
  ink20:      "#B0AF98",
  ink10:      "#D8D7C4",
  paper:      "#F5F4EC",   // warm off-white (replaces E8E7D8)
  white:      "#FFFFFF",
};

export const themes = {
  light: {
    mode: "light",
    colors: {
      // Surfaces
      background:      palette.paper,
      backgroundAlt:   "#EDECDF",
      surface:         palette.white,
      surfaceMuted:    "#F2F1E8",
      surfaceElevated: "#FAFAF5",
      surfaceGlass:    "rgba(255,255,255,0.85)",

      // Borders
      border:          "rgba(0,0,0,0.07)",
      borderStrong:    "rgba(0,0,0,0.13)",
      borderBrand:     "rgba(200,230,48,0.40)",

      // Text
      text:            palette.ink90,
      textMuted:       palette.ink60,
      textSubtle:      palette.ink40,
      textOnBrand:     palette.ink90,    // dark text on lime
      textOnDark:      "#F5F4EC",        // light text on dark surfaces
      textOnAccent:    palette.white,    // white text on colored accents

      // Brand
      brand:           palette.lime,
      brandStrong:     palette.limeDark,
      brandSoft:       palette.limeSoft,
      brandTint:       palette.limeTint18,

      // Section accents
      accentCommunity: palette.violet,
      accentLibrary:   palette.coral,
      accentWallet:    palette.amber,
      accentProfile:   palette.sky,

      // Semantic
      success:         palette.success,
      successTint:     palette.successTint,
      warning:         palette.warning,
      error:           palette.error,
      errorTint:       palette.errorTint,

      // Navigation
      navSurface:      palette.ink90,
      navActive:       palette.lime,
      navText:         "rgba(245,244,236,0.50)",
      navTextActive:   palette.ink90,

      // Shadows
      shadow:          "rgba(0,0,0,0.06)",
      shadowMedium:    "rgba(0,0,0,0.10)",
      shadowStrong:    "rgba(0,0,0,0.16)",
      overlay:         "rgba(15,15,13,0.52)",
    },
  },
  dark: {
    mode: "dark",
    colors: {
      // Surfaces
      background:      palette.ink,
      backgroundAlt:   palette.ink90,
      surface:         "#1C1C18",
      surfaceMuted:    "#242420",
      surfaceElevated: "#2C2C26",
      surfaceGlass:    "rgba(28,28,24,0.85)",

      // Borders
      border:          "rgba(255,255,255,0.07)",
      borderStrong:    "rgba(255,255,255,0.12)",
      borderBrand:     "rgba(200,230,48,0.25)",

      // Text
      text:            "#F5F4EC",
      textMuted:       palette.ink20,
      textSubtle:      palette.ink40,
      textOnBrand:     palette.ink90,
      textOnDark:      "#F5F4EC",
      textOnAccent:    palette.white,

      // Brand
      brand:           palette.lime,
      brandStrong:     palette.limeDark,
      brandSoft:       palette.limeSoft,
      brandTint:       palette.limeTint10,

      // Section accents
      accentCommunity: "#A78BFA",   // lighter violet for dark mode
      accentLibrary:   "#FB923C",
      accentWallet:    "#FBD24A",
      accentProfile:   "#38BDF8",

      // Semantic
      success:         "#4ADE80",
      successTint:     "rgba(74,222,128,0.12)",
      warning:         "#FBD24A",
      error:           "#F87171",
      errorTint:       "rgba(248,113,113,0.12)",

      // Navigation
      navSurface:      "#0C0C0A",
      navActive:       palette.lime,
      navText:         "rgba(255,255,255,0.40)",
      navTextActive:   palette.ink90,

      // Shadows
      shadow:          "rgba(0,0,0,0.30)",
      shadowMedium:    "rgba(0,0,0,0.44)",
      shadowStrong:    "rgba(0,0,0,0.60)",
      overlay:         "rgba(8,8,6,0.75)",
    },
  },
};
```

### Section Color Identity Rules

Each major section of the app has a tint identity applied to:
- Section heading accent line / underline
- Active category pill background
- Section icon container background
- Skeleton shimmer tint

| Section | Accent Token | Where used |
|---------|-------------|------------|
| Dashboard / Events | `brand` (lime) | Active pills, hero card accent, CTA buttons |
| Community | `accentCommunity` (violet) | Community card borders, join buttons, chat bubbles |
| Event Library | `accentLibrary` (coral) | Ticket badges, filter pills, past event overlays |
| Wallet | `accentWallet` (amber) | Balance card, transaction icons, payout badges |
| Profile | `accentProfile` (sky) | Avatar ring, stat values, interest pills |

---

## 3. Spacing System

Replace all hardcoded margins with tokens:

```javascript
export const spacing = {
  xs:   4,
  sm:   8,
  md:  12,
  lg:  16,
  xl:  20,
  xxl: 28,
  xxxl:40,
  page: 18,   // horizontal screen padding
  section: 32, // vertical gap between major sections
};
```

**Rules:**
- `paddingHorizontal: spacing.page` (18) on all screen ScrollViews
- `gap: spacing.xxl` (28) between major sections
- `gap: spacing.lg` (16) between cards in a list
- `gap: spacing.md` (12) between elements within a card
- `gap: spacing.sm` (8) between label and value pairs

---

## 4. Shape Language

### Border Radius Scale

```javascript
export const radius = {
  xs:   6,    // tags, small badges
  sm:  10,    // input fields, small buttons
  md:  16,    // list row items, small cards
  lg:  20,    // standard cards, modals
  xl:  28,    // hero cards, large modals
  xxl: 36,    // pill buttons, bottom nav
  full: 9999, // circular avatars, round badges
};
```

### Shape Philosophy

- **All buttons are fully pill-shaped** (`radius.xxl`). No more rectangular buttons with `radius.md`.
- **Cards use `radius.xl` (28)** for the main content card, `radius.md` (16) for nested inner cards.
- **Bottom nav is pill-shaped** (`radius.xxl`), floating above the safe area.
- **Modals** use `radius.xl` (28) on the top corners only (`borderTopLeftRadius`, `borderTopRightRadius`) for bottom sheets. Full `radius.xl` for center modals.
- **Avatar containers** are always `radius.full`.
- **Category/filter pills** use `radius.xxl` for the pill shape.

### Organic Accent Elements

Inspired by the wallet blob and UniLearn's splat shapes, select screens get organic background accents:

- **Wallet balance card** — lime/amber gradient with a subtle curved top mask (SVG path or masked View)
- **Dashboard greeting area** — faint lime blob behind the avatar/greeting (using `borderRadius` asymmetry or SVG)
- **Onboarding screens** — large organic shape as background element (already done, keep)
- These are `position: 'absolute'` decorations, never obscuring interactive content

---

## 5. Elevation & Shadow System

```javascript
export const elevation = {
  // Use these consistently per component type
  flat:    { shadowOpacity: 0, elevation: 0 },
  card:    { shadowOffset: {w:0,h:4},  shadowOpacity: 0.07, shadowRadius: 16, elevation: 4 },
  modal:   { shadowOffset: {w:0,h:8},  shadowOpacity: 0.14, shadowRadius: 28, elevation: 10 },
  nav:     { shadowOffset: {w:0,h:8},  shadowOpacity: 0.20, shadowRadius: 24, elevation: 12 },
  button:  { shadowOffset: {w:0,h:4},  shadowOpacity: 0.18, shadowRadius: 12, elevation: 5 },
};
```

Cards in light mode: warm beige shadow (`rgba(0,0,0,0.06)`).
Cards in dark mode: deeper shadow (`rgba(0,0,0,0.32)`).
CTA buttons: brand-colored shadow on primary buttons (`rgba(200,230,48,0.30)` in light, `rgba(200,230,48,0.20)` in dark).

---

## 6. Navigation Redesign

### Bottom Navigation (`UserBottomNav`)

**Current:** Dark pill with icon-only items, active state = lime background box.

**New design:**

```
┌─────────────────────────────────────────────┐
│   [⌂]    [◎]    [☷]    [◈]                 │  ← floating pill, 72px tall
│  Home  Discover Library  Wallet              │  ← labels below icons
└─────────────────────────────────────────────┘
```

Changes:
- Add **text labels** below each icon (12px, PlusJakartaSans_600SemiBold)
- Active item: **icon + label both turn lime**, no background box — the label itself anchors the state
- Inactive: icon and label at 40% opacity
- Add **spring-bounce scale animation** on press (0.85 → 1.0, spring damping 12)
- Pill has a very subtle top border: `borderTopWidth: 0.5, borderTopColor: "rgba(255,255,255,0.08)"`
- Bottom nav floats with `marginHorizontal: 16, marginBottom: 8`, rounded fully (`borderRadius: 32`)
- Height: 64px content + safe area bottom
- Icon size: 24px (up from 22)

### Top Navigation (`UserNavBar`)

**Current:** Logo left, bell + avatar right in a horizontal bar.

**New design:**

Screen-specific top bars replace the universal `UserNavBar`:

| Screen | Top bar pattern |
|--------|----------------|
| Dashboard | Avatar (left) + "UniHub" wordmark (center) + Bell (right) |
| Community | "Community" h2 heading (left) + Search icon (right) |
| Event Library | "Library" h2 heading (left) + Filter icon (right) |
| Wallet | "Wallet" h2 heading (left) + (nothing right) |
| Profile | Back arrow or avatar (left) + username (center) + Settings gear (right) |

All top bars: `paddingHorizontal: 18`, `paddingTop: insets.top + 8`, `paddingBottom: 12`, `backgroundColor: theme.colors.background`.

---

## 7. Core Component Redesigns

### 7.1 PrimaryButton

**Philosophy from references:** Pill-shaped, full-width for page-level CTAs, inline for card CTAs. Brand CTA uses lime+dark text. Secondary uses surface+border. Destructive uses error red.

```javascript
// New button spec
variants = {
  primary:     { bg: lime,           text: ink90,  border: none,   shadow: limeShadow },
  secondary:   { bg: surface,        text: text,   border: border, shadow: none       },
  ghost:       { bg: transparent,    text: text,   border: border, shadow: none       },
  accent:      { bg: accentColor,    text: white,  border: none,   shadow: accentShadow },
  destructive: { bg: error,          text: white,  border: none,   shadow: none       },
}

// Size scale
sizes = {
  sm:  { height: 40, px: 16, fontSize: 13, radius: 20 },
  md:  { height: 50, px: 20, fontSize: 15, radius: 25 },   // default
  lg:  { height: 58, px: 24, fontSize: 16, radius: 29 },   // page CTA
}
```

- Remove `borderRadius: 16`. All buttons are `radius.xxl` (fully pill-shaped).
- Press animation: `scale: 0.96` spring, `duration: 100ms`.
- Loading state: spinner replaces label, button stays same width (no layout shift).
- Add `size` prop. Default `md`. Page CTAs use `lg`.

### 7.2 TextField

**Current:** Functional but visually weak — no focus ring, no label animation.

**New spec:**

```
Label (floating, 11px caption)
┌─────────────────────────────────────┐
│  Input text                   [icon]│   ← 52px height, radius.md (16)
└─────────────────────────────────────┘
  Helper / error text (12px, below)
```

States:
- **Default:** `border: theme.colors.border`, label above in caption style
- **Focused:** `border: theme.colors.brand (2px)`, label in lime color
- **Error:** `border: theme.colors.error (2px)`, helper text in red, error icon right
- **Success:** `border: theme.colors.success (2px)`, checkmark icon right
- **Disabled:** `opacity: 0.5`, `pointerEvents: none`

Animation: border color transition 150ms. No floating label animation (adds complexity for minimal gain — static labels above are cleaner).

### 7.3 EventCard (Hero)

The main event card used on Dashboard. Full redesign.

```
┌─────────────────────────────────────────────┐
│  [Full-bleed image, 200px tall]             │
│  ┌─────────────────────────────────────┐    │
│  │ "LIVE" pill (red pulse) (optional)  │    │
│  │                        [♥ heart]    │    │
│  └─────────────────────────────────────┘    │
│─────────────────────────────────────────────│
│  [Category badge]              [Price]      │
│  Event Title (h3)                           │
│  📍 Location  ·  📅 Date (caption)         │
│  [Avatar stack]  X attending  →  [Register]│
└─────────────────────────────────────────────┘
```

Changes:
- `borderRadius: radius.xl` (28) on entire card
- Image height: 200px. Image uses `resizeMode: cover`, `borderTopRadius: 28`
- Gradient overlay on image bottom 40%: `linear-gradient(transparent → rgba(0,0,0,0.7))`
- Category badge: small pill, `accentLibrary` background, white text 11px bold
- Price: right-aligned, `h4` size, lime color in dark mode, `ink90` in light
- Heart button: 36×36 pressable, top-right of image, `rgba(0,0,0,0.35)` circular bg
- Attending avatars: 3 stacked 24px circles, "-8px" horizontal offset, "+X more" text
- Register button: inline, right-aligned, `size: sm`, `variant: primary`
- Shadow: `elevation.card`

### 7.4 EventCard (Row / List)

Used in Event Library and search results.

```
┌──────────────────────────────────────────────┐
│ [Image 72×72  │  Title (h4)                  │
│  radius.md]   │  📍 Venue  ·  Date (caption) │
│               │  [Category pill]   [$Price]  │
└──────────────────────────────────────────────┘
```

- Height: ~90px
- Image: 72×72, `radius.md`, `resizeMode: cover`
- No shadow on rows — rely on `border: theme.colors.border` for separation
- Press state: `backgroundColor: theme.colors.surfaceMuted` (no scale on rows, just bg change)

### 7.5 CommunityCard

```
┌─────────────────────────────────────────────┐
│  [Banner image, 120px, full width]          │
│  ┌─────────────────────────────────┐        │
│  │ [Private 🔒] badge (top-left)   │        │
│  └─────────────────────────────────┘        │
│─────────────────────────────────────────────│
│  [Community emoji 40px]                     │
│  Community Name (h3)                        │
│  Members count  ·  [Joined ✓ / Join +]      │
│  Brief description (caption, 2 lines max)   │
└─────────────────────────────────────────────┘
```

- Banner: 120px height, `borderTopRadius: 28`
- Emoji sits in a 48×48 circle, `backgroundColor: surface`, positioned `-24px` from banner bottom (overlapping)
- "Joined" button: outline style (`variant: ghost`), `size: sm`
- "Join" button: `variant: primary`, `size: sm`
- Card border: `1px violet tint` for community cards specifically (`borderColor: violetTint`)

### 7.6 TicketCard

```
┌─────────────────────────────────────────────────┐
│  [Ticket stub left edge — 4px lime strip]        │
│  Event Title (h3)                               │
│  Date  ·  Time  ·  Venue  (caption row)         │
│─────────────── dashed line ──────────────────── │
│  Ticket type (bodySmall)    QR placeholder (32) │
│  [Status badge: Confirmed / Pending / Cancelled]│
└─────────────────────────────────────────────────┘
```

- Left edge: 4px wide lime strip (`borderLeftWidth: 4, borderLeftColor: lime`) — signature element
- Dashed separator: dashed `borderStyle` or emulated with repeated dots
- Status badge: pill, color matches status (success/warning/error)
- Background: `surface` with subtle lime tint on confirmed: `brandTint`

### 7.7 NeuCard (Base Card)

Replace current implementation:

```javascript
// variants
base:     { radius: 20, border: 1, shadow: elevation.card }
elevated: { radius: 24, border: 1, shadow: elevation.modal, bg: surfaceElevated }
flat:     { radius: 20, border: 1, shadow: none }
pill:     { radius: 999, border: 1, shadow: none, px: 16, py: 10 }
```

### 7.8 ModalShell / Bottom Sheet

**Current:** Basic modal wrapper.

**New spec:**

All modals use bottom sheet pattern (slides up from bottom) unless they are confirmation dialogs (which center):

```
// Bottom sheet
- borderTopLeftRadius: 28, borderTopRightRadius: 28
- Drag handle: 4×40px, backgroundColor: border, centered, margin 12 from top
- backgroundColor: surface
- paddingHorizontal: 18
- paddingTop: 8 (after drag handle)
- paddingBottom: insets.bottom + 24
- Backdrop: rgba(0,0,0,0.52), dismissable on tap
- Entry animation: translateY from 100% → 0, spring(damping: 24, stiffness: 300)
- Exit animation: translateY to 100%, timing 200ms

// Center modal (confirmations only)
- width: screenWidth - 48
- borderRadius: 28
- backgroundColor: surface
- padding: 24
- Entry animation: scale 0.92 → 1.0 + fade, spring(damping: 18)
```

### 7.9 BadgeRow / Category Pills

The horizontal scrolling filter system used everywhere:

```
[ All ]  [ Upcoming ]  [ Free ]  [ Near Me ]  [ Today ]
```

- Pills: `height: 36`, `paddingHorizontal: 14`, `radius.xxl`
- Default: `backgroundColor: surfaceMuted`, `color: textMuted`
- Active: `backgroundColor: brand`, `color: textOnBrand` (for Events/Dashboard)
- Active (Community): `backgroundColor: accentCommunity`, `color: white`
- Active (Library): `backgroundColor: accentLibrary`, `color: white`
- Font: `label` token (12px, 700 weight)
- ScrollView: `horizontal`, `showsHorizontalScrollIndicator: false`, `contentPadding: {left: 18}`
- Padding between pills: `gap: 8`

### 7.10 SkeletonLoader

Use animated shimmer (opacity pulse 0.3→0.7→0.3, 1.2s loop):

```
SkeletonRow:  width: 100%, height: 88px, radius.lg, surfaceMuted bg
SkeletonCard: width: 100%, height: 240px, radius.xl, surfaceMuted bg  
SkeletonPill: width: 80px, height: 36px, radius.xxl, surfaceMuted bg
SkeletonText: width: varies (70%/50%/30%), height: 14px, radius.xs, surfaceMuted bg
```

### 7.11 EmptyState

One shared component:

```
[Large emoji, 48px]
Title (h3, centered)
Subtitle (bodySmall, centered, textMuted, max 2 lines)
[PrimaryButton, size: md, not fullWidth, minWidth: 180]  ← optional
```

- Container: `paddingVertical: 40`, centered
- Emoji sits in a 72×72 `surfaceMuted` circle with `radius.full`
- Space between emoji and title: 16px
- Space between title and subtitle: 8px
- Space between subtitle and button: 24px

### 7.12 Toast

**Current:** basic toast component exists.

**New spec:**
- Position: bottom of screen, `bottom: 80 + safeArea` (above bottom nav)
- Slides in from bottom (translateY: 40 → 0), spring
- Auto-dismisses after 3.5s
- Width: `screenWidth - 36`, centered
- Height: 52px, `radius.xxl`
- Has icon left (CheckCircle, AlertCircle, Info), message, optional action button right
- Types: `success` (green bg), `error` (red bg), `info` (dark bg), `warning` (amber bg)
- Text: `label` token, white

---

## 8. Screen-by-Screen Specs

---

### 8.1 Dashboard (`app/(app)/dashboard.js`)

**Layout hierarchy:**

```
[Top Bar: Avatar | UniHub wordmark | Bell]
─────────────────────────────────────────
[Greeting: "Good morning, [Name] 👋" h1]
[Subtitle: "4 events happening this week" caption lime]
─────────────────────────────────────────
[Category Pills: All · Music · Tech · Sports · Free · Today]
─────────────────────────────────────────
[FEATURED HERO CARD — full width, 280px total height]
  Image 200px + content area below
  "For You" badge top-left on image
  Heart top-right
  Event name, location, date, price, register CTA
─────────────────────────────────────────
["Happening Now" section]
  Section header: "🔴 Live Now" in h4 with pulsing red dot
  Horizontal scroll of EventCard (compact, 220px wide each)
─────────────────────────────────────────
["This Weekend" section]
  Section header row with "See all →" right link
  Vertical list of EventCard (Row style)
─────────────────────────────────────────
["Free Events" section (if available)]
  Section header
  Horizontal scroll of small EventCard
─────────────────────────────────────────
[Bottom Nav]
```

**Key changes:**
- Greeting uses user's first name only (split on space), `h1` size
- "X events this week" stat is a dynamic subtitle, in lime color
- Remove the top `UserNavBar` component — embed the top bar directly in Dashboard
- Hero card gets the first upcoming non-live event with highest relevance score
- "Happening Now" section only renders if there are live events
- Each section gap: `spacing.section` (32px)
- Skeleton: show 1 `SkeletonCard` (hero) + 3 `SkeletonRow` (weekend list) while loading

---

### 8.2 Event Library (`app/(app)/event-library.js`)

**Layout hierarchy:**

```
[Header: "Library" h1 + filter icon]
─────────────────────────────────────────
[Search bar — full width, 52px, radius.xxl, surfaceMuted bg]
  🔍 icon left, clear X right (44×44 hit area)
─────────────────────────────────────────
[Tab bar: Upcoming | My Tickets | Past]
  Underline style, lime underline on active, 15px 700
─────────────────────────────────────────
[Category filter pills (horizontal scroll)]
  Changes based on active tab
─────────────────────────────────────────
[Content — per tab:]

UPCOMING: Vertical list of EventCard (Row)
MY TICKETS: Vertical list of TicketCard
PAST: Vertical list of compact past card
        (Image left, "Past" badge, "View Ticket" + review option)
─────────────────────────────────────────
[Bottom Nav]
```

**Key changes:**
- Search bar replaces header-inline search — full-width, prominently placed
- Tab underline uses `accentLibrary` (coral) not lime, since Library section identity is coral
- Filter modal (FilterModal component) opens from the filter icon — slide-up bottom sheet
- Empty state per tab: unique emoji + message + CTA
- "My Tickets" tab shows ticket count badge on the tab label itself

---

### 8.3 Community (`app/(app)/community.js`)

**Layout hierarchy:**

```
[Header: "Community" h1 + search icon + compose icon]
─────────────────────────────────────────
[My Communities horizontal scroll]
  "Your spaces" h4 + "Browse all →" right link
  Small community bubbles: 56×56 circle avatars
  + Add/create "+" bubble at end
─────────────────────────────────────────
[Discover Communities section]
  "Discover" h2
  [Category filter pills]
  Vertical list of CommunityCard
─────────────────────────────────────────
[+ FAB: Create Community button]
  Position: absolute bottom-right, 56×56, lime bg
  Plus icon, dark color
  Springs up above bottom nav
─────────────────────────────────────────
[Bottom Nav]
```

**Key changes:**
- "My communities" are shown as horizontal bubbles (like Instagram stories), not a second card list
- FAB (floating action button) replaces the in-list "create" item — cleaner hierarchy
- Community cards use `accentCommunity` (violet) border tint
- Create Community modal: multi-step bottom sheet, all inputs use `<TextField />`
- Step indicator: 3 dots (or 1-2-3 numbered pills) at top of modal
- Step 1: Name + description (`<TextField />` × 2)
- Step 2: Icon/emoji selection grid (with visible border on unselected, lime border on selected)
- Step 3: Privacy settings (Private/Public toggle) + optional private code (`<TextField />`)

---

### 8.4 Notifications (`app/(app)/notifications/index.js`)

**Layout hierarchy:**

```
[Header: "Notifications" h1 + "Mark all read" text button (lime)]
─────────────────────────────────────────
[Filter pills: All · Events · Community · Payments · System]
─────────────────────────────────────────
["NEW" section header (only if unread exist)]
[Notification cards...]
─────────────────────────────────────────
["EARLIER" section header]
[Notification cards...]
─────────────────────────────────────────
```

**Notification Card redesign:**

```
┌────────────────────────────────────────────────┐
│ [Type icon circle 40×40] │ Title (h4)          │
│   (accent colored bg)    │ Preview (bodySmall) │
│                          │ Time (caption right)│
│─────────────────────────────────────────────── │
│ [Action buttons: "View Event" | "RSVP"]        │  ← only on unread
└────────────────────────────────────────────────┘
```

- Unread: left border stripe `4px wide, accentColor`, `backgroundColor: brandTint`
- Read: no border stripe, `backgroundColor: surface`
- Swipe left to dismiss (react-native-gesture-handler swipeable)
- Type icon background: each type has its own accent tint circle

---

### 8.5 Notification Detail (`app/(app)/notifications/[id].js`)

No major layout changes needed. Apply updated typography scale, pill buttons, and ensure all `Text` components have `lineHeight`.

---

### 8.6 Past Events (`app/(app)/past-events.js`)

Merge into Event Library "Past" tab. Keep the standalone screen but make it accessible from Library tab.

**Card redesign:**

```
┌─────────────────────────────────────────────┐
│ [Image 80×80, radius.md]                    │
│   "Past" badge overlaid (top-left)          │
│ Event title (h4)                            │
│ Date attended (caption)                     │
│ ★ Write a review  |  View Ticket  |  ✕     │
└─────────────────────────────────────────────┘
```

- "View Ticket" → `<PrimaryButton size="sm" variant="ghost" />`
- "Write a review" → `<PrimaryButton size="sm" variant="ghost" icon={<Star />} />`
- Remove button: plain `<Pressable>` with X icon, `hitSlop: 12`
- Cancel state: button shows `<ActivityIndicator />` only, label hidden

---

### 8.7 Profile (`app/(app)/profile.js`)

**Layout hierarchy:**

```
[Top bar: back arrow | username (center) | settings gear]
─────────────────────────────────────────
[Hero area — gradient bg strip, 180px]
  [Avatar 96×96, circular, 3px brand ring]
  [Edit photo icon — lime circle, 28×28, bottom-right of avatar]
  Name (h2)
  @username (bodySmall, textMuted)
  University badge (caption pill)
─────────────────────────────────────────
[Stats row: Events Attended · Hosted · Following · Followers]
  Each stat: number (h3, brand color) + label (caption)
  Vertical dividers between stats
─────────────────────────────────────────
[Interest pills — wrapping horizontal]
  Each pill: `accentProfile` tint bg, sky text
─────────────────────────────────────────
[Tab bar: Events · Hosted · Community]
  Underline style, sky underline
─────────────────────────────────────────
[Tab content — vertical list]
─────────────────────────────────────────
```

**Key changes:**
- Gradient strip behind avatar: lime→transparent (top of screen), only 180px, fades into background
- Avatar ring: 3px `brand` color ring, 2px gap between ring and avatar
- Stats dividers: real 1px height Views with `backgroundColor: border`
- Following/Followers: functional (route to user list), or hidden if no data
- Profile completeness banner: if profile < 80% complete, show a lime banner card "Complete your profile → +3 items"

---

### 8.8 Settings (`app/(app)/settings.js`)

**Layout:**

```
[Header: "Settings" h1]
─────────────────────────────────────────
[Profile card — tappable, goes to profile-edit]
  [Avatar 56px] | Name + email | Edit icon (lime)
─────────────────────────────────────────
[Section: "Account"]
  Notification Settings → 
  Privacy Settings →
  Change Password →
─────────────────────────────────────────
[Section: "Preferences"]
  Theme (Light / Dark / System) — inline toggle row
  App Language →
─────────────────────────────────────────
[Section: "Support"]
  Help & Support →
  Rate the App →
  Share App →
─────────────────────────────────────────
[Section: "Legal"]
  Terms of Service →
  Privacy Policy →
  App Version (static, no arrow)
─────────────────────────────────────────
[Danger zone]
  Delete Account (red text, no icon container)
─────────────────────────────────────────
[Logout button — full width, variant: destructive]
```

**SettingsItem component redesign:**

```
┌─────────────────────────────────────────────────┐
│ [Icon 40×40 circle, accent tint bg] │ Label  >  │
└─────────────────────────────────────────────────┘
```

- Icon circle: `radius.full`, `backgroundColor: accentTint`, icon in `accentColor`
- Purple/indigo for security → use `accentCommunity` tint (violet, already in tokens now)
- All items: `height: 60px`, `paddingHorizontal: 16`, `radius.md`
- Separator: none between items in same section — use `gap: 2` between rows
- Section headers: `h4` size, `textMuted`, `paddingHorizontal: 18`, `paddingTop: 20, paddingBottom: 8`

---

### 8.9 Wallet (`app/(app)/wallet.js`)

**This screen gets the most dramatic redesign. Inspired by the wallet reference images.**

**Layout hierarchy:**

```
[Header: "Wallet" h1 + history icon right]
─────────────────────────────────────────
[BALANCE HERO CARD — full width, 200px]
  Dark background (#1C1C18 always, regardless of theme)
  Organic curved top-right shape in amber/lime gradient (decorative)
  "Available Balance" caption (textMuted on dark)
  Balance: $3,200.00 (balanceLarge token — 38px SpaceGrotesk 800, white)
  Underneath: "Locked: $X · Earned: $X" row (caption, textMuted)
─────────────────────────────────────────
[Action row — 4 buttons below the card]
  [↓ Add]  [↑ Withdraw]  [→ Transfer]  [📋 History]
  Each: 64×64 circle, surfaceMuted bg, icon + label below
─────────────────────────────────────────
[Transactions section]
  "Recent Transactions" h2 + "See all →"
  Filter pills: All · Income · Payout · Ticket
  List of transaction rows:
    [App icon 40px circle] │ Name · Date │ Amount (right, red or green)
─────────────────────────────────────────
[Bottom Nav]
```

**Balance card details:**
- Always dark (`#1C1C18`) — doesn't change with theme. This creates visual anchoring.
- Curved decorative shape: a `View` with `borderBottomLeftRadius: 120` positioned absolute top-right, `backgroundColor: amberTint`, width ~200, height ~160
- Border: none. Shadow only.
- `borderRadius: radius.xl` (28)

**Action buttons:**
- Replace flat horizontal strip with a 2×2 grid or 4-column row
- Each action: icon circle (56×56, `accentWallet` tint) + label (caption, below)
- Grid layout allows for future expansion

**Transaction rows:**
- Amount: green for credits (`+$X`), red for debits (`-$X`)
- App/merchant icon: 40×40 circle, fallback to first letter
- Swipe right on row to mark as reviewed (optional, adds delight)

---

### 8.10 Onboarding (`app/onboarding/`)

**Do not touch onboarding.** User instruction.

---

### 8.11 Event Detail (`app/event/[eventId].js`)

**Layout hierarchy:**

```
[Hero image — full width, 260px, no border radius on sides]
  Gradient: transparent → rgba(0,0,0,0.7) bottom 50%
  Back arrow (top-left, 40×40 circle, rgba(0,0,0,0.4) bg)
  Heart button (top-right, 40×40 circle, rgba(0,0,0,0.4) bg)
  Overlaid on image bottom:
    Category badge (top-left area of gradient)
    Price tag (top-right area of gradient)
─────────────────────────────────────────
[Content — scrollable below image]
  Event title (h1)
  Organizer row: [Avatar 32px] Hosted by Name (bodySmall)
  ─────────────
  [Quick stats row]
    📅 Date · ⏰ Time · 📍 Location · 🎟️ X tickets left
  ─────────────
  [Attending avatars + count + "Join them" CTA]
  ─────────────
  [About — collapsible, 3 lines default → "Read more"]
  ─────────────
  [Ticket Selection]
    "Select Ticket" h2
    [TicketCard per type — selectable, radio + unselected circle]
  ─────────────
[Sticky bottom bar — stays above keyboard & nav]
  Selected ticket info left | [Register CTA right]
  Height: 72px, surfaceElevated bg, top border, safe area padding
```

**Key changes from audit:**
- Free tickets: display "FREE" in lime instead of empty string
- Sold-out tickets: `pointerEvents: "none"`, opacity 0.4, "Sold Out" text replaces price
- Unselected ticket: empty `○` radio circle left of ticket name
- Selected ticket: filled `●` in lime + lime left border strip
- Hero image `onError`: fallback gradient View with event name text
- Back arrow: `hitSlop: { top: 8, bottom: 8, left: 8, right: 8 }` minimum

---

### 8.12 Event Payment (`app/event/[eventId]/payment.js`)

**Layout:**
- Full bottom sheet (slides up over event detail, not a separate route push)
- Countdown timer: prominent, bold, amber color, in a dark card
- Payment method: radio list with icon + label, active state = lime radio circle
- Insufficient balance: banner warning card with "Top Up Wallet →" CTA button (not just text)
- "Pay Now" CTA: `size: lg`, `variant: primary`, sticky at bottom

---

### 8.13 Event Registration (`app/event/[eventId]/registration.js`)

**Layout:**
- Step indicator at top if multi-step (pill steps: ① ② ③)
- All custom question fields use `<TextField />`
- Required field indicator: red asterisk after label
- Submit button: disabled until all required fields filled
- Success screen after submit: confetti animation (lottie or manual), ticket preview card, "View Ticket" and "Share" CTAs

---

### 8.14 Event Manage (`app/event/[eventId]/manage.js`)

**Tab bar redesign:**
- Tabs: Overview · Attendees · Check-In · Announce · Settings
- Underline tab style, lime underline
- "Check-In" tab: QR scanner button prominently placed, not hidden
- "Announce" tab: links to `app/event/[eventId]/announce.js`
- Bulk actions on Attendees: select multiple → "Approve All" / "Reject All" buttons appear in a bottom action bar

---

### 8.15 Community Detail / Chat (`app/users/community/[id].js`)

**Layout:**

```
[Header: Community name (h3) + emoji | Members count | Settings icon]
─────────────────────────────────────────
[Chat messages — FlashList, inverted]
  Outgoing: right-aligned, lime bubble, dark text
  Incoming: left-aligned, surfaceMuted bubble
  System messages: centered, caption, textSubtle
  OG link previews: card inside bubble, radius.md
  Emoji reactions: pill row below message
─────────────────────────────────────────
[Input row — sticky bottom]
  [Attach 📎] [TextField, grows] [Emoji 😊] [Send →]
  Above input: emoji picker bar (horizontal scroll)
  Media attach: opens ActionSheet with Camera / Gallery / File
─────────────────────────────────────────
```

**Key changes:**
- Message bubbles: `radius.xl` with one corner "pinned" (bottom-right for outgoing: `borderBottomRightRadius: 4`)
- Voice note: remove UI entirely until implemented — no stub buttons
- Link previews: always render if OG data available
- Image messages: full-width inside bubble, tappable to fullscreen lightbox
- Message pagination: load last 50 messages, load more on scroll-to-top

---

### 8.16 Profile Edit (`app/users/profile-edit.js`)

**Layout:**

```
[Header: "Edit Profile" h2 + Save button (lime text, right)]
─────────────────────────────────────────
[Avatar 96px + "Change Photo" tap overlay]
─────────────────────────────────────────
[Section: "Basic Info"]
  Full Name: <TextField />
  Username: <TextField /> + availability check indicator
  Bio: <TextField multiline rows={3} />
─────────────────────────────────────────
[Section: "Academic"]
  University: <TextField />
  Course / Major: <TextField />
  Year of Study: selector (pill group 1-6+)
─────────────────────────────────────────
[Section: "Interests"]
  Interest pills grid (same as onboarding/interests.js)
  Multi-color selected state
─────────────────────────────────────────
[Save button — sticky bottom, size: lg]
```

- Photo upload: opens ActionSheet (Camera / Gallery), real upload or "Coming Soon" stub clearly labeled
- Save: shows loading spinner, then success Toast "Profile updated ✓"
- Unsaved changes: warn on back navigation

---

### 8.17 Notification Settings (`app/users/notification-settings.js`)

- Each toggle: check device push permission status on mount → initialize `pushEnabled` from `Notifications.getPermissionsAsync()`
- Toggle rows: icon circle (matching notification type tint) + label + iOS-style Switch
- Save changes: auto-save on toggle (no explicit save button)

---

### 8.18 Privacy Settings (`app/users/privacy-settings.js`)

- Password modal: uses `<TextField secureTextEntry />` not raw `TextInput`
- Each section: clearly labeled, with helper text explaining what the setting does
- Blocked users: list with "Unblock" action, shown if any blocked users exist

---

### 8.19 Sign In (`app/(auth)/signin.js`)

No structural changes needed. Apply updated button (pill shape, size: lg) and typography scale. Add checkmark animation on successful login (scale + fade in `<CheckCircle />`).

---

### 8.20 Sign Up (`app/(auth)/signup.js`)

- After account creation → route to `app/onboarding/university.js` (already done, keep)
- Username availability: show spinner (`<ActivityIndicator size={14} />`) inside TextField right icon during debounce check
- Form step indicator: use numbered pill steps (①②③) at top of each step — already exists, verify it renders

---

## 9. Animation & Motion System

### Principles
1. **Spring over timing** for interactive elements (press, expand, appear)
2. **Timing for non-interactive** transitions (fade, color change)
3. **Nothing is instant.** Minimum 80ms, maximum 400ms for UI transitions.

### Spring Presets

```javascript
export const springs = {
  snappy: { damping: 20, stiffness: 400 },    // button press, toggle
  smooth: { damping: 22, stiffness: 280 },    // card press, scale
  bouncy: { damping: 14, stiffness: 260 },    // nav item, FAB
  gentle: { damping: 28, stiffness: 200 },    // modal entrance
};
```

### Animation Catalog

| Element | Animation | Config |
|---------|-----------|--------|
| Button press | scale: 1 → 0.96 → 1 | `springs.snappy` |
| Card press | scale: 1 → 0.98 → 1 | `springs.smooth` |
| Nav item tap | scale: 1 → 0.85 → 1 | `springs.bouncy` |
| Modal entrance | translateY: 100% → 0 | `springs.gentle` |
| Bottom sheet | translateY: 100% → 0 | `springs.gentle` |
| Toast entrance | translateY: 40 → 0 + opacity | `springs.smooth` |
| Screen transition | Expo Router default slide | — |
| Skeleton pulse | opacity: 0.3 → 0.7 → 0.3 | timing 1200ms loop |
| FAB appear | scale: 0 → 1 | `springs.bouncy` |
| Pill select | backgroundColor crossfade | timing 150ms |
| Error shake | translateX: 0→8→-8→4→-4→0 | timing 300ms |
| Like button | scale: 1→1.3→1 | `springs.bouncy` |
| Live pulse dot | scale: 1→1.5→1, opacity: 1→0→1 | timing 1500ms loop |

---

## 10. Accessibility Requirements

All P0 — must ship with these:

| Requirement | Implementation |
|-------------|---------------|
| All touch targets ≥ 44×44px | `hitSlop` on small elements; minimum `width/height: 44` on pressables |
| Text contrast WCAG AA | Verified against token pairs. See Color System section |
| `accessibilityLabel` on all icon-only buttons | "Notifications", "Search", "Favorite", "Share", etc. |
| `accessibilityRole` on all interactive elements | `button`, `link`, `checkbox`, `tab` |
| Screen reader order | Logical top-to-bottom DOM order — no absolute positioning that disrupts order |
| Error states announced | `accessibilityLiveRegion="polite"` on error Text components |
| Color is never the only signal | All error states include icon; all status badges include text |

---

## 11. Implementation Plan

### Phase 1 — Foundation (do this first, everything else depends on it)

1. **Update `theme/tokens.js`** — full replacement with new palette + spacing + radius exports
2. **Rebuild `PrimaryButton`** — pill shape, size scale, new variants
3. **Rebuild `NeuCard`** — new radius scale, flat/elevated/pill variants
4. **Rebuild `TextField`** — focus ring, error state, success state, helper text
5. **Rebuild `UserBottomNav`** — icon + label, spring animation, new sizing
6. **Create `EmptyState` component**
7. **Update `SkeletonLoader`** — new variants (row, card, pill, text)
8. **Update `Toast`** — new position, pill shape, types

### Phase 2 — Screens (top usage first)

Order: Dashboard → Event Detail → Event Library → Community → Wallet → Profile → Settings → Auth screens → Secondary screens

### Phase 3 — New Screens & Polish

Order: Profile Edit → Notification Settings → Privacy Settings → Announce → Manage → Community Detail polish

### Phase 4 — Animation Pass

Add all spring animations, live pulse, skeleton, toast, and modal motion after all screens are structurally correct.

---

## 12. What NOT to Change

- **Onboarding screens** — user instruction
- **Routing / navigation structure** — Expo Router file-based routes stay the same
- **API calls / data fetching** — this is a UI-only revamp
- **Auth logic** — keep existing session management
- **`lib/` utilities** — `auth.js`, `config.js`, `socket.js`, etc. untouched

---

## 13. Definition of Done

The revamp is complete when:

- [ ] All hardcoded colors replaced with theme tokens
- [ ] All `TextInput` replaced with `<TextField />`
- [ ] All inline `Pressable` CTAs replaced with `<PrimaryButton />`
- [ ] All buttons are pill-shaped (no rectangular buttons remain)
- [ ] All touch targets ≥ 44×44px
- [ ] Empty state component used on every screen that can have no content
- [ ] Skeleton loaders on all data-fetching screens
- [ ] Spring animations on all interactive elements
- [ ] Bottom nav has icon + label, springs, lime active state
- [ ] WCAG AA contrast passes on all text/background pairs
- [ ] Screenshots taken of every screen in both light and dark mode, verified against this spec
