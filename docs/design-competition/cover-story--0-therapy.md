# Cover Story (cover-story, lens: therapy)

Tagline: Six faces, one contact — pool the file's clues and rule them out, out loud.
Primary: expressive / secondary: receptive, pragmatics
Minutes: {"1":4,"2":5,"3":6}

Core loop: The Agent sees a lineup of suspects with purely visual attributes (headwear, eyewear, carried item, companion, footwear); the Handler holds a printed CONTACT FILE of clues about the hidden contact's unobservable habits ("allergic to dogs", "quit the ministry desk") plus an EVIDENCE KEY that maps each habit to a visible trace. For each clue the Handler reads the habit aloud and asks "what would that look like on someone?"; the Agent infers the trace, the Handler confirms it against the Key, the Agent reports who shows it, and the pair speaks the full chain — "Number three can't be the contact BECAUSE the contact never keeps a dog, and he's got one" — before the Agent stamps that suspect CLEARED and commits. Neither side ever holds the conclusion alone: the Handler never sees the dog, the Agent never hears the allergy, and the elimination exists only in the spoken bridge from habit to trace to face. After the last clue exactly one face survives, and the Agent confirms it as the contact.

---

# Cover Story — design spec

Module id: `cover-story` · Codename: **Cover Story** (the research-shortlist name, kept) · Therapy target: **inference from evidence**

---

## 1. Concept & fiction

A contact is hiding in plain sight under a cover identity. The **Field Agent**'s screen shows the surveillance lineup: four to six people photographed on the street, each with concrete visible details — what's on their head, on their eyes, in their hands, at their heel, on their feet. The **Handler** holds the CONTACT FILE: a numbered list of things HQ knows about the contact's *life* — habits, history, allergies, jobs — none of which can be seen directly. The manual also carries the **Evidence Key**, tradecraft's bridge between the two worlds: every habit leaves a trace ("a morning in the downpour leaves an umbrella in the hand; a ministry desk leaves a briefcase").

Nobody on either side of the barrier knows who the contact is. The Handler has habits but no faces; the Agent has faces but no habits. The contact only materializes when the pair pools evidence out loud, clue by clue, ruling faces out with spoken reasons until exactly one is left standing. Then the Agent confirms the contact and the meet is on.

**Tagline (mission builder):** *Six faces, one contact — pool the file's clues and rule them out, out loud.*

**Primary TherapyTarget: `expressive`** ("Describing & directing"). The tallyable target behavior is *produced language*: rich attribute descriptions of the lineup, and — the heart of the module — complex causal sentences of the form "___ can't be the contact **because** the contact ___, and ___ has ___." That is inferential-language production: combining two premises (Handler's clue + Agent's observation) into a spoken conclusion with a causal conjunction, exactly the "how do you know?" justification the research shortlist targets. The SLP can tally each because-chain from across the room.
**Secondary: `receptive`** (the Agent must process each read-aloud clue and act on its implication) **and `pragmatics`** (the Handler's evidence-eliciting questions, and the confirm-before-acting repair loop the manual scripts). Pragmatics is deliberately *not* primary — Bad Intel and Asset Interview already own that filter slot; Cover Story gives the mission builder an expressive-primary module with real inference load.

Original IP throughout: no KTANE names, trade dress, or manual text; the asymmetric-manual genre only.

---

## 2. What the Agent sees

Portrait iPad layout, minimal text, everything meaningful is a shape (never color-only):

- **Header plate** (etched-metal style, matching the case's Tradecraft idiom): the file name — e.g. `CONTACT FILE: NIGHTINGALE` — and a clue counter rendered as pips plus `CLUE 1 / 3`. **The clue text itself never appears on screen.** The screen knows *which* dossier; only the manual knows what its clues say.
- **The lineup**: 4 suspects (Rookie) in a 2×2 grid, 5 (Agent) in 2+3, 6 (Mastermind) in 2×3. Each card is a framed surveillance-photo silhouette with its position number and five attribute drawings placed anatomically:
  - **headwear** on the head — beret / flat cap / rain hood / bare-headed
  - **eyewear** on the face — dark glasses / reading glasses / none
  - **carrying** in the hand — umbrella / briefcase / instrument case / shopping basket / empty-handed
  - **companion** beside the figure — a dog / a bicycle / alone
  - **footwear** — rubber boots / polished shoes / canvas shoes
  All values are distinct silhouette shapes readable at card size; cards are ≥ 44 pt touch targets (Rookie cards are quarter-screen).
- **Tap a card** → a diagonal rubber-stamp `CLEARED` overlay appears (tap again to un-stamp; stamps are provisional until committed).
- **Bottom bar**: one wide button, `LOG IT` — commits the current clue's provisional stamps. After the final clue it becomes `CONFIRM CONTACT`; the Agent taps the surviving card (it gets a ring highlight, not a color) and then the button.
- Committed stamps lock with a small clue-number chip ("cleared on clue 2") so the pair can retrace their chain during debrief.
- Every card exposes `describeSuspect()` as its aria-label (2D) and face-region label (3D later), using exactly the manual's attribute vocabulary.

On-screen words, total: the file name, `CLUE n / m`, `CLEARED`, `LOG IT`, `CONFIRM CONTACT`. The reading load lives with the Handler, as designed.

---

## 3. What the Handler has

Everything below is a draft of the actual `rules.ts` tables. Each row carries game semantics **plus** standard (~7th–9th grade) and simplified (~3rd–5th grade) prose; the manual generator and `solve()` both consume these same rows (the Bad Intel pattern). Data model:

```ts
export type FieldId = 'headwear' | 'eyewear' | 'carrying' | 'companion' | 'footwear';

export interface FieldValue { id: string; label: string; icon: SuspectIcon }  // icons are SHAPES
export interface FieldRule {
  id: FieldId; label: string;
  standard: string; simplified: string;      // "how the Agent will describe it"
  values: readonly FieldValue[];
}

export interface Mark {                       // one Evidence Key row
  id: MarkId;
  field: FieldId;
  values: readonly string[];                  // the visible trace (usually 1 value; class/pair marks have 2+)
  keyword: string;                            // SMALL-CAPS phrase embedded in clue prose; the Key's lookup handle
  traceStandard: string; traceSimplified: string;   // Key right-hand column
  // clue prose per polarity — authored only for pairs some dossier uses (table test enforces)
  hasStandard?: string; hasSimplified?: string;
  lacksStandard?: string; lacksSimplified?: string;
}

export interface DossierClue { mark: MarkId; polarity: 'has' | 'lacks' }
export interface Dossier { id: string; name: string; difficulty: Difficulty; clues: readonly DossierClue[] }
```

Semantics (the whole rulebook in two lines):
- **`lacks` clue** ("the contact never/quit/would not …"): the contact does NOT carry the trace → **any suspect showing the trace is cleared.**
- **`has` clue** ("the contact certainly did …"): the contact DOES carry the trace → **any suspect missing the trace is cleared.**

### Table 1 — Lineup legend (`FIELD_RULES`)

| Field | Values | Standard prose | Simplified prose |
|---|---|---|---|
| Headwear | beret · flat cap · rain hood · bare-headed | "What is on their head — a beret, a flat cap, a rain hood, or nothing." | "What is on their head?" |
| Eyewear | dark glasses · reading glasses · none | "What is on their eyes — dark glasses, small reading glasses, or nothing." | "Do they wear glasses? Which kind?" |
| Carrying | umbrella · briefcase · instrument case · shopping basket · empty-handed | "What is in their hand — an umbrella, a briefcase, an instrument case, a shopping basket, or nothing at all." | "What is in their hand?" |
| Companion | a dog · a bicycle · alone | "Who or what is with them — a dog at their heel, a bicycle they are wheeling, or no one." | "Is anything with them? A dog? A bike?" |
| Footwear | rubber boots · polished shoes · canvas shoes | "What is on their feet — rubber boots, polished shoes, or canvas shoes." | "What shoes do they wear?" |

### Table 2 — The Evidence Key (`MARKS`)

Printed with the callout: *standard* — "In this business the Evidence Key is gospel. A habit always leaves its trace, and a trace never lies. If the file says the contact stayed dry, the contact is not the one holding an umbrella." / *simplified* — "The Key is always right. A habit leaves a mark you can see."

| Keyword (in clue prose) | Field = trace | Standard trace | Simplified trace |
|---|---|---|---|
| KEPT A DOG | companion = dog | "A dog at their heel." | "A dog next to them." |
| A DESK AT THE MINISTRY | carrying = briefcase | "A government briefcase in hand." | "A briefcase." |
| THE RIVERFRONT GLARE | eyewear = dark glasses | "Dark glasses against the light." | "Dark glasses." |
| ON TWO WHEELS | companion = bicycle | "Wheeling a bicycle." | "A bike with them." |
| THE EVENING ORCHESTRA | carrying = instrument case | "An instrument case in hand." | "An instrument case." |
| THE FLOODED TOWPATH | footwear = rubber boots | "Rubber boots, still muddy." | "Rubber boots." |
| THE MORNING DOWNPOUR | carrying = umbrella | "An umbrella, still in hand." | "An umbrella." |
| THE MARKET STREET | carrying = shopping basket | "A shopping basket on the arm." | "A shopping basket." |
| THE FINE PRINT | eyewear = reading glasses | "Small reading glasses." | "Reading glasses." |
| PARADE INSPECTION | footwear = polished shoes | "Shoes polished to a shine." | "Shiny shoes." |
| WEAK EYES *(Mastermind)* | eyewear ∈ {dark glasses, reading glasses} | "Glasses of some kind — dark or reading, either counts." | "Any glasses at all." |
| NEVER BAREHEADED *(Mastermind)* | headwear ∈ {beret, flat cap, rain hood} | "Something on the head — any hat or hood counts." | "Any hat or hood." |

### Table 3 — Rookie dossiers, complete (3 clues each, all `lacks`, single-value traces, distinct fields)

**CONTACT FILE: NIGHTINGALE** *(Rookie)*

| # | Clue (standard) | Clue (simplified) | data |
|---|---|---|---|
| 1 | "Our contact breaks out in hives near dogs. They have never once KEPT A DOG." | "The contact is allergic to dogs. They never KEPT A DOG." | `{ mark: 'kept-a-dog', polarity: 'lacks' }` |
| 2 | "The contact walked out on A DESK AT THE MINISTRY a year ago and never looked back." | "The contact quit A DESK AT THE MINISTRY. No more office job." | `{ mark: 'ministry-desk', polarity: 'lacks' }` |
| 3 | "The contact has been underground for weeks — nowhere near THE RIVERFRONT GLARE." | "The contact stayed inside for weeks. Never in THE RIVERFRONT GLARE." | `{ mark: 'riverfront-glare', polarity: 'lacks' }` |

**CONTACT FILE: LAMPLIGHTER** *(Rookie)*

| # | Clue (standard) | Clue (simplified) | data |
|---|---|---|---|
| 1 | "The contact never learned to balance ON TWO WHEELS — everyone in the old network teased them for it." | "The contact cannot ride ON TWO WHEELS." | `{ mark: 'two-wheels', polarity: 'lacks' }` |
| 2 | "The contact quit THE EVENING ORCHESTRA when the trouble started. The chair sits empty." | "The contact left THE EVENING ORCHESTRA. They do not play now." | `{ mark: 'evening-orchestra', polarity: 'lacks' }` |
| 3 | "The contact came in by the high road — never near THE FLOODED TOWPATH." | "The contact took the dry road. Never THE FLOODED TOWPATH." | `{ mark: 'flooded-towpath', polarity: 'lacks' }` |

Rookie tier note *(warning callout, printed above these tables)* — standard: "Every clue clears exactly one face. Make the Agent say WHO is out and WHY — the whole chain, habit to trace to face — before anything gets stamped." / simplified: "Each clue rules out one person. Say who is out and why. Then stamp."

### Agent tier — structure + sample rows

2 dossiers × **4 clues**, distinct fields; clues 1–3 are `lacks`, clue 4 introduces the **`has` polarity** (always in final position — see §6). Tier note *(tip)* — standard: "A DID clue works backwards from a NEVER clue: it clears every face that is MISSING the trace." / simplified: "A DID clue is backwards. It clears people who do NOT have the thing."

**CONTACT FILE: MAGPIE** — sample rows:

| # | Clue (standard) | data |
|---|---|---|
| 1 | "The contact breaks out in hives near dogs — never once KEPT A DOG." | `{ mark: 'kept-a-dog', polarity: 'lacks' }` |
| 3 | "The contact reads nothing smaller than a headline — THE FINE PRINT means nothing to them." | `{ mark: 'fine-print', polarity: 'lacks' }` |
| 4 | "One thing is certain: the contact stood PARADE INSPECTION this very morning." | `{ mark: 'parade-inspection', polarity: 'has' }` |

**CONTACT FILE: TINSMITH** — same shape (e.g. `two-wheels`-lacks, `market-street`-lacks, `riverfront-glare`-lacks, then `morning-downpour`-has: "The contact walked every step of the way through THE MORNING DOWNPOUR.").

### Mastermind tier — structure + sample rows

2 dossiers × **5 clues**, all five fields in play; mixes `lacks`, one **multi-value (class) mark**, and one `has` — broad marks (`|values| > 1`) and `has` clues restricted to the last two positions (§6). **No tier note** — reading the polarity and the class trace unprompted is the tier's point.

**CONTACT FILE: HALCYON** — sample rows:

| # | Clue (standard) | data |
|---|---|---|
| 1 | "The contact quit THE EVENING ORCHESTRA years ago." | `{ mark: 'evening-orchestra', polarity: 'lacks' }` |
| 4 | "After the border incident the contact swore they would go NEVER BAREHEADED again — always something on the head." | `{ mark: 'never-bareheaded', polarity: 'has' }` |
| 5 | "The contact's WEAK EYES are all over the file — they see nothing without glasses." | `{ mark: 'weak-eyes', polarity: 'has' }` |

### Working a clue (printed steps — the exchange script)

Standard edition:
1. "Before clue one, ask for the lineup, left to right: head, eyes, hands, company, feet for every face."
2. "Read the current clue aloud exactly as printed. Then ask: 'What would that look like on someone?' — let the Agent answer before you open the Evidence Key."
3. "Find the SMALL-CAPS phrase in the Evidence Key and check the Agent's answer against the trace. Say the trace aloud."
4. "Ask: 'So who's out — and why?' Do not accept a number alone. The Agent must give the chain: '___ can't be the contact because the contact ___, and ___ has/has no ___.'"
5. "Chain complete and you both agree? The Agent stamps that face and presses LOG IT. Then read the next clue."
6. "After the last clue, one face is left. The Agent says who and what they look like; you confirm nothing in the file argues back; the Agent taps them and presses CONFIRM CONTACT."

Simplified edition:
1. "Ask what the people look like, one by one."
2. "Read the clue out loud. Ask: 'What would we see?'"
3. "Check the Key. Say what to look for."
4. "Ask: 'Who is out? Why?' The Agent must say the reason."
5. "Agree? Stamp that person. Press LOG IT. Next clue."
6. "One person left? That is the contact. Tap them. Press CONFIRM CONTACT."

Plus a tip callout (both editions): "A wrong stamp and a wrong contact both count as wrong answers. Saying the reason first costs nothing."

---

## 4. The conversation loop

One full Rookie solve of the §9 worked instance (FILE: NIGHTINGALE, module marked STATIC, drills = 1). *Annotations in italics.*

> **H:** Cover Story. What's stamped on the plate at the top?
> **A:** "Contact File: Nightingale." And it says clue one of three.
> **H** *(step 1)*: Before I read anything — give me the lineup, left to right.
> **A:** There's four people. First guy has a briefcase, second one has an umbrella…
> **H** *(STATIC badge — scripted, printed protocol)*: **Say again?**
> **A** *(rephrases, fuller — the repair drill)*: Okay, slower. Number one: flat cap, little reading glasses, briefcase, nobody with him, shiny shoes. Number two: beret, no glasses, umbrella, alone, canvas shoes. Number three: no hat, a shopping basket, and a dog next to him — rubber boots. Number four: rain hood, dark sunglasses, empty hands, pushing a bicycle, shiny shoes.
> *The barrier forces a five-attribute description of every face; the Static Protocol forces one full rephrase of it. This is the richest possible "first description" — nothing like "it's a 7."*
> **H** *(reads clue 1)*: "Our contact breaks out in hives near dogs. They have never once KEPT A DOG." …What would that look like on someone?
> **A:** Hives?… oh — a dog. Someone walking a dog.
> **H** *(checks Key: KEPT A DOG → "a dog at their heel")*: The Key says the same — a dog at their heel. So who's out, and why?
> **A:** Number three. He can't be the contact **because** the contact never keeps a dog, and number three has the dog right there.
> **H:** Agreed. Stamp three, log it.
> *The inference chain is spoken end to end. Note that the conclusion existed on neither side: the Handler never saw a dog; the Agent never heard about the allergy. The Handler's "what would that look like?" is the evidence-eliciting question; the "who's out and why?" gate makes the because-clause mandatory before any tap.*
> **A:** Logged. Clue two of three.
> **H** *(clue 2)*: "The contact walked out on A DESK AT THE MINISTRY a year ago and never looked back." What trace would a ministry desk leave?
> **A:** Um… papers? A briefcase?
> **H:** Key says a government briefcase in hand. Anyone still standing carrying one?
> **A:** Number one. So number one is out, **because** the contact quit the ministry, and he's still carrying the ministry briefcase.
> **H:** Stamp him. Log it.
> **A:** Done. Clue three of three.
> **H** *(clue 3)*: "The contact has been underground for weeks — nowhere near THE RIVERFRONT GLARE." What does glare leave on a face?
> **A:** Sunglasses! Number four has the dark ones. She can't be the contact **because** the contact hasn't been in the sun, and she's wearing dark glasses.
> **H:** Key agrees — dark glasses. Stamp four, log it. Who's left?
> **A:** Only number two — beret, umbrella, alone, canvas shoes.
> **H:** No dog, no briefcase, no dark glasses. Nothing in the file argues back. That's our contact — confirm it.
> **A** *(taps card 2, presses CONFIRM CONTACT)*: Contact confirmed.

Exchange density: ~4 substantive utterances per side per clue, every one on-target (attribute description, evidence-eliciting question, trace inference, causal justification), plus a scripted repair round — all tallyable from across the room.

---

## 5. Difficulty tiers

| | Rookie (1) | Agent (2) | Mastermind (3) |
|---|---|---|---|
| Suspects | 4 (2×2) | 5 (2+3) | 6 (2×3) |
| Clues | 3 | 4 | 5 |
| Fields in play | 3 | 4 | all 5 |
| Polarity | all `lacks` | `lacks` + one `has` (last) | mixed, incl. `has` |
| Traces | single-value only | single-value | incl. class marks (WEAK EYES, NEVER BAREHEADED) |
| Tier note | warning: "every clue clears exactly one; say who and why" | tip: DID-clue polarity flip | none — unprompted vigilance |
| Minutes | **4** | **5** | **6** |

What scales is *reasoning complexity* — more premises to hold, polarity flips, class-level traces ("any glasses counts") — plus description load (more faces, more fields). Never speed: no clock exists anywhere in the design, per the verified anti-recommendation; stakes are the SLP-set 1–3 wrong answers, as everywhere else in the app.

---

## 6. Generation & solvability

**State shape** (mirrors Bad Intel: the answer is deliberately *not* stored — it is derivable only via the printed tables):

```ts
export type Suspect = Record<FieldId, string>;          // valueId per field — everything visible, nothing else
export interface CoverStoryState {
  dossier: string;          // Dossier id — the screen names it, the manual prints its clues
  suspects: Suspect[];      // positions left-to-right, top-to-bottom
}
export type CoverStoryAnswer = {
  clears: number[][];       // per clue, the sorted set of newly-stamped suspect indices
  contact: number;          // the survivor
};
```

**`generate(seed, difficulty)`** (all randomness through `mulberry32(seed)` → deterministic, constraint 5):
1. `dossier = pick(rng, DOSSIERS_BY_DIFFICULTY[difficulty])`; let C = clue count, N = C + 1 suspects.
2. Build N *specs*: one **target** plus one non-target per clue; `killers = shuffle(rng, [0..C-1])` assigns each non-target the clue that clears it (a bijection — every clue clears exactly one face).
3. Fill constrained fields per spec. For clue *i* = (mark, polarity): the target and every non-target with killer > *i* must **satisfy** it (`has`: field ∈ mark.values, pick one via rng; `lacks`: field ∉ mark.values); the non-target with killer = *i* must **violate** it (`has`: field ∉ values; `lacks`: field ∈ values). Fields never conflict because a table test asserts every dossier's clues use **distinct fields** (≤ 5 clues, 5 fields).
4. Fill all remaining fields uniformly at random (lineup variety).
5. Distinctness pass: while any two suspects are identical in all five fields, resample one free field of one of them (deterministic bounded loop; the free-value space makes collisions vanishingly rare — the 1000-seed test proves termination empirically).
6. `shuffle(rng, suspects)` into screen positions.

**`solve(state)`** uses only the exported tables: look up the dossier, walk its clues in order; at clue *i*, the expected clear-set is every not-yet-cleared suspect that violates (mark, polarity) — a pure predicate on visible fields; after clue C, `contact` = the single survivor. **`validate`** canonicalizes (sorts each clear-set) and compares against `solve`.

**Exactly one defensible answer — the argument.** Every decision point is the evaluation of a binary predicate `field ∈ values` on data both parties can verbalize; there is no judgment call anywhere (constraint 4's "robot Handler" bar). By construction: (a) the target satisfies every clue, so it is never in any expected clear-set and always survives; (b) the non-target with killer *i* satisfies clues 1..*i*−1 (so it is alive and never clearable earlier) and violates clue *i* (so it is exactly cleared there); (c) it cannot be cleared twice because it leaves the alive set at *i*. Therefore each clue's expected set is exactly `{the assigned non-target}`, the sets are disjoint and exhaust the non-targets, and the survivor is unique. The homogenization corollary — a `has` or class clue at position *i* forces all later-alive suspects to share its trace — is contained by the authoring rule (enforced by a rules-table test, like Bad Intel's model tests): `has` clues and marks with `|values| > 1` may appear only in the last two clue positions. The property test (`logic.test.ts`, same skeleton as Bad Intel's) asserts over **1000 seeds × 3 difficulties**: well-formed lineups; unique tags per constraint; each clue's expected set has size 1; `validate(state, solve(state))` is true; perturbed answers (extra stamp, missing stamp, wrong-clue stamp, wrong contact, truncated) are all rejected; every clue position of every dossier gets exercised as a killer across seeds; and generation is deterministic per (seed, difficulty).

---

## 7. Answer & validation model

- **Per clue:** the Agent taps suspects to toggle provisional `CLEARED` stamps, then presses `LOG IT` to commit that clue's set. Commit matches `solve`'s set for that clue → the stamps lock (with a clue-number chip) and the counter advances. Mismatch (wrong face, extra face, or missing face — including an empty commit) → **one wrong answer** (`onStrike`), the provisional stamps revert, locked stamps stay, and the same clue remains active.
- **Final:** after the last clue the button becomes `CONFIRM CONTACT`; the Agent taps a card and confirms. Confirming any card other than the survivor → one wrong answer. Confirming the survivor → `onSolved`.
- Wrong answers per module are the mission-wide SLP setting (1–3, default 1); exhausting them seals the module red, per the shared shell. `onAttempt(correct, answer)` logs each commit for the session record. There is no way to brute-force cheaply: even at Rookie the first clue has 4 candidate single stamps plus multi-stamp sets, against a default single allowed miss.

---

## 8. Static Protocol & hints

**Static Protocol fit:** the manual's step 1 makes the Handler open by requesting the full lineup — a five-attribute description of every face, the richest first description in the app. On a STATIC-badged instance the Handler answers that first description only with the printed neutral requests ("Say again?" / "What do you mean?" / "I didn't understand that," to the SLP-set depth) before proceeding to clue 1 — pure stacked-clarification repair on genuinely dense material.

**Hints (escalating, communication-only, verbatim — after the shell's generic manual pointer):**
1. "Handler — after you read a clue, don't say what to look for yet. Ask: 'What would that look like on someone?' and let the Agent work it out. Then check the Evidence Key together."
2. "Agent — before you stamp anyone, say the whole chain out loud: 'The file says the contact ___, so we're looking for ___. Number ___ has ___, so they can't be the contact.'"
3. "Still stuck? Handler, walk the lineup one face at a time: 'Tell me about number one — head, eyes, hands, company, feet.' Hold each face up against the clue before anyone touches the screen."

None can leak an instance answer: they script questions and sentence frames only.

---

## 9. Worked example

As `generate(4102, 1)` would emit it (hand-built; positions post-shuffle):

```json
{
  "moduleId": "cover-story", "difficulty": 1, "seed": 4102,
  "state": {
    "dossier": "nightingale",
    "suspects": [
      { "headwear": "flat-cap",   "eyewear": "reading-glasses", "carrying": "briefcase",       "companion": "alone",   "footwear": "polished-shoes" },
      { "headwear": "beret",      "eyewear": "none",            "carrying": "umbrella",        "companion": "alone",   "footwear": "canvas-shoes" },
      { "headwear": "bare-headed","eyewear": "none",            "carrying": "shopping-basket", "companion": "dog",     "footwear": "rubber-boots" },
      { "headwear": "rain-hood",  "eyewear": "dark-glasses",    "carrying": "empty-handed",    "companion": "bicycle", "footwear": "polished-shoes" }
    ]
  }
}
```

Replay against the §3 tables (0-based indices; screen shows 1-based positions):
- **Clue 1** — `kept-a-dog`, `lacks`. Key: KEPT A DOG → companion = dog. Predicate `companion ∈ {dog}` over alive {0,1,2,3}: only suspect 2. Expected clear-set **[2]** — "number three has the dog; the contact never keeps a dog."
- **Clue 2** — `ministry-desk`, `lacks`. Key: A DESK AT THE MINISTRY → carrying = briefcase. Over alive {0,1,3}: only suspect 0. Expected **[0]**.
- **Clue 3** — `riverfront-glare`, `lacks`. Key: THE RIVERFRONT GLARE → eyewear = dark glasses. Over alive {1,3}: only suspect 3. Expected **[3]**.
- **Survivor:** suspect 1 (beret, no glasses, umbrella, alone, canvas shoes) — satisfies all three clues; every other suspect violates exactly its killer clue and nothing earlier.

`solve(state)` ⇒ `{ "clears": [[2],[0],[3]], "contact": 1 }`; `validate` accepts exactly this and rejects any deviation. A judge can replay every step above using only §3's printed tables — no information outside them is needed, which is precisely the claim the 1000-seed test generalizes.

---

## 10. Risks & open questions

- **The because-sentence is procedurally scripted, not mechanically enforced.** A pair can degrade to "who's got a dog? three. stamp." The manual's "do not accept a number alone" gate, the hints, and the Static Protocol push back, and the SLP tallies the chains — but the mechanic itself only verifies the stamp. A future "justify gate" (Handler-side checkbox ritual) is possible if playtests show degradation; deliberately out of scope now.
- **`has`/class clues homogenize survivors** (everyone left must share the trace). Contained by the last-two-positions authoring rule, but a Mastermind lineup can still end with two hatted, bespectacled finalists; playtest whether that reads as samey or as tension.
- **Bijection meta-knowledge:** once one face is stamped, students know the clue is done. That truncates *searching* but not *justifying* — which face still requires the chain. If it proves exploitable, widen Mastermind to 7 suspects with two doubled clues (the solvability argument extends unchanged: expected sets stay uniquely determined).
- **Icon legibility at 6 cards** — five silhouette attributes per card on a shared iPad; footwear is the at-risk slot. Needs the real-hardware pass; a tap-and-hold card zoom is a cheap fallback.
- **Fiction looseness:** an innocent could plausibly carry an umbrella. The "Evidence Key is gospel" callout declares the genre convention; watch whether any student litigates it.
- **Simplified-edition noun load** (beret, instrument case) — the legend table and card icons scaffold it, but the easy-read manual should get the same picture-figure treatment as Bad Intel's control figure.
- **Overlap check:** shares surface vocabulary (people, carried items) with Spot the Contact and Asset Interview; mechanics and target differ, but mission builders combining all three may want a variety note.

---

## 11. Why this beats the obvious alternative

The obvious inference module is Guess-Who-behind-a-barrier: the Handler asks attribute questions ("does anyone wear a hat?") until one suspect remains. That trains description and question-asking — which Asset Interview already covers — but contains *zero inference*: every question is directly answerable by looking, so the conclusion is only ever a running tally, and the talk collapses into yes/no ping-pong. Cover Story inserts the unobservable layer the research shortlist actually asks for: the Handler holds *habits*, the Agent holds *appearances*, and the elimination exists in neither — it comes into being only when someone says "the contact never keeps a dog, he has a dog, so he can't be the contact." Every clue forces a premise-combination across the information gap, a trace inference the Agent voices before the Key confirms it, and a causal justification the manual refuses to let them skip — while staying fully rules-as-data, robot-solvable, and provably unambiguous over 1000 seeds per tier in exactly the Bad Intel mold, so it drops into the existing engine, manual generator, and test harness with no new machinery.
