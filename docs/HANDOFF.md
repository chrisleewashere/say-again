# Handoff — starting a new session on Say Again?

Paste the block below as your first message in a new Claude Code session. Keep it
short on purpose: everything else lives in `CLAUDE.md` and `docs/PROJECT_STATE.md`,
which are kept current. A handoff that restates project facts will drift out of
date and start lying — that is exactly how the previous one went wrong.

---

## The prompt

> You're picking up **Say Again?** — an original asymmetric co-op communication game
> for high-school speech therapy. One player (Field Agent) holds an iPad showing
> puzzles mounted in a 3D vintage spy briefcase; the other (Handler) holds a printed
> field manual with the rules but no view of the screen. The information gap forces
> the talking, and the talking is the therapy. I'm Chris, a school SLP.
>
> The repo is at `~/Documents/say-again`, on `main`, public at
> github.com/chrisleewashere/say-again. **Start by reading `CLAUDE.md` and
> `docs/PROJECT_STATE.md`** — they are the source of truth for constraints,
> decisions, architecture invariants, and open threads. Trust them over your
> assumptions, and update them when a decision changes.
>
> Working, shipped, and live at https://chrisleewashere.github.io/say-again/ —
> 10 modules, 261 unit tests + 11 e2e all green. But it is NOT feature-complete:
> there's a live backlog (three research-backed modules, manual reprints, a face
> hardware pass, launch prep). Treat this as mid-flight, not wrap-up.
>
> Two things about how I work:
> - **I run Claude Code in the Claude desktop app, not the terminal CLI.** There is no
>   `claude` command on my machines. Don't hand me shell commands you can run
>   yourself — run them.
> - **Verify on the iPad simulator, not just in tests.** Several real defects passed
>   the whole suite and only showed up on device. If you can't see it, say so rather
>   than implying you checked.
>
> Tell me what you find before changing anything, and flag what you need.

---

## What the new session should already have

Verify rather than assume — these were true on 2026-07-26:

- **`gh` authenticated** as `chrisleewashere` with `repo, workflow, read:org`, and
  `admin: true, push: true` on this repo. Push and merge directly; no PR needed
  unless Chris asks.
- **iOS simulator tooling** works. Xcode 26.6, `xcode-select` correct. An iPad (A16)
  simulator is the usual target. Attach the panel BEFORE building so Chris can watch.
- **Playwright** installed and matching the pinned version.
- **TickTick connector** — the list is "Say Again? (Therapy Game)". It's reconciled
  against `PROJECT_STATE.md` open threads; keep them in step rather than letting Chris
  sync two lists by hand.
- **Memory** is keyed to the repo directory. Launch with `~/Documents/say-again` as the
  working directory so it lands in the right place. (A copy also exists under the
  retired `-Say-Again-Market-Research` project key; that folder is dead — see its
  `MEMORY.md`.)

## Traps that have each cost real time

All of these are documented in `PROJECT_STATE.md`, repeated here because they are the
ones that actually bite:

1. **CSS is global and unscoped.** `index.css`'s bare `button {}`, `.card`,
   `.btn-primary` already reach `src/modules/**` and `src/scene/**`. Restyling them
   leaks into the locked Tradecraft case. The CRT menu look is scoped under `.crt` for
   exactly this reason — keep it that way.
2. **Never rename storage identifiers.** Dexie db `keep-yapping`, localStorage `ky-*`.
   Existing devices keep their session logs.
3. **Pages green build + red deploy** → check
   Settings → Environments → github-pages → Deployment branches. Not the Pages source.
4. **Install Playwright browsers from inside `app/`**, never globally — a version
   mismatch fails all 11 e2e with a misleading "Executable doesn't exist".
5. **Node is root-owned** (`/usr/local`, from the nodejs.org installer), so every
   `npm install -g` fails with EACCES. Never suggest `sudo npm install -g`. Local
   installs into `app/node_modules` are fine.
6. **Homebrew is at `/opt/homebrew/bin`**, on PATH only via `~/.zshrc`, which
   non-interactive shells don't source. `gh` may need a full path.
7. **e2e accessible names are a contract.** 42 of them. Restyle freely; don't rename,
   re-role, or remove. `.sr-only` is a legitimate way to keep a name.

## Strategy, so nobody re-litigates it

**The app is FREE.** The goal is adoption — therapists actually using it — with grant
funding and possible acquisition as the upside. Monetization is not the plan. The
earlier free-base + paid-module-packs hypothesis is dead, and with it the verified
Apple blocker that killed it (IAP can't be bought through Apple School Manager and
breaks on device-assigned school iPads). Modules ship for efficacy and adoption
reasons, not as revenue units. The July 2026 market dossier retains value only for its
grant-fit and channel findings.
