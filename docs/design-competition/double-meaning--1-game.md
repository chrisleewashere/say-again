# Double Meaning (double-meaning, lens: game)

Tagline: Steam open the mailbag: spot which postcards carry coded phrases, decode them into standing orders — and wave the innocent mail through untouched.
Primary: vocabulary / secondary: expressive, pragmatics
Minutes: {"1":4,"2":5,"3":6}

Core loop: The Agent works an intercepted mailbag of postcards: each card has a picture on the front and a one-line message with one underlined phrase on the back. The Handler holds the ring's captured codebook, which says what each phrase would look like "taken at its word" and what it secretly means if it is code. For every card the Agent describes the front picture (before reading any words), then reads the underlined phrase; the Handler compares the picture to the codebook's literal depiction — a match means the card is code and the phrase's figurative meaning selects a standing-order symbol for the Agent to tap, while a mismatch means the phrase is ordinary talk and the card gets the RELEASE stamp. Wrong sorts are strikes; there is no clock; at Mastermind, multiple-meaning words appear whose picture selects the sense, and some senses are innocent. The literal-versus-figurative comparison is the only way through: the Agent holds the evidence, the Handler holds the meanings, and neither can sort a single card alone.

---

# Double Meaning — Module Design Spec

Therapy target: **idioms, figurative language, and multiple-meaning words**.
Primary `TherapyTarget`: **`vocabulary`** ("Vocabulary & categories" — semantic depth: what phrases and word senses mean is the decision substrate of every move). Secondary: `expressive` (the Agent must produce precise literal scene descriptions), `pragmatics` (confusable pictures and the Static Protocol force clarification and repair).

Justification of the primary: figurative language is a semantics problem — knowing that a phrase has a stored, non-compositional meaning alongside its word-for-word reading, and that words carry multiple senses selected by context. Every decision point in this module is resolved by that knowledge and nothing else. `receptive` and `expressive` work happens, but it is in service of the semantic comparison, exactly as Password Intercept's describing serves its semantics target.

---

## 1. Concept & fiction

**Codename:** Double Meaning
**Tagline:** *Steam open the mailbag: spot which postcards carry coded phrases, decode them into standing orders — and wave the innocent mail through.*

The safehouse runs a postal intercept — the Steam Room. Every night a mailbag of postcards passes through on its way out of the city. Most are exactly what they look like: aunts, weather, dinner. But a courier ring hides operational traffic in plain sight, and counterintelligence has captured their codebook.

The ring's trick is elegant: a coded postcard is marked by its own front. The picture on the front of a coded card shows the flagged phrase **taken at its word** — an actual tipped jar of beans for "spilled the beans," actual bare feet on ice for "cold feet." An innocent card's front is just a tourist scene with no connection to its words. The censor's office has already underlined the one suspicious phrase on each card; what nobody at the intercept desk can do alone is tell which cards are talking and which are just talking.

The **Field Agent** sits at the sorting desk with the mailbag on the iPad. The **Handler** holds the captured codebook — every phrase the ring uses, what the words would look like if they were meant for real, what they secretly mean, and which standing order that meaning triggers. Innocent mail must be RELEASED unaltered (hold it back and the ring notices the intercept); coded mail must be decoded to the right order (release it and the network walks into a trap). Nothing explodes and nothing is timed — but every wrong sort is a strike, and the SLP sets how few the desk can afford.

The fiction is original: no borrowed names, art, manual text, or trade dress. The idioms themselves are public-domain English; every definition, depiction description, carrier sentence, and example in the tables below is fresh prose written for this module.

---

## 2. What the Agent sees

A warm-lit sorting desk, in the Tradecraft idiom, on one screen. Minimal text; everything decision-relevant is visual or tappable.

**The rack (top ~60%):** 3–5 postcards (by difficulty) in a horizontal rack. Each card renders as one wide row showing both faces at once:
- **Front (left half):** a single flat SVG scene — the picture. One clear subject, 2–4 salient details, drawn in the module's woodcut-postcard style. No words in the art.
- **Back (right half):** one short handwritten-style line (≤ 12 words) with **one phrase underlined** in censor's red, plus a postage stamp bearing a large numeral (1–9). The stamp numeral is pure describing flavor — like Bad Intel's setting numbers, it never decides anything, but it gives the pair an unambiguous way to name cards ("the card with stamp 7").

Tapping a card selects it: it lifts and glows amber; sorted cards lie flat under a RELEASED or DECODED overlay stamp and stop responding.

**The sorting console (bottom ~40%):** fixed hardware, identical every mission:
- A brass **RELEASE** stamp button (large, left).
- Six **standing-order keys** in a row, each showing only a symbol: **the flame, the bell, the key, the ladder, the clock, the coin**. No text labels — the symbols' meanings live only in the Handler's manual (same trick as Asset Interview's verdict badges, and the reason the Agent cannot decode alone).
- The **SORT lever** (right). Committing is two taps: select a destination (it lights), then pull the lever. This kills accidental strikes on an iPad.

Touch targets ≥ 64 px. All state is shape/position-coded, never color-only: selected = lifted + border, sorted = overlay stamp + flat. Aria labels come from the same `describePicture()` strings the manual's picture legend is generated from.

**On-screen text budget:** one short sentence per card back. That is the entire Agent-side reading load, deliberately: reading one natural sentence containing the phrase is itself the therapy-valid presentation of an idiom in context, and it is far below the Handler's load.

---

## 3. What the Handler has

Four generated-from-data pieces per edition: the **marking rule**, the **picture check steps**, the **codebook** (per tier), and the **order board**. Everything below is drafted as the actual `rules.ts` rows would print.

### 3a. The marking rule (the crux — printed as a warning callout)

**Standard:** "The ring marks its mail with the picture. On a coded card, the front shows the underlined phrase exactly as if it were meant word for word — the book below tells you what each phrase looks like *taken at its word*. Always get the Agent's description of the front FIRST, before any words are read. Then look up the underlined phrase and compare, detail for detail. Match: the card is code — the phrase's real meaning picks the order. No match: the phrase is just ordinary talk meaning what the book says it really means — stamp RELEASE and send it on."

**Simplified:** "Coded cards are marked by the picture. First ask: what is the picture on the front? Then ask for the underlined words. Look them up below. The book tells you what the words would look like if they were real. Same as the Agent's picture? The card is code. Different picture? It is normal mail. Stamp RELEASE."

### 3b. Working a card (steps block — the conversation script)

**Standard:**
1. "Pick a card by its stamp number. Front first: 'Describe the whole picture — don't read me anything yet.'"
2. "Now the back: 'Read the underlined words exactly as printed, then the whole line.'"
3. "Find the phrase in the codebook. Read its *taken-at-its-word* picture aloud and ask: 'Does your picture match that, detail for detail?'"
4. "Match → code. Read what the phrase really means, find that meaning's family on the order board, and name the symbol for the Agent to press."
5. "No match → ordinary talk. Tell the Agent what the phrase really meant in the message, then: 'Stamp RELEASE.'"
6. "Not sure it matches? Do not guess. Trade details one at a time until you both are."

**Simplified:** the same six moves in short sentences ("Ask about the picture first. No reading yet." / "Ask for the underlined words." / "Look them up. Read the book's picture. Ask: is that your picture?" / "Same? It is code. Say the real meaning. Name the symbol." / "Different? Normal mail. Say what it really meant. Stamp RELEASE." / "Not sure? Ask again. Asking is free.").

### 3c. The order board (complete — one static table, all tiers)

Each coded meaning belongs to one **meaning family**; each family triggers one standing order on one symbol key. (Rookie's printed codebook also repeats the symbol inline per row — one lookup for Rookie Handlers; Agent and Mastermind Handlers make the second hop themselves.)

| Family | Meanings about… (standard / simplified) | Standing order | Symbol key |
|---|---|---|---|
| SECRETS | telling, keeping, or losing secrets / secrets | Burn the papers | **the flame** |
| WARNINGS | trouble, fear, danger, backing out / trouble or fear | Warn the network | **the bell** |
| GOOD FORTUNE | easy wins, luck, good news / good news or easy | Open the safe house | **the key** |
| HARD WORK | effort, struggle, working long / hard work | Send more hands | **the ladder** |
| WAITING | resting, pausing, staying put / rest or wait | Hold position | **the clock** |
| MONEY | earning, spending, cost / money | Pay the source | **the coin** |

### 3d. Rookie codebook (tier 1 — complete, 8 entries)

Printed columns: *Underlined phrase | Taken at its word (the coded picture) | What it really means | Family → symbol*. Standard-edition prose shown; simplified variants follow in brackets. All prose is original.

| Phrase | Taken at its word | What it really means | Family |
|---|---|---|---|
| spill the beans | A tipped-over jar with dry beans scattering out of it. [A jar tipped over. Beans falling out.] | To give away a secret you were supposed to keep. [To tell a secret.] | SECRETS → the flame |
| let the cat out of the bag | A cloth sack lying open with a cat climbing out. [A cat climbing out of a bag.] | To let a secret slip out before it was meant to be told. [To let a secret get out.] | SECRETS → the flame |
| in hot water | A person standing in a steaming tub of water. [A person in a tub. Steam rising.] | In trouble with someone because of what you did. [In trouble.] | WARNINGS → the bell |
| cold feet | Bare feet standing on a block of ice. [Bare feet on ice.] | So nervous about a plan that you want to back out. [Too scared to do the plan.] | WARNINGS → the bell |
| piece of cake | One slice of layer cake on a small plate with a fork. [A slice of cake on a plate.] | So easy it takes no effort at all. [Very easy.] | GOOD FORTUNE → the key |
| hit the hay | A person swinging a fist at a bale of hay. [A person punching hay.] | To go to bed for the night. [To go to sleep.] | WAITING → the clock |
| cost an arm and a leg | A price tag with a drawing of an arm and a leg where the number should be. [A price tag with an arm and a leg on it.] | To be painfully expensive. [To cost a lot of money.] | MONEY → the coin |
| bring home the bacon | A person walking through a doorway carrying a whole slab of bacon. [A person carrying bacon home.] | To earn the money a family lives on. [To earn the money.] | MONEY → the coin |

Each entry also carries (data, not printed): its `pictureId`, and 1–2 fixed **carrier sentences** the card back can show — written so both readings stay plausible (e.g. "Aunt Rosa finally spilled the beans at Sunday dinner." / "At the market, Tomas let the cat out of the bag." / "Standing at the door, Petra got cold feet." / "Right after supper, the twins hit the hay." / "The repairs cost Uncle Bo an arm and a leg." / "Grandfather said the last part was a piece of cake." / "After Saturday, your brother is in hot water again." / "These days, cousin Vera brings home the bacon."). Ambiguous carriers are a design requirement: the sentence must never decide the card, only the picture does.

**Neutral fronts** (innocent-mail pictures, shared pool, with legend prose for the manual): the lighthouse on the rocks, the mountain lake, the market fountain, the tram car, the beach umbrella, the clock tower. None depicts any codebook phrase.

**Rookie tier note (warning callout):** "Every Rookie mailbag hides exactly one coded card — never more, never fewer, never the same one twice. Make the Agent prove every card." [Simplified: "One card is always code. Check every card."]

### 3e. Agent codebook (tier 2 — structure + sample rows)

Same columns; the *Family* column prints the family only (Handler makes the order-board hop). Adds ~8 entries authored as **confusable pairs** — pictures sharing a salient subject with a Rookie or tier-2 entry, so a lazy description ("it's a cat one") no longer resolves and detail-trading is forced. Sample rows:

| Phrase | Taken at its word | What it really means | Family |
|---|---|---|---|
| cat got your tongue | A cat up on a person's shoulder, one paw at their open mouth. [A cat pawing at a person's mouth.] | Staying silent when you are expected to speak. [Not talking.] | SECRETS |
| burn the midnight oil | An oil lamp burning on a desk, a moon in the window behind it. [A lamp lit at night on a desk.] | To keep working long after everyone else has stopped. [To work late.] | HARD WORK |
| break the ice | A frozen pond with a pick cracking the surface. [Ice cracking under a pick.] | To get strangers talking for the first time. [To help people start talking.] | GOOD FORTUNE |

(cat-sack vs cat-at-mouth; feet-on-ice vs pick-on-ice; flame-symbol talk vs lamp-at-desk — each pair differs on one nameable detail.) **Tier note (tip):** "Two of the four cards in an Agent mailbag are coded. The pictures at this tier rhyme — a cat is not enough; get the whole scene." [Simplified: "Two cards are code. Pictures look alike. Ask for every detail."] Tier 2 innocent cards may also wear **another phrase's** coded picture (cross-idiom decoy): the front shows the cat-sack while the underline reads "cold feet" — matching the picture to *the underlined phrase's* row, not to any row, becomes load-bearing.

### 3f. Mastermind codebook (tier 3 — structure + sample rows)

Adds **double-entry words**: one underlined word or short phrase, two codebook rows with different pictures — the picture selects the sense, and *not every sense is code*. A `disposition` field ('code' | 'clean') appears as the row's outcome. Sample rows:

| Phrase | Taken at its word | What it really means | Outcome |
|---|---|---|---|
| caught a bug | A hand holding a tiny microphone on a wire. [A small hidden microphone in a hand.] | The ring found a listening device. [They found a hidden microphone.] | code — WARNINGS |
| caught a bug | A person with a net catching a beetle. [A net catching a beetle.] | Ordinary talk: picked up a little illness, or an insect. Nothing hidden. [Normal talk. Not code.] | clean — RELEASE |
| by the bank | A grassy river edge with reeds and a mooring post. [The edge of a river.] | The riverside drop is active — stay put there. [Wait at the river.] | code — WAITING |
| by the bank | A stone building with columns and a coin sign. [A money building.] | Ordinary talk: errands at the money bank. [Normal talk. Not code.] | clean — RELEASE |

**Tier 3 has no tier note** (mirrors Bad Intel: no promise of how many cards are coded — 1 to 3 of the 5, seeded). The uniform rule from 3a still decides everything: find the row whose picture matches; no row → RELEASE; a matching row's outcome column says code (family → symbol) or clean (RELEASE).

---

## 4. The conversation loop

Rookie mailbag, 3 cards. Static Protocol active on this module (1 say-again). **[annotations in brackets]**

> **Handler:** Steam Room's open. Pick a card by its stamp number. Picture first — don't read me any words yet. *[the manual's step 1 blocks the phrase-first shortcut: the Agent must produce a scene description cold]*
> **Agent:** Stamp four. It's beans. *[typical underspecified first description]*
> **Handler (STATIC badge — scripted):** Say again? Tell me that a different way. *[Static Protocol: neutral clarification request on the first description; Handler may not act]*
> **Agent:** Okay — a jar is tipped over on its side, and little beans are pouring out onto the table. *[repair: reformulation with subject, state, action — the expressive target]*
> **Handler:** Got it. Now the back — the underlined words exactly as printed, then the whole line.
> **Agent:** Underlined: "spilled the beans." The line says, "Aunt Rosa finally spilled the beans at Sunday dinner."
> **Handler:** Looking it up… book says: taken at its word, "spill the beans" looks like a tipped-over jar with dry beans scattering out. Detail for detail — is that your picture? *[the literal reading is spoken aloud and compared against evidence: literal-meaning comprehension made load-bearing]*
> **Agent:** Yes. Jar on its side, beans coming out.
> **Handler:** Then the card's marked — it's code. The phrase really means to give away a secret you were supposed to keep. *[figurative meaning produced in contrast to the literal one — the core contrast of idiom therapy, said out loud every round]* Secrets family… order is "Burn the papers." Press the flame key and pull the lever.
> **Agent:** Flame… lever. It stamped DECODED. *[click #1]*
> **Handler:** Next card. Picture first.
> **Agent:** Stamp seven. A lighthouse standing on rocks, with waves.
> **Handler:** And the underline?
> **Agent:** "Hit the hay." Whole line: "Right after supper, the twins hit the hay."
> **Handler:** Book says word for word that would look like a person punching a bale of hay. A lighthouse is not that. So it's ordinary talk — it just means the twins went to bed. *[the mismatch case: the pair explicitly rules the literal reading out AND still states the figurative meaning — idiom knowledge is exercised on innocent cards too]* Stamp RELEASE.
> **Agent:** Released. One card left — the warning said exactly one is code, and we found it, so… I still check it? *[comprehension monitoring carrying over]*
> **Handler:** We check it. Picture first.

The Static Protocol lands on the richest possible first utterance — a whole scene, not a digit — so the scripted "say again" forces genuine reformulation (spec constraint 10 satisfied by construction).

---

## 5. Difficulty tiers

| | Rookie (1) | Agent (2) | Mastermind (3) |
|---|---|---|---|
| Cards | 3 | 4 | 5 |
| Coded | exactly 1 (promised in print) | exactly 2 (promised) | 1–3, seeded, **no promise** |
| Codebook | 8 transparent idioms, symbol printed inline per row (one lookup) | +8 entries incl. confusable-picture pairs; family only (order-board hop added) | + double-entry multiple-meaning words with clean senses; cross-idiom decoys common |
| Innocent fronts | neutral scenes only | neutral + cross-idiom decoys | neutral + cross-idiom + clean-sense matches |
| What scales | nothing but looking up | description precision (minimal-pair pictures), two-table navigation | sense selection; "match ≠ code" — the outcome column must be read; vigilance without a promised count |
| Minutes | ~4 | ~5 | ~6 |

Complexity scales; speed never does. No mechanic anywhere references time.

---

## 6. Generation & solvability

**State shape** (everything the Agent sees; nothing more — the solution is not stored):

```ts
interface PostCard {
  phrase: PhraseId;      // which underlined phrase
  sentence: number;      // index into that phrase's fixed carrier sentences
  picture: PictureId;    // the front art
  stamp: number;         // 1–9 flavor numeral, unique within the rack
}
interface DoubleMeaningState { cards: PostCard[]; }
```

**Rule tables** (`rules.ts`): `PHRASES` (id, printed text, tier), `PICTURES` (id, legend prose std/simp — also feeds aria labels and the manual's picture legend), `ENTRIES` (phraseId, pictureId, takenAtItsWord std/simp, meaning std/simp, family, disposition, carrier sentences), `FAMILIES`/`ORDERS` (family → order label std/simp → symbol), `TIER_NOTES`, `MARKING_RULE`. Manual and solver both generate from these — nothing else.

**generate(seed, difficulty):** mulberry32(seed) →
1. Card count and coded count from the tier row (tier 3: coded = randInt 1–3).
2. Coded cards: sample distinct phrases from the tier pool whose entry (or one seeded sense-entry, tier 3) has `disposition: 'code'`; card gets that entry's `pictureId` and a seeded carrier sentence.
3. Innocent cards: sample distinct phrases; front drawn from {neutral pool} ∪ {tier ≥ 2: other phrases' entry pictures} ∪ {tier 3: this phrase's `clean`-sense picture}, **filtered so the picture never equals any `code`-entry picture of this card's own phrase**.
4. Invariants enforced: phrases distinct across the rack; pictures distinct across the rack; stamp numerals distinct; shuffle rack order.

**solve(state)** — derived from tables only, exactly the Handler's printed procedure:
```
for each card:
  match = ENTRIES.find(e => e.phraseId === card.phrase && e.pictureId === card.picture)
  if (!match)                → { kind: 'release' }
  if (match.disposition === 'clean') → { kind: 'release' }
  else → { kind: 'decode', order: ORDER_BY_FAMILY[match.family].symbol }
```

**Exactly one defensible answer — the argument:**
- Per phrase, entry pictures are distinct (static table invariant, unit-tested), so `match` is unique or absent — no card can satisfy two rows.
- The generator guarantees `match` exists exactly when intended (coded and clean-sense cards) and is impossible otherwise (step 3's filter), so "no row → release" is never a judgment call.
- family → order is a total 1:1 static map; disposition is a printed column. Every branch of the procedure is a table lookup on `===`; there is nothing a robot Handler cannot decide.
- Human-side ambiguity (does the described picture match the printed depiction?) is not a solver question — pictures are discrete ids and each id's legend prose names its distinguishing details. The residual risk is art/prose quality, addressed in §10.

**Property tests** (1000 seeds × 3 tiers, per house style): rack size, coded count matches the tier promise, all uniqueness invariants, decoy-safety (innocent card's picture matches no code row of its phrase), `validate(state, solve(state))` true, mutations rejected (wrong symbol on a coded card, release on a coded card, decode on an innocent card, truncated answers), byte-equal determinism, and coverage — across seeds every entry appears coded, every order symbol is demanded, and every tier-3 disposition combination occurs.

---

## 7. Answer & validation model

```ts
type CardMove = { kind: 'release' } | { kind: 'decode'; order: OrderSymbolId };
type DoubleMeaningAnswer = CardMove[];   // aligned to state.cards
```

The Agent sorts cards in any order: select card → select RELEASE or one symbol key → pull the SORT lever (two-tap commit). The component checks the committed move against `solve(state)` for that card (tables-only, same as Bad Intel's per-step commits). Correct: overlay stamp, card retires; when the last card retires, `onSolved()`. Wrong — releasing a coded card, decoding an innocent one, or decoding to the wrong symbol: `onStrike()`, the card stays live and unchanged, and the module seals at the SLP's strike limit (1–3). `validate(state, answer)` compares the full aligned array to `solve(state)` for the robot tests. No partial credit, no ambiguity: every card has one accepted move.

---

## 8. Static Protocol & hints

**Static Protocol fit:** the mandated first utterance is a whole-scene description (the manual's step 1 explicitly demands the picture before any words), so the scripted clarification requests ("Say again?", "Tell me that a different way", "Give me one more detail") always land on rephrasable material. The stamp numerals, scene details, and sentence prosody give the Agent at least three distinct reformulation axes.

**The 3 escalating hints (verbatim, communication-only, never instance answers):**
1. "Start with the front of the card. Describe the whole picture — who or what is in it, and what is happening — before you read a single word."
2. "Read the underlined words exactly as printed, then ask your Handler: 'What would that look like if it were meant for real?' Compare their answer to your picture, one detail at a time."
3. "If you two disagree, take turns: the Handler reads the book's picture description one detail at a time, and you answer 'mine has that' or 'mine doesn't' for each detail before anyone touches a key."

---

## 9. Worked example

`generate(seed 4471, difficulty 1)` emits (as the data would read):

```ts
{ cards: [
  { phrase: 'spill-the-beans', sentence: 0, picture: 'jar-beans-tipped',  stamp: 4 },
  { phrase: 'hit-the-hay',     sentence: 0, picture: 'lighthouse-rocks', stamp: 7 },
  { phrase: 'cold-feet',       sentence: 0, picture: 'market-fountain',  stamp: 2 },
] }
```

Screen: three cards — (4) beans pouring from a tipped jar / "Aunt Rosa finally <u>spilled the beans</u> at Sunday dinner."; (7) a lighthouse on rocks / "Right after supper, the twins <u>hit the hay</u>."; (2) a market fountain / "Standing at the door, Petra got <u>cold feet</u>."

Replaying against §3's tables:
- **Card 4:** entry `spill-the-beans` has `pictureId: 'jar-beans-tipped'` — match. Disposition code, family SECRETS, order board → **the flame**. Move: `{ kind: 'decode', order: 'flame' }`. (Transcript in §4.)
- **Card 7:** entry `hit-the-hay` expects `person-punching-hay`; card shows `lighthouse-rocks` — no match → **`{ kind: 'release' }`**. Conversation states the real meaning anyway: the twins went to bed.
- **Card 2:** entry `cold-feet` expects `bare-feet-on-ice`; card shows `market-fountain` — no match → **`{ kind: 'release' }`**. The Rookie tier note is satisfied: exactly one coded card, and the pair verified all three rather than inferring the last.

`solve()` returns `[decode flame, release, release]`; `validate` accepts it; any other move on any card strikes. A judge can replay every step from the printed tables alone.

---

## 10. Risks & open questions

- **Art is load-bearing.** Every entry needs a distinct, instantly readable SVG whose legend prose names its distinguishing details. A muddy "beans jar" sinks the round. Mitigation: small fixed picture inventory (~30 by tier 3), each shipped with legend prose, and a playtest pass where students describe pictures cold before any idiom work.
- **Carrier-sentence authoring discipline.** A sentence that forces one reading ("she spilled the beans all over the floor") corrupts the fiction even though the solver ignores sentences. Needs an authoring checklist + review; consider a lint test asserting no carrier sentence contains its entry's depiction keywords.
- **Confusable pairs can overshoot.** Tier-2 minimal-pair pictures are the richest talk generator and the biggest human-ambiguity risk. If the differing detail isn't the most salient element in both pictures, pairs get demoted to plain entries. This is the #1 thing ambiguity playtesting must hit.
- **The family hop can feel mechanical.** A Handler could match picture → family → symbol without ever saying the meaning aloud. The steps script and hints push meaning-first talk, and the debrief prompts should ask "what did each coded phrase really mean?" — but a rushed pair can shortcut the semantics. Honest limitation; the tally, not the mechanic, catches it.
- **Idiom equity.** EL students and some autistic students may not know any of these idioms — which is fine and is the point: all meaning lives in the Handler's codebook, so no prior idiom knowledge is required to win. But cultural load should be reviewed (all chosen idioms are common North American classroom fare; the pool is data, so swapping is cheap).
- **Release guessability.** A reckless Agent can stamp RELEASE at ~50%+ base rate on Rookie. The strike budget (default 1) prices that out, and the promised coded-count note makes blind releasing self-defeating — but a 2-card-left endgame at Rookie does leak the last answer once the coded card is found (same accepted trade-off as Bad Intel's exactly-one promise).
- **Open question:** should tier-3 clean-sense rows speak the order board's language ("outcome: RELEASE") or the fiction's ("nothing hidden")? Needs a reading-level pass on the simplified edition with real students.

---

## 11. Why this beats the obvious alternative

The obvious module is an idiom quiz in a trench coat: the Handler reads "spill the beans," the Agent picks the matching meaning from four pictures, repeat. It dies on every axis this project cares about — the Handler is a flashcard, the Agent's talk is "the second one," the first description is trivial so the Static Protocol has nothing to grip, and a student who knows the idiom bypasses the partner entirely. Double Meaning inverts the flow: the meanings sit inert in the Handler's codebook and the evidence sits mute on the Agent's screen, so the literal reading must be *spoken* (the Handler voicing "taken at its word"), the scene must be *described* (the Agent, in detail, twice if the static crackles), and the figurative meaning must be *used* — it selects a consequence, not a checkbox. Innocent cards make literal-vs-figurative a real decision with a real cost instead of a foregone conclusion; confusable pictures and clean senses give the toy a skill curve worth replaying; and the sorting-desk fantasy — steaming open the ring's mail with the captured codebook — is a fiction students will ask to run again, which is exactly how a module delivers therapy minutes.
