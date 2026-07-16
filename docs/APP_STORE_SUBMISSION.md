# App Store Submission Guide

Everything in this repo is ready to build; the signing and upload steps must happen on your
Mac because they require Xcode and your Apple Developer identity.

## Run it FREE first (no Developer Program needed)

You do not need the $99 program to play the native app — only to put it on the App Store.
With just Xcode and a free Apple ID you can:

- **Run in the iPad simulator**: do the Build steps below, then in Xcode pick any iPad
  simulator from the device menu and press **Run**. No signing required at all.
- **Sideload to your real iPad**: in Xcode → Settings → Accounts, add your Apple ID (free).
  In Signing & Capabilities pick the "Personal Team" it creates, plug in the iPad, Run.
  The first time, the iPad will ask you to trust the developer profile
  (Settings → General → VPN & Device Management). Free-team builds expire after **7 days** —
  just press Run again to re-sign. Fine for classroom piloting; enroll in the paid program
  when you're ready to publish.

Hold off on the "One-time setup" enrollment until launch — everything else works without it.

## One-time setup (for the actual App Store submission)

1. **Apple Developer Program** — enroll at https://developer.apple.com/programs/ ($99/yr).
   Use the Apple ID you want the app published under. Enrollment approval can take a day or
   two.
2. **Xcode** — install from the Mac App Store (Xcode 16 or newer).
3. **Node.js** — install Node 20+ (https://nodejs.org), needed to build the web bundle.
4. Clone this repo on the Mac.

## Build the app

```bash
cd app
npm install              # required BEFORE opening Xcode — the iOS project
                         # resolves Capacitor plugins out of node_modules
npm test                 # everything should be green
npm run build            # produces app/dist
npx cap sync ios         # copies dist + plugins into the Xcode project
npx cap open ios         # opens the Xcode workspace
```

Native-only features to check while testing: haptic taps on solves/strikes (Taptic Engine),
and the screen staying awake during a mission (it should never dim mid-heist).

## Configure signing (first time only)

In Xcode:

1. Select the **App** target → **Signing & Capabilities**.
2. Check **Automatically manage signing** and choose your **Team**.
3. Bundle identifier is `com.chrislee.sayagain` — change it if you prefer (it must be
   globally unique; reverse-DNS of a domain you control is conventional).

## Test on a real iPad

1. Plug in an iPad, select it as the run destination, press **Run**.
2. Play a full mission with the printed manual (`manuals/` in this repo) — this is also
   exactly what App Review will want to understand, so note how you'd explain it.

## App Store Connect setup

1. Go to https://appstoreconnect.apple.com → **My Apps** → **+** → **New App**.
   - Platform: iOS · Name: **Say Again?** (or your preferred store
     name if taken) · Language: English · Bundle ID: the one from Xcode · SKU: anything
     (e.g. `say-again-1`).
2. Fill in the listing using `docs/APP_STORE_METADATA.md` (description, keywords,
   category **Education**, age rating questionnaire — everything answers "No", yielding 4+).
3. **App Privacy** section: declare **Data Not Collected** (true — see
   `docs/PRIVACY_POLICY.md`). Host the privacy policy somewhere linkable — the GitHub file
   URL works, or GitHub Pages.
4. Pricing: **Free** (you can change later; paid requires the Paid Apps agreement + banking
   info first).

## Screenshots

App Review requires screenshots for 13" and 12.9" iPad. Easiest path: run the app in the
iPad Pro simulator, play each module, and press **⌘S** to save screenshots. Suggested set
(also see `docs/APP_STORE_METADATA.md`): Home, Mission Setup, two different puzzles
mid-play, Debrief.

## Upload

1. In Xcode: select **Any iOS Device (arm64)** as destination.
2. **Product → Archive**. When the Organizer opens: **Distribute App → App Store Connect →
   Upload** (defaults are fine).
3. In App Store Connect, attach the build to your version, complete **App Review
   Information** — add reviewer notes like:

   > This is a two-player cooperative communication game designed for school
   > speech-language therapy. One player uses the device; the other uses a printed manual
   > (PDF included with the app's website/repo). All functionality is offline; no accounts
   > are needed. To test: tap New Mission → add any puzzle → Start.

4. **Submit for Review**. First reviews typically take 1–3 days. Rejections are usually
   fixable metadata questions — answer in Resolution Center and resubmit.

## After approval

- The printed manuals in `manuals/` are what partner students use — keep a few copies in
  your therapy room.
- To ship an update: bump the version in Xcode (target → General → Version), rebuild
  (`npm run build && npx cap sync ios`), archive, upload, submit.
