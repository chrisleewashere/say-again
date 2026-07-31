# Double Meaning (double-meaning, lens: systems)

Tagline: Is it code or just a postcard? Route intercepted mail by what the sender really meant.
Primary: vocabulary / secondary: pragmatics, expressive
Minutes: {"1":3,"2":5,"3":6}

Core loop: The Agent sees an intercepted postcard: a picture side (2-4 large flat icons forming a scene) and a short printed phrase. The Handler holds the alphabetical CODEBOOK, where every phrase has exactly two rows — a plain (literal) meaning and a hidden (figurative) meaning — each with the picture evidence that proves it and the routing it triggers. The Agent reads the phrase aloud and describes the picture; the Handler reads BOTH meanings aloud and the pair argues which one the picture fits; literal cards go back down the CIVILIAN POST chute, coded cards go to the desk matching the hidden meaning's theme (SECRETS, TROUBLE, FEELINGS, ...). The literal-vs-figurative call, made out loud with evidence, is the only path to the right pigeonhole — and it repeats for every card in the intercept.

---

# Double Meaning — design spec

Module id: `double-meaning` · Codename: **Double Meaning** · Primary target: **vocabulary** (secondary: pragmatics, expressive)

**Why `vocabulary` is the primary TherapyTarget.** The load-bearing cognitive move on every card is lexical-semantic: select the correct *sense* of a phrase (plain vs hidden) from pictured context, then map the hidden sense into a *meaning category* (secrets / trouble / feelings / effort / money). That is sense selection plus semantic categorization — exactly what `THERAPY_TARGET_LABELS.vocabulary` ("Vocabulary & categories") names, and exactly the figurative-language deficit the research shortlist targets for high schoolers with language disorders. Pragmatics (negotiating meaning, repairing descriptions) and expressive (scene description) are genuinely exercised but are the *vehicle*; the *cargo* is word and phrase meaning.

---

## 1. Concept & fiction

The enemy hides coded traffic inside the city's ordinary mail. Their couriers write postcards using set phrases **figuratively** — "the beans got spilled last night" means a secret leaked, and the postcard is really a report to their network. Innocent civilians use the very same phrases **literally** — somebody actually knocked over a pot of beans. The only tell is the picture side of the postcard: senders always illustrate what they were actually talking about.

The Field Agent works the **Intercept Desk**: postcards arrive one at a time, and behind the desk is a wall of routing pigeonholes — one desk per hidden-meaning theme, plus the **CIVILIAN POST** chute for genuine mail that must go back into circulation (holding an innocent grandmother's postcard blows the whole operation). The Handler holds the **Codebook**: every cover phrase the enemy is known to use, its plain meaning, its hidden meaning, and where each kind of card goes.

Neither can work alone: the Agent sees the card but has no codebook; the Handler knows both meanings of every phrase but cannot see the picture that decides between them.

Tagline: *Is it code or just a postcard? Route intercepted mail by what the sender really meant.*

## 2. What the Agent sees

A 2D React component (`DoubleMeaning.tsx`), portrait-iPad-friendly, minimal text:

- **Header strip** (small): `INTERCEPT DESK` legend and a card counter — `CARD 1 OF 2`. No other chrome.
- **The postcard** (center, ~60% of width, landscape card with a stamp-and-postmark dressing in the corner — pure decoration):
  - **Picture pane** (top ⅔ of the card): 2–4 large flat line-art icons composed as a scene (e.g., a broken window, a lamp, a wall clock). Icons are drawn, never labeled with text. Every icon carries an aria-label from the icon table (`describeIcon`), so VoiceOver reads "A window with a cracked pane."
  - **Phrase plate** (bottom ⅓): the phrase in large type between quote marks — `"in hot water"`. This is the only reading the Agent must do, one short phrase, large print. (SLP can read it aloud for non-readers; the Handler script also opens by asking the Agent to read it, which is itself the first expressive rep.)
- **The routing wall** (bottom rail, fixed for the tier): one pigeonhole per desk, each a ≥72 px touch target showing a **badge shape** + one-word label — keyhole/SECRETS, cracked triangle/TROUBLE, heart/FEELINGS (+ gear/EFFORT at tier 2, coin/MONEY at tier 3) — and, set apart on the left with a mail-flap visual, the slot-badge **CIVILIAN POST** chute. Badges are shapes, never color-coded, matching the house rule.
- **Tapping a pigeonhole** commits the current card. Correct: the card slides into the slot (haptic tick), the next card slides in, counter advances. Wrong: shake + buzz, card stays put, strike registered — the desk never changes state on a miss (same "talking first costs nothing" property as Bad Intel).

Nothing else is tappable. There is no way to peek at meanings, themes, or the codebook from the screen.

## 3. What the Handler has

All of the following renders from `rules.ts` data via `manual.ts` — the same tables `solve()` walks. Rookie is complete below; Agent and Mastermind are sketched with real sample rows.

### 3a. The routing wall (desk table)

`ROUTING_DESKS: readonly DeskRule[]` — `{ id, label, badge, badgeName, minDifficulty, standard, simplified }`

| Desk | Badge | Standard prose | Simplified prose |
|---|---|---|---|
| CIVILIAN POST | the mail slot | Genuine mail. The sender meant the words exactly as written — nothing hidden. Send it back down the chute so real people get their post. | Normal mail. The words mean just what they say. Put it back in the mail. |
| SECRETS desk | the keyhole | Coded traffic about telling or keeping secrets. | Hidden messages about secrets. |
| TROUBLE desk | the cracked triangle | Coded traffic about danger, risk, or being in trouble. | Hidden messages about trouble or danger. |
| FEELINGS desk | the heart | Coded traffic about strong feelings — nerves, joy, dread. | Hidden messages about feelings. |
| EFFORT desk *(tier 2+)* | the gear | Coded traffic about hard work and long hours. | Hidden messages about hard work. |
| MONEY desk *(tier 3)* | the coin | Coded traffic about money and what things cost. | Hidden messages about money. |

### 3b. The picture glossary (scene icon table)

`SCENE_ICONS: readonly SceneIcon[]` — `{ id, phrase, standard, simplified }`. The `phrase` field ("a cooking pot") is what codebook rows are *generated from*; `standard`/`simplified` are the spot-it descriptions and the Agent-side aria labels, so Handler prose and Agent screen can never drift. Rookie's icons (cue icons plus the neutral dressing pool):

| Icon (phrase) | Standard: how to spot it | Simplified |
|---|---|---|
| a cooking pot | A pot on a stove with steam lines rising. | A pot with steam. |
| food spilled on the floor | Small shapes scattered from a tipped container. | Spilled food. |
| a whispering figure | A person with a hand cupped beside their mouth. | Someone whispering. |
| a wrapped gift | A box with ribbon and a bow. | A present. |
| a birthday cake | A cake with lit candles. | A cake with candles. |
| a cat | A sitting cat, tail curled. | A cat. |
| an open sack | A cloth bag tipped open at the mouth. | An open bag. |
| a steaming bathtub | A tub with wavy steam lines above it. | A hot bath. |
| a whistling kettle | A kettle with steam from the spout. | A hot kettle. |
| a cracked window | A window pane with a crack through it. | A broken window. |
| an office desk | A desk with a nameplate — somewhere you get called to. | A boss's desk. |
| a warning letter | An envelope stamped with an exclamation mark. | A warning letter. |
| a pair of ice skates | Boots with blades. | Ice skates. |
| cracking ice | A frozen surface with spreading cracks. | Cracked ice. |
| a snowdrift | A mound of snow with flakes falling. | Snow. |
| bare feet | Two footprints-and-toes, no shoes. | Bare feet. |
| a low thermometer | A thermometer with the bar near the bottom. | A cold thermometer. |
| a stage curtain | Theater curtains with a spotlight beam. | A stage. |
| a diving board | A high board over water. | A diving board. |
| a crescent moon | A crescent moon with stars. | The moon. |
| a rocket | A rocket with a flame trail. | A rocket. |
| a trophy | A cup on a base. | A trophy. |
| confetti | Scattered streamers and dots falling. | Confetti. |
| *neutral:* a lamp / a chair / a potted plant / a wall clock / a bicycle / a wristwatch | Ordinary room dressing; each with a one-line spot-it description. | One word each. |

Neutral icons are deliberately **inert household objects**; a table test enforces that no neutral icon appears in any phrase's evidence list (see §6).

### 3c. THE CODEBOOK — the load-bearing table

`EXPRESSIONS: readonly ExpressionRule[]`:

```ts
interface SenseRule {
  /** icons that prove this sense; any one shown is proof */
  cueIcons: readonly SceneIconId[];
  /** fresh-prose meaning, both editions (original writing, no borrowed definitions) */
  standard: string;
  simplified: string;
}
interface ExpressionRule {
  id: string;
  phrase: string;          // printed on the card and in the codebook, alphabetical
  theme: DeskId;           // where the FIGURATIVE sense routes
  difficulty: Difficulty;  // lowest tier this phrase can appear at
  literal: SenseRule;      // always routes to CIVILIAN POST
  figurative: SenseRule;
}
```

The manual prints one alphabetical codebook (lookup is by phrase, not tier); each phrase renders as a two-row group, generated as: *"Picture shows {cue phrases joined with 'or'} → {meaning} → {desk}."* Rookie codebook, complete — six phrases across three themes:

**"cold feet"** — theme: FEELINGS
- PLAIN: picture shows a snowdrift, bare feet, or a low thermometer → the sender's feet were genuinely freezing. → CIVILIAN POST. *(simplified: Snow, bare feet, or a cold thermometer → real cold feet. → CIVILIAN POST.)*
- HIDDEN: picture shows a stage curtain or a diving board → means *too nervous to go through with the plan*. → FEELINGS desk. *(simplified: A stage or a diving board → hidden meaning: too scared to do it. → FEELINGS desk.)*

**"in hot water"** — theme: TROUBLE
- PLAIN: picture shows a steaming bathtub or a whistling kettle → the sender means water that is actually hot. → CIVILIAN POST. *(simplified: A hot bath or a hot kettle → real hot water. → CIVILIAN POST.)*
- HIDDEN: picture shows a cracked window, an office desk, or a warning letter → means *in trouble for something you did*. → TROUBLE desk. *(simplified: A broken window, a boss's desk, or a warning letter → hidden meaning: in trouble. → TROUBLE desk.)*

**"let the cat out of the bag"** — theme: SECRETS
- PLAIN: picture shows a cat or an open sack → a real cat really got loose. → CIVILIAN POST. *(simplified: A cat or an open bag → a real cat got out. → CIVILIAN POST.)*
- HIDDEN: picture shows a whispering figure or a wrapped gift → means *to give away a secret without meaning to*. → SECRETS desk. *(simplified: Whispering or a present → hidden meaning: a secret slipped out. → SECRETS desk.)*

**"over the moon"** — theme: FEELINGS
- PLAIN: picture shows a crescent moon or a rocket → the sender means the actual moon, up in the sky. → CIVILIAN POST. *(simplified: The moon or a rocket → the real moon. → CIVILIAN POST.)*
- HIDDEN: picture shows a trophy or confetti → means *so happy you could burst*. → FEELINGS desk. *(simplified: A trophy or confetti → hidden meaning: very, very happy. → FEELINGS desk.)*

**"skating on thin ice"** — theme: TROUBLE
- PLAIN: picture shows a pair of ice skates or cracking ice → someone really went skating where the ice is thin. → CIVILIAN POST. *(simplified: Ice skates or cracked ice → real skating. → CIVILIAN POST.)*
- HIDDEN: picture shows a warning letter or an office desk → means *taking a chance that could land you in serious trouble*. → TROUBLE desk. *(simplified: A warning letter or a boss's desk → hidden meaning: one more risk and you are in big trouble. → TROUBLE desk.)*

**"spill the beans"** — theme: SECRETS
- PLAIN: picture shows a cooking pot or food spilled on the floor → the sender is talking about real beans. → CIVILIAN POST. *(simplified: A pot or spilled food → real beans. → CIVILIAN POST.)*
- HIDDEN: picture shows a whispering figure, a wrapped gift, or a birthday cake → means *to tell a secret you were supposed to keep*. → SECRETS desk. *(simplified: Whispering, a present, or a cake → hidden meaning: telling a secret. → SECRETS desk.)*

Note the deliberate structure: cue icons are **disjoint between the two senses of a phrase** (enforced by test), but freely shared *across* phrases (a whispering figure proves the hidden sense of both SECRETS phrases) — so describing the picture alone never identifies the phrase, and reading the phrase alone never decides the sense. Each half of the pair holds exactly half the problem.

### 3d. The Double Meaning rule (the module's exception callout)

`DOUBLE_MEANING_RULE` (warning callout, printed above the codebook):
- **Standard:** "Every phrase in this codebook has two meanings: a PLAIN one, where the words mean exactly what they say, and a HIDDEN one the enemy uses as code. The phrase alone can never tell you which — senders always illustrate what they were really talking about, so the picture side decides. Route a card from the phrase alone and you will misroute mail. Genuine mail goes back down the CIVILIAN POST chute; coded mail goes to the desk that matches its hidden meaning."
- **Simplified:** "Every phrase has two meanings. The plain meaning: the words mean just what they say. The hidden meaning: it is code. The phrase alone is not enough. The picture tells you which meaning is real. Plain → CIVILIAN POST. Hidden → the matching desk."

### 3e. Working a card (the Handler's script — printed as `steps`)

Standard edition:
1. Ask for the phrase word for word, and how many cards are in the stack.
2. Find the phrase in the codebook — it is in alphabetical order.
3. Do not read the rows yet. Ask: "Describe the picture — every single thing in it."
4. Read BOTH rows aloud: the plain meaning first, then the hidden meaning.
5. Ask: "Which meaning does the picture fit? What in the picture proves it?"
6. Only when you both agree, name the desk. The Agent taps it.

Simplified edition:
1. Ask: "What does the phrase say?"
2. Find the phrase in the book. It is in ABC order.
3. Ask: "What is in the picture? Name everything."
4. Read both meanings out loud. The plain one first. Then the hidden one.
5. Ask: "Which meaning fits the picture? Why?"
6. Agree first. Then say the desk. The Agent taps it.

Tip callout (both editions, tone `tip`): "A card routed to the wrong slot counts as a wrong answer, and the card stays on the desk. Talking it through first costs nothing." / "Wrong slot = wrong answer. The card stays. Asking again is free."

### 3f. Tier notes (`TIER_NOTES`, matching the Bad Intel pattern)

- **Rookie (warning):** "One card per intercept, and no promises about which meaning you'll get — the picture is the only way to tell. Make the Agent prove the meaning before anyone taps." / "The phrase is not enough. Always check the picture first."
- **Agent (tip):** "Two cards now, and the extra picture clutter is deliberate — most of what the Agent sees proves nothing. Ask what's *evidence* and what's just furniture." / "More things in the picture now. Some mean nothing. Ask about all of them."
- **Mastermind:** `null` — as in Bad Intel, unprompted vigilance is the subtlety lever.

### 3g. Agent & Mastermind codebook additions (sketch — same row structure)

**Tier 2** (adds EFFORT desk; +5–6 phrases). Samples:
- **"burning the midnight oil"** — EFFORT. PLAIN: an oil lamp or a moonlit window → a lamp really burning at night → CIVILIAN POST. HIDDEN: a stack of books or a desk piled with papers → *staying up late to finish the work* → EFFORT desk.
- **"butterflies in your stomach"** — FEELINGS. PLAIN: a butterfly net or a butterfly in a jar → real butterflies → CIVILIAN POST. HIDDEN: a stage curtain or an exam paper → *the fluttery feeling of being nervous* → FEELINGS desk.
- **"keep it under your hat"** — SECRETS. PLAIN: a brimmed hat or a hatbox → a real hat → CIVILIAN POST. HIDDEN: a whispering figure or a locked diary → *to tell no one at all* → SECRETS desk.

**Tier 3** (adds MONEY desk; +5–6 opaque idioms and single-word metaphors — same contract, no new rule kinds). Samples:
- **"cost an arm and a leg"** — MONEY. PLAIN: an arm cast, a leg cast, or crutches → the sender means a real arm and a real leg → CIVILIAN POST. HIDDEN: a price tag or an empty wallet → *so expensive it hurts to pay* → MONEY desk.
- **"a gold mine"** — MONEY. PLAIN: a pickaxe or a mine tunnel → a real mine with real gold → CIVILIAN POST. HIDDEN: a crowded shop or a lightbulb-idea → *something that earns a lot of money* → MONEY desk.
- **"a minefield"** — TROUBLE. PLAIN: a fenced field with warning signs → a real minefield → CIVILIAN POST. HIDDEN: a tangle of question marks or a tense meeting table → *a situation where any step could blow up on you* → TROUBLE desk.

All definitions above are written fresh for this manual; the idioms themselves are public-domain stock, per the IP rule.

## 4. The conversation loop (annotated Rookie transcript)

Instance: one card — phrase `"in hot water"`, picture: *a cracked window, a lamp, a wall clock*. This module is STATIC-badged this mission (repairDrills = 1).

> **Handler** *(script step 1)*: What does the phrase say, word for word? And how many cards?
> **Agent**: One card. It says "in hot water." *(expressive: precise reading aloud; the counter forces a two-part answer)*
> **Handler** *(finds row; script step 3)*: Don't tap anything. Describe the picture — every single thing in it.
> **Agent**: Uh, there's a window and some stuff.
> **Handler** *(STATIC — scripted neutral clarification, not a real answer)*: Say again? Tell me one thing at a time.
> **Agent**: Okay — a window with a big crack in it. A lamp. And a clock on the wall. *(repair: the vague description is reformulated into an enumerated one — the Static Protocol's whole point, and the picture pane is rich enough that "say again" has real work to do)*
> **Handler** *(script step 4)*: Codebook says this phrase has two meanings. Plain meaning: the picture shows a steaming bathtub or a whistling kettle — water that's actually hot. Hidden meaning: the picture shows a cracked window, an office desk, or a warning letter — it means *in trouble for something you did*. *(the Agent receives both senses receptively — the figurative definition is heard every round, whichever sense wins)*
> **Agent**: There's no bathtub. No kettle either.
> **Handler** *(script step 5)*: So which meaning does the picture fit? What proves it?
> **Agent**: The hidden one. The cracked window — somebody broke something, so they're in trouble. The lamp and the clock aren't anything. *(the load-bearing move, out loud: sense selection with cited evidence, plus explicitly discarding the distractors)*
> **Handler**: Agreed — it's code, and "in trouble" is the TROUBLE desk. The cracked triangle.
> **Agent** *(taps TROUBLE)*: In it goes. ✓

Every turn is forced by the information gap: steps 1–3 exist because the Handler is blind, steps 4–5 exist because the Agent has no codebook, and the tap waits on a negotiated agreement about *meaning*, not on either player's private knowledge.

## 5. Difficulty tiers

What scales is semantic load and evidence density — never speed:

| | Rookie | Agent | Mastermind |
|---|---|---|---|
| Cards per intercept | 1 | 2 | 3 |
| Phrase pool | 6 transparent idioms (difficulty 1) | + ~6 (difficulty ≤ 2) | + ~6 opaque idioms & word metaphors (≤ 3) |
| Desks (besides CIVILIAN POST) | 3 | 4 | 5 |
| Cue icons shown per card | 2 | 1 | 1 |
| Neutral distractor icons | 1 | 2 | 3 |
| Tier note in manual | full warning | brief tip | none |
| Minutes | ~3 | ~5 | ~6 |

Rookie: evidence is doubled and clutter minimal — the literal/figurative call is nearly always clean. Agent: single cue among two distractors — describing *everything* and sorting evidence from furniture becomes necessary. Mastermind: three cards, single cue among three distractors, opaque phrases whose hidden meanings the student is least likely to know, five near-neighbor desks (is "a minefield" TROUBLE or MONEY? only the codebook says), and no manual reminder to check the picture.

## 6. Generation & solvability

**State shape** (minimal — two fields per card, nothing else):

```ts
export interface Postcard { expression: string; icons: SceneIconId[] }
export interface DoubleMeaningState { cards: Postcard[] }
export type DoubleMeaningAnswer = DeskId[];   // one desk per card, in order
```

As in Bad Intel, the active sense is **deliberately not stored** — it is derivable by intersecting the shown icons with the two senses' `cueIcons`, which is exactly the check the printed codebook tells the human Handler to make. `state` contains only what the Agent can see and say.

**generate(seed, difficulty):**
1. `rng = mulberry32(seed)`.
2. `pool = EXPRESSIONS.filter(e => e.difficulty <= difficulty)`; draw `difficulty` **distinct** expressions with `sample`.
3. Per card: choose the sense with an independent coin flip (no distributional promise — so no meta-exploit like "one of each, therefore the last card is forced").
4. Per card: `cues = sample(rng, sense.cueIcons, CUE_COUNT[difficulty])`, `neutrals = sample(rng, NEUTRAL_ICONS, NEUTRAL_COUNT[difficulty])`, `icons = shuffle(rng, [...cues, ...neutrals])`.
5. Emit `{ cards }`. Same seed + difficulty ⇒ identical instance (pure `mulberry32` stream, no ambient state).

**solve(state)** — from tables only:

```ts
cards.map(({ expression, icons }) => {
  const e = EXPRESSION_BY_ID[expression];
  const literalHit = icons.some(i => e.literal.cueIcons.includes(i));
  return literalHit ? 'civilian-post' : DESK_FOR_THEME[e.theme];
});
```

(The robot may equivalently check the figurative intersection; the invariants below make the two checks agree.)

**Why every instance has exactly one defensible answer path.** Three invariants, all mechanical:
1. *Within-phrase disjointness* — for every expression, `literal.cueIcons ∩ figurative.cueIcons = ∅`. Static table test.
2. *Neutral inertness* — `NEUTRAL_ICONS` is disjoint from **every** sense's `cueIcons` across the whole codebook. Static table test.
3. *Construction* — shown icons = (cues drawn only from the active sense) ∪ (neutrals). By (1) and (2), the icon set intersects the active sense's cues (nonempty by construction) and intersects the other sense's cues not at all.

Therefore per card exactly one sense matches (XOR, asserted per-seed in the property test), the sense determines the desk by a total function (literal ⇒ CIVILIAN POST; figurative ⇒ `theme`, a single `DeskId` per expression, and a table test asserts every theme reachable at a tier has a desk at that tier), and the answer is the ordered list of these forced choices. No judgment calls anywhere: the robot Handler needs only set membership and one table lookup — the same two acts the printed manual scripts for the human.

**logic.test.ts plan** (mirrors Bad Intel's): 1000 seeds × 3 tiers asserting well-formedness (distinct expressions, icon counts per tier, exactly-one-sense-hit per card), `validate(state, solve(state)) === true`, rejection of mutated answers (wrong desk, truncation, civilian↔desk swap), determinism, coverage across seeds (every eligible expression appears; both senses of every expression occur), plus the table tests: cue disjointness, neutral inertness, theme/desk coverage, alphabetical phrase order, nonempty prose in both editions for every desk, icon, sense, and callout.

**Implementation size:** `rules.ts` is data entry (~18 expressions, ~40 icons, 6 desks, callouts); `logic.ts` is ~70 lines; `manual.ts` is table-mapping like Bad Intel's; the component is a card + a row of buttons. Comfortably one dev-day against the existing module skeleton.

## 7. Answer & validation model

- The Agent answers a card by **tapping one pigeonhole** (a `DeskId`, `civilian-post` included). Cards are processed strictly in order; only the top card is routable.
- **Correct tap:** card animates into the slot, next card presented; when the last card lands, `onSolved()`.
- **Wrong answer** = tapping any desk other than `solve(state)[currentCard]`. `onStrike()` fires, the card stays, the desk state is unchanged — identical stakes model to Bad Intel (1–3 strikes per module, SLP-set, seals red at the limit; mission continues).
- Module-level `validate(state, answer)`: `answer.length === cards.length` and element-wise equality with `solve(state)`. Partial or reordered answers are rejected.

## 8. Static Protocol & hints

**Static Protocol fit.** The first description is naturally compound — a phrase read verbatim *plus* a multi-icon scene — so the scripted "say again" always has substance to work on (rephrase the scene one item at a time, re-read the phrase, separate evidence from furniture). Nothing about the design lets a first description collapse to a single token; even the phrase alone is 3–6 words that must be read accurately for the Handler's alphabetical lookup to land on the right row — a misread phrase sends the Handler to the wrong page and surfaces as a repair, not a strike.

**Hints** (escalating, communication-only, verbatim):
1. "Start with the card: read the phrase out loud exactly as printed, then name every single thing in the picture."
2. "Ask your Handler for BOTH meanings — the plain one and the hidden one. Then say which one the picture fits, and what in the picture proves it."
3. "Put it in one sentence: 'The picture shows ___, so the sender means it the ___ way, so it goes to ___.' If you two disagree, ask your Handler what the other meaning's picture would have looked like."

## 9. Worked example (hand-built Rookie instance)

As `generate(seed, 1)` would emit it:

```json
{
  "moduleId": "double-meaning",
  "difficulty": 1,
  "seed": 4127,
  "state": {
    "cards": [
      { "expression": "spill-the-beans",
        "icons": ["wall-clock", "birthday-cake", "whispering-figure"] }
    ]
  }
}
```

Replay against the §3 tables:
1. Screen: one card, counter `CARD 1 OF 1`; picture pane shows a wall clock, a birthday cake, a whispering figure; phrase plate reads **"spill the beans"**; routing wall shows CIVILIAN POST, SECRETS, TROUBLE, FEELINGS.
2. Handler (script 1–2): gets the phrase, finds **"spill the beans"** in the alphabetical codebook.
3. Handler (script 3): "Describe the picture — everything." Agent: "A clock on the wall, a birthday cake with candles, and a person whispering behind their hand."
4. Handler (script 4) reads both rows: PLAIN — pot or spilled food ⇒ real beans ⇒ CIVILIAN POST; HIDDEN — whispering figure, wrapped gift, or birthday cake ⇒ *to tell a secret you were supposed to keep* ⇒ SECRETS desk.
5. Script 5: "Which meaning fits? What proves it?" Agent: "No pot, nothing spilled — but the whispering and the cake match the hidden one. The clock is nothing." (Robot check, identically: icons ∩ literal cues `{cooking-pot, spilled-food}` = ∅; icons ∩ figurative cues `{whispering-figure, wrapped-gift, birthday-cake}` = `{birthday-cake, whispering-figure}` ≠ ∅ ⇒ figurative ⇒ theme `secrets`.)
6. Agent taps the keyhole slot. `validate(state, ["secrets"])` ⇒ true. Solved, zero strikes.

The one defensible answer is `["secrets"]`; every other tap (`civilian-post`, `trouble`, `feelings`) is rejected by `validate` and would strike.

## 10. Risks & open questions

- **Prior idiom knowledge thins the Agent-side gap.** A student who already knows "spill the beans" can guess theme SECRETS without the Handler *if* the sense is figurative. The literal fork keeps the scene check load-bearing (a known idiom still misroutes if the card is genuine mail), and the target population is precisely the students who *don't* reliably hold the figurative senses — but strong-comprehender partners may shortcut the talk. Mitigations if playtesting confirms: lean the draw toward literal cards for repeat players, and Mastermind's opaque phrases restore the gap.
- **Human-facing neutral inertness is a curation judgment, not a provable property.** The tests prove set-disjointness, not connotation — a teacup icon would be set-disjoint from "in hot water" yet visually suggest it. The pool is deliberately dull household objects, and every new phrase requires re-auditing the pool. This is the design's main ongoing editorial cost.
- **Some classic idioms don't have a drawable literal scene** ("raining cats and dogs" literal is nonsense) — the contract quietly excludes them, which constrains the phrase list. Accepted: ~18 well-chosen phrases beat 40 forced ones.
- **The figurative definitions arrive receptively** (Handler reads them); the Agent never produces a definition inside the puzzle. Expressive consolidation should ride the existing debrief — a "Talk it over" prompt like "Pick two phrases from this intercept and tell your partner both meanings from memory" — worth adding when the module ships.
- **Phrase-reading is on the Agent side.** One short large-print phrase per card is the entire Agent reading load, but for non-readers the SLP must voice it; the aria-labels cover VoiceOver users. Watch this in the classroom playtest.
- **Cross-phrase cue sharing is a feature** (scene alone never identifies the phrase) but as the codebook grows, an accidental *within-phrase* collision or a cue that plausibly reads as the wrong sense to a human must be caught — the table tests catch the former; only ambiguity playtesting catches the latter.

## 11. Why this beats the obvious alternative

The obvious build is an idiom quiz with spy paint: the screen shows "in hot water" and four definitions, the Handler's manual holds the answer key, and the Handler just reads letters. That design has a one-way gap (the Handler could solve alone with the key; the Agent contributes a page number), a first description of "it says B" that starves the Static Protocol, and definitions as *answers to be matched* rather than *meanings to be used* — precisely the "quiz with spy paint" failure the brief warns about. Double Meaning instead splits the semantic act itself down the middle: the Agent holds the context (picture) but not the senses, the Handler holds both senses but not the context, and the only way to route a card is to say the evidence out loud, hear both meanings, and argue which one the sender intended — sense selection from context, the actual therapy target, performed as conversation on every single card, atop the same rules-as-data spine (three typed tables, a ten-line solver, a codebook that prints beautifully in both editions) that makes the rest of the app provable.
