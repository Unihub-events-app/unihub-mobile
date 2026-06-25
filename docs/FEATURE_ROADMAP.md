# UniHub Mobile — Feature Gap Analysis & Next Build Roadmap
> Generated: 2026-06-25 | Completeness: ~55–60% of a world-class university platform

---

## Executive Summary

UniHub has a solid foundation: event discovery, basic ticketing, community groups, wallet payments, and notifications are all present. However, the app is missing the features that turn a functional prototype into a platform people return to daily — **organizer tools, real-time community chat, advanced discovery, social engagement, and quality-of-life flows like waitlists, reminders, and reviews.**

**Feature completeness by category:**

| Category | Completeness | Critical Gaps |
|----------|-------------|---------------|
| Event Discovery | 40% | Filters, map view, recommendations, calendar |
| Event Detail | 45% | Reviews, social proof, waitlist UI, gallery |
| Event Creation | 55% | Templates, co-organizers, announcements |
| Organizer Tools | 25% | Analytics, check-in scanner, comms, promo codes |
| Ticketing & Payments | 50% | Refunds, transfers, top-up, promo codes |
| Community | 35% | Real-time chat, feed, media, roles, moderation |
| User Profile | 45% | Badges, completion score, functional follow lists |
| Wallet | 50% | Top-up, filter, refund tracking |
| Notifications | 60% | Email digest, DND, more trigger types |
| Discovery/Personalization | 30% | Algorithm, recommendations, search autocomplete |
| Social & Engagement | 20% | Feed, reactions, invitations, gamification |
| Onboarding | 30% | Interests wizard, university selection, photo setup |
| Settings & Account | 45% | Delete account, 2FA, help, connected apps |

**Top 10 gaps to close first:**
1. QR code check-in system (critical organizer tool)
2. Event waitlist UI (code exists, no UI)
3. Event reviews & ratings (social proof + quality signal)
4. Organizer analytics dashboard (revenue, attendance, conversion)
5. Wallet top-up / add funds flow
6. Advanced event discovery filters (date, price, distance, category)
7. Real-time community chat
8. Promotional / discount codes for events
9. Event reminders (push at 1h / 1d / 3d before)
10. Onboarding interests wizard (currently skipped entirely)

---

## What's Working Well

These features are solid and need only polish, not rework:

- **Auth flow** — signup/signin with validation, OTP, password strength
- **Event creation form** — 4-step wizard, ticket types, registration questions
- **Event library** — upcoming/past tabs, ticket view, live events section
- **Community discovery** — public + private code lookup, member count, search
- **Wallet basics** — balance display (available/locked/earned), bank management, withdrawal
- **Notification center** — 17 types, unread badges, mark-all-read, detail screen
- **Event management** — attendees tab, approve/reject pending registrations
- **Category browsing** — pills on dashboard, interest-based "For You" badge
- **Dark mode** — fully themed via `theme/tokens.js`
- **Push notifications** — Expo push tokens registered and sent

---

## Missing & Incomplete Features

---

### EVENTS: Discovery & Browsing

#### Missing

**Advanced Filters** | CRITICAL
- No date range picker (Today / This Week / This Month / Custom)
- No price range slider (Free / Paid / Under ₦X)
- No time-of-day filter (Morning / Afternoon / Evening / Night)
- No distance filter (On Campus / Near Me / City-wide)
- No capacity filter (Small <50 / Medium / Large >500)
- No sorting (Most Popular / Soonest / Price: Low-High / Newest)

**Map View** | HIGH
- "Near Me" filter exists but uses string matching (city/university in text), not real GPS
- No map showing event pins around the user
- No geofencing or radius-based discovery

**Save / Bookmark Events** | HIGH
- No wishlist or "interested" state on an event
- Users can't save events to come back to later
- No saved events tab in event library

**Event Recommendations** | HIGH
- Dashboard has "For You" tag but no real algorithm behind it
- No "Because you attended X" suggestions
- No "Popular in your university" section
- No recently-viewed history

**Calendar View** | MEDIUM
- No calendar interface for browsing events by date
- No monthly/weekly calendar grid

**Event Reminders (per event)** | HIGH
- No "Remind me" toggle on event detail
- No reminder timing options (1 hour / 1 day / 3 days before)
- Notifications exist but no user-configured reminders

**Trending Algorithm** | MEDIUM
- Trending section shows attendee count but is not ranked by velocity/recency
- No real trending signal (views, registrations per hour, social shares)

**Social Integration** | MEDIUM
- No native Share to Instagram / Twitter / WhatsApp from event detail
- Generic `Share.share()` only sends text — no rich card / OG image

**Search Autocomplete** | MEDIUM
- No suggestions while typing
- No recent search history
- Searches entire title only — no tag/description search

---

#### Incomplete

- **Near Me** — filter checks text fields, not device GPS coordinates
- **"For You"** — sorting based on interests array match, no ML or behavioral signal
- **Event search** — keyword only, no fuzzy match, no relevance ranking

---

### EVENTS: Detail & Experience

#### Missing

**Event Reviews & Ratings** | HIGH
- No way to rate or review an event after attending
- No aggregate star rating shown on event cards
- No organizer reply to reviews
- Social proof gap — users have no signal on event quality

**Event Gallery / Photos** | MEDIUM
- Only single cover image supported
- No photo album or post-event photo wall
- Organizers can't upload multiple images

**Attendee Social Proof** | MEDIUM
- No "X people are going" counter on detail page
- No avatars of friends attending (if following system works)
- Missing FOMO signal that drives registrations

**Waitlist UI** | HIGH
- Backend likely supports waitlists (capacity logic exists)
- No "Join Waitlist" button renders when event is at capacity
- No waitlist position indicator
- No auto-promotion notification when a spot opens

**Event FAQ** | LOW
- No FAQ section on event detail

**Venue Map** | MEDIUM
- Location is shown as text only
- No embedded map (Google Maps / Apple Maps deep link)
- No "Get Directions" button

**RSVP / Interest States** | LOW
- Only binary: registered or not
- No "Interested" soft state (RSVP without committing)

**Similar Events** | MEDIUM
- No recommendations section at bottom of event detail
- No "More from this organizer"

**Event Cancellation Notice** | HIGH
- No UI state for a cancelled event
- If organiser cancels, users see normal detail — no banner/alert

**Speaker / Host Profiles** | LOW
- No speaker section or host bio on event detail

---

#### Incomplete

- **Waitlist** — logic referenced in codebase, no UI exposed
- **Ticket "Free" label** — shows empty string instead of "Free"
- **Sold-out tickets** — still pressable (should be disabled)

---

### EVENTS: Creation & Management

#### Missing

**Event Templates / Duplicate** | MEDIUM
- Can't clone a previous event as a starting point
- Repeat events (weekly/monthly) require starting from scratch

**Co-organizers & Staff Roles** | HIGH
- Only one organizer per event
- Can't add a check-in staff member without giving them full organizer access
- No role: check-in scanner, manager, co-host

**Event Announcements** | HIGH
- Organizer can't send a message/announcement to all registered attendees
- No broadcast tool for "Venue changed" or "Doors open at 6pm" updates

**Bulk Registration Actions** | MEDIUM
- Can only approve / reject one registration at a time
- No "Approve All" or checkbox bulk select

**Attendance Export** | MEDIUM
- No CSV export of attendee list
- No export of registration form responses

**Refund Management (Organizer)** | HIGH
- Organizers can't issue refunds from the manage screen
- No manual refund button per attendee
- No bulk refund on event cancellation

**Promotional Codes / Discounts** | HIGH
- No discount code creation tool for organizers
- No early-bird pricing (first N tickets at lower price)
- No group discount (buy 5+ get 20% off)
- No promo code input at checkout

**Event Rescheduling** | MEDIUM
- No "Reschedule" option that updates date + notifies attendees
- Editing event date doesn't trigger attendee notification

**Feedback / Post-event Survey** | MEDIUM
- No tool to send post-event survey to attendees
- No way to collect NPS or feedback from within the app

**Activity Timeline** | LOW
- No audit log of event changes (who approved what, when)

**QR Code Generation** | CRITICAL
- No QR code generated for each ticket
- Check-in tab in manage screen exists but no QR scanner
- This is a fundamental organizer expectation

---

#### Incomplete

- **Check-in tab** — UI exists in manage screen, no QR scanning logic
- **Settings tab** — visible but minimal content
- **Revenue overview** — manage screen doesn't show total revenue collected

---

### ORGANIZER TOOLS

#### Missing

**Analytics Dashboard** | CRITICAL
- No overview of all events: total attendees, total revenue, conversion rate
- No per-event breakdown: views → registrations → attendance
- No revenue trend chart
- No traffic source attribution (how did people find the event?)

**Revenue Reports** | HIGH
- No financial summary (gross, fees, net payout)
- No payout history per event
- No reconciliation between Paystack charges and wallet credits

**Attendance Analytics** | HIGH
- No breakdown by ticket type
- No check-in rate (registered vs actually attended)
- No demographic data (university, year, etc.)

**Attendee Communication** | HIGH
- No in-app messaging to all attendees
- No email blast to registered users
- No push notification from organizer to attendees

**QR Check-in Scanner** | CRITICAL
- No camera-based QR scanner
- No real-time check-in status update
- No offline check-in fallback

**Conversion Funnel Tracking** | MEDIUM
- No visibility into: event page views → ticket page → registration → completion
- No abandonment tracking

**Discount Code Management** | HIGH
- No code creation UI
- No usage analytics per code
- No expiry or usage limit settings

**Organizer Profile Page** | MEDIUM
- No public organizer profile showing all their events
- No "Follow this organizer" functionality
- No organizer verification badge

---

### TICKETING & PAYMENTS

#### Missing

**Wallet Top-up / Add Funds** | CRITICAL
- Users have no way to add money to their wallet
- Paystack exists for event payment but no deposit flow
- Insufficient balance shows error with no action path

**Ticket Transfer** | HIGH
- Can't transfer a ticket to another user
- If a user can't attend, ticket is wasted
- No gifting or secondary transfer mechanism

**Ticket Refund (User-initiated)** | HIGH
- Cancel registration exists but no refund confirmation
- No indication of refund policy per event
- No tracking of refund status in wallet

**Promotional Code (User Side)** | HIGH
- No promo code input field at checkout
- No discount applied at payment step

**Bulk Ticket Purchase** | MEDIUM
- Can only buy one ticket per transaction
- Groups attending together can't buy all tickets at once

**Multiple Payment Methods** | MEDIUM
- Only wallet and Paystack card
- No bank transfer option
- No USSD payment (common for Nigerian market)

**Receipt / Invoice** | MEDIUM
- No ticket receipt emailed after purchase
- No downloadable invoice/PDF

**Payment Reconciliation** | MEDIUM
- Transaction history is basic
- No filter by event, type, date range
- No export to PDF/CSV

**Dynamic / Tiered Pricing** | LOW
- No early-bird pricing automation
- No price increase at capacity threshold

---

#### Incomplete

- **Paystack integration** — initialized but payment URL handling needs verification
- **Wallet payment** — works but no top-up makes it a dead end
- **Transaction history** — shows 10 items max, no pagination
- **Withdrawal states** — no clear pending / failed / completed UI per transaction

---

### COMMUNITY

#### Missing

**Real-time Chat** | CRITICAL
- Recent message preview exists on community cards
- No full in-app chat UI found
- No WebSocket / real-time infrastructure visible
- This is the core community engagement feature

**Community Feed / Posts** | HIGH
- No activity feed (posts, announcements, shared events)
- Text-only interaction assumed — no post creation

**Media Sharing in Chat** | HIGH
- No image/file attachment in messages
- Text only limits community engagement significantly

**Sub-communities / Channels** | MEDIUM
- Flat structure — one chat per community
- No topic channels (e.g. #announcements, #events, #general)

**Pinned Messages / Announcements** | MEDIUM
- No ability to pin a message at top of chat
- No announcement format separate from messages

**Moderation Tools** | HIGH
- No ability to mute a member
- No ability to remove/ban a member
- No message deletion by admin
- No report message functionality

**Member Directory** | MEDIUM
- Can see members but no searchable/filterable directory
- No role badges (Admin, Moderator, Member) visible

**Community Events** | MEDIUM
- No way to attach a hosted event to a community
- No "Events from this community" section

**Community Analytics (Admin)** | MEDIUM
- No member growth chart
- No activity metrics (messages/day, active members)
- No engagement rate

**Community Invite Links** | HIGH
- Private communities use manual code sharing
- No shareable invite link with expiry
- No link-based QR code for community

**Community Settings (Post-creation)** | MEDIUM
- Can't change community name/description/icon after creation
- Can't change private/public status after creation

**Roles & Permissions** | MEDIUM
- Only creator distinction currently
- No admin / moderator / member tiers
- No granular permission control

---

#### Incomplete

- **Voice note stub** — button exists, no recording
- **Community creation** — image upload is "coming soon"
- **Private community access** — works via code but no invite link

---

### USER PROFILE

#### Missing

**Profile Completeness Indicator** | MEDIUM
- No % complete progress bar
- No prompt to add missing info (bio, photo, university, interests)
- Empty profiles hurt trust and community engagement

**Achievement Badges** | MEDIUM
- No gamification system
- No badge for: first event hosted, 10 events attended, community founder, etc.
- No points or level system

**Functional Followers / Following** | HIGH
- "Followers" and "Following" tabs exist in profile
- Both show empty state with no data or action path
- Follow/unfollow buttons exist but UI doesn't update to show counts working

**User Verification Badge** | MEDIUM
- No verification for organizers or notable members
- No trust signal for new users choosing to register for an event

**User Blocking** | HIGH
- No ability to block another user
- Required for safety on any social platform

**User Reporting** | HIGH
- No report user button
- Required for App Store / Play Store compliance on social apps

**Activity Feed / Timeline** | LOW
- No chronological view of a user's activity (events attended, communities joined)

**OAuth / Social Login** | MEDIUM
- Email/password only
- No Google, Apple, or Facebook sign-in
- Apple Sign In is required for App Store apps with social auth

---

#### Incomplete

- **Follow system** — buttons render, follow API likely works, counts not updating visibly
- **Event history tabs** — Hosted, Attending, Past tabs exist, data load unverified

---

### WALLET & PAYMENTS (BROADER)

#### Missing

**Top-up / Add Funds** | CRITICAL
- No deposit flow — users can't add money to wallet
- Blocks the wallet-based payment model entirely for new users

**Refund Tracking** | HIGH
- Refunds may process on backend but no tracking in wallet UI
- Users don't know when refund arrives

**Low Balance Notification** | LOW
- No alert when wallet drops below a threshold
- Could trigger re-engagement

**Payment History Filters** | MEDIUM
- Can't filter by: event name, date range, type (credit/debit), amount range

**Tax / VAT Handling** | LOW
- No tax calculation on tickets
- No VAT receipt generation (relevant for corporate buyers)

**Multi-currency** | LOW
- NGN only — international events not supported

---

### NOTIFICATIONS

#### Missing

**Notification Preference Controls** | HIGH
- Link to notification-settings.js exists but may be a stub
- Must allow per-type toggle: Events, Community, Follows, Payouts, System

**Email Digest** | MEDIUM
- No daily/weekly summary email
- Heavy in-app users may miss events without email backup

**Do Not Disturb / Quiet Hours** | LOW
- No time window to suppress notifications

**Event Update Notifications** | HIGH
- No push when organizer reschedules or cancels an event
- Critical for attendee trust

**Waitlist Notification** | HIGH
- No notification when user is promoted from waitlist
- Needs to be a prominent alert

**Comment/Reply Notifications** | MEDIUM
- No notification when someone replies to user's community message

**Smart Grouping** | LOW
- All notifications are individual
- "5 people followed you" should group into one notification

---

#### Incomplete

- **Notification types** — 17 types defined but not all are triggered by real events
- **Push token management** — registered but no device management UI

---

### DISCOVERY & PERSONALIZATION

#### Missing

**Personalized Recommendations** | HIGH
- No algorithm using interests, history, or social graph
- "For You" is a simple interests array match, not behavioral

**Search Autocomplete / Suggestions** | MEDIUM
- No suggestions while typing
- No recent search history
- No trending search terms

**Search Ranking** | MEDIUM
- Search results in no clear order (no relevance scoring)
- Most popular events don't surface first

**Explore / Browse by University** | MEDIUM
- No "Events at my university" dedicated section
- Users at different universities get mixed feed

**Saved / Bookmarked Events** | HIGH
- No way to save an event to revisit

**New Events Section** | LOW
- No "Just Added" section for recently created events

---

### SOCIAL & ENGAGEMENT

#### Missing

**Comment System** | MEDIUM
- No comments on events
- No discussion thread on event detail page

**Event Reactions / Likes** | LOW
- No way to like or react to an event listing

**Native Social Sharing** | MEDIUM
- No rich share card to Instagram Stories, Twitter, WhatsApp
- Only generic text share via OS share sheet

**Event Invitations** | HIGH
- Can't invite a friend to an event within the app
- No "Invite Friends" button on event detail

**Activity / Social Feed** | HIGH
- No feed showing what people you follow are attending
- No "Your friend signed up for X event" updates

**Leaderboards / Gamification** | LOW
- No most active organizer ranking
- No most events attended this semester badge
- No points system

**Polls / Interactive Content** | LOW
- No polls in community chat
- No interactive content during live events

---

### ONBOARDING

#### Missing

**Interests Selection Wizard** | HIGH
- Signup goes directly to dashboard with no interests collected
- Users see generic feed with no personalization from day one
- Interests can be edited later but most users never will

**University & Department Selection** | HIGH
- No mandatory university selection in onboarding
- "Near Me" and "At My University" filters are useless without this

**Profile Photo Upload** | MEDIUM
- New users start with blank avatar
- No prompt to upload photo during onboarding

**Bio & Username Prompt** | LOW
- Username auto-generated from name but never reviewed by user
- No guided bio creation

**First Event Suggestion** | MEDIUM
- After onboarding, no curated "Your first event" prompt
- First-time users have no guided next step

---

### SETTINGS & ACCOUNT

#### Missing

**Delete Account** | CRITICAL
- Required by Apple App Store guidelines (5.1.1)
- Required by Google Play policies
- Missing = app rejection risk

**Apple Sign In** | CRITICAL
- If any OAuth is offered, Apple Sign In is mandatory on iOS
- Required by Apple guideline 4.8

**Two-Factor Authentication (2FA)** | HIGH
- No 2FA option for account security
- Important for organizers managing payments

**Help & Support** | HIGH
- No help articles or FAQ in-app
- No support chat or ticket system
- No "Contact Us" link

**Activity / Login Log** | MEDIUM
- No history of where/when account was accessed

**Connected Devices** | MEDIUM
- No list of devices with active sessions
- No "Sign out of all devices"

**Data Export** | MEDIUM
- No "Download your data" option
- Required by GDPR if serving EU users

**About & Legal** | MEDIUM
- No Terms of Service link
- No Privacy Policy link
- No app version display
- Required for app stores

**Language Selection** | LOW
- English only, no localization option

---

## Technical Debt Impacting Features

| Debt Item | Features Blocked | Priority |
|-----------|-----------------|----------|
| No real-time infrastructure (WebSocket/Pusher) | Community chat, live notifications, check-in updates | CRITICAL |
| No file upload system (S3 / CDN) | Community media, event galleries, profile photos | HIGH |
| Geolocation not integrated | Near Me filter, map view, distance sorting | HIGH |
| No QR library installed | Check-in scanning, ticket QR codes | HIGH |
| Basic search (keyword only) | Search autocomplete, relevance ranking, filters | HIGH |
| No analytics service (Amplitude/Firebase) | Feature usage tracking, funnel analysis, A/B tests | MEDIUM |
| No email service (SendGrid/Mailgun) | Event announcements, receipts, digest emails | HIGH |
| No caching layer | Performance, offline support, stale data | MEDIUM |
| No admin panel | Moderation, user management, content review | HIGH |
| Zustand only for auth (no global data store) | Complex cross-screen state, real-time sync | MEDIUM |

---

## Prioritized Feature Roadmap

---

### PHASE 1 — Core Completeness (Weeks 1–4)
> Make the existing features actually complete

**1.1 — Wallet Top-up** | CRITICAL | 3 days
- Paystack payment flow to deposit funds into wallet
- Deposit history tab in wallet screen
- Success notification + balance update
- Fixes the broken wallet payment model

**1.2 — Waitlist UI** | CRITICAL | 2 days
- Show "Join Waitlist" button when ticket capacity is full
- Waitlist position indicator ("You're #3 in line")
- Push notification when promoted from waitlist
- Backend logic likely exists — this is UI completion

**1.3 — QR Code Tickets + Check-in Scanner** | CRITICAL | 5 days
- Generate QR code per ticket (encode ticketId + userId)
- Display QR on ticket card and ticket detail screen
- Build check-in scanner screen using `expo-camera` + `expo-barcode-scanner`
- Real-time check-in status update in manage screen
- Offline fallback: manual code entry

**1.4 — Event Reviews & Ratings** | HIGH | 4 days
- Post-event review modal (auto-triggers 24h after event end)
- 1–5 star rating + optional text review
- Aggregate rating displayed on event cards and detail page
- Organizer can reply to reviews

**1.5 — Delete Account + Legal Settings** | CRITICAL | 2 days
- Delete Account option with confirmation + 30-day grace period
- Terms of Service + Privacy Policy links in Settings
- App Version display
- Required for App Store & Play Store compliance

**1.6 — Notification Preferences** | HIGH | 2 days
- Complete notification-settings.js screen
- Per-type toggles: Events, Community, Follows, Payouts, Announcements
- Push notification preference persisted in backend

---

### PHASE 2 — Discovery & Engagement (Weeks 5–8)
> Make the app worth opening daily

**2.1 — Advanced Event Filters** | HIGH | 5 days
- Filter drawer: Date range, Price (Free/Paid/Under ₦X), Category, Distance
- Sort options: Soonest, Most Popular, Price, Newest
- Filter pills visible above results when active
- URL-safe filter state (shareable links)

**2.2 — Save / Bookmark Events** | HIGH | 2 days
- Bookmark icon on event cards and detail page
- "Saved Events" tab in Event Library
- Persistent via API

**2.3 — Event Reminders** | HIGH | 3 days
- "Remind Me" toggle on event detail (after registering)
- Time options: 15 minutes / 1 hour / 1 day / 3 days before
- Scheduled push notification sent at reminder time
- Stored per-user per-event

**2.4 — Organizer Analytics Dashboard** | HIGH | 6 days
- New "Analytics" tab in event manage screen
- Metrics: Total registrations, Check-in rate, Revenue, Ticket breakdown
- Simple charts (bar for daily registrations, pie for ticket types)
- All-events summary on organizer profile

**2.5 — Promotional / Discount Codes** | HIGH | 4 days
- Organizer creates codes with: discount %, fixed amount, usage limit, expiry
- Promo code input field at payment step
- Code validation API call + price update in real time
- Code usage stats in manage screen

**2.6 — Onboarding Interests Wizard** | HIGH | 3 days
- After signup, 3-step wizard: interests, university/faculty, profile photo
- Minimum 3 interests required before proceeding
- Sets up personalized feed from day one

---

### PHASE 3 — Community & Social (Weeks 9–12)
> Make communities feel alive

**3.1 — Real-time Community Chat** | CRITICAL | 10 days
- Full chat UI in community/[id].js
- WebSocket / Pusher integration for real-time messages
- Message history with pagination (load more on scroll up)
- Typing indicators
- Image + file attachment support
- Unread message count badge on community card

**3.2 — Event Invitations** | HIGH | 3 days
- "Invite Friends" button on event detail
- In-app search for users to invite
- Push notification to invited user with event link
- Invitation accepted/declined tracking

**3.3 — Functional Follow System** | HIGH | 3 days
- Follow / Unfollow API calls properly update counts in UI
- Followers and Following lists show real users
- Activity feed: "People you follow are going to X"
- "Suggested users to follow" based on community overlap

**3.4 — User Blocking & Reporting** | HIGH | 2 days
- Block user from profile screen (hides their content)
- Report user with category selection (spam, harassment, fake)
- Report goes to admin queue
- Required for App Store safety compliance

**3.5 — Community Invite Links** | MEDIUM | 2 days
- Shareable deep link for joining a community
- QR code for private community (replaces manual code sharing)
- Link expiry option for private communities
- Copy link + Share sheet integration

**3.6 — Pinned Announcements** | MEDIUM | 2 days
- Admin can pin a message at top of community chat
- Pinned message has distinct visual treatment (brand border)
- Only one pinned message at a time

---

### PHASE 4 — Organizer Power Features (Weeks 13–16)
> Make UniHub the default tool for event organizers

**4.1 — Event Announcements to Attendees** | HIGH | 4 days
- "Send Announcement" button in event manage screen
- Compose screen with title + body
- Sends push notification to all registered attendees
- Appears in notification center as "Event Update" type

**4.2 — Co-organizers & Staff Roles** | HIGH | 4 days
- Invite co-organizer by username/email
- Roles: Co-organizer (full access), Check-in Staff (scanner only), Manager (attendees + analytics)
- Role displayed in manage screen header
- Invited user gets notification

**4.3 — Bulk Registration Actions** | MEDIUM | 2 days
- Checkbox multi-select in Pending and Attendees tab
- "Approve All" / "Reject Selected" bulk action
- Confirmation dialog before bulk action
- Progress indicator during processing

**4.4 — Attendee Export** | MEDIUM | 2 days
- Export attendee list as CSV from manage screen
- Fields: name, email, ticket type, registration date, check-in status
- Download to device or share via email

**4.5 — Refund Management** | HIGH | 3 days
- Per-attendee refund button in manage screen
- Refund confirmation with amount shown
- Funds returned to attendee wallet (or original payment method)
- Bulk refund on event cancellation
- Refund status tracking in wallet

**4.6 — Event Templates** | MEDIUM | 2 days
- "Save as Template" on event manage screen
- "Create from Template" option in create event flow
- Templates stored per user
- Saves: title format, ticket types, registration questions, settings

---

### PHASE 5 — Polish & Delight (Weeks 17–20)
> The 10% that makes users tell their friends

**5.1 — Personalized Feed** | MEDIUM | 8 days
- Algorithm scoring based on: interests match, past attendance, social graph overlap, recency, location
- "Because you attended X" recommendation card
- "Trending at [University]" section
- Users who follow people attending see social signal

**5.2 — Map View for Events** | MEDIUM | 5 days
- Map tab on dashboard (Mapbox or Google Maps)
- Event pins with thumbnail preview on tap
- Cluster pins for multiple events in same area
- Filter map by category

**5.3 — Achievement Badges & Gamification** | MEDIUM | 5 days
- Badge system: First Event, 10 Events Attended, Community Founder, Verified Organizer, etc.
- Profile badge showcase
- "You unlocked a new badge!" push notification
- Leaderboard: Most Active This Month

**5.4 — Calendar Integration** | MEDIUM | 3 days
- "Add to Calendar" button on registered event (iOS Calendar / Google Calendar)
- Monthly calendar view in Event Library
- Calendar export as `.ics` file

**5.5 — Rich Social Sharing** | LOW | 3 days
- Auto-generated event share card (event name, date, image, QR link)
- Native Instagram Stories share
- WhatsApp deep link with event preview
- Referral tracking (who shared, how many registered from share)

**5.6 — Post-event Experience** | MEDIUM | 4 days
- Automatic review prompt 24h after event end
- "Event Highlights" screen with photo upload by attendees
- Certificate of attendance generation (downloadable PDF)
- "Attend again" quick re-register for recurring events

**5.7 — Apple Sign In & OAuth** | CRITICAL (for App Store) | 3 days
- Apple Sign In required if any third-party auth is offered
- Google Sign In for Android
- Link social accounts to existing email accounts

---

## Infrastructure Prerequisites

Before building Phase 3+, these backend/infrastructure items must be in place:

| Item | Required For | Estimated Effort |
|------|-------------|-----------------|
| WebSocket server (Socket.io or Pusher) | Real-time chat, live check-in | 1 week |
| File upload service (AWS S3 or Cloudflare R2) | Community media, event galleries, profile photos | 3 days |
| Push notification scheduling | Event reminders, waitlist alerts | 2 days |
| QR code library (`expo-barcode-scanner`) | Check-in scanning | 1 day |
| Geolocation integration (`expo-location`) | Near Me filter, map view | 1 day |
| Email service (SendGrid or Mailgun) | Announcements, receipts, digest | 2 days |
| Analytics service (Amplitude or Firebase) | Funnel tracking, feature usage | 2 days |
| Search infrastructure (Algolia or Typesense) | Autocomplete, ranking, filters | 1 week |

---

## Success Metrics for Next Build

| Metric | Current (Estimated) | Target After Phase 1–3 |
|--------|--------------------|-----------------------|
| D7 retention | ~20% | 45% |
| Events registered per user per month | ~1.2 | 3.5 |
| Community messages per active user/week | 0 (no chat) | 15+ |
| Organizer repeat event creation rate | ~30% | 65% |
| Wallet top-up conversion | 0% (no flow) | 40% of paying users |
| Average check-in rate | Unmeasured | 75% of registrations |

---

## Conclusion

UniHub's next build should focus on three things:

1. **Complete what's half-done** — Waitlist UI, QR check-in, notification preferences, functional follow system, real community chat. These are features users expect and the code sometimes already supports.

2. **Empower organizers** — Analytics, announcements, promo codes, refund management, bulk actions. Organizer satisfaction drives event supply. No events = no users.

3. **Make discovery worth it** — Advanced filters, saved events, event reminders, onboarding interests wizard. Users will open the app more when they find relevant events and are reminded before they happen.

The features in Phase 1–2 (~8 weeks) will take the app from 55% to 80% of a world-class platform. Phase 3–4 closes the gap to 95%.
