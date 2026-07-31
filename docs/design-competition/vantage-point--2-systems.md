# Vantage Point (vantage-point, lens: systems)

Tagline: Read the overhead map through the Spotter's eyes — her left, not yours.
Primary: pragmatics / secondary: expressive, receptive
Minutes: {"1":3,"2":5,"3":6}

Core loop: The Agent sees a bird's-eye satellite view of a plaza — landmarks on a grid, plus the Spotter standing at one edge with an arrow showing which way she faces — and a post code. The Handler looks up that post's protocol, whose every direction is phrased in the Spotter's egocentric frame ("the landmark on HER left"), and can act only on the Agent's description of the scene. The pair must jointly perform the frame shift out loud: the Handler probes ("Which way is she facing? Her left or your left?"), the Agent describes and mentally rotates, and only then taps the landmark. Higher tiers add 180-degree facings, compound relations, and a second watcher with his own sight-lines and blind spots, so the pair must track and contrast what each character can see.

---

# Vantage Point — design spec (perspective-taking)

> **Ships behind a pilot flag.** The research shortlist backs perspective-taking but warns that spatial and cognitive perspective load stacks fast for this population. This module is designed so the load ramp is itself a data table (`LOAD_RAMP` in `rules.ts`), visible to the SLP in the printed manual and in the mission builder, and the classroom pilot (section 10) has explicit pass bars before the flag comes off.

## 1. Concept & fiction

**Codename:** Vantage Point. **Tagline:** *"Read the overhead map through the Spotter's eyes — her left, not yours."*

The Agent is monitoring the KESTREL satellite feed: a straight-down view of a city plaza where a dead drop must be signaled. Our asset on the ground — **the Spotter** — is standing at the plaza's edge, watching. Her signal protocols were written from *her* vantage, not the camera's: "chalk the landmark on my LEFT." The Handler holds the protocol book for every observation post; the Agent holds the only view of the plaza. Neither frame is the other's: the camera sees a map, the Spotter sees a scene, and the pair must translate between them out loud. At Mastermind, an enemy **Guard** watches the same plaza from another edge, and some steps turn on what *he* can and cannot see — crates cast shadows across his sight-lines, and his blind spots are the mission's opportunities.

The therapy is the translation. The load-bearing move on every single step is a perspective shift that neither partner can skip: the Handler cannot see the plaza, and the Agent cannot know which egocentric relation the protocol asks for. The archetypal exchange — "the one on the left." "Whose left?" — is the module's engine, not a failure mode.

**Primary TherapyTarget: `pragmatics`** (Clarifying & repair). Justification: the engine's five-value enum has no perspective-taking entry, and in SLP practice perspective-taking / theory-of-mind work is housed under social communication — pragmatics. Concretely, the conversational behavior this module forces is *frame-of-reference negotiation and repair*: establishing whose viewpoint a deictic term belongs to, detecting frame mismatches, and repairing them ("her left, not your left"). That is a pragmatics skill executed through spatial language. Secondary targets: `expressive` (precise scene description with spatial vocabulary) and `receptive` (following multi-attribute relational directions).

## 2. What the Agent sees

A dark tactical screen styled as a satellite feed. Minimal text; everything load-bearing is visual.

- **Post plate** (top center): the post code in stencil caps, e.g. `POST ASH`. STATIC badge appears here when a repair drill is seeded.
- **Compass rose** (top right): small N-up rose. Gives the pair shared *allocentric* vocabulary ("the north edge") without doing any egocentric work for them. Screen-up is always North.
- **The plaza**: a 3×3 grid (Rookie) or 4×4 grid (Agent/Mastermind) of stone tiles. Landmarks sit on tiles as big monochrome line-art icons — statue, fountain, kiosk, bench, lamppost — each with a small one-word caption beneath (STATUE), matching the manual's figure exactly. Each landmark tile is one touch target, ≥ 88 px.
- **The Spotter**: a round badge token standing just *outside* the grid on one edge, with a bold chevron on the token showing her facing (always perpendicular, into the plaza) plus a short sight-line notch. No view cone is drawn — the screen never renders what she sees; that computation belongs to the conversation.
- **Mastermind only**: **the Guard**, a square badge token with a different silhouette on another edge, same chevron treatment; and 1–2 **crates** drawn as wooden boxes on tiles (visually inert, not tappable). The screen does **not** shade anyone's shadows.
- **Step dots** (bottom): one dot per protocol step (● ○ ○), current step pulsing. Rookie shows a single dot.

Tap behavior: tapping a landmark commits it as the answer to the current step. Correct → the tile stamps a chalk mark, next dot lights. Wrong → haptic buzz, red pulse, strike. Spotter, Guard, crates, and empty tiles are inert. Nothing on screen tells the Agent which relation is being asked — that arrives only through the Handler's voice.

3D case: standard mount (`faceplate` omitted); no custom 3D work.

## 3. What the Handler has

All tables below are drafted as they will print. Every row lives in `rules.ts` carrying semantics + both prose editions; the manual and solver generate from the same rows (badIntel pattern). Query prose is *composed* from the fragment tables by a `phrase(query, edition)` function, so a compound step's sentence can never drift from its predicate.

### Table A — Landmark legend (`LANDMARKS`)

| Landmark | How to spot it *(standard)* | What it looks like *(simplified)* |
|---|---|---|
| Statue | A stone figure on a square plinth. | A stone person. |
| Fountain | A round pool with a spray at its center. | A round pool of water. |
| Kiosk | A small hut with a striped awning. | A tiny shop hut. |
| Bench | A long seat of slatted boards. | A long seat. |
| Lamppost | A tall pole with a lantern on top. | A tall light pole. |
| Crate *(Mastermind)* | A stacked wooden box — nobody sees through it. | A big wooden box. It blocks eyes. |

Plus a printed figure of all icons (same art as the screen) and the two watcher tokens: *"The Spotter — ours. The chevron on her token shows the way she is facing. The Guard — theirs."*

### Table B — The vantage rule (`VANTAGE_RULE`, the module's one big rule, printed as a warning callout)

- **Standard:** "Every direction in a protocol belongs to the person it names — never to the camera. Before trusting any answer, make the Agent say the facing out loud: 'She is looking toward the ___ edge.' Then take her view: AHEAD is the way she faces; LEFT is her left hand; RIGHT is her right hand; CLOSEST and FARTHEST are measured from where she stands. Her left is not the map's left, and when she faces you, her left is your right."
- **Simplified:** "Her left is not your left. First say which way she looks. Then pretend to be her. Her left hand side = LEFT. Her right hand side = RIGHT. In front of her = AHEAD. Near her = CLOSEST. Far from her = FARTHEST."
- Printed figure: overhead person icon with facing arrow and labeled LEFT / RIGHT / AHEAD sectors.

### Table C — Relation fragments (`RELATION_FRAGMENTS`)

| id | Predicate (frame coords) | Standard fragment | Simplified fragment |
|---|---|---|---|
| `left` | lateral > 0 | on the {name}'s LEFT | on HER/HIS left |
| `right` | lateral < 0 | on the {name}'s RIGHT | on HER/HIS right |
| `ahead` | lateral = 0 | straight AHEAD of the {name} | right in front of HER/HIM |
| `closest` | min depth | CLOSEST to the {name} | nearest to HER/HIM |
| `farthest` | max depth | FARTHEST from the {name} | farthest from HER/HIM |
| `hidden` *(D3)* | occluded by a crate | that the {name} CANNOT see | that {name} cannot see |
| `visible` *(D3)* | not occluded | that the {name} CAN see | that {name} can see |

Compound composition (D2+): pick + side → standard *"the CLOSEST landmark on her LEFT"*; simplified splits into two sentences: *"Look only at her left side. Take the nearest one."* Visibility filter (D3) prefixes: *"Of the landmarks the Guard cannot see, …"*

### Table D — Rookie posts (`POSTS`, difficulty 1 — COMPLETE)

Each post is one printed table; one query per post at Rookie. Composed prose shown.

| Post | Step 1 — Standard | Step 1 — Simplified |
|---|---|---|
| POST ASH | Chalk the landmark on the Spotter's LEFT. | Tap the thing on HER left. |
| POST BIRCH | Chalk the landmark on the Spotter's RIGHT. | Tap the thing on HER right. |
| POST CEDAR | Chalk the landmark straight AHEAD of the Spotter. | Tap the thing right in front of her. |
| POST ELM | Chalk the landmark CLOSEST to the Spotter. | Tap the thing nearest to her. |
| POST FIR | Chalk the landmark FARTHEST from the Spotter. | Tap the thing farthest from her. |

### Rookie tier note (`LOAD_RAMP[1]`, printed as a warning — the SLP-visible ramp)

- **Standard:** "Rookie posts are gentle on purpose: one question, one Spotter, and she never faces the map's south edge — the turn is a quarter-turn at most. If the pair is fighting the turn, stay here; the turn only gets bigger above Rookie."
- **Simplified:** "One question. A small turn. Take your time."

### Agent posts (difficulty 2 — structure + samples)

Structure: 4×4 grid, four landmarks, Spotter on **any** edge (180° mirror facings enter here — the tier note says so explicitly) at any offset; **two** queries per post; compound relations (side + pick).

| Post | Steps (standard prose, composed) |
|---|---|
| POST GALE | 1. Chalk the CLOSEST landmark on the Spotter's LEFT. 2. Chalk the FARTHEST landmark on her RIGHT. |
| POST HARBOR | 1. Chalk the landmark straight AHEAD of the Spotter. 2. Chalk the CLOSEST landmark on her RIGHT. |
| POST INLET | 1. Chalk the landmark FARTHEST from the Spotter. 2. Chalk the CLOSEST landmark on her LEFT. |

Tier note (`LOAD_RAMP[2]`, tip): *"Agent posts turn the Spotter every way — including facing you, where her left is your right. Two questions per post; make the Agent restate the facing before each one."*

### Mastermind posts (difficulty 3 — structure + samples)

Structure: 4×4 grid, four landmarks, **two** watchers (Spotter + Guard, distinct edges), 1–2 crates, **three** queries; steps name whose frame, and may filter by visibility.

| Post | Steps (standard prose, composed) |
|---|---|
| POST ONYX | 1. Chalk the one landmark the Guard CANNOT see. 2. Chalk the CLOSEST landmark on the Spotter's LEFT. 3. Chalk the landmark on the Guard's RIGHT. *(compound: side unique via generation)* |
| POST PYRITE | 1. Of the landmarks the Spotter CAN see, chalk the FARTHEST from her. 2. Chalk the CLOSEST landmark on the Guard's LEFT. 3. Chalk the landmark straight AHEAD of the Spotter. |

Crate shadow rule (`SHADOW_RULE`, printed with a figure):
- **Standard:** "A crate blocks sight in a straight line: from a watcher's eyes, every tile directly behind the crate — straight away from that watcher, tile after tile — is hidden from them. A crate never hides anything beside it. Each watcher has their own shadows: what the Guard cannot see, the Spotter often can."
- **Simplified:** "A crate blocks eyes. Behind the crate is hidden — straight back only. The Spotter and the Guard have different hidden spots."

Tier note (`LOAD_RAMP[3]`, tip): *"Two watchers, two views, plus your own. Every step names whose eyes to use — check the name first, every time."*

### "Working a step" (printed steps block, standard)

1. Ask for the post name; find its protocol.
2. Before step 1, get the lay of the land: where does the Spotter stand, which way does she face, what landmarks are out there and where?
3. Read the step aloud exactly as printed. Ask: "Whose view is that in?"
4. When the Agent names a landmark, test it: "Is that her left, or your left?"
5. Agreed on exactly one landmark? The Agent taps it, and you read the next step.

(Simplified edition: same five moves, short sentences, ending *"Not sure? Ask again. Asking is free. A wrong tap counts."*)

## 4. The conversation loop — annotated Rookie transcript

Instance: `POST ASH`; Spotter on the **west** edge, middle, facing east; statue bottom-left (0,2), kiosk top-middle (1,0), fountain middle-right (2,1). Correct answer: **kiosk**. Naive screen-frame answer ("left" = map-left): statue — the two diverge by construction of this example.

> **H:** What does the plate at the top say? — *[label check, joint attention]*
> **A:** POST ASH.
> **H** *(finds ASH; per Working-a-step 2)*: Before the step — describe the whole scene for me.
> **A:** There's a lady on the left and some stuff. A statue and a shop and a fountain. — *[first description, vague]*
> **H** *(STATIC badge is lit — scripted neutral clarification, no content help)*: **Say again — I didn't copy all of that.**
> **A** *(repair — forced rephrase with more information)*: The Spotter is on the west edge, in the middle. Her arrow points east, into the plaza. The statue is in the bottom-left corner, the kiosk is top-middle, the fountain is middle of the right side. — *[expressive: complete scene description with allocentric anchors; this is what the Static Protocol is for]*
> **H:** Copy. Protocol says: chalk the landmark on the Spotter's LEFT. Whose left is that? — *[frame check — the vantage rule's scripted probe]*
> **A:** Hers.
> **H:** So face the way she faces. Which way is she looking?
> **A:** East. Toward the right of my screen. — *[Agent restates facing — the load-bearing setup]*
> **H:** You're her now. Where does your left hand point on the map?
> **A:** If I face east… my left is north. The top of the map. — *[the perspective shift, performed verbally]*
> **H:** What's on her left, then?
> **A:** The kiosk — it's at the top. — *[correct referent found in her frame]*
> **H:** Her left, or your left? — *[repair-style contrast probe from Working-a-step 4]*
> **A:** Hers. MY left would be the statue side. — *[explicit frame contrast — the module's core therapeutic exchange]*
> **H:** Then tap the kiosk.
> *A taps the kiosk → chalk mark, solved.*

Every step forces at minimum: a scene description (expressive), a facing statement, a frame attribution ("whose left?"), and a frame-contrast repair — none of which either partner can produce alone.

## 5. Difficulty tiers

| | Rookie (1) | Agent (2) | Mastermind (3) |
|---|---|---|---|
| Grid / landmarks | 3×3, 3 landmarks | 4×4, 4 landmarks | 4×4, 4 landmarks + 1–2 crates |
| Watchers | 1 Spotter, **centered** on S/E/W edge (0° or ±90° shift only) | 1 Spotter, any edge (adds the 180° mirror), any offset | Spotter + Guard on distinct edges — two foreign frames plus the Agent's own |
| Queries per post | 1, single attribute | 2, compound (side + pick) | 3, compound + visibility filters, frame named per step |
| New cognition | one egocentric rotation, single referent | mirror facings; two-attribute relations | level-1 visual PT ("what can he see?") bridging to cognitive PT; frame switching between steps |
| Minutes | **3** | **5** | **6** |

What scales is exactly the pilot-flagged load dimensions, and each is one field of the `LOAD_RAMP` table: allowed edges, watcher count, offset freedom, query count, relation arity, crates. The SLP can read the ramp in the manual's tier notes and hold a pair at any rung. Speed never scales; there is no clock anywhere.

## 6. Generation & solvability

**State shape** (mirrors badIntel: no derived answers stored — the referents are recomputable from state + tables only):

```ts
type Edge = 'north' | 'south' | 'east' | 'west';
interface Landmark { kind: LandmarkKind; col: number; row: number }
interface Watcher { role: 'spotter' | 'guard'; edge: Edge; offset: number }
interface VantageState {
  post: string;                 // Post id — screen prints its name, manual prints its protocol
  grid: { cols: number; rows: number };
  landmarks: Landmark[];
  watchers: Watcher[];          // facing is DERIVED: perpendicular, into the plaza
  crates: { col: number; row: number }[];  // empty except D3
}
type VantageAnswer = number[];  // one landmark index per protocol query, in order
```

**Frame math as data** (`EDGE_FRAMES` table): each edge row carries `forward` and `left` unit vectors in (col,row) screen coordinates (row increases downward), e.g. `west: { forward: (1,0), left: (0,-1) }`. A watcher on edge *e* at offset *k* stands one cell outside the grid; for any landmark, `depth = dot(pos − watcherPos, forward)` and `lateral = dot(pos − watcherPos, left)`. `side` is the sign of `lateral` (0 = ahead); `closest/farthest` are extrema of `depth`; `hidden(w)` holds iff some crate shares the landmark's lateral value in *w*'s frame with strictly smaller depth. `solve(state)` walks the post's query rows, filters landmarks by the query's predicate fields, and returns the unique index per query. This is the same predicate the manual's fragments verbalize.

**The permutation invariant.** At every tier, `generate` places landmarks so that they occupy **pairwise-distinct columns and pairwise-distinct rows** (a permutation matrix layout: 6 layouts on 3×3, 24 on 4×4, times landmark-kind assignments, edges, offsets, and posts — thousands of distinct instances per tier). Because every watcher faces along a grid axis, each landmark's `lateral` equals its (row or column) line index relative to the watcher — so distinct columns + distinct rows imply **all landmarks have pairwise-distinct laterals AND pairwise-distinct depths in every watcher's frame, for every edge and every offset**. Consequences:

- **Rookie — uniqueness for all configurations, no filtering.** Watcher centered on a 3×3 edge: laterals of the 3 landmarks are a permutation of {+1, 0, −1} → `left`, `right`, `ahead` each match exactly one landmark; depths are 3 distinct values → `closest`/`farthest` unique. Every one of the 5 Rookie posts has exactly one defensible answer for *every* layout × edge draw. `generate(seed,1)` is: pick post, pick layout, pick edge from `LOAD_RAMP[1].edges`, assign kinds, done. Zero rejection sampling; 1000-seed property test asserts exactly-one-referent per query anyway.
- **Agent — uniqueness by constructive offset choice.** Distinct depths make any `closest/farthest + side` compound unique **iff its side-set is nonempty**. Side-set sizes are a pure function of the watcher's offset (offset *k* puts *k* lines on one side, 3−*k* on the other). `generate(seed,2)` computes, for the drawn post and layout, the set of (edge, offset) pairs under which every query's candidate set is nonempty (a total, closed-form check — no search), and rng-picks among them; this set is provably nonempty (any interior offset 1..2 gives both sides ≥1 line). `ahead` queries force offset = the ahead landmark's line, still closed-form. Deterministic, no retries.
- **Mastermind — uniqueness by exhaustive enumeration over a tiny space.** After drawing layout, post, and two watcher placements (side-nonemptiness enforced per watcher exactly as D2), the generator enumerates all crate placements (≤ 12 empty cells, 1–2 crates → ≤ 78 combos) and keeps those where every query of the post has exactly one referent — e.g. exactly one landmark hidden from the Guard for a `hidden` step. It rng-picks among the valid combos; if none exists for this draw (possible for some watcher pairs), it deterministically advances to the next (edge, offset) pair in the enumerated valid list, then the next layout — a bounded loop over a finite space, same seed → same walk → same instance. The 1000-seed property suite asserts termination, uniqueness per query, and `validate(state, solve(state))` for all three tiers — plus a coverage test (badIntel-style) that every post and every facing class (0°/90°/180°) actually occurs across seeds.

**Why exactly one defensible answer:** every query predicate is a total function of integer grid coordinates — sign tests and strict extrema over pairwise-distinct integers. There are no metric judgments, no diagonals, no "mostly left," and no tie-breaks: ties are structurally impossible under the permutation invariant, and emptiness/multiplicity are excluded by construction (D1), closed-form choice (D2), or exhaustive filtering (D3). The robot Handler needs only `EDGE_FRAMES`, `RELATION_FRAGMENTS` predicates, `SHADOW_RULE`, and the `POSTS` rows — exactly what the printed manual verbalizes.

## 7. Answer & validation model

- The current protocol step is the current step dot; the Agent answers by **tapping one landmark**. That tap commits immediately (badIntel convention — talking is free, tapping is not).
- Correct tap → chalk stamp, advance to next step; all steps done → `onSolved`.
- **Wrong answer** = tapping any landmark other than the current step's unique referent → `onStrike` (+ `onAttempt(false, …)`), step does not advance, scene unchanged. Strikes to the SLP-set per-module cap (1–3) seal the module, as everywhere.
- Crates, watcher tokens, and empty tiles are inert — mis-taps on them do nothing and cost nothing.
- `validate(state, answer)` = `answer` deep-equals `solve(state)` (ordered index list), exactly the badIntel shape.
- **Pilot instrumentation:** a pure helper `classifyMiss(state, stepIdx, tappedIdx)` labels a wrong tap `'mirror-flip'` when the tapped landmark is the referent of the same query with left↔right swapped (computable and unique under the invariant), else `'other'`. Logged through `onAttempt` detail into the session log/CSV — this is the load-signature measure in section 10.
- Shared `describeLandmark()` / `describeWatcher()` text functions feed aria-labels (2D) and face region labels (3D), consistent with manual language (badIntel's `describeControl` pattern).

## 8. Static Protocol & hints

**Static Protocol fit.** The first description is necessarily rich — the Handler's printed step 2 demands the full scene (watcher position, facing, all landmarks) before any query is read, so the scripted "say again" always has substance to force a rephrase of (facing is the detail most often dropped, and the rephrase must supply it). No "it's a 7" degenerate case exists: even the post name is only the *lookup*, never the description.

**Hints (verbatim, escalating, communication-only — never instance answers):**

1. "Handler — before any step, ask: 'Where is the Spotter standing, and which way is she facing?' Nothing works until you both know her facing."
2. "Agent — say whose view every direction is in: 'her left,' 'my left,' 'the map's left.' If somebody just says 'left,' ask: whose?"
3. "Still stuck? Agent — turn your body to face the same way the Spotter faces, then say what is on each side of you. Handler — walk them through it: 'You are her now. Where does your left hand point on the map?'"

(Hint 3 deliberately reaches for the embodied-rotation scaffold — physically aligning one's body is the classic support for spatial perspective shifts and is available in any therapy room.)

## 9. Worked example — one complete Rookie instance, replayable

As `generate(483, 1)` would emit it:

```json
{
  "moduleId": "vantage-point", "difficulty": 1, "seed": 483,
  "state": {
    "post": "post-ash",
    "grid": { "cols": 3, "rows": 3 },
    "landmarks": [
      { "kind": "statue",   "col": 0, "row": 2 },
      { "kind": "kiosk",    "col": 1, "row": 0 },
      { "kind": "fountain", "col": 2, "row": 1 }
    ],
    "watchers": [ { "role": "spotter", "edge": "west", "offset": 1 } ],
    "crates": []
  }
}
```

Well-formedness: landmarks occupy distinct columns {0,1,2} and distinct rows {2,0,1} — permutation invariant holds. `west ∈ LOAD_RAMP[1].edges` (a 90° shift), offset 1 = centered as Rookie requires.

**Robot-Handler solve, from the tables only:**

1. `POSTS['post-ash']` → one query: `{ frame: 'spotter', side: 'left' }`; prose composes to "Chalk the landmark on the Spotter's LEFT."
2. `EDGE_FRAMES.west` → `forward = (1,0)`, `left = (0,−1)`; watcher stands at (−1, 1), facing east.
3. Frame-transform each landmark (`lateral = offset − row`, `depth = col + 1`):
   - statue (0,2): lateral = 1−2 = **−1** (her right), depth 1
   - kiosk (1,0): lateral = 1−0 = **+1** (her left), depth 2
   - fountain (2,1): lateral = **0** (ahead), depth 3
4. Query filter `lateral > 0` → exactly one candidate: **kiosk**, index 1.
5. `solve` returns `[1]`; `validate(state, [1])` → true. Any other tap — statue `[0]` (the screen-frame "left" trap *and* the mirror-flip referent, so a miss here logs `'mirror-flip'`) or fountain `[2]` — fails validation and strikes.

A judge can replay the transcript in section 4 against exactly this instance.

## 10. Risks & open questions

- **The 180° mirror is the load cliff.** Facing-south configurations (her left = your right) are excluded from Rookie *by data* and enter at Agent tier. If the pilot shows even 90° shifts overloading, the fix is one row edit (`LOAD_RAMP[1].edges = ['south']`) — but then the perspective move nearly vanishes at Rookie, and the module's Rookie tier would need rethinking. This is the single biggest open question and exactly what the pilot gates.
- **Rookie 0° seeds (south edge) are near-trivial** — deliberate warm-up rungs, but if the pilot shows boredom or guess-tapping, drop `'south'` from the D1 edge list (one data row). With 3 landmarks and default 1 strike, blind guessing is a 67% module-fail risk, so the incentive to talk holds even on easy seeds.
- **Compound-relation reading load lands on the Handler** ("the closest landmark on her LEFT"). The simplified edition splits every compound into two imperative sentences; still, D2 should be watched for Handler-side parsing stalls, since our Handler may also have language needs.
- **Shadow-rule misconceptions** at D3 (students assuming a crate hides neighboring tiles, not just the straight-back line). The figure and "straight back only" prose target this; pilot should log D3 `hidden`-step miss rates separately.
- **The overhead token shows a chevron, not hands** — "her left hand" asks students to map a symbol to a body. Hint 3's embodiment scaffold is the mitigation; if pilot shows persistent trouble, the token art can gain tiny L/R hand dots (art change only, no rules change).
- **Enum gap:** filed under `pragmatics`; the mission builder cannot filter for "perspective-taking" as such. Acceptable now; if more PT modules ship, consider widening `TherapyTarget` (engine change, out of scope here).
- **Ambiguity testing:** the D1 uniqueness proof is airtight; D2 relies on the closed-form offset check and D3 on exhaustive crate filtering — the 1000-seed-per-tier property suite plus the coverage tests (every post, every facing class, every step position) is the acceptance bar, same as badIntel.

**Classroom pilot plan (the flag comes off only on these numbers):**
1. **Per-facing accuracy:** every instance logs its facing class (0°/90°/180°). Bar: Rookie 90° first-attempt accuracy within 15 points of the pair's other Rookie-module accuracy, and ≥ 70% absolute.
2. **Mirror-flip share:** fraction of wrong taps classified `'mirror-flip'` by `classifyMiss`. A high share means frame confusion — the *target* being exercised (keep tier, add reps); a low share with high miss rate means general overload (lower the ramp). This distinction is the pilot's key diagnostic and it is only possible because misses are classifiable.
3. **Time envelope:** Rookie median ≤ 4 min, D2 ≤ 6; time-to-first-commit as the exchange-length proxy.
4. **Hint depth & Static Protocol repair quality:** which hint tier gets used, and whether the post-"say again" description adds facing information (SLP tally judgment).
5. **Exchange tally:** using the existing tally overlay, count independent vs prompted frame attributions ("her left") and spontaneous whose-left clarifications — measure with the tally, not the grade.
6. **Affect/opt-out:** any student refusing the module or visibly disengaging on 90° seeds is a stop signal regardless of the numbers.
Decision rule: Rookie ships to the mission builder after bars 1–3 hold across ≥ 2 sessions for ≥ 3 pairs; D2 unlocks on the same bars at D2; D3 stays flagged until D2 clears.

## 11. Why this beats the obvious alternative

The obvious build is to *render* the shift — give the Agent a "Spotter-cam" toggle or a first-person inset showing her view. That version does the perspective-taking in the GPU: the student reads an answer off a picture, the conversation collapses to label-passing, and the therapy evaporates; worse, its correctness rests on rendered imagery a printed manual can never reproduce or prove. Vantage Point instead keeps one map on screen and puts the transformation entirely in language, where the pair must construct it together — and because every relation is a sign test or strict extremum over a permutation-matrix layout, uniqueness is a two-line proof at Rookie and an exhaustively checked finite enumeration above, the whole module is five small tables whose rows read as clean manual prose in both editions, and a competent dev can finish `rules.ts`, `logic.ts`, `manual.ts`, the tests, and a grid-of-buttons component in a day. The contract is the elegance: the same seven relation rows are simultaneously the solver's predicates, the manual's sentences, the difficulty ramp's knobs, and the pilot's measurement axes.
