# Project State — Say Again?

> Living onboarding digest for anyone (human or Claude session) picking up this repo.
> Last updated: 2026-07-24.

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

- Playable web build (private artifact, stable URL):
  https://claude.ai/code/artifact/457f11ec-6c9f-4cce-a841-7782faf39c2b
  Pipeline: `npx vite build --config vite.artifact.config.ts` → extract fragment
  (title + styles + root div + module scripts) → republish same URL.
- PWA works offline; Chromebook path = publish to a public URL (not yet done).
- Repo rename to `say-again` endorsed but not done (GitHub disallows `?` in names;
  redirects preserve old links; afterwards sweep support/privacy URLs in docs).

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
3. Market research dossier — handoff prompt delivered to Chris to run in a fresh session
   (purpose: pricing + go-to-market + honest sizing; audience of one, candid;
   monetization hypothesis to stress-test: free base + paid evidence-based module packs).
4. Mac-side Claude Code session drives Xcode builds; git is the bridge between sessions.
5. Chris's TickTick list "Say Again? (Therapy Game)" tracks 13 loose ends.
