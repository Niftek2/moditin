// App Store submission guide — phase-by-phase checklist data for Modal Itinerant.

export const PHASES = [
  {
    number: 1,
    title: "Phase 1 — Pre-Submission Checklist",
    summary: "Account, Bundle ID, IAP capability, agreements & build config.",
    steps: [
      { id: "p1-1", text: "Confirm Apple Developer Program enrollment is active ($99/year).", detail: "developer.apple.com → Membership. Status must read Active." },
      { id: "p1-2", text: "Register the Bundle ID in the Apple Developer portal.", detail: "Certificates, Identifiers & Profiles → Identifiers → +. Use a reverse-domain ID.", code: "com.modalitinerant.app" },
      { id: "p1-3", text: "Enable the In-App Purchase capability on the App ID.", detail: "Edit the identifier and check 'In-App Purchase'. Required before any IAP can go live." },
      { id: "p1-4", text: "Complete Agreements, Tax, and Banking in App Store Connect.", warn: "Paid apps & subscriptions will NOT go live until the Paid Apps agreement is signed and banking/tax info is filled in." },
      { id: "p1-5", text: "Confirm the Base44 mobile build uses the correct Bundle ID and display name.", detail: "Display name: Modal Itinerant. Bundle ID must match the portal exactly." },
    ],
  },
  {
    number: 2,
    title: "Phase 2 — In-App Purchase Setup",
    summary: "Create the auto-renewable subscription and submit it with the build.",
    steps: [
      { id: "p2-1", text: "Create a new Auto-Renewable Subscription product.", detail: "App Store Connect → your app → Subscriptions → create a Subscription Group first, then add a subscription." },
      { id: "p2-2", text: "Set the reference name, product ID, and price.", detail: "Reference name: Annual Individual. Price tier: $179/year (or your chosen Apple price).", code: "com.modalitinerant.app.annual" },
      { id: "p2-3", text: "Add a localized display name and description.", detail: "Display name: Annual Individual Membership. Description: full access to caseload, IEP, scheduling & simulator tools." },
      { id: "p2-4", text: "Submit the IAP for review alongside the first build.", warn: "Apple requires at least one IAP to be submitted WITH the first build when content is gated behind a subscription. Skipping this causes a rejection." },
    ],
  },
  {
    number: 3,
    title: "Phase 3 — Create the App Record",
    summary: "Apps → + New App with platform, name, Bundle ID & SKU.",
    steps: [
      { id: "p3-1", text: "Go to App Store Connect → Apps → + → New App." },
      { id: "p3-2", text: "Platform: iOS. Name: Modal Itinerant. Primary Language: English (U.S.)." },
      { id: "p3-3", text: "Bundle ID: select the one you registered — it must match exactly.", code: "com.modalitinerant.app" },
      { id: "p3-4", text: "SKU: a unique internal code (not shown to users).", code: "modalitinerant2026" },
      { id: "p3-5", text: "User Access: Full Access. Click Create." },
    ],
  },
  {
    number: 4,
    title: "Phase 4 — App Metadata",
    summary: "Listing copy, keywords, category & age rating.",
    steps: [
      { id: "p4-1", text: "Name: Modal Itinerant." },
      { id: "p4-2", text: "Subtitle (30 char max).", code: "Tools for Itinerant Educators" },
      { id: "p4-3", text: "Description — feature-focused, no student names or PII.", detail: "Cover caseload management, IEP goal tracking, service hour logging, hearing simulator, and session planning." },
      { id: "p4-4", text: "Keywords (100 char max).", code: "IEP, itinerant, deaf education, TOD, caseload, service hours, hearing, special education" },
      { id: "p4-5", text: "Primary Category: Education." },
      { id: "p4-6", text: "Age Rating: 4+ (no user-generated public content, no social features)." },
      { id: "p4-7", text: "Support URL & Marketing URL: your published Base44 app URL." },
    ],
  },
  {
    number: 5,
    title: "Phase 5 — Screenshots & App Preview",
    summary: "Required device sizes, key screens, demo data only.",
    steps: [
      { id: "p5-1", text: "6.9\" required (iPhone 16 Pro Max).", code: "1320 × 2868 px" },
      { id: "p5-2", text: "6.5\" required (iPhone 14 Plus).", code: "1242 × 2688 px" },
      { id: "p5-3", text: "iPad 12.9\" — optional but recommended." },
      { id: "p5-4", text: "Capture key screens: Dashboard, Student Detail, Calendar, Service Hours, Hearing Simulator.", detail: "Minimum 3 per device size, max 10." },
      { id: "p5-5", text: "Use Demo Mode so NO real student data is visible.", warn: "Real student PII in screenshots is both a privacy violation and a rejection risk." },
      { id: "p5-6", text: "Do not overlay promotional text or price claims on screenshots.", warn: "Price/promo text baked into screenshots is a common rejection reason." },
    ],
  },
  {
    number: 6,
    title: "Phase 6 — Privacy & Data Safety",
    summary: "App Privacy answers + public privacy policy URL.",
    steps: [
      { id: "p6-1", text: "Collects Contact Info (email) — used for account login." },
      { id: "p6-2", text: "Collects Identifiers (User ID) — linked to account." },
      { id: "p6-3", text: "Does NOT collect: precise location, health data, financial info, browsing history." },
      { id: "p6-4", text: "Data used to track you: No." },
      { id: "p6-5", text: "Data linked to you: email + user ID, for app functionality only." },
      { id: "p6-6", text: "Add a Privacy Policy URL — must load publicly with no login.", detail: "Use the published /PrivacyPolicy route on your Base44 domain." },
    ],
  },
  {
    number: 7,
    title: "Phase 7 — Review Information",
    summary: "Demo account + reviewer notes (critical for first-pass approval).",
    steps: [
      { id: "p7-1", text: "Create a test teacher account with pre-seeded demo data (built-in demo mode)." },
      { id: "p7-2", text: "Enter the demo credentials in App Store Connect → App Review Information.", warn: "The reviewer MUST be able to log in and reach full functionality, or the app is rejected under Guideline 2.1 / 4.0." },
      {
        id: "p7-3",
        text: "Add reviewer notes explaining the login requirement and subscription flow.",
        detail:
          "Suggested notes: 'This is a professional tool for itinerant special education teachers (Teachers of the Deaf). Login is required because the app stores caseload and IEP data specific to each educator. A demo account is provided above. Subscription is required to access full features — tap Subscribe on the paywall screen to trigger the Apple in-app purchase flow.'",
      },
      { id: "p7-4", text: "Confirm a support phone number or email is listed." },
    ],
  },
  {
    number: 8,
    title: "Phase 8 — Build Upload via Base44",
    summary: "Generate the iOS build and upload to App Store Connect.",
    steps: [
      { id: "p8-1", text: "In Base44, use Publish → Mobile App to generate the iOS build." },
      { id: "p8-2", text: "Ensure the Bundle ID matches App Store Connect exactly.", code: "com.modalitinerant.app" },
      { id: "p8-3", text: "Upload the build via Xcode → Organizer → Distribute App, or drag the .ipa into the Transporter app." },
      { id: "p8-4", text: "Wait for build processing (~15–30 min)." },
      { id: "p8-5", text: "Select the processed build in App Store Connect for this version." },
    ],
  },
  {
    number: 9,
    title: "Phase 9 — Pricing & Availability",
    summary: "Set price, keep Apple IAP & web Stripe strictly separate.",
    steps: [
      { id: "p9-1", text: "Set base country price to United States." },
      { id: "p9-2", text: "Note Apple's cut: 30% year 1, 15% after year 1 of a subscription." },
      {
        id: "p9-3",
        text: "Do NOT mention or link to the web/Stripe subscription from inside the iOS app.",
        warn: "Guideline 3.1.1 — the $179/year Stripe subscription sold on the web is a separate product. Referencing external payment inside iOS is a rejection.",
      },
      {
        id: "p9-4",
        text: "Hide all in-app Stripe checkout links when running in iOS mode.",
        code: "window.ModalApp?.platform === 'ios'",
      },
    ],
  },
  {
    number: 10,
    title: "Phase 10 — Common Rejections to Avoid",
    summary: "Pre-emptive fixes for the most frequent rejection reasons.",
    steps: [
      { id: "p10-1", text: "Guideline 3.1.1 — no external payment links in iOS. Stripe buttons hidden in iOS mode." },
      { id: "p10-2", text: "Guideline 4.0 — app fully functional with the demo account. Test every tab." },
      { id: "p10-3", text: "Guideline 5.1.1 — privacy policy accessible without login. Confirm /PrivacyPolicy loads publicly." },
      { id: "p10-4", text: "Guideline 2.1 — no crashes. Test Subscribe → Apple IAP → entitlement check → Dashboard on a real device." },
      { id: "p10-5", text: "Guideline 1.2 — do NOT select the Kids category. This app is for educators, not children." },
    ],
  },
  {
    number: 11,
    title: "Phase 11 — Submit for Review",
    summary: "Final answers and submission.",
    steps: [
      { id: "p11-1", text: "Click 'Add for Review' then 'Submit to App Review'." },
      { id: "p11-2", text: "IDFA / advertising identifiers: No." },
      { id: "p11-3", text: "Export compliance: standard encryption (HTTPS) — 'Yes, uses standard encryption, exempt from EAR'." },
      { id: "p11-4", text: "Click Submit. Typical review time: 24–48 hours." },
      { id: "p11-5", text: "Monitor email and the Resolution Center in App Store Connect for reviewer messages." },
    ],
  },
];

export const TOTAL_STEPS = PHASES.reduce((sum, p) => sum + p.steps.length, 0);