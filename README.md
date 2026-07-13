# Say Again?

An original two-player cooperative communication game built for high-school speech-language
therapy — styled as playful spy missions.

**The premise:** the *Field Agent* holds an iPad and sees the puzzles. The *Handler* holds a
printed Field Manual and sees the rules. Neither has the whole picture. The only way through
is to talk it out — describing precisely, following multi-step directions, asking clarifying
questions, and repairing misunderstandings. That information gap *is* the therapy.

## What's here

| Path | What it is |
|---|---|
| `app/` | The game — Vite + React + TypeScript, wrapped for iOS with Capacitor |
| `app/ios/` | Xcode project for App Store submission |
| `manual/build/` | Generated printable manual HTML (intermediate) |
| `manuals/` | **Printable Field Manual PDFs** — standard + easy-read editions |
| `docs/` | Privacy policy, App Store submission guide, SLP quick-start |

## For the SLP

- **Mission builder:** pick puzzles by communication goal (following directions, describing,
  clarifying/repair, vocabulary), set difficulty per puzzle, choose a pace (no timer by
  default), and start.
- **Mission codes:** every mission has a code like `FOX-492`. The same code always rebuilds
  the exact same puzzles — replay after a breakdown, or share with a colleague.
- **Data:** a discreet tally overlay (correct / prompted / incorrect per student) plus
  automatic per-puzzle logs. Everything stays on-device; export CSV from the Logbook.
  No accounts, no cloud, no student PII (use initials).
- **Manuals:** print `manuals/field-manual-standard.pdf` (~7th–9th grade reading level) or
  `manuals/field-manual-easy-read.pdf` (~3rd–5th grade). Same puzzles, different reading load.

## Development

```bash
cd app
npm install
npm run dev        # play in a browser
npm test           # engine + module property tests (robot-Handler suites)
npm run typecheck
npm run manual     # regenerate manual HTML + PDFs
npm run build      # production web build
npx cap sync ios   # push web build into the Xcode project
```

### Architecture: rules as data

Every puzzle module keeps its rules in `rules.ts` as typed data. The game engine evaluates
that data to check answers, and the manual generator renders the *same data* to printable
prose — so the printed manual can never drift from app behavior. Property tests
("robot Handler") solve thousands of seeded puzzle instances per module using only the rule
data and assert the app accepts every derived answer.

Modules implement the `ModuleDefinition` contract in `app/src/engine/types.ts`:
`generate(seed, difficulty)` / `solve(state)` / `validate(state, answer)` / `Component` /
`manual` (structured content, standard + simplified editions).

## App Store

See `docs/APP_STORE_SUBMISSION.md` for the step-by-step guide (Mac + Xcode required for
signing and upload). App Store metadata lives in `docs/APP_STORE_METADATA.md`.

## A note on originality

This game is an original work in the cooperative asymmetric-information genre. All puzzle
designs, rules, manual text, art, and theme are original to this project.
