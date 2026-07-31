# Vantage Point (vantage-point, lens: game)

Tagline: A leaked photo, four watchers — stand in their shoes to burn the vantage it was taken from.
Primary: expressive / secondary: pragmatics, receptive
Minutes: {"1":4,"2":5,"3":6}

Core loop: The Agent sees an overhead plaza map — landmarks plus animal-coded watcher tokens, each with a facing arrow — and a stamped dossier name. The Handler's printed LEAK DOSSIER for that name is a numbered flow of perspective checks ("From the FOX's spot, is the fountain on THEIR left or THEIR right?") whose branches the Agent cannot see. Each check forces the Agent to mentally stand at a watcher, shift frames, and give an owned answer ("on their left — not mine"), which the Handler uses to walk the flow toward the one vantage that could have produced the leaked photo. The Agent taps that watcher and confirms with a BURN stamp; wrong accusations are the only strikes, so tension comes from consequence, never a clock. Every branch is a suspect-elimination beat, and the click is the accusation landing on a watcher the very first question seemed to clear.

---

# Vantage Point — design spec

Perspective-taking module for Say Again?. Ships behind a **pilot flag** (visible in the mission
builder as "PILOT") until the classroom load measurements in §10 clear it — per the research
shortlist's explicit caution.

---

## 1. Concept & fiction

**Codename:** Vantage Point
**Tagline (mission builder):** "A leaked photo, four watchers — stand in their shoes to burn the vantage it was taken from."

The opposition just published a surveillance photograph of your dead drop. Somebody's window sold
you out. HQ's photo lab tore the frame apart — shadows, sightlines, what's left of what — and
compressed the analysis into a **LEAK DOSSIER**: a numbered questionnaire that, answered from the
live plaza, pins down the *only* vantage point the photo could have been taken from. The Handler
holds the dossier. The Agent holds the periscope feed: an overhead map of the plaza with its
landmarks and the known watchers — codenamed FOX, OWL, CAT, CROW — each frozen mid-shift, facing
the way their arrow points. Answer every check *through the watcher's eyes*, find the traitor
vantage, and burn it.

It is a whodunit: each answered check eliminates suspects, the pair feels the net closing, and the
final accusation is the click. The load-bearing move — the thing the fun is impossible without —
is the perspective shift itself: no check in any dossier can be answered from the Agent's own
bird's-eye frame, and the Handler cannot compute a single answer without the Agent's shifted
description crossing the gap.

**Original IP note:** plaza, animal-coded watchers, leak-dossier fiction, all prose original.
Asymmetric-manual genre only; no external names, assets, or trade dress.

## 2. What the Agent sees

A single screen, minimal text, everything visual:

- **Header strip:** the dossier name stamped like a file label — e.g. `LEAK DOSSIER K` — plus the
  shell's standard strike pips / STATIC badge. This is the only required reading.
- **The plaza:** a 7×7 grid drawn as worn paving stones (faint grid lines are deliberate — they let
  the Agent *count squares* for distance checks). The map has **no printed coordinates and no
  compass** — a deliberate choice so descriptions stay in natural spatial language ("near the top,
  left of the fountain") instead of coordinate call-outs that would bypass the therapy.
- **Landmarks:** 4–6 large monochrome icon objects from a fixed set (fountain, statue, kiosk,
  lamp post, phone box, park bench), one per cell, each visually distinct by shape (never
  color-coded).
- **Watcher tokens:** 3–4 round badges, each showing an animal glyph (fox / owl / cat / crow) and a
  bold **arrow wedge** showing which way that watcher faces. Tokens are ≥64 px touch targets.
- **View-cone scaffold (the SLP-visible load lever, see §5):** at Rookie, tapping a watcher token
  toggles a soft amber quarter-wedge showing the half-plane in front of them; at Agent tier the
  wedge shows only while the finger is held down; at Mastermind it is off. The cone shows *what is
  ahead* — it never reveals left vs right, so it scaffolds grounding without doing the rotation
  for the student.
- **Accusation flow:** tapping a watcher token arms it (ring highlight + a red `BURN?` stamp slides
  in beside it). Tapping the stamp commits the accusation. Tapping a different watcher re-arms.
  Tapping landmarks just wiggles them. Two-step commit prevents accidental strikes.

On a correct burn the token gets a satisfying red `BURNED` overstamp and the module solves. On a
wrong burn the shell registers a strike and the plaza stays exactly as it was.

## 3. What the Handler has (rule tables — the actual data)

All tables live in `rules.ts` with `standard` and `simplified` prose per row; the manual generator
and the solver both consume them, exactly as in Bad Intel / Asset Interview.

### 3.1 Watcher tokens (`WATCHERS`)

| id | label | standard (how to spot it) | simplified |
|---|---|---|---|
| fox | FOX | A round token with a fox face; the arrow wedge shows where the fox is looking. | A circle with a fox. The arrow shows where it looks. |
| owl | OWL | A round token with an owl face and its facing arrow. | A circle with an owl and an arrow. |
| cat | CAT | A round token with a cat face and its facing arrow. | A circle with a cat and an arrow. |
| crow | CROW | A round token with a crow head and its facing arrow. | A circle with a crow and an arrow. |

### 3.2 Landmarks (`LANDMARKS`)

| id | label | standard | simplified |
|---|---|---|---|
| fountain | fountain | A round basin with a spray plume in the middle. | A round pool with water. |
| statue | statue | A figure standing on a square plinth. | A person made of stone. |
| kiosk | kiosk | A small hut with a striped awning. | A little shop hut. |
| lamp | lamp post | A tall pole with a lamp head. | A tall street light. |
| phonebox | phone box | A narrow booth with square windows. | A phone booth. |
| bench | park bench | A low bench with slats. | A bench to sit on. |

### 3.3 The Shoes Rule (`SHOES_RULE` — the printed rule that makes the module)

- **standard:** "Every LEFT and RIGHT in a dossier belongs to the WATCHER, never to the Agent. The
  Agent checks by standing in the watcher's shoes: face the way the arrow faces, then decide which
  hand the landmark falls on. An answer without an owner — a plain 'it's on the left' — is not an
  answer. Ask: whose left?"
- **simplified:** "LEFT and RIGHT mean the watcher's left and right. Not yours. Pretend to stand
  where the watcher stands. Face the way the arrow points. Then answer. Always say 'their left'
  or 'their right'."

### 3.4 Check kinds (`CHECK_KINDS` — question templates; `{…}` filled from the dossier row)

| id | name | tiers | standard template | simplified template | answers |
|---|---|---|---|---|---|
| side1 | SIDE CHECK | 1+ | From the {watcher}'s spot, is the {landmark} on their LEFT or their RIGHT? | Stand in the {watcher}'s shoes. Is the {landmark} on their left or their right? | THEIR LEFT / THEIR RIGHT |
| depth | DISTANCE CHECK | 2+ | Which is farther ahead of the {watcher}: the {A} or the {B}? Count grid squares the way the arrow points. | Which one is farther in front of the {watcher}: the {A} or the {B}? Count the squares. | {A} / {B} |
| side2 | FRAME CHECK | 3 | Looking out through the {watcher}'s eyes, is the {A} to the left or to the right of the {B}? | Look the way the {watcher} looks. Is the {A} on the left of the {B}, or on the right? | LEFT OF / RIGHT OF |
| sight | SIGHT LINE | 3 | The {watcher} stares straight along their arrow. Is the {landmark} in CLEAR view, or BLOCKED by something in between? Only landmarks block a view; watchers never do. | Look straight along the arrow. Can the {watcher} see the {landmark}? Say CLEAR or BLOCKED. Only landmarks block. | CLEAR / BLOCKED |

### 3.5 Tier notes (`TIER_NOTES` — the load ramp, printed where the SLP and Handler see it)

| tier | tone | standard | simplified |
|---|---|---|---|
| 1 | warning | Rookie plazas are set gentle on purpose: every watcher's arrow points at the left or right edge of the map — one quarter-turn from the way you read it — and every check names one landmark at a time. If left and right still tangle here, stay here; this module climbs fast. | Rookie watchers only look toward the sides of the map. Each question is about one thing. Take your time. |
| 2 | tip | Agent plazas add watchers who face the bottom of the map — a full about-face from the reader. That is the hard one: their left is your right. Distance checks also start here. | A watcher can now face the bottom of the map. Their left is your right. Be careful. |
| 3 | — | *(no note — Mastermind handlers work from the glossary alone)* | — |

### 3.6 Dossiers (`DOSSIERS` — 2 per tier, printed as numbered flows; forward-only, `goTo > self`)

**Rookie tier — complete.**

**DOSSIER K** (3 watchers: fox, owl, cat; landmarks referenced: fountain, statue, kiosk)

| step | check | on first answer | on second answer |
|---|---|---|---|
| 1 | SIDE CHECK — FOX / fountain | THEIR LEFT → step 2 | THEIR RIGHT → step 3 |
| 2 | SIDE CHECK — OWL / statue | THEIR LEFT → **burn the OWL** | THEIR RIGHT → **burn the FOX** |
| 3 | SIDE CHECK — OWL / kiosk | THEIR LEFT → **burn the CAT** | THEIR RIGHT → step 4 |
| 4 | SIDE CHECK — CAT / fountain | THEIR LEFT → **burn the FOX** | THEIR RIGHT → **burn the OWL** |

**DOSSIER L** (3 watchers; landmarks referenced: lamp post, kiosk, statue)

| step | check | on first answer | on second answer |
|---|---|---|---|
| 1 | SIDE CHECK — CAT / lamp post | THEIR LEFT → step 2 | THEIR RIGHT → step 3 |
| 2 | SIDE CHECK — FOX / kiosk | THEIR LEFT → **burn the FOX** | THEIR RIGHT → **burn the CAT** |
| 3 | SIDE CHECK — FOX / statue | THEIR LEFT → step 4 | THEIR RIGHT → **burn the OWL** |
| 4 | SIDE CHECK — OWL / lamp post | THEIR LEFT → **burn the CAT** | THEIR RIGHT → **burn the FOX** |

Leaf prose (generated per leaf): standard "Only the {watcher}'s vantage matches the leaked frame.
The Agent taps the {watcher}, then the BURN stamp." / simplified "The leak is the {watcher}. Tap
the {watcher}. Then tap BURN."

**Agent tier — structure:** DOSSIERS M and N; 4 watchers (adds CROW), 5 steps, mix of SIDE and
DISTANCE checks, all four watchers appear as leaves. Sample rows from DOSSIER M:

| step | check | branches |
|---|---|---|
| 1 | SIDE CHECK — CROW / fountain | THEIR LEFT → 2 · THEIR RIGHT → 3 |
| 2 | DISTANCE CHECK — FOX / statue vs kiosk | STATUE farther → **burn the CROW** · KIOSK farther → 4 |
| 4 | DISTANCE CHECK — CAT / fountain vs phone box | FOUNTAIN farther → **burn the OWL** · PHONE BOX farther → 5 |

**Mastermind tier — structure:** DOSSIERS P and R; 4 watchers, 6 landmarks, 5–6 steps drawing on
all four check kinds (SIGHT LINE and FRAME CHECK only exist here). Sample rows from DOSSIER P:

| step | check | branches |
|---|---|---|
| 1 | SIGHT LINE — OWL / fountain | CLEAR → 2 · BLOCKED → 3 |
| 2 | FRAME CHECK — CROW / statue vs kiosk | STATUE to the LEFT of it → 4 · to the RIGHT → **burn the OWL** |
| 5 | SIDE CHECK — FOX / bench | THEIR LEFT → **burn the CROW** · THEIR RIGHT → **burn the CAT** |

Authoring invariant (unit-tested): within one dossier, no (watcher, landmark-set) query repeats,
so branch outcomes are geometrically independent and every leaf is reachable (see §6).

### 3.7 Ramp levers as data (SLP-visible, all in `rules.ts`)

```ts
export const FACINGS_BY_DIFFICULTY   = { 1: ['E','W'], 2: ['E','W','S'], 3: ['N','E','S','W'] };
export const CHECKS_BY_DIFFICULTY    = { 1: ['side1'], 2: ['side1','depth'], 3: ['side1','depth','side2','sight'] };
export const WATCHER_COUNT           = { 1: 3, 2: 4, 3: 4 };
export const LANDMARK_COUNT          = { 1: 4, 2: 5, 3: 6 };
export const CONE_SCAFFOLD           = { 1: 'toggle', 2: 'hold', 3: 'off' } as const;
```

### 3.8 Handler working steps (`WORKING_STEPS`, both editions; standard shown)

1. Before opening the dossier, ask for the full plaza walk: every landmark, every watcher, where
   each stands and which way its arrow points.
2. Find the dossier named at the top of the Agent's screen. Read the current check exactly as
   printed.
3. Only accept an owned answer — "their left," "their right." A plain "left" gets one reply:
   "Whose left?"
4. If an answer comes back instantly, test it: "Face the way the arrow faces — still sure?"
5. Follow the branch for that answer. At a burn line, name the vantage by its animal — never by
   pointing.
6. *(warning callout)* Burning the wrong vantage is a wrong answer, and the plaza does not change.
   Checks cost nothing — re-ask, re-answer, re-walk the shoes as many times as it takes.

## 4. The conversation loop (annotated Rookie transcript)

Instance: the §9 worked example (DOSSIER K). STATIC badge lit — one repair drill on this module.

> **H:** Before I open the dossier — walk me around the whole plaza. Everything you see.
> **A:** There's a fountain and some animals with arrows.
> **H** *(Static Protocol, scripted, answers the FIRST description only):* Say again — that didn't
> come through. Tell it to me piece by piece.
> **A** *(rephrase forced — expressive, listener-adapted):* Okay. The fountain is near the top,
> a little right of the middle. A statue is left of the middle, and the kiosk is below the statue.
> A lamp post sits by the right edge. Watchers: a fox on the left side with its arrow pointing
> toward the lamp-post side. An owl low on the right, arrow pointing back toward the kiosk. A cat
> at the bottom left, arrow pointing the same way as the fox.
> **H:** Got it. Dossier K, check one: from the FOX's spot, is the fountain on THEIR left or THEIR
> right?
> **A:** It's on the right.
> **H** *(manual step 3 — frame-collision repair, the module's signature exchange):* Whose right —
> yours or the fox's?
> **A** *(the perspective shift, out loud):* …mine. Hold on. Standing in the fox's shoes — the fox
> faces toward the lamp post, and the fountain is up on the top side of its arrow… that's the
> fox's LEFT. On **their** left.
> **H** *(follows LEFT → step 2):* Their left. Next check: from the OWL's spot, is the statue on
> THEIR left or THEIR right?
> **A** *(self-initiated frame marking — the target behavior generalizing):* The owl faces the
> other way, toward the statue side. Facing that way, the top of the map is the owl's right hand.
> The statue is above the owl's line — so on **their** right.
> **H** *(step 2, THEIR RIGHT → leaf):* Then only the FOX's vantage matches the leaked frame. Tap
> the fox, then the burn stamp.
> **A:** The fox?! Its first answer looked clean… *(taps FOX, taps BURN — solved.)*

What got forced: a rich multi-referent scene description (Static-compatible by design — the first
description is never "it's a 7"), two full perspective shifts spoken aloud, one Handler-probed
frame repair, and owned spatial vocabulary ("their left") as the price of progress.

## 5. Difficulty tiers

| | Rookie (1) | Agent (2) | Mastermind (3) |
|---|---|---|---|
| Rotation demanded | 90° only (arrows point at left/right map edges) | adds 180° mirror (arrows may point at bottom edge) | any of four facings |
| Check kinds | SIDE only, **single referent** | + DISTANCE (two referents, count-the-squares) | + FRAME (two referents through the vantage) and SIGHT LINE (level-1 "what can they see", with occluders) |
| Watchers / landmarks | 3 / 4 | 4 / 5 | 4 / 6 |
| Dossier depth (checks to a leaf) | 2–3 (4 steps total) | 3–4 (5 steps) | 4–5 (5–6 steps) |
| View-cone scaffold | tap-to-toggle | hold-to-peek | off |
| Minutes | **4** | **5** | **6** |

Each lever is a data row (§3.7), each tier's delta is printed as a TIER_NOTE (§3.5), and the
mission builder shows the tier notes — the ramp is visible to the SLP in three places, not implied.

## 6. Generation & solvability

**State shape** (everything the Agent can see; nothing hidden — the verdict is derivable only via
the printed dossier, exactly like Asset Interview):

```ts
type Facing = 'N' | 'E' | 'S' | 'W';           // internal only; never printed
interface VantageState {
  dossier: DossierId;                            // stamped on screen, indexes the printed flow
  watchers:  { id: WatcherId; x: number; y: number; facing: Facing }[];
  landmarks: { id: LandmarkId; x: number; y: number }[];   // 7×7 grid, distinct cells
}
type VantageAnswer = WatcherId;                  // the burned vantage
```

**Geometric predicates** (in `logic.ts`, driven by the tables): with facing vector `f` and
left vector `l = rot90ccw(f)`, define `fwd(w,p) = f·(p−w)` and `lat(w,p) = l·(p−w)` (integers).

- `side1(w,L)`: LEFT iff `lat > 0`. **Well-posed iff** `fwd ≥ 1 ∧ |lat| ≥ 1`.
- `depth(w,A,B)`: farther = greater `fwd`. **Well-posed iff** both `fwd ≥ 1 ∧ |fwdA−fwdB| ≥ 2`.
- `side2(w,A,B)`: A left of B iff `lat(A) > lat(B)`. **Well-posed iff** both `fwd ≥ 1 ∧ |latA−latB| ≥ 2`.
- `sight(w,L)`: **well-posed iff** `lat(L)=0 ∧ fwd(L) ≥ 2`; BLOCKED iff some other landmark `M`
  has `lat(M)=0 ∧ 0 < fwd(M) < fwd(L)`. Watchers never block (printed rule, §3.4).

**generate(seed, difficulty):** seeded `mulberry32`; pick one of the tier's two dossiers; then a
deterministic bounded attempt loop: (a) place the tier's watchers on distinct cells with facings
drawn from `FACINGS_BY_DIFFICULTY`; (b) for each dossier step in order, place its referenced
landmark(s) by choosing uniformly (seeded) from the cells satisfying the *conjunction* of every
constraint that dossier places on that landmark (a landmark referenced by two steps must satisfy
both); for a SIGHT step, first flip a seeded coin for CLEAR/BLOCKED, then place or forbid the
in-between blocker accordingly; (c) fill remaining landmark slots with decoys on free cells kept
off any constrained sight ray; (d) verify **every step of the dossier is well-posed** (not just the
walked path) and all cells distinct — else next attempt. Same seed ⇒ same attempt sequence ⇒ same
instance, forever.

**Why exactly one defensible answer.** Every predicate is *total and strict* on well-posed input:
the well-posedness margins (`|lat| ≥ 1`, differences `≥ 2`, on-ray requirement) are generator
invariants, so no check can be a tie, a judgment call, or a "sort of dead ahead." Dossier flows
are forward-only (`goTo > step`, unit-tested), so `solve()` — walk the printed steps evaluating
each predicate from `state` — terminates at exactly one leaf, which is the unique answer
`validate()` accepts. The human Handler runs the *same* procedure because the question prose in
§3.4 is generated from the same rows the predicates implement, and the margins are chosen so the
human judgment (which side of the arrow line; count the squares; is anything on the straight line)
matches the sign computation with room to spare. Requiring *all* steps well-posed (not just the
solution path) means even a pair that answers a check wrong and wanders down the other branch
meets only answerable questions — errors surface at the accusation, never as an unanswerable
question.

**Tests (mirroring `badIntel/logic.test.ts`):** for 1000 seeds × 3 tiers: instance well-formed
(cells distinct, facings in tier pool, counts per §3.7); every dossier step well-posed with the
stated margins; `validate(state, solve(state))` true; wrong-watcher answers rejected; plus
**leaf coverage** — across the 1000 seeds every leaf of every dossier is reached (catches an
authoring edit that orphans a branch); plus byte-equal determinism over repeated generation.

## 7. Answer & validation model

The Agent answers checks *verbally* — the app validates only the accusation (Asset Interview
precedent). Tap a watcher token → armed ring + `BURN?` stamp → tap the stamp to commit.
`validate(state, watcherId)` is `watcherId === solve(state)`. A committed wrong burn is a strike
(1–3, SLP-set; default 1) and changes nothing on screen; landmark taps are inert; re-arming is
free. There are no other wrong-answer surfaces and no timer anywhere.

## 8. Static Protocol & hints

**Static fit:** the manual's step 1 demands a full plaza walk before the dossier opens, so the
Agent's first description is inherently rich (multiple landmarks, watcher stances, facings) —
scripted clarifications ("Say again — piece by piece", "Start from a different corner") have real
material to work on, and the rephrase practices exactly the scene-description skill the checks
then depend on.

**The three escalating hints (verbatim, communication-only):**

1. "Start wide: walk your Handler around the whole plaza — every landmark, every watcher, where
   each one stands and which way its arrow points."
2. "Left and right belong to the watcher, not to you. Say whose side you mean out loud — 'on the
   FOX's left, not mine' — and check it by facing the way the fox faces."
3. "Do the shoes trick, and narrate it: put a finger on the watcher, turn your other hand to match
   its arrow, and talk your Handler through what that watcher sees — what's straight ahead first,
   then which side each thing lands on."

## 9. Worked example (hand-built Rookie instance)

As `generate()` would emit (coords: x grows toward the right map edge, y toward the top; both 0–6):

```json
{ "moduleId": "vantage-point", "difficulty": 1, "seed": 4711,
  "state": {
    "dossier": "dossier-k",
    "watchers": [
      { "id": "fox", "x": 1, "y": 5, "facing": "E" },
      { "id": "owl", "x": 5, "y": 1, "facing": "W" },
      { "id": "cat", "x": 2, "y": 1, "facing": "E" } ],
    "landmarks": [
      { "id": "fountain", "x": 4, "y": 6 },
      { "id": "statue",   "x": 2, "y": 3 },
      { "id": "kiosk",    "x": 3, "y": 2 },
      { "id": "lamp",     "x": 6, "y": 3 } ] } }
```

Well-posedness audit (every step of DOSSIER K, walked or not): step 1 FOX(E)/fountain: fwd=3,
lat=+1 ✓; step 2 OWL(W)/statue: fwd=3, lat=−2 ✓; step 3 OWL(W)/kiosk: fwd=2, lat=−1 ✓; step 4
CAT(E)/fountain: fwd=2, lat=+5 ✓. Facings all E/W (Rookie pool) ✓; 3 watchers, 4 landmarks,
distinct cells ✓ (lamp is the unconstrained decoy).

Replaying the printed table: **Step 1** — FOX faces E, left = north; fountain lat=+1 > 0 ⇒
**THEIR LEFT** ⇒ go to step 2. **Step 2** — OWL faces W, left = south; statue lat=−2 < 0 ⇒
**THEIR RIGHT** ⇒ leaf: *burn the FOX*. `solve()` returns `"fox"`; the Agent taps the fox token,
taps BURN, `validate` accepts, module solved in two checks. (Had step 1 been answered
egocentrically as "right", the pair would walk 3 → 4 and accuse wrongly — the strike traces
cleanly back to one un-shifted answer, which is what the debrief talks over.)

## 10. Risks & open questions

- **Cognitive load is the headline risk — hence the pilot flag.** Even 90° shifts overload some
  students; the module's whole ramp rests on assumptions the shortlist says to verify first.
  **The classroom pilot must measure, per student per session (printed one-page tally sheet, one
  row per check):**
  1. *Egocentric substitution rate* — was the first answer in the watcher's frame or the
     student's? Gate: ≥60% first-answer correct-frame at Rookie by session two.
  2. *Repair success* — of flipped answers, share self-corrected after one "Whose left?" probe.
     Gate: ≥80%.
  3. *Stall rate* — answers taking >30 s (bucketed <10 / 10–30 / >30). Gate: <20% at Rookie.
  4. *Completion* — ≥80% of Rookie plays end in a correct burn within default strikes + hints.
  5. *Scaffold effect* — alternate cones-on / cones-off Rookie sessions; the error-rate delta
     validates (or kills) the cone as a load lever.
  6. *Static stacking* — pilot with `repairDrills=0` first; add Static only once solo error rate
     <25%, and watch whether a stacked clarification degrades accuracy on the *next* check.
  7. *Engagement* — replay requests and abandonment vs. the other nine modules.
  Ship gate: metrics 1 and 4 met for ≥3 students; failure fallback is a pre-tier patch
  (all arrows pointing up = 0° shift) added as data, not code.
- **Deferred error signal:** verbal check answers aren't app-validated, so an egocentric slip only
  surfaces at the accusation. Mitigated by short flows (2–3 checks at Rookie) and the mandatory
  "Whose left?" probe; pilot should watch for blame spirals between partners.
- **Perceptual margins:** `|lat| ≥ 1` is mathematically strict but a 1-cell offset at long range
  is visually thin; if pilot shows misreads, raise the margin to 2 in `rules.ts` (data change only).
- **Static opt-out:** the engine seeds which modules get STATIC; there is currently no per-module
  exclusion, which pilot step 6 wants. Open engine question (small flag on `ModuleDefinition`).
- **Leaf-coverage fragility:** a dossier edit could orphan a leaf; the coverage test (§6) is the
  guard and must ship with the module.
- **3D face:** the cone scaffold on the canvas face is untested; module ships on the 2D/DOM path
  first (the sanctioned fallback), face pass follows the hardware playtest like everything else.
- **Target taxonomy:** `TherapyTarget` has no perspective-taking value. Chosen primary:
  **expressive** — the countable behavior the SLP tallies is the Agent *producing*
  frame-of-reference-marked, listener-adapted spatial description ("on the fox's left, past the
  kiosk"); perspective-taking is the cognitive engine, but the observable language target is
  describing-and-directing. Secondary: **pragmatics** (frame collisions force "whose left?"
  repair) and **receptive** (precise parsing of the Handler's check wording).

## 11. Why this beats the obvious alternative

The obvious perspective-taking module is a barrier-game arrangement clone ("describe your side so
I can rebuild it") or a rotate-the-map task — the first has no decisions, no consequence, and no
click (it's an exercise wearing a trench coat), and the second does the mental rotation *for* the
student the moment the map turns. Vantage Point instead wraps the same drill in a whodunit with
elimination stakes: every shifted answer visibly narrows the suspects, a wrong frame doesn't just
lose a point — it burns the wrong watcher, and the reveal regularly lands on a vantage the first
check seemed to clear, which is exactly the kind of twist high-schoolers replay for. Meanwhile the
therapy is unfakeable: no dossier branch can be taken until a perspective-shifted, frame-owned
description crosses the table, the ramp that the research demands is literal data rows an SLP can
read, and the honest pilot flag turns the shortlist's caution into a measurement plan instead of a
shrug.
