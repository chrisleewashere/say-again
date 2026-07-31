# Cover Story (cover-story, lens: game)

Tagline: Everyone at the drop site has a story. Pool the evidence, say the chain out loud, and accuse the one story the scene cannot support.
Primary: expressive / secondary: pragmatics, receptive
Minutes: {"1":4,"2":5,"3":6}

Core loop: The Agent sees a drop-site scene — three condition tiles (weather, time, place) and a bench of bystanders, each holding a visible cover activity — while the Handler holds the Plausibility Index: printed rules for when each cover story physically cannot be true. Neither side can find the courier alone: the Agent has all the observations but none of the rules, the Handler has all the rules but none of the observations, and the guilty suspect is stored nowhere — it exists only as an inference. The Handler elicits the scene, then works suspect by suspect, reading each cover's rule aloud and asking for exactly the evidence it names; the pair verbalizes each verdict as a because-chain ("the angler's story can't be true BECAUSE you can't fish at a train station"). To commit, the Agent must tap not just WHO but WHY — the suspect plus the condition tile(s) that break their story — so the justification is literally the answer. Exactly one story breaks per instance, by construction, so a careful chain always clicks shut on one defensible accusation.

---

# Cover Story — Design Spec

Module id: `cover-story` · Codename: **Cover Story** · Tagline: *"Everyone at the drop site has a story. One of them can't be true."*

Primary target: **expressive** (`Describing & directing`) — the scored language act is producing the inference chain out loud: precise scene description plus causal-connective justification ("she can't really be painting BECAUSE it's raining and paint runs"). Inference-from-evidence has no dedicated slot in the five-target taxonomy; what a session observer actually tallies here is the Agent's evidence descriptions and the pair's spoken because/so/unless statements, which is expressive production. Secondary: **pragmatics** (the Handler's evidence-eliciting questions, "how do you know?" challenges, and repair when a description is incomplete) and **receptive** (the Agent executes the Handler's manual-driven checking procedure, including conditional "unless" clauses at Mastermind).

---

## 1. Concept & fiction

A dead drop is scheduled at a public spot — a park, a rail station, a harbor quay. Counterintelligence radioed ahead: an enemy courier is already on site, posing as an ordinary bystander. Couriers are trained to blend in, but they pick their cover in a briefing room, not in the field — and the field has weather, light, and geography the briefing room didn't predict. HQ's **Plausibility Index** (the Handler's manual chapter) catalogs exactly which cover activities cannot physically be true under which field conditions.

Everyone at the site is doing something visible: painting, fishing, reading, walking a dog. All of those stories hold up — except one. The genuine bystanders are really doing what they appear to do, so their activities fit the scene. The courier is faking, and somewhere the fake contradicts reality: an angler where there is no water, a photographer in the pitch dark. The pair's job is to pool what the Agent can see with what the Handler can look up, test every story against the scene, and accuse the one person whose cover story the scene cannot support — naming the evidence that blew it.

The conclusion is stated on neither side. The screen never marks anyone; the manual never names anyone. "The flat-cap man is the courier" exists only as a spoken inference assembled across the gap.

## 2. What the Agent sees

A single calm scene, styled as a surveillance frame ("DROP SITE — LIVE OBSERVATION"). Three zones, top to bottom:

**Condition rail (top): three large icon tiles**, fixed slots left to right —
- WEATHER: sun / rain / snow (sun disc; slanted rain over a cloud; snowflakes over a cloud)
- TIME: day / night (sun above horizon; moon and stars)
- PLACE: park / station / harbor (tree and bench; rail tracks and clock; anchor and bollard)

Each tile is an icon plus a one-word caption (RAIN, DAY, STATION). The tiles are also the **evidence chips** — they become tappable during an accusation.

**Suspect bench (middle): 4–6 suspect cards** in a row (two rows of three at Mastermind). Each card shows:
- A simple portrait with one distinguishing **look** (flat cap, wide-brim hat, plaid scarf, round glasses, striped apron, hood) — pure describing flavor, never rule-relevant, like Bad Intel's setting numbers.
- A **cover activity** icon in their hands/at their feet (easel and brush, fishing rod, camera, open newspaper, dog on a lead, ice-cream tray) with a one-word caption (PAINTER, ANGLER, PHOTOGRAPHER, READER, DOG WALKER, SELLER).
- At Mastermind only: an **accessory chip** pinned to the card corner (umbrella / lantern / satchel / none), icon plus one word.

**Accuse bar (bottom):** dormant until a suspect card is tapped. Tapping a suspect highlights the card and slides up the accusation tray: "WHO — [selected suspect] · WHY — tap the tile(s) that break the story," the three condition tiles now selectable (multi-select, checkmark overlay), and an **ACCUSE** button that stays disabled until at least one tile is selected. A CANCEL affordance backs out with no penalty. Nothing commits until ACCUSE.

Total on-screen text: one-word captions and the three accuse-bar words. All targets are 64px+ touch regions. Every suspect and tile has a `describeSuspect()` / `describeTile()` aria string generated from the same rules-data labels the manual uses, so 2D DOM, 3D face regions, and manual language never diverge.

## 3. What the Handler has

The manual chapter contains: a cover legend, a condition-tile legend, the **Plausibility Index** (one table per tier, generated from the same `COVER_RULES` rows the solver walks), the accusation procedure, and the say-the-chain callout. All prose below is drafted as it would sit in `rules.ts` data rows (standard + simplified strings per row).

### Cover legend (all tiers)

| Cover | Standard: how to spot it | Simplified |
|---|---|---|
| The Painter | An easel, a canvas, and a raised brush. | A painting stand and a brush. |
| The Angler | A long fishing rod held out over the edge. | A fishing pole. |
| The Photographer | A camera on a neck strap, raised to the eye. | A camera. |
| The Reader | A newspaper held wide open in both hands. | An open newspaper. |
| The Dog Walker | A dog on a lead beside them. | A dog on a leash. |
| The Seller | A vendor's tray of ice cream on a shoulder strap. | A tray of ice cream. |

Condition legend (same dual-prose treatment): weather = sun / rain / snow, time = day / night, place = park / station / harbor, each with a spot-it sentence ("A slanted-rain tile means rain is falling at the site.").

### Plausibility Index — ROOKIE (complete)

Header framing, standard edition: *"A genuine bystander's story fits the scene. The courier's cannot. For each suspect, find their cover below and check the scene against its row. Exactly the conditions named in the row matter — nothing else breaks a story."*
Simplified: *"Real people's stories fit the scene. The courier's story does not fit. Check each cover in this table."*

| Cover | The story breaks when… (standard) | Simplified | Evidence tile |
|---|---|---|---|
| The Painter | it is RAINING. Watercolors run and canvas soaks — no painter sets up in the rain. | Painters do not paint in the rain. Rain means the painter is lying. | WEATHER |
| The Angler | the place is the PARK or the STATION. An angler needs water; there is nothing to fish anywhere but the harbor. | You can only fish at the harbor. An angler at the park or station is lying. | PLACE |
| The Photographer | it is NIGHT. The shot is black after dark — a night photographer isn't really shooting. | It is too dark for photos at night. Night means the photographer is lying. | TIME |
| The Reader | it is RAINING. Nobody holds an open newspaper in the rain — the pages dissolve. | You cannot read a wet newspaper. Rain means the reader is lying. | WEATHER |
| The Seller | it is SNOWING. Nobody buys ice cream in a snowstorm; a seller with no possible customers is lying. | Nobody buys ice cream in the snow. Snow means the seller is lying. | WEATHER |
| The Dog Walker | never — dogs get walked in any weather, at any hour, anywhere. This story always holds up. | Never. The dog walker's story is always OK. | — |

Rookie callout (warning tone), standard: *"Exactly one story on screen breaks. When you think you've found it, do not accuse yet — say the chain aloud: 'The ___'s story can't be true BECAUSE the Index says ___ and the Agent sees ___.' Then the Agent taps the suspect AND the tile the chain names."* Simplified: *"Only one story is broken. Say WHY out loud before you tap. Tap the person, then tap the tile that proves it."*

### Plausibility Index — AGENT tier (structure + samples)

Same table shape; every cover now has 1–2 rows, at least three rows are **two-condition conjunctions** (evidence = two tiles), and the dog walker loses immunity — no free passes, every suspect must be checked. Sample rows:

| Cover | The story breaks when… (standard) | Simplified | Evidence tiles |
|---|---|---|---|
| The Photographer | it is NIGHT **and** the place is the PARK. The station and the harbor are lit all night; the park after dark is pitch black. | Night AND park together. The park has no lights at night. | TIME + PLACE |
| The Dog Walker | it is SNOWING **and** it is NIGHT. Nobody takes a dog out into a snowstorm after dark. | Snow AND night together. | WEATHER + TIME |
| The Seller | it is NIGHT. The ice-cream trade packs up at dusk. | Sellers stop at night. | TIME |

### Plausibility Index — MASTERMIND tier (structure + samples)

Adds an **UNLESS** column keyed to the visible accessory chips, plus an accessory legend (umbrella, lantern, satchel — *"the satchel appears in no exception; a satchel saves no one"*). Generation always plants a **near-miss**: one innocent whose base rule fires but whose accessory satisfies the exception — the pair must rule them out aloud. Sample rows:

| Cover | The story breaks when… | UNLESS (standard) | Simplified |
|---|---|---|---|
| The Painter | it is RAINING | …they have an UMBRELLA rigged over the easel. An umbrella saves the painter's story. | Rain breaks it — but an umbrella saves it. |
| The Photographer | it is NIGHT | …they carry a LANTERN. A lantern rig lights the shot. | Night breaks it — but a lantern saves it. |
| The Angler | the place is the PARK or the STATION | — nothing saves fishing on dry land. | Nothing saves it. |

### Accusation procedure (printed steps, both tiers of prose)

1. Ask for the scene first: all three tiles — weather, time, place. (Simplified: "Ask: what is the weather? Day or night? What place?")
2. Ask who is on the bench: for each suspect, their look and their cover. (Mastermind adds: and any accessory chip.)
3. Take one suspect at a time. Read that cover's row aloud. Ask only for the evidence the row names.
4. Say the verdict as a sentence: "…checks out, because…" or "…can't be true, because…". (Simplified: "Say WHY out loud.")
5. When exactly one story is broken, the Agent taps that suspect, taps the tile(s) the row names, and presses ACCUSE.

Tip callout: *"A wrong accusation — wrong person OR wrong evidence — counts as a wrong answer. Talking the chain through first costs nothing."*

## 4. The conversation loop

Rookie instance (the worked example from section 9): rain, day, station; photographer (wide-brim hat), dog walker (plaid scarf), angler (flat cap), seller (striped apron). Static Protocol is armed on this module with 1 say-again.

> **Handler:** Before anyone gets accused I need the scene. What do the three tiles at the top show?
> **Agent:** It's raining, and there's a sun over the line so it's daytime, and we're at the train station.
> **Handler** *(STATIC badge showing — scripted neutral clarification, per protocol the Handler may not act on a first description)*: Say again? I didn't copy all of that.
> **Agent** *(forced rephrase — the repair rep)*: Okay — three tiles. Weather tile is rain, slanted lines. Time tile is day. Place tile is the station, it has train tracks and a clock.
> **Handler:** Copy: rain, day, station. Now the bench — who's there, one at a time, what they look like and what they're doing.
> **Agent:** Four people. A lady in a big wide hat holding a camera up. A man with a plaid scarf walking a dog. A man in a flat cap with a fishing pole. And someone in a striped apron with an ice-cream tray.
> *(Rich first descriptions — the scene plus four suspects — are exactly what constraint 10 wants; there is no trivial "it's a 7" opening.)*
> **Handler:** Checking the photographer first. The Index says a photographer's story breaks at NIGHT. Is your time tile night?
> **Agent:** No — day.
> **Handler:** Then she checks out. She really could be taking photos. Dog walker: the book says that story NEVER breaks. He's clear no matter what.
> **Agent:** Even in the rain?
> **Handler:** Even in the rain — dogs get walked in anything. *(The Agent's commonsense suspicion is overruled by the table — the manual, not vibes, decides.)* Next, the angler. The Index says an angler's story breaks when the place is the park OR the station, because there's no water to fish. Say again — where are you?
> **Agent:** The station!
> **Handler:** Then how can he be fishing? There's no water at a train station.
> **Agent:** He can't! His story can't be true BECAUSE we're at the station and you can't fish at a station. *(The target inference chain, produced out loud by the student.)*
> **Handler:** Hold on — one story exactly should break, so prove the seller first. The seller breaks in SNOW. Is it snowing?
> **Agent:** No, raining. So the seller checks out… and the flat-cap man is the only broken story. He's the courier.
> **Handler:** Agreed. Tap the flat-cap angler, then tap the tile that broke him — which one is it?
> **Agent:** The place tile. Station. *(Taps angler, taps PLACE, presses ACCUSE.)* Got him.

Every exchange crosses the gap: the Handler cannot check a single row without an observation; the Agent cannot judge a single suspect without a row. The conclusion — never printed anywhere — is assembled in speech, and the evidence-tap makes the "because" part of the committed answer.

## 5. Difficulty tiers

| | 1 — Rookie (~4 min) | 2 — Agent (~5 min) | 3 — Mastermind (~6 min) |
|---|---|---|---|
| Suspects | 4 | 5 | 6 |
| Rules per cover | exactly 1 (dog walker: none — one always-safe cover) | 1–2, incl. two-condition conjunctions; no always-safe cover | 1–2, conjunctions + UNLESS exception clauses |
| Evidence to tap | 1 tile | 1–2 tiles | 1–2 tiles, after ruling out the exception |
| Accessories | not shown | not shown | shown on every card (umbrella / lantern / satchel / none) |
| Planted trap | — | — | one near-miss innocent: base rule fires, accessory saves them |
| Language load | single-premise chains ("because X") | two-premise chains ("because X and Y together") | chains with ruling-out ("X would break it, UNLESS — and she has the umbrella, so she checks out") |

Complexity scales; speed never does. No clocks anywhere; stakes are the SLP-set 1–3 wrong accusations before the module seals.

## 6. Generation & solvability

**State shape** (everything the Agent sees; the courier is deliberately NOT stored — it is derivable, exactly as Bad Intel omits its broken step):

```ts
type Weather = 'sun' | 'rain' | 'snow';
type TimeOfDay = 'day' | 'night';
type Place = 'park' | 'station' | 'harbor';
type ConditionSlot = 'weather' | 'time' | 'place';
type Accessory = 'umbrella' | 'lantern' | 'satchel' | 'none';

interface Suspect { cover: CoverId; look: LookId; accessory: Accessory; }
interface CoverStoryState {
  conditions: { weather: Weather; time: TimeOfDay; place: Place };
  suspects: Suspect[];
}
type CoverStoryAnswer = { suspect: number; evidence: ConditionSlot[] }; // evidence is a set
```

**Rule row shape** (the single source for solver and manual):

```ts
interface CoverRule {
  id: string; cover: CoverId; tier: Difficulty;
  when: Partial<Record<ConditionSlot, readonly string[]>>; // conjunction; each named slot must hold one of the listed values
  unless?: Exclude<Accessory, 'satchel' | 'none'>;          // tier 3 only
  standard: string; simplified: string;
}
```

A rule **fires** for a suspect iff every `when` slot matches the scene AND (`unless` is absent or the suspect's accessory ≠ `unless`). `solve(state)`: for each suspect, evaluate every tier-table row for their cover; return `{ suspect: i, evidence: Object.keys(firedRule.when) }` for the unique suspect/rule that fires — precisely the mechanical check the printed procedure walks a human Handler through, using only table data.

**generate(seed, difficulty)** is constructive, not rejection-sampled:
1. `mulberry32(seed)`; pick the guilty cover and one of its tier rules R (`pick`).
2. Enumerate, in fixed table order, all condition assignments (the full space is only 3×2×3 = 18) that satisfy R's `when`.
3. Enumerate innocent-cover subsets of the required size from the remaining covers. For each (assignment, subset) pair, keep it iff (a) no rule of any innocent cover fires under the assignment — at tier 3 an innocent whose base rule fires is kept only as the designated near-miss with `accessory = rule.unless`, and exactly one near-miss is required — and (b) no OTHER rule of the guilty cover fires (uniqueness of evidence), and (c) at tier 3 the guilty suspect's accessory can be chosen to defeat R's exception (anything but `unless`; satchel/none as decoys).
4. `pick` one valid combo from the enumerated list, assign distinct looks by `sample`, `shuffle` bench order, emit.

**Exactly one defensible answer — the argument.** By construction exactly one (suspect, rule) pair fires: the guilty suspect's chosen rule fires by step 2; the guilty suspect's other rules are excluded by filter (b); every innocent's rules are excluded by filter (a) (near-misses are defused by their accessory, which the fire-check honors). Firing is a pure function of the tables plus visible state, so `solve` recovers the same unique pair, and `validate` accepts exactly `{ guilty index, evidence = keys of R.when }` (set equality, order-free). There are no judgment calls: "matches" is value equality on enum slots, and the robot Handler needs zero heuristics. Non-emptiness of the enumerated pool is not asserted per-seed but proved **exhaustively at the table level**: the space is tiny, so a vitest iterates every tier × every rule × all 18 assignments × all cover subsets and asserts each rule has at least one valid combo — the generator can never dead-end, for any seed. On top sits the standard property suite: 1000 seeds × 3 difficulties asserting well-formedness, `validate(state, solve(state)) === true`, exactly-one-firing, rejection of wrong-suspect / wrong-evidence / superset-evidence answers, coverage (every cover gets to be guilty across seeds), and byte-identical regeneration from equal (seed, difficulty).

**Seeded determinism:** enumeration order is fixed by table order; all randomness flows through the seeded rng; same seed + difficulty = same instance, forever.

## 7. Answer & validation model

- Tap a suspect card → card highlights, accusation tray opens. Tapping another suspect moves the highlight. Free, unlimited, unlogged as answers.
- In the tray, tap condition tile(s) to select evidence (toggle, multi-select). ACCUSE enables once ≥1 tile is selected.
- **ACCUSE commits** `{ suspect, evidence }`. Correct iff suspect index matches `solve` and evidence equals the fired rule's slot set exactly (as a set — order-free, but no missing tiles and no padding extras, so shotgunning all three tiles fails).
- Any incorrect ACCUSE → `onStrike()` (one of the SLP's 1–3 wrong answers); the scene stays exactly as it was, nothing is revealed, and the pair keeps talking. Correct ACCUSE → `onSolved()`.
- CANCEL closes the tray without committing. `onAttempt(correct, answer)` logs each commit for the tally.

Brute-force math: Rookie 4 suspects × 7 non-empty tile subsets = 28 committable answers against a default single allowed wrong answer; Mastermind 6 × 7 = 42. Guessing is strictly irrational; saying the chain is the cheap path — by design.

## 8. Static Protocol & hints

**Static Protocol:** fully compatible. The Agent's natural first description is the richest in the catalog — three scene tiles plus a bench of described strangers — so the scripted neutral clarifications ("Say again — I didn't copy all of that." / "Give me that once more, one thing at a time.") land on real content and force genuinely restructured rephrasals (see the transcript in section 4). There is no degenerate "it's a 7" opening to hide behind; the manual's step 1 ("ask for the scene first") guarantees the first exchange is a multi-part description.

**Hints (verbatim, escalating, communication-only — they never touch instance answers):**
1. "Set the scene first. Handler, ask for all three tiles — weather, time, and place — before you talk about any people."
2. "Work one suspect at a time. Handler, find that cover in the Index and read its row out loud; Agent, answer with what the screen shows, not with who feels suspicious."
3. "Before you accuse, say the whole chain together: 'The ___'s story can't be true BECAUSE the manual says ___ and the screen shows ___.' If you can't finish that sentence, you're not ready to tap."

## 9. Worked example

One complete Rookie instance, exactly as `generate(seed, 1)` would emit it (guilty cover = angler, rule `angler-dry-land`, drawn assignment rain/day/station, innocents {photographer, dog-walker, seller}, bench shuffled):

```json
{
  "moduleId": "cover-story", "difficulty": 1, "seed": 4870,
  "state": {
    "conditions": { "weather": "rain", "time": "day", "place": "station" },
    "suspects": [
      { "cover": "photographer", "look": "wide-brim-hat", "accessory": "none" },
      { "cover": "dog-walker",   "look": "plaid-scarf",   "accessory": "none" },
      { "cover": "angler",       "look": "flat-cap",      "accessory": "none" },
      { "cover": "seller",       "look": "striped-apron", "accessory": "none" }
    ]
  }
}
```

Replay against the Rookie table, suspect by suspect, exactly as `solve` and the printed procedure both do:
1. Suspect 0, photographer. Row: breaks when TIME = night. Scene time = day → does not fire. Story holds.
2. Suspect 1, dog walker. No row — never breaks. Story holds (note: rain does NOT implicate him; only printed rows break stories).
3. Suspect 2, angler. Row: breaks when PLACE ∈ {park, station}. Scene place = station → **fires**. Evidence slot = PLACE.
4. Suspect 3, seller. Row: breaks when WEATHER = snow. Scene weather = rain → does not fire. Story holds.
5. Painter and reader rows exist in the table but no suspect carries those covers — vacuous. (Rain would have broken a painter or reader; the generator's filter (a) is exactly why neither is on this bench.)

Exactly one fired rule → `solve` returns `{ "suspect": 2, "evidence": ["place"] }`. `validate` accepts only that pair: `{suspect: 2, evidence: ["weather"]}` is wrong (evidence mismatch), `{suspect: 2, evidence: ["place","weather"]}` is wrong (padded set), `{suspect: 1, evidence: ["place"]}` is wrong (suspect mismatch). A judge can re-derive every step from section 3's table alone.

## 10. Risks & open questions

- **Commonsense leakage.** Some Rookie rows are guessable from world knowledge (painter/rain), letting a bold Agent shortcut the Handler. Mitigations: the evidence-set requirement (you must know WHICH tile the row names — rain looks equally damning for the reader, and the dog walker looks suspicious in rain but never breaks), the strict wrong-answer budget, and tier 2–3 rows that are deliberately tradecraft-arbitrary (park-at-night conjunctions, unless-clauses). Ambiguity playtesting should specifically watch Rookie pairs skipping the manual; if it happens, rotate one arbitrary row into the Rookie table (e.g. reader breaks at the HARBOR — "the spray").
- **Two stories that both look broken to intuition.** Generation guarantees exactly one FIRED rule, but a student may *feel* two are broken (seller in rain). This is a feature — the manual arbitrates — but it needs the manual framing sentence ("exactly the conditions named in the row matter — nothing else breaks a story") to carry weight in both editions. Verify in the read-aloud test that the simplified sentence lands.
- **Evidence multi-select motor/attention load.** Tap-suspect-then-tap-tiles-then-ACCUSE is a three-stage commit; students with motor or attention needs may commit prematurely. Mitigate with the disabled-until-evidence ACCUSE button and generous CANCEL; watch it on the iPad playtest.
- **Referent collision.** Covers are unique per bench (the generator draws covers without replacement) so "the angler" is always a unique referent; if a future variant allows duplicate covers, the look system must be promoted from flavor to referent and descriptions get harder — do not do this casually.
- **Static table breadth.** Variety comes from guilty cover × rule × assignment × innocent mix × looks × bench order (hundreds of distinct Rookie scenes, more above), but the RULES are memorizable across many sessions — same trade-off Bad Intel accepted. If pairs plateau, add a second bank of covers (busker, jogger, florist) as pure data rows: zero engine work by design.
- **Near-miss fairness (tier 3).** The near-miss innocent is only fair if the accessory chips are unmissable on screen and the UNLESS column is unmissable in print. Both need visual QA in the easy-read edition especially.

## 11. Why this beats the obvious alternative

The obvious inference module is a Guess-Who-style eliminator: the Handler secretly holds the courier's attribute profile and the Agent narrows candidates with yes/no questions. That design fails the brief twice. First, its conclusion IS stated on one side — the Handler effectively knows the answer, so nothing is genuinely inferred across the gap, and the talk degrades into attribute bingo ("does he have a hat?") rather than causal reasoning; second, it wears its mass-market inspiration on its sleeve, and derivative-feeling designs lose. Cover Story's conclusion exists on neither side of the table: the screen shows people the Agent can't judge, the manual shows rules the Handler can't apply, and the courier only comes into existence when a student says "his story can't be true BECAUSE" — the exact inferential-language behavior the research shortlist ordered. The commit mechanism then makes that justification load-bearing: you don't just accuse a person, you tap the evidence, so the module mechanically refuses to accept a conclusion without its chain. And the fiction gives the click a story-shaped payoff — a lie collapsing under the weather — which is the kind of resolution a high-schooler asks to run again.
