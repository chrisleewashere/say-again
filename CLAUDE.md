# Say Again? — working agreement

**Read `docs/PROJECT_STATE.md` first.** It is the living onboarding digest and the source
of truth for architecture invariants, decisions, and open threads. Trust it over
assumptions; update it when a decision changes.

This file is the short version — the rules that must never be broken.

## Hard constraints

1. **Original IP only.** No KTANE names, assets, manual text, or trade dress. The
   asymmetric-co-op *genre* is fair game; content is not.
2. **Never rename internal storage identifiers.** The Dexie db is `keep-yapping` and
   localStorage keys are `ky-*`, deliberately unchanged through the rename to
   "Say Again?" so existing devices keep their session logs.
3. **Privacy is absolute.** All student data on-device (IndexedDB), initials/nicknames
   only, no accounts, no network calls.
4. **The Tradecraft dark look is a locked aesthetic choice** — `envIntensity 0`, one hot
   desk lamp. Do not brighten it. Judged and chosen deliberately; not a bug.
5. **Rules as data.** Engine solver and printed manual generate from the same tables in
   each module's `rules.ts`. The robot-Handler property tests must keep passing.
6. **Repo stays public** (free GitHub Pages). The $99 Apple Developer Program is deferred
   until actual launch.

## Strategy (decided 2026-07-24)

Ship it **free**. The goal is adoption — therapists actually using it — with grant funding
and possible acquisition as the upside. Monetization is not the plan; the earlier
"free base + paid module packs" hypothesis is dead, and with it the Apple IAP / Apple
School Manager problem. New modules keep shipping for efficacy and adoption reasons,
not as revenue units.

## Branch & deploy

- Develop on and push to **`main`**. (Supersedes any older branch instructions.)
- Every push to `main` runs CI plus a GitHub Pages deploy; tests gate the build.
- Live at https://chrisleewashere.github.io/say-again/
- Pages deploys through the `github-pages` **environment**, which carries a deployment
  branch policy. If a deploy fails while the build job passes, check that policy first —
  it silently pinned the old pre-rename branch name once already.

## Verify

```bash
cd app
npm install                       # must run before opening Xcode (SPM resolves from node_modules)
npm run typecheck && npm test     # 261 unit tests (Vitest)
npx playwright test               # 11 e2e — drives the 3D faces via window.__kyFace
npm run manual                    # regenerates manual HTML + PDFs (deterministic)
npm run build && npx cap sync ios # web bundle -> iOS project
```

Playwright browsers must match the pinned version — run `npx playwright install chromium`
from inside `app/`, not globally, or you get a build-number mismatch.

## Environment notes (Chris's Macs)

- Homebrew lives at `/opt/homebrew/bin`, which is only on PATH via `~/.zshrc`.
  Non-interactive shells don't source that, so `gh` may need a full path.
- Chris runs Claude Code through the **Claude desktop app**, not the terminal CLI — there is
  no `claude` command on his machines. Don't suggest `cd <dir> && claude`; the working
  directory is set through the app.
- Currently an M1 MacBook Pro; a Mac Studio M3 is becoming the primary dev machine.
