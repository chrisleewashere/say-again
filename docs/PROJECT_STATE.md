# Project State — Say Again?

> Living onboarding digest for anyone (human or Claude session) picking up this repo.
> Last updated: 2026-07-24 (Pages live, iOS simulator pass, strategy set to free).

## What this is

An original asymmetric co-op communication game for high-school speech therapy. The
**Field Agent** holds an iPad showing puzzles mounted inside a 3D vintage spy briefcase;
the **Handler** holds a printed Field Manual (two reading levels) with the rules but no
view of the screen. The information gap forces the talking — precise describing,
direction following, clarifying questions, conversational repair — and the talking is
the therapy. Built by/for Chris, a school SLP, aimed at App Store publication.

Formerly "Keep Yapping & Everyone Escapes"; renamed **Say Again?** everywhere.
Bundle ID `com.chrislee.sayagain` (changeable until first App Store upload).
Internal storage identifiers (Dexie db `keep-yapping`, `ky-*` localStorage keys) are
**deliberately unchanged** so existing devices keep their session logs — never rename them.

## Strategy (decided 2026-07-24)

**Ship it free.** Chris chose adoption over monetization: the win condition is therapists
actually using it, with grant funding and possible acquisition as the upside. The earlier
"free base + paid evidence-based module packs" hypothesis is **dead**, and with it the
verified Apple blocker that killed it (in-app purchases cannot be bought through Apple
School Manager volume purchasing and break on device-assigned school iPads, making a
paid-packs model invisible to district purchase orders). New modules keep shipping for
efficacy and adoption reasons, not as revenue units. Market dossier (2026-07-16) retains
value for its grant-fit and channel findings; its pricing and sizing sections are history.

## Architecture invariants (do not break)

- **Rules as data**: every module's rules live in `rules.ts` as typed data carrying both
  game semantics and manual prose. The engine solver AND the printed manual generate from
  the same tables; robot-Handler property tests solve 1000 seeds per difficulty tier.
- **Seeded determinism**: mission codes (e.g. `FOX-492`) derive every puzzle via
  `hashSeed(code:index:moduleId:difficulty)`. Same code + same module list = same mission.
- **Shared runner**: `src/game/useMissionRunner.ts` holds all game logic; the classic 2D
  shell and the 3D Field Case shell are presentation only and can never diverge.
- **In-scene faces**: puzzles render ON the 3D plates as canvas textures with raycast UV
  tap regions (`src/scene/faces/`) — the iPad-safe input path (iOS WKWebView drops touches
  on CSS-3D-transformed DOM; mesh raycasting does not). The flat DOM panel remains as the
  accessibility path (VoiceOver/switch) and fallback for faceless modules.
- **Trivial module expansion**: a new module = one folder in `src/modules/` conforming to
  `ModuleDefinition` + one line in `registerAll.ts` (+ optional face + a line in
  `scene/faces/index.ts`). No 3D work is ever required.
- **Original IP only**: no KTANE names, assets, manual text, or trade dress. Mechanics
  genre is fair game; content is not.
- **Privacy**: all data on-device (IndexedDB), initials-only labels, zero network calls.

## Content (10 modules)

| Module | Codename | Primary target |
|---|---|---|
| wire-maze | Laser Grid Bypass | receptive (conditional rules) |
| vault-dial | Crack the Safe | expressive (describing) |
| keypad-cipher | Code Room | vocabulary (categories) |
| password-intercept | Password Intercept | vocabulary (semantics) |
| alarm-bypass | Alarm Bypass | receptive (sequences) |
| escape-route | Escape Route | spatial language |
| id-check | Spot the Contact | expressive + pragmatics |
| debrief-tapes | Debrief Tapes | **narrative** (story assembly + retell) |
| bad-intel | Bad Intel | pragmatics (comprehension monitoring — Agent flags the impossible step) |
| asset-interview | Asset Interview | pragmatics (question formulation — Handler's decision tree vs Agent's facts) |

## Stakes & SLP features

- Per-module failure: 1–3 wrong answers (SLP-set, default 1) seals the module red;
  mission always completes; honest A+–F grade (each module 100 − 20/wrong, failed = 0).
- **Static Protocol** repair drills: SLP sets 0–3 "say-agains"; seeded modules show a
  STATIC badge; the Handler answers first descriptions only with scripted neutral
  clarification requests (stacked-clarification paradigm; script printed in the manual).
- **Hints**: escalating (manual pointer → per-module coaching), logged per module,
  SLP on/off toggle.
- Debrief screen ends with "Talk it over" prompts (process + content debriefing).
- Tally overlay (correct/prompted/incorrect per student), logbook, CSV export
  (includes grade, repair_drills, hints). Measure with the tally, not the grade.

## Research grounding

Deep-research dossier (25 adversarially verified claims):
https://claude.ai/code/artifact/865cd097-7c46-4b9d-b477-7f3ce341e38e
Drove: Static Protocol, Debrief Tapes, Bad Intel, Asset Interview, hints, debrief prompts.
Backlog from its shortlist: **Cover Story** (inference from evidence), **Double Meaning**
(idioms), **Vantage Point** (perspective-taking — pilot for cognitive load first).
Anti-recommendation: no time-pressure mechanics (invites brute force, kills exchange quality).

## Build & verify

```bash
cd app
npm install
npm run typecheck && npm test     # 261 unit tests (Vitest)
npx playwright test               # 11 e2e (chromium at /opt/pw-browsers/chromium in CCR)
npm run manual                    # regenerates manual HTML + PDFs (deterministic)
npm run build && npx cap sync ios # web bundle -> iOS project
```

- Playwright must use chromium explicitly (iPad device presets default to WebKit).
- Headless GL flags for probes: `--no-sandbox --disable-dev-shm-usage --enable-unsafe-swiftshader`.
- e2e drives 3D faces via the dev-only `window.__kyFace` hook.
- Manual PDFs pin CreationDate for byte-determinism.

## iOS / Xcode

Complete Capacitor 8 project in `app/ios/` (SPM, not CocoaPods — **`npm install` must run
before opening Xcode**; plugins resolve out of `node_modules`). Plugins: app, haptics
(Taptic Engine cues), keep-awake (screen stays on during missions). Safe-area insets
handled; `ITSAppUsesNonExemptEncryption=false` set. Free-team simulator/sideload path
(no $99 program) documented in `docs/APP_STORE_SUBMISSION.md` — the paid program is
deferred until actual launch, per Chris.

## Distribution

- PRIMARY: GitHub Pages — https://chrisleewashere.github.io/say-again/ — deployed
  by .github/workflows/pages.yml on every push to main (tests gate the build;
  base path derives from the repo name). Public, works on iPads + Chromebooks.
  **VERIFIED LIVE 2026-07-24**: HTTP 200, boots, all 10 modules listed, no console errors.
- **Pages gotcha (cost an evening):** deploys go through the `github-pages` *environment*,
  which carries a deployment branch policy. After the rename that policy still allowed only
  the old branch name, so the build job passed, uploaded its artifact, and the deploy job
  failed with no readable log while the URL 404'd. If Pages is red but CI is green, check
  Settings → Environments → github-pages → Deployment branches first. (Repo Settings →
  Pages → Source was already correct; that was not the problem.)
- Legacy private artifact (one cosmetic build behind, updates currently BLOCKED
  by a service-side "PR review page" classifier misfiring on the bundle —
  bisected to a ~190KB slice of minified app code; size/canonicalRoute/github
  URLs each ruled out): https://claude.ai/code/artifact/457f11ec-6c9f-4cce-a841-7782faf39c2b
- RENAMES DONE 2026-07-24: repo is now chrisleewashere/say-again; default branch
  is `main` (was claude/keep-talking-speech-therapy-uwr442). Old URLs redirect.
  Develop on and push to `main` now — per Chris, superseding earlier branch
  instructions. Repo stays PUBLIC (free Pages; private+Pages is paywalled).

## Visual identity (decided 2026-07-24)

Chris chose **Tradecraft** (refined 1968 analog spycraft) from a 4-way agent
competition (vs blackline/atomic/noir — files kept in `src/scene/themes/` for a
possible future "case finish" setting; do not delete). All six plates rack in
the case BOTTOM (2x3); the lid is the mission status board (phosphor clock,
module jewels, brass plate). Mission ticking is default-on (Settings toggle).
Theme = data (`SceneTheme`); active theme persists under `ky-scene-theme`.

## Open threads

1. Classroom iPad playtest of the in-case faces (the real gate for everything).
2. Reprint both manual editions (Static Protocol page + 3 new modules added).
3. Backlog modules from the research shortlist: **Cover Story** (inference from evidence),
   **Double Meaning** (idioms), **Vantage Point** (perspective-taking — pilot for cognitive
   load first).
4. Per-module custom face hardware pass, awaiting the iPad playtest.
5. Grant path: ASHFoundation Researcher–Practitioner Collaboration Grant ($35k) needs a
   university PI partner and its next cycle is 2027 — lining up a PI is a long-lead item
   worth starting well before the app is "done".
6. Chris's TickTick list "Say Again? (Therapy Game)" tracks the loose ends.
7. Chris must still get his district's outside-work policy in writing (conflict-of-interest
   risk of piloting his own product on his caseload — lower stakes now that it's free, but
   not zero).

Done and no longer open: the market-research dossier (delivered 2026-07-16; outcome is the
Strategy section above), and the Pages deploy (verified live 2026-07-24).

## Verified baseline (2026-07-24 — MacBook Pro, Node 24.18, Xcode 26.6)

- `tsc -b` clean; **261/261** Vitest; **11/11** Playwright e2e — including both in-scene
  face specs (solve-on-face, wrong-wire-strike-on-face), which are what prove the raycast
  UV path rather than the DOM fallback.
- Native iOS build: **0 errors** (~3 min cold), one benign `No AppIntents.framework`
  warning. Launched on an iPad (A16) simulator: 3D Field Case renders in WKWebView,
  in-scene faces draw as canvas textures, lid status board live (READY / module jewels /
  embossed mission code), raycast taps land, Tradecraft lighting intact.
- One unexplained anomaly: the simulator rotated portrait→landscape mid-mission with no
  deliberate trigger. `Info.plist` allows all four iPad orientations so iOS was within its
  rights and play continued fine — but watch for it on real hardware, since a rotation
  mid-mission is disruptive when a student is holding the case.
- Known minor tech debt: three.js logs `THREE.Clock has been deprecated. Please use
  THREE.Timer instead.` during the scene tests.

## Working environment

- **Homebrew is at `/opt/homebrew/bin`, on PATH only via `~/.zshrc`** — non-interactive
  shells don't source that, so `gh`/`brew` may need a full path.
- **Install Playwright browsers from inside `app/`** (`npx playwright install chromium`).
  A global install pulled build 1234 while the pinned 1.61.1 wanted 1228, and all 11 e2e
  failed with a misleading "Executable doesn't exist".
- `.claude/settings.json` carries a permission allowlist for routine read-only and build
  commands. Deliberately excluded so they always prompt: `git push`, `gh pr create`, `rm`,
  `curl`, `sudo`.
- A **Mac Studio M3** is becoming the primary dev machine. Run Claude Code with this repo
  as the working directory so project memory is keyed to the code, not to a sibling folder.
