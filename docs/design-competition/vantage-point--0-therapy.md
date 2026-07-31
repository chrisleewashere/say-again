# Vantage Point (vantage-point, lens: therapy)

Tagline: See the room the way the camera sees it — the drop is wherever the lens says it is.
Primary: pragmatics / secondary: expressive, receptive
Minutes: {"1":3,"2":5,"3":6}

Core loop: The Agent sees an overhead blueprint of a room: four landmark walls (door, window, shelf, vent), four objects with stencil letters, one object wearing tag brackets, and one wall-mounted camera with a visible view-fan. The Handler's manual holds SIGHTLINE protocol cards whose every question is phrased from the camera's point of view — "from the camera's view, is the tagged object on its LEFT or its RIGHT?" — so the pair can only advance if the Agent verbally adopts the camera's frame and the Handler maps the answer through the printed card. The probe's answer branches to a terminal selector (nearest/farthest/camera-leftmost/...) that names exactly one object; the Agent taps it and commits with MARK DROP. Rookie is a single 90-degree, single-referent judgment with a printed compass scaffold the Handler reads only after the Agent tries; Mastermind adds the 180-degree mirror wall and a recorded-frame probe answered from a ghost position rather than the live room. The module ships behind an SLP pilot flag with named load metrics.

---

# Vantage Point — design spec

Module id: `vantage-point` · Codename: **Vantage Point** · Tagline: *"See the room the way the camera sees it — the drop is wherever the lens says it is."*

**Primary TherapyTarget: `pragmatics`.** Perspective-taking is a social-cognition/pragmatics domain in SLP practice: the load-bearing move is adopting a viewpoint that is not your own and marking it in language ("from the camera's view, ITS left…"). The mission-builder label for pragmatics ("Clarifying & repair") is an imperfect fit, but every probe answer here is a presupposition-managed utterance and the coach's-order design (ask first, scaffold second) makes prompted-vs-independent repair the thing the tally measures — squarely pragmatics. Secondary: `expressive` (spatial describing with landmarks), `receptive` (following the protocol's framed directions). **Ships behind an SLP "Pilot modules" settings toggle, default off** — honest about the research shortlist's cognitive-load caution; the pilot metrics are in section 10.

The design was written dialogue-first. The exchange we want to hear, and which the mechanic exists to force:

> A: "The camera's on the vent wall, looking across at the shelf wall."
> H: "From the camera's point of view — is the tagged statue on its LEFT or its RIGHT?"
> A: "If I stand where the camera is and face the shelf wall… my left hand points at the door wall. The statue's on the door side. So — its LEFT."

Neither line can happen without the other player. That's the module.

---

## 1. Concept & fiction

A gallery safehouse is under surveillance — by our own side. HQ hid tonight's dead drop under one of the objects in the room, and to keep couriers honest, the pickup instructions are encoded **from the security camera's point of view**, not the courier's. The Field Agent has the room's overhead blueprint on the case screen; the Handler has the printed **SIGHTLINE PROTOCOL** cards. Only by describing the room *as the camera sees it* can the pair decode which object hides the drop. Mark the wrong object and the courier walks into a watched pickup.

Original IP: landmark-walled blueprint, view-fan camera, stencil-lettered set dressing, "sightline protocol" fiction — no resemblance to any existing title's content or trade dress.

## 2. What the Agent sees

A single overhead blueprint filling the plate face — almost no text, everything visual and fat-fingered for iPad:

- **A 4×4 tile room.** Each of the four walls carries a fixed, always-identical landmark glyph drawn on the wall itself: **DOOR** (bottom edge), **WINDOW** (top edge), **SHELF** (left edge), **VENT** (right edge). These are the shared vocabulary — the pair talks in landmarks, not deixis, so the manual never depends on screen orientation and physically rotating the iPad (a taught scaffold, see section 8) never desyncs the language.
- **Four objects** on tiles (statue, crate, vase, lamp, radio, globe — 4 sampled per seed), each a bold distinct silhouette with a large **stencil letter** painted on it (describable flavor, like Bad Intel's settings; the rules never use letters). Placement is "rook-style": no two objects share a row or a column.
- **One object wears pulsing tag brackets** — the corner-reticle "TAGGED" referent.
- **One wall-mounted camera**: a housing glyph seated in a wall, with a translucent **view-fan** spreading into the room so its facing is unmistakable. It sits at one of four positions along its wall.
- **Mastermind only, some protocols:** the camera shows a small **REC ●** film-frame badge, and the tagged object has a **ghost outline** on another tile with a dashed arrow to its current spot — where it stood when the camera took its last-sweep photo.
- **Header strip:** the protocol name, e.g. `SIGHTLINE A` (the only meaningful text, mirroring Bad Intel's `SERVICE MODEL C`).
- **Interaction:** tap an object to select (it highlights with a target ring); a **MARK DROP** bar at the bottom commits. Two-step commit prevents accidental strikes. Nothing else is tappable.

`faceplate`: standard single slot. Every element gets an aria-label from the same `describeObject()` strings the manual language uses (Bad Intel pattern).

## 3. What the Handler has — the rule tables

All tables live in `rules.ts` as typed data; the solver and both manual editions generate from them. Shapes:

```ts
export type Wall = 'door' | 'window' | 'shelf' | 'vent';
export type ProbeId = 'side-tagged' | 'half-tagged' | 'recorded-side-tagged';
export type SelectorId = 'nearest' | 'farthest' | 'cam-leftmost' | 'cam-rightmost';
export type FilterId = 'keep-near-half' | 'keep-far-half';
export interface Plan { filter?: FilterId; selector: SelectorId }
export interface Protocol {
  id: string; name: string; difficulty: Difficulty;
  cameraWalls: readonly Wall[];        // the load ramp, AS DATA
  probe: ProbeId;
  branches: { a: Plan; b: Plan };      // a = LEFT/NEAR, b = RIGHT/FAR
}
```

### Table 1 — CAMERA COMPASS (`FACING_RULES`) — complete

One row per wall; total (tested like Bad Intel's step-rule totality). The window row is printed with all the others — the manual is one chapter; the ramp lives in which walls protocols may use.

| wall | faces | its LEFT | its RIGHT | standard prose | simplified prose |
|---|---|---|---|---|---|
| door | window | shelf | vent | "A camera on the DOOR wall looks across at the window wall — the same way the Agent reads the plan. Its LEFT is the SHELF wall, its RIGHT is the VENT wall." | "Camera on the DOOR wall: its left is the SHELF wall. Its right is the VENT wall." |
| shelf | vent | window | door | "A camera on the SHELF wall looks across at the vent wall. Face that way yourself and your left arm points at the WINDOW wall — that is the camera's LEFT; the DOOR wall is its RIGHT." | "Camera on the SHELF wall: its left is the WINDOW wall. Its right is the DOOR wall." |
| vent | shelf | door | window | "A camera on the VENT wall looks across at the shelf wall. Its LEFT is the DOOR wall, its RIGHT is the WINDOW wall." | "Camera on the VENT wall: its left is the DOOR wall. Its right is the WINDOW wall." |
| window | door | vent | shelf | "A camera on the WINDOW wall looks straight back at the Agent's way of reading the plan — everything is mirrored. Its LEFT is the VENT wall, its RIGHT is the SHELF wall." | "Camera on the WINDOW wall: everything flips. Its left is the VENT wall. Its right is the SHELF wall." |

Rendered with a `figure` block per row: a tiny plan showing the camera, its view-fan, and L/R arrows.

**COACH'S ORDER callout (both editions, tone: warning)** — the graduated-prompting rule that keeps the compass from deleting the therapy:
- standard: "Ask every camera question FIRST and let the Agent work it out aloud. Only if the Agent is stuck — or you doubt the answer — read the matching compass row out loud, then ask again. On the tally that second answer counts as prompted, not independent."
- simplified: "Ask the question first. Let your partner think out loud. If they are stuck, read them the compass row. Then ask again."

### Table 2 — PROBE QUESTIONS (`PROBE_RULES`) — complete

| id | semantics | standard prose (Handler reads aloud) | simplified prose |
|---|---|---|---|
| `side-tagged` | sign of (tagged lateral − camera offset) in the camera frame | "Ask: from the camera's point of view, is the TAGGED object on the camera's LEFT or on its RIGHT?" | "Ask: does the camera see the tagged object on its left, or on its right?" |
| `half-tagged` | tagged depth 1–2 vs 3–4 from camera wall | "Ask: counting floor tiles out from the camera's wall, is the TAGGED object in the NEAR half of the camera's view (tiles 1 and 2) or the FAR half (tiles 3 and 4)?" | "Ask: is the tagged object close to the camera's wall (1 or 2 tiles) or far from it (3 or 4 tiles)?" |
| `recorded-side-tagged` | as `side-tagged`, evaluated at the ghost cell | "Ask: in the camera's RECORDED frame — the last-sweep photo, where the tagged object still stands at its ghost outline — was the tagged object on the camera's LEFT or its RIGHT?" | "Ask about the photo, not now: in the photo, was the tagged object on the camera's left or right? The photo shows it at the ghost outline." |

### Table 3 — SELECTORS & FILTERS (`SELECTOR_RULES`, `FILTER_RULES`) — complete

| id | semantics | standard prose | simplified prose |
|---|---|---|---|
| `nearest` | min depth (tiles from camera wall; adjacent tile = 1) | "The drop is the object standing FEWEST tiles from the camera's wall. Have the Agent count tiles for each object." | "Find the object closest to the camera's wall. Count the tiles." |
| `farthest` | max depth | "The drop is the object standing MOST tiles from the camera's wall." | "Find the object farthest from the camera's wall." |
| `cam-leftmost` | min lateral toward camera's LEFT wall | "Use the compass row to name the camera's LEFT wall. The drop is the object closest to that wall." | "Find the camera's LEFT wall on the compass. The drop is the object closest to that wall." |
| `cam-rightmost` | mirror of above | "Name the camera's RIGHT wall from the compass. The drop is the object closest to that wall." | "Find the camera's RIGHT wall. The drop is the object closest to that wall." |
| `keep-near-half` (filter) | keep depth ≤ 2 | "First cross off every object in the FAR half — keep only objects 1 or 2 tiles from the camera's wall. Two objects always remain." | "Keep only the objects close to the camera's wall (1 or 2 tiles). Ignore the rest." |
| `keep-far-half` (filter) | keep depth ≥ 3 | "Keep only objects 3 or 4 tiles from the camera's wall." | "Keep only the far objects (3 or 4 tiles). Ignore the rest." |

### Table 4 — SIGHTLINE PROTOCOLS (`PROTOCOLS`)

**Rookie — complete (3 protocols).** Camera walls: door, shelf, vent (0° and 90° only — never the window mirror). One probe, one selector, single tagged referent, branch pairs are opposite extremes on one axis (so the two branches always name different objects — the perspective judgment is always load-bearing).

| id | name | cameraWalls | probe | LEFT/NEAR branch | RIGHT/FAR branch |
|---|---|---|---|---|---|
| `sightline-a` | SIGHTLINE A | door, shelf, vent | `side-tagged` | `nearest` | `farthest` |
| `sightline-b` | SIGHTLINE B | door, shelf, vent | `side-tagged` | `farthest` | `nearest` |
| `sightline-c` | SIGHTLINE C | door, shelf, vent | `half-tagged` | `nearest` | `farthest` |

Manual rendering (generated from the rows), standard edition, SIGHTLINE A: "Ask the side question about the tagged object. If the Agent answers LEFT: the drop is the object nearest the camera's wall. If RIGHT: the object farthest from it." Simplified: "Ask: left or right? LEFT → closest object to the camera's wall. RIGHT → farthest object."

**Agent tier — sketch (structure above + sample rows).** 90° walls only; adds two-step plans and camera-frame L/R superlatives across all four objects:

| id | name | cameraWalls | probe | LEFT/NEAR branch | RIGHT/FAR branch |
|---|---|---|---|---|---|
| `sightline-d` | SIGHTLINE D | shelf, vent | `side-tagged` | filter `keep-near-half` → `cam-leftmost` | filter `keep-far-half` → `cam-leftmost` |
| `sightline-e` | SIGHTLINE E | shelf, vent | `side-tagged` | `cam-rightmost` | `cam-leftmost` |
| `sightline-f` | SIGHTLINE F | shelf, vent | `half-tagged` | filter `keep-far-half` → `cam-rightmost` | filter `keep-near-half` → `cam-rightmost` |

**Mastermind — sketch.** Adds exactly one new load per protocol, never both at once (pilot compares them):

| id | name | cameraWalls | probe | LEFT/NEAR branch | RIGHT/FAR branch |
|---|---|---|---|---|---|
| `sightline-g` | SIGHTLINE G | window | `side-tagged` | `cam-rightmost` | `cam-leftmost` |
| `sightline-h` | SIGHTLINE H | shelf, vent | `recorded-side-tagged` | `nearest` | `farthest` |
| `sightline-i` | SIGHTLINE I | window | `half-tagged` | filter `keep-near-half` → `cam-leftmost` | filter `keep-far-half` → `cam-leftmost` |

### Table 5 — RECORDED FRAME rule (`RECORDED_RULE`, Mastermind; the Bad-Intel-style exception block)

- standard: "Some protocols ask about the camera's RECORDED frame — its last-sweep photo. The Agent's plan shows the tagged object's old position as a ghost outline. Recorded questions are answered from the GHOST position; every other question is answered from the room as it stands NOW. The photo and the room always disagree about which side the tagged object is on — that disagreement is the whole point."
- simplified: "REC questions are about the photo, not now. In the photo the tagged object was at the ghost outline. Answer REC questions from the ghost. Answer all other questions from where things are now."

### Table 6 — TIER SCAFFOLD NOTES (`TIER_NOTES`) — the SLP-visible load ramp

| tier | tone | standard | simplified |
|---|---|---|---|
| 1 | tip | "Rookie cameras never hang on the window wall, and every card asks one question about the tagged object only. If left-and-right stalls out, coach the strategy: have the Agent turn the whole case so the camera's wall is nearest their body — then the camera's left IS their left. Fade this as soon as you can." | "Stuck on left and right? Turn the iPad so the camera's wall is closest to you. Now its left is your left." |
| 2 | tip | "This tier compares ALL objects from the camera's frame and chains two steps. Keep the coach's order: question first, compass row second." | "Ask first. Read the compass only if your partner is stuck." |
| 3 | — (null) | *(no note — spotting the mirror and the photo unprompted is the point)* | |

The manual chapter also opens with a generated **LOAD LADDER** table (one row per tier: "what's new here"), so the ramp is visible to the SLP on paper, not just in play.

## 4. The conversation loop — annotated Rookie transcript

Instance: SIGHTLINE A; camera on the **vent** wall, offset row 2; crate-V (shelf/window corner), lamp-R (center), **statue-K tagged**, vase-M (door/vent corner). Static Protocol: 1 repair drill on this module. Full geometry in section 9.

1. **H:** "Vantage Point. Before anything — the room report: which wall has the camera, and what's in the room?" *(the manual's step 1 forces a rich first description — Static-compatible by design)*
2. **A:** "There's a camera and four things." *(insufficient first description)*
3. **H** *(Static Protocol script, round 1)*: "Say again? I need more than that." *(scripted neutral clarification request)*
4. **A:** "OK — the camera hangs on the vent wall, a bit up from the middle, and its fan points across at the shelf wall. Near the window-shelf corner there's a crate with a V. A lamp with an R in the middle. Under the lamp, a statue with a K — that one has the flashing tag brackets. And a vase with an M down in the door corner right under the camera." *(repair: rephrased with landmarks, positions, and the tagged referent — the tally-able revision)*
5. **H:** "Copy: camera on the vent wall, tag on the statue. What protocol name is printed at the top?" *(information request)*
6. **A:** "SIGHTLINE A."
7. **H** *(reads the card, probe FIRST per coach's order)*: "From the camera's point of view — is the tagged statue on the camera's LEFT, or on its RIGHT?" *(the load-bearing perspective probe; the Handler cannot answer it, the Agent cannot know it matters)*
8. **A:** "From the camera… it's on the vent wall looking at the shelf wall. If I stand where the camera is and face that way, my left hand points at the door wall. The statue is on the door side of the camera. So — its LEFT." *(spoken frame-shift reasoning; SLP tallies independent-correct. If the Agent stalls, the Handler reads the vent compass row aloud and re-asks — tallied prompted)*
9. **H:** "LEFT. Then the card says the drop is the object NEAREST the camera's wall. Count tiles from the vent wall — who's closest?" *(defined counting rule, receptive direction)*
10. **A:** "The vase is one tile from the vent wall. The lamp's two. So the vase — the M." *(applies the rule, self-identifies with the stencil letter)*
11. **H:** "Confirm back: vase, letter M, one tile off the vent wall. Tap it, then MARK DROP." *(confirmation loop)*
12. **A** taps the vase, taps MARK DROP. Solved — roughly ten meaningful utterances, every one either a description, a framed-perspective judgment, a clarification, or a confirmation.

## 5. Difficulty tiers

| | Rookie (1) | Agent (2) | Mastermind (3) |
|---|---|---|---|
| Camera walls | door/shelf/vent (0° or 90° shift) | shelf/vent (90°) | window (180° mirror) or 90° with REC |
| Probe referent | tagged object only | tagged object | tagged object, sometimes in the RECORDED frame (ghost) |
| Plan | 1 probe + 1 distance selector | probe + optional half-filter + L/R superlative over all 4 objects | one new load per protocol: mirror wall OR recorded frame OR mirror+two-step |
| Scaffold | full turn-the-case coaching printed | method reminder only | silent |
| Minutes | ~3 | ~5 | ~6 |

Complexity scales; speed never does. No timers anywhere; stakes are the SLP-set 1–3 wrong answers per module, exactly like every other module.

## 6. Generation & solvability

**State shape** (the whole screen, nothing hidden — the drop is derivable, never stored):

```ts
export interface RoomObject {
  kind: ObjectKind;              // statue | crate | vase | lamp | radio | globe
  letter: string;                // stencil flavor, never used by rules
  col: number; row: number;      // 1..4; col 1 = shelf side, row 1 = window side
  tagged?: boolean;
  ghost?: { col: number; row: number };  // tagged object only, REC protocols only
}
export interface VantageState {
  protocol: string;                       // Protocol id — named on screen, card in manual
  camera: { wall: Wall; offset: number }; // offset 1..4 along the wall (lateral coordinate)
  objects: RoomObject[];
}
export type VantageAnswer = { object: number };  // index of the tapped object
```

**generate(seed, difficulty)** — fully constructive, no rejection loops:
1. `rng = mulberry32(seed)`; pick a protocol from `PROTOCOLS_BY_DIFFICULTY[difficulty]`.
2. Rook placement: `rows = shuffle(rng, [1,2,3,4])`, `cols = shuffle(rng, [1,2,3,4])`; object *i* gets `(cols[i], rows[i])`. Sample 4 distinct kinds and 4 distinct stencil letters. Pick a tagged index.
3. Camera: pick `wall` from the protocol's `cameraWalls`; compute the tagged object's lateral coordinate on that wall (col for door/window, row for shelf/vent); pick `offset` from `[1..4]` minus that value — the side probe can never be "dead ahead".
4. REC protocols only: place the tagged object's `ghost` on a currently-empty cell whose lateral coordinate is (a) ≠ camera offset and (b) on the **opposite side** of the camera from the live position — the photo always disagrees with the room, so answering from the live scene always takes the wrong branch. Such a cell always exists: the far side of the offset has ≥1 lateral value, each lateral value has 4 cells and at most 1 is occupied per row/col by rook placement.
5. Shuffle object order for display. Same seed + difficulty → identical instance, forever.

**solve(state)** — robot Handler, tables only: look up the protocol row; evaluate its probe by the printed definitions (side = sign of lateral difference in the camera frame given by `FACING_RULES`; half = depth ≤ 2; recorded-side = same, at the ghost); take the branch; apply the optional filter (depth halves) then the selector (extremal depth or extremal lateral-toward-LEFT-wall) and return that object's index.

**Exactly one defensible answer — the argument:**
- Only the final MARK DROP is an answer; probe answers are conversation. So uniqueness = uniqueness of the selected object.
- Rook placement means the 4 objects' rows are exactly {1,2,3,4} and columns exactly {1,2,3,4}. Therefore, viewed from ANY wall, object depths are a permutation of {1,2,3,4} and laterals are a permutation of {1,2,3,4}. Every `nearest/farthest/cam-leftmost/cam-rightmost` over any subset is tie-free; every half-filter splits the four objects exactly 2/2, so a filter always leaves 2 candidates and the following selector picks a strict extremum of 2 distinct values.
- The side probes are total and binary: step 3 guarantees tagged-lateral ≠ camera offset (live), step 4 guarantees the same for the ghost. `half-tagged` is total because depth ∈ {1,2,3,4} partitions into halves.
- Every judgment is a counting rule printed in the manual (tiles from a named wall; closeness to a named wall) — nothing perceptual, nothing a robot Handler can't compute, no adjudication.
- Branch plans are opposite extremes on one axis, so the two branches always name different objects — tested, which also proves the perspective probe is load-bearing in every instance.

**Property tests** (Bad Intel pattern, 1000 seeds × 3 tiers): rook invariants; offset/ghost constraints; `validate(state, solve(state))` true; every wrong object index rejected; branch objects differ; every protocol × wall × branch occurs across seeds; REC: solving from the live position instead of the ghost yields the other branch's (different) object; byte-identical determinism across repeated generation.

## 7. Answer & validation model

Tap an object → target ring; tap **MARK DROP** → commit. `validate` accepts iff `answer.object === solve(state).object`. A wrong commit is one strike (`onStrike`), haptic thunk, ring clears, play continues until solved or the SLP's strike cap seals the module. Nothing else can strike — probe talk is free, exactly where we want the risk-free rehearsal to live.

## 8. Static Protocol & hints

**Static Protocol:** the manual's step 1 ("give the room report") makes the first description a multi-clause utterance — camera wall, facing, four objects, tag — so the scripted "Say again?" rounds force genuine reformulation, never a re-said digit. Marked modules behave exactly per the engine's stacked-clarification script.

**Hints (verbatim, escalating, communication-only — never instance answers):**
1. "Start with the camera, not the objects. Tell your Handler which wall it hangs on and which wall its view-fan points at — use the wall names."
2. "Answer like you ARE the camera. Try saying: 'I'm standing where the camera is, facing the ___ wall, so my left hand points at the ___ wall' — then place the tagged object."
3. "Still stuck? Turn the whole iPad so the camera's wall is the edge closest to your body. Now the camera's left is YOUR left. Answer the question from there, then turn it back."

Hint 3 teaches the classroom-true rotation strategy (a method, not an answer); its use is logged, and its per-tier frequency is a pilot metric.

## 9. Worked example — one Rookie instance, replayable

As `generate(seed, 1)` would emit (letters/kind assignment illustrative; structure exact):

```json
{
  "moduleId": "vantage-point", "difficulty": 1, "seed": 4242,
  "state": {
    "protocol": "sightline-a",
    "camera": { "wall": "vent", "offset": 2 },
    "objects": [
      { "kind": "crate",  "letter": "V", "col": 1, "row": 1 },
      { "kind": "statue", "letter": "K", "col": 2, "row": 3, "tagged": true },
      { "kind": "lamp",   "letter": "R", "col": 3, "row": 2 },
      { "kind": "vase",   "letter": "M", "col": 4, "row": 4 }
    ]
  }
}
```

Invariant check: rows {1,3,2,4} and cols {1,2,3,4} are permutations (rook ✓); vent-wall lateral = row; tagged row 3 ≠ camera offset 2 ✓; walls allowed for `sightline-a` include vent ✓.

Solve against the drafted tables, exactly as a judge (or the robot Handler) would:
1. Protocol card `SIGHTLINE A`: probe `side-tagged`; LEFT → `nearest`, RIGHT → `farthest`.
2. Compass row for **vent**: faces shelf; its LEFT is the **door** wall (increasing row). Tagged statue row 3 vs camera offset 2 → statue is on the door side → **LEFT**.
3. Branch LEFT → `nearest`: depth from the vent wall = 5 − col → vase 1, lamp 2, statue 3, crate 4. Minimum is the **vase (M)**.
4. `solve` returns `{ object: 3 }`; the Agent taps the vase and MARK DROP; `validate` accepts. (Branch RIGHT would have named the crate — different object, so the perspective judgment decided the outcome.) The section-4 transcript is this exact instance.

## 10. Risks & open questions

- **The compass table as crutch.** A Handler who pre-reads the compass row deletes the perspective work. The COACH'S ORDER callout plus the prompted-vs-independent tally are the mitigation, but paper can't enforce turn order — the pilot must watch for it.
- **Lexical left/right vs frame rotation confound.** A student who fails the probe may have a left/right word-retrieval problem, not a perspective problem. The tally can't distinguish them; SLP observation must. Rookie's `sightline-c` (depth-only, no L/R) exists partly as the discriminating comparison.
- **Guessability.** Four objects → a blind MARK DROP is 25%. With the default 1-strike seal and letter-grade cost, guessing is a losing strategy, but a 3-strike setting softens that. Acceptable; noted.
- **Camera offset subtlety.** "Left of the camera" depends on the camera's own position along its wall, not just its wall. The view-fan and the offset-aware probe make this honest, but a student may reason wall-vs-wall and be right most of the time for the wrong reason. Generator keeps tagged-lateral ≠ offset; pilot should note whether offset ever confuses.
- **Mastermind stacking.** Mirror wall, recorded frame, and two-step plans are each one protocol's load, never combined with each other except `sightline-i` (mirror + two-step, no REC). If the pilot shows any single layer is too much, the protocol table — being data — can be re-tiered without touching engine code.
- **Open question:** should an SLP toggle restrict Rookie seeds to door-wall (0-shift) cameras for a student's first sessions ("training-wheels seeds")? Cheap to add as a mission-builder option; deferred to pilot feedback.
- **Open question:** does physically rotating the iPad (hint 3) fight the case hardware when the screen is mounted in the 3D briefcase? On the classic 2D shell it's free; in the case it means turning the whole case. Landmark walls keep the language safe either way, but the scaffold's ergonomics need a hardware check.

**What the classroom pilot must measure (the gate before this leaves the pilot flag):**
1. **Solve time per tier** vs the 3/5/6-minute estimates; >2× median = overload signal at that tier.
2. **Strike rate at Rookie** — target <20% of Rookie runs taking any strike; higher means the floor of the ramp is wrong.
3. **Independent vs prompted probe answers** (existing tally categories): the ratio should climb across sessions; a flat all-prompted profile means the compass is carrying the task and the load is blocking, not productive.
4. **Hint-3 (rotation strategy) frequency per tier** — expected to fade tier-over-tier; rising use at Agent/Mastermind = ramp too steep.
5. **Exchange quality:** utterances per minute on this module vs Bad Intel (in-family baseline), and a count of camera-frame markers ("its left", "from the camera", "in the photo") in the SLP tally — the module's actual point.
6. **Mastermind layer comparison:** time, strikes, and abandon/spin behavior on `sightline-g/i` (mirror) vs `sightline-h` (recorded frame), tracked separately, to decide which cognitive layer ships and which waits.
7. **Affect notes:** disengagement/frustration observations per tier, because load that the metrics miss shows up in faces first.

## 11. Why this beats the obvious alternative

The obvious perspective-taking module is "describe the scene from the character's chair" — open-response, Handler-judged, and therefore unbuildable here: no robot Handler can adjudicate free description, no two answers are ever provably unique, and the talk quality collapses into the Agent monologuing while the Handler nods. Vantage Point compiles the same clinical move — adopt a frame that isn't yours and mark it in language — down to a binary probe whose answer only the Agent can produce and whose consequence only the Handler can read, feeding a counting-rule selector with exactly one defensible object. Every perspective judgment is spoken, tally-able as independent/prompted/incorrect with the app's existing categories, risk-free until the single committed tap, Static-Protocol-rich at the first description, and generated constructively so 1000-seed proofs are trivial. And because the entire load ramp — walls, probes, plan depth, scaffold text — lives in typed protocol tables, the pilot can re-tier the module by editing data rows, which is exactly the posture a design that honestly ships behind a load-pilot flag should have.
