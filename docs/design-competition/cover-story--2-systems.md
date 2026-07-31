# Cover Story (cover-story, lens: systems)

Tagline: Break every alibi but one — the suspect whose story holds is your courier.
Primary: expressive / secondary: pragmatics, receptive
Minutes: {"1":4,"2":5,"3":7}

Core loop: The Agent's screen shows a case name and a lineup of suspects, each carrying small evidence items ("pocket litter") drawn as icons with no labels. The Handler's manual holds two static tables the Agent never sees: an Evidence Index (what each item proves about a person) and the named Case File (three to five facts about what the courier did that day). The Handler elicits descriptions of each suspect's items, looks up what they prove, and reads case facts aloud; whenever an item proves a fact wrong, the pair must say the inference chain out loud — "the muddy boots prove he came on foot, but the courier rode the tram, so it can't be him" — and the Agent commits it by tapping the suspect, tapping that exact item, and stamping STORY BROKEN. Every suspect but one carries exactly one story-breaking item; the courier is never named on either side and emerges only as the last story standing, which the Agent marks after recapping why everyone else is out.

---

# Cover Story — design spec

Module id `cover-story`. Primary target `expressive` (Describing & directing): the committed game action *is* a spoken causal justification — the Agent must produce evidence descriptions and "can't-be-the-courier-BECAUSE" complex sentences to earn every stamp. Secondary `pragmatics` (the Handler runs on evidence-eliciting questions and "how do you know?" checks) and `receptive` (the Agent acts on the Handler's read-aloud facts and negated facts). The roster already carries two pragmatics-primary modules (Bad Intel, Asset Interview); inference-from-evidence lands most heavily on the *production* of the inferential language, so expressive is both honest and roster-balancing.

## 1. Concept & fiction

**Codename: COVER STORY.** *Tagline: Break every alibi but one — the suspect whose story holds is your courier.*

An enemy courier is hiding in a lineup of ordinary citizens. Surveillance built a file on what the courier did today — but never got a face. Each suspect was stopped at the checkpoint and their pocket litter photographed. Everybody's cover story sounds fine; the pocket litter doesn't lie. The Agent holds the checkpoint photos (the screen). The Handler holds the case file and the station's Evidence Index — the tradecraft key that says what each item *proves* about the person carrying it. Neither the file nor the screen names the courier. The pair must pool what they hold, break each cover story with one proven contradiction, and say out loud why the last suspect standing must be the one.

Original IP throughout: no borrowed names, text, or trade dress; the fiction sits inside Say Again?'s existing 1968 Tradecraft world.

## 2. What the Agent sees

A corkboard-style plate, minimal text, everything tappable:

- **Top banner:** `CASE: ORCHID` — stencil type, the only load-bearing text on screen. This is the Handler's lookup key.
- **Suspect grid:** 4–6 cards (2×2 at Rookie, 2×3 at higher tiers). Each card has:
  - a letter tab (`A`–`F`) — how the pair refers to suspects;
  - a seeded decorative silhouette portrait (hat / scarf / build variants — pure dressing, never rule-relevant; the manual says so explicitly);
  - a row of 2–4 **evidence icons** (tram ticket stub, muddy boots, dripping umbrella, dry newspaper, café receipt, market bag, ink-smudged left or right cuff, coin purse, money clip, bakery bag, late-show ticket stub). Icons carry **no text labels** — naming and describing them is the Agent's expressive job. (Full aria-labels via `describeEvidence()` for VoiceOver.)
- **Focus view:** tapping a card zooms it: portrait large, items enlarged in a row, each item tappable (selected item gets a ring highlight), plus a big **STORY BROKEN** stamp button (disabled until an item is selected) and a close control.
- **Committing a clear:** tap suspect → tap the item that breaks their story → tap STORY BROKEN. Correct: inked diagonal `CLEARED` stamp, card grays, haptic tick; items stay reviewable read-only (supports the end recap). Wrong: strike shake, nothing changes.
- **Endgame:** when exactly one card is unstamped, it gains a gold **MARK AS COURIER** strip (present but locked earlier — a padlock glyph explains itself). Tapping it completes the module.

Touch targets ≥ 60 px; state never color-only (stamps, grayscale, lock glyph); works as a flat 2D React component; standard single-slot faceplate.

## 3. What the Handler has

Four kinds of printed content, all generated from `rules.ts` data. Drafted tables follow — **standard** prose first, **simplified** in brackets where it differs.

### 3a. The six traits — "every trait has two sides" (static, all tiers)

| Trait | One side | Other side |
|---|---|---|
| Travel | rode the tram | came on foot |
| Rain | stayed dry | was out in the morning rain |
| Lunch | ate at the café | bought lunch at the market |
| Writing hand | writes left-handed | writes right-handed |
| Money | pays with coins | pays with paper bills |
| Hours | up before dawn | out past midnight |

**Callout (warning), standard:** "Every trait has exactly two sides, and the case files use only these twelve. If a file rules one side out, the courier did the other — there is no third option." **[Simplified: "Each row has two sides. If the file says NOT one side, the courier did the other side."]**

### 3b. The Evidence Index (static, all tiers)

| Evidence | What it proves |
|---|---|
| Tram ticket stub | Rode the tram — conductors only punch tickets on board. *[They rode the tram.]* |
| Muddy boots | Came on foot — the only mud in town is on the canal footpath. *[They walked. The footpath is muddy.]* |
| Dripping umbrella | Was out in the morning rain. *[They were out in the rain.]* |
| Crisp dry newspaper | Stayed dry — today's paper would be ruined by rain. *[They stayed dry.]* |
| Café receipt | Ate at the café — the till stamps today's date. *[They ate at the café.]* |
| Market bag | Bought lunch at the market stall. *[They got food at the market.]* |
| Ink smudge, LEFT cuff | Writes left-handed — fresh ink drags along the writing-hand cuff. *[They write with the left hand.]* |
| Ink smudge, RIGHT cuff | Writes right-handed. *[They write with the right hand.]* |
| Coin purse | Pays with coins. *[They pay with coins.]* |
| Money clip | Pays with paper bills. *[They pay with paper money.]* |
| Bakery bag | Was up before dawn — the first batch sells out by seven. *[They got up very early.]* |
| Late-show ticket stub | Was out past midnight — the last picture ends at twelve. *[They were out very late.]* |

A small `figure` block prints the 12 icons above this table, exactly as drawn on screen (same pattern as Bad Intel's control figure).

**The Golden Rule of clearing (callout, warning), standard:** "A suspect is cleared ONLY when one of their items proves a case fact wrong. No item, no proof — someone carrying nothing about a fact stays a suspect. Looks, faces, and hunches clear nobody." **[Simplified: "Clear a suspect only when an item proves the file wrong. No proof? They stay a suspect. Never guess from faces."]**

### 3c. Case files — Rookie tier COMPLETE

**Tier note (warning), standard:** "Every suspect but one carries exactly one item that breaks a case fact. Find it, say the because-sentence out loud, then stamp." **[Simplified: "All but one suspect has one item that breaks the file. Say why before you stamp."]**

**CASE ORCHID — Rookie (4 suspects, 3 facts)**

| # | The file says |
|---|---|
| 1 | The courier rode the tram. *[same]* |
| 2 | The courier stayed dry all morning. *[The courier stayed dry.]* |
| 3 | The courier ate at the café. *[same]* |

**CASE GARNET — Rookie (4 suspects, 3 facts)**

| # | The file says |
|---|---|
| 1 | The courier came on foot. *[The courier walked.]* |
| 2 | The courier pays with coins. *[same]* |
| 3 | The courier writes left-handed. *[The courier writes with the left hand.]* |

### 3d. Agent and Mastermind case files — structure + sample rows

**Agent tier:** 5 suspects, **4 facts, exactly one printed as a NOT** (the negation of the trait's other side — the pair must flip it with the two-sides table). Tier note (tip), standard: "One fact in each file is written as a NOT. Use the two-sides table to turn it around before you hunt." **[Simplified: "One fact says NOT. Flip it: the courier did the other side."]**

- **CASE LANTERN** (sample rows): 1 — "The courier was out in the morning rain." · 2 — "The courier did NOT come on foot." *[The courier did not walk.]* · 3 — "The courier pays with paper bills." · 4 — "The courier ate at the café."
- **CASE TINDERBOX** (sample rows): 1 — "The courier writes right-handed." · 2 — "The courier did NOT stay dry." · 3 — "The courier was up before dawn." (+1 more)

**Mastermind tier:** 6 suspects, **5 facts, two printed as NOTs**, and suspects also carry **neutral items** (traits the file never mentions — describing them and *ruling them irrelevant* is deliberate work). No tier note at all — spotting negations and irrelevant evidence unprompted is the point (same silence lever as Bad Intel).

- **CASE NIGHTJAR** (sample rows): 1 — "The courier rode the tram." · 2 — "The courier did NOT pay with coins." · 3 — "The courier was out past midnight." (+ "did NOT eat at the café", "writes left-handed")
- **CASE VESPER** (sample rows): 1 — "The courier stayed dry all morning." · 2 — "The courier did NOT write right-handed." · 3 — "The courier came on foot." (+2 more)

### 3e. Working the board (steps block)

Standard: 1) "Ask for the case name at the top of the screen. Find that case file." 2) "Ask the Agent to describe each suspect and every item they carry — one suspect at a time. Look each item up in the Evidence Index and say aloud what it proves." 3) "Read the case facts one at a time. When an item proves a fact wrong, have the Agent say the whole chain — 'the ___ proves they ___, but the file says the courier ___, so it can't be them' — then tap the suspect, tap that item, and stamp STORY BROKEN." 4) "If nothing a suspect carries breaks any fact, leave them alone. They stay a suspect." 5) "One suspect left unstamped? That is the courier — but before the Agent taps MARK, recap how you know: everyone else's story broke."

Simplified: 1) "Ask for the case name. Find that case in this book." 2) "Ask: 'What is suspect A carrying?' Look up each item. Say what it proves." 3) "Read a fact. Does an item prove it wrong? Say: 'It can't be them because ___.' Then tap the suspect, tap the item, tap the stamp." 4) "No proof? Do not stamp." 5) "One suspect left? That is the courier. Say why. Tap MARK."

**Tip callout, standard:** "The stamp is a promise. Before every stamp, finish the sentence out loud: '___ can't be the courier BECAUSE ___.' If you can't finish it, you aren't ready to stamp." **[Simplified: "Before you stamp, say: 'It can't be them because ___.' Can't say it? Don't stamp."]**

## 4. The conversation loop

Rookie, CASE ORCHID, Static Protocol active (1 say-again). Suspects: A = muddy boots + café receipt; B = dripping umbrella + tram ticket; C = tram ticket + dry newspaper; D = market bag + dry newspaper. *(Annotations in italics.)*

> **H:** What's the case name at the top? — *lookup key request; Handler can do nothing alone*
> **A:** Orchid.
> **H:** Case Orchid, got it. Describe suspect A for me — everything he's carrying.
> **A:** Tall guy with a hat. Boots… and some paper thing. — *first description, underspecified*
> **H** *(STATIC — scripted, neutral):* Say again? I only caught part of that. — *repair drill fires on the first description*
> **A:** Suspect A carries two things: boots with mud all over them, and a little receipt — like from a restaurant. — *rephrased, more precise; the repair itself is the therapy*
> **H:** Muddy boots — my index says the only mud in town is on the canal footpath, so A came on foot. And the file's first fact says the courier rode the tram. So what does that tell us? — *Handler supplies the two premises but withholds the conclusion; evidence-eliciting "how do you know" question*
> **A:** A can't be the courier because he walked, and the courier took the tram. — *the target behavior: the unstated conclusion, inferred out loud as a because-sentence*
> **H:** Agreed. Tap A, tap the boots, stamp it. *(Correct clear — the receipt would be rejected: it confirms fact 3.)*
> **A:** Stamped. B has an umbrella that's dripping wet, and a tram ticket.
> **H:** The ticket fits — courier did ride the tram. But a dripping umbrella proves B was out in the rain, and fact 2 says the courier stayed dry. So? — *near-miss forces "fits vs. breaks" talk; one confirming item never saves a broken story*
> **A:** B's out — because she got rained on and the courier didn't. Tapping the umbrella… stamped.
> **A:** D has a market bag and a dry newspaper.
> **H:** Dry newspaper fits — stayed dry. What does a market bag prove? — *Handler makes the Agent wait for the lookup: "bought lunch at the market." Fact 3: ate at the café.*
> **A:** So D can't be it because he ate at the market, not the café. Stamped.
> **H:** That leaves C. Before you mark — how do we know it's C? — *forced synthesis recap*
> **A:** Because A walked, B was out in the rain, D ate at the market. C's the only story that still holds.
> **H:** Mark as courier. *(Solved.)*

Note the Static Protocol fit: the natural first ask is "describe a suspect and everything they carry" — a genuinely rich multi-attribute description (item, condition, left/right), never a trivial "it's a 7."

## 5. Difficulty tiers

| | Rookie | Agent | Mastermind |
|---|---|---|---|
| Suspects | 4 | 5 | 6 |
| Case facts | 3, all direct | 4, one negated | 5, two negated |
| Items per suspect | 2 | 3 | 4 |
| Neutral (irrelevant) items | none | occasional | common — must be described and *ruled irrelevant* |
| Manual tier note | full warning | negation tip | silent |
| Minutes | **4** | **5** | **7** |

What scales is inferential load only — negation flips, relevance judgments, more chains — never speed. Stakes remain the SLP-set 1–3 wrong answers.

## 6. Generation & solvability

```ts
// rules.ts (data): TraitRule{ id, label, sides:[TraitSide, TraitSide] } where TraitSide carries
//   phrase + factStandard/factSimplified + notStandard/notSimplified prose;
// EvidenceRule{ id, trait, side: 0|1, name, standard, simplified } — 12 rows = 6 traits × 2 sides;
// CaseRule{ id, name, difficulty, facts: CaseFact[] } with CaseFact{ trait, side, negated? }
//   (negated is PROSE-ONLY: prints as "did NOT <other side.phrase>"; the solver ignores it).

// logic.ts
interface Suspect { look: number; items: EvidenceId[] }        // look = decorative variant
interface CoverStoryState { caseId: CaseId; suspects: Suspect[] } // target NOT stored — derivable
type CoverStoryAnswer = { clears: { suspect: number; item: number }[]; courier: number };

const contradicts = (e: EvidenceId, f: CaseFact) =>
  EVIDENCE_BY_ID[e].trait === f.trait && EVIDENCE_BY_ID[e].side !== f.side;
```

`generate(seed, difficulty)`: `mulberry32(seed)`; pick a case of the tier; K = facts.length; suspects = K+1. Shuffle fact indices to assign each decoy its broken fact (a **bijection** — every printed fact clears exactly one suspect); insert the target at a random position. Each decoy's items = the single **breaker** (the evidence of the *opposite side* of its assigned fact) + fillers; the target gets fillers only. Fillers are sampled without trait repetition per suspect from the **confirm pool** (evidence matching the side of *other* case facts) and, at tier ≥ 2, the **neutral pool** (both sides of traits the case never mentions). Item order and suspect order shuffled. Pool sizes always suffice (confirm pool = K−1 ≥ 2 icons per suspect at Rookie; neutral adds more above).

**Uniqueness argument.** (i) Case facts use distinct traits (static table invariant, unit-tested), so no fact contradicts another. (ii) The target carries only confirming/neutral icons — zero contradictions by construction. (iii) Each decoy carries exactly one breaker; its fillers confirm other facts or touch unmentioned traits, and the ≤1-icon-per-trait rule bars a second icon on the broken trait — so exactly one contradicting item. Therefore `solve()` — "for each suspect, list items contradicting any case fact; the unique zero-contradiction suspect is the courier; each other suspect's unique contradicting item is its clear" — is derived from `CASES` + `EVIDENCE` alone and is total and single-valued. Every decision point (which item breaks suspect S; who is the courier) has exactly one defensible answer; a robot Handler needs no judgment calls. Property tests (mirroring `badIntel/logic.test.ts`, 1000 seeds × 3 tiers): exactly one zero-contradiction suspect; every decoy exactly one breaker; `validate(state, solve(state))` true; perturbations rejected (wrong item cited, clearing the courier, wrong courier, missing clear); byte-determinism of generate; coverage — across seeds every fact index of every case gets broken; table totality (12 = 6×2 evidence rows with both-edition prose; distinct-trait facts per case; 2 cases per tier with 3/4/5 facts).

## 7. Answer & validation model

The answer is the full elimination record: an (order-free) set of `{suspect, item}` clears — one per decoy, citing the exact breaking item — plus the final `courier` index. Each clear commits on the STORY BROKEN stamp: citing a non-contradicting item, or stamping the true courier, calls `onStrike` (and `onAttempt(false, …)`); the board is unchanged. MARK AS COURIER unlocks only when one suspect remains, so the committed chain is always complete; `validate` still checks set-equality of clears and the courier index, so the robot-Handler contract is airtight. Wrong answers per module before sealing: the mission-wide SLP setting (1–3).

## 8. Static Protocol & hints

Static Protocol needs nothing module-specific: the seeded STATIC badge appears and the engine's scripted neutral clarifications answer the Agent's first description. The module's contribution is that first descriptions are inherently rich (a suspect plus every carried item, with condition and left/right detail), so a stacked "say again" forces real reformulation. The three escalating hints, verbatim:

1. "Start with the case name at the top of the screen. Handler — find that case file and read its first fact out loud."
2. "Agent — pick one suspect and describe every single item they carry. Handler — look each item up in the Evidence Index and say what it proves."
3. "Before any stamp, finish this sentence out loud: 'They can't be the courier because their ___ proves they ___, but the file says the courier ___.'"

All three coach the exchange; none can leak an instance answer.

## 9. Worked example

`generate(…, 1)` emits (Rookie): `state = { caseId: 'orchid', suspects: [ A:{items:[muddyBoots, cafeReceipt]}, B:{items:[drippingUmbrella, tramTicket]}, C:{items:[tramTicket, dryNewspaper]}, D:{items:[marketBag, dryNewspaper]} ] }` (looks omitted). Replay against Section 3's tables:

- **Fact 1 — "rode the tram" (side: tram).** Contradicting evidence = *muddy boots* (foot side). A carries it → A's story breaks on fact 1. Clear = (A, boots). A's café receipt confirms fact 3 — fits, saves nothing.
- **Fact 2 — "stayed dry."** Contradicting evidence = *dripping umbrella*. B carries it → clear (B, umbrella). B's tram ticket confirms fact 1 — the near-miss.
- **Fact 3 — "ate at the café."** Contradicting evidence = *market bag*. D carries it → clear (D, market bag). D's dry newspaper confirms fact 2.
- **C:** tram ticket confirms 1, dry newspaper confirms 2, nothing touches 3 — and by the Golden Rule absence proves nothing. Zero contradictions → C is the courier.

`solve(state)` = `{ clears: [{A,boots},{B,umbrella},{D,marketBag}], courier: C }`; `validate` accepts it and rejects, e.g., (A, receipt) — the receipt contradicts no fact. Note the bijection: each of the three printed facts broke exactly one suspect. A judge can replay every step from the printed tables with no judgment calls.

## 10. Risks & open questions

- **Icon nameability.** Unlabeled icons are the expressive point, but students with word-finding deficits may stall on "muddy boots" vs "old shoes." Mitigations: 12 highly-differentiated icons, the manual figure legend, and Handler scaffolding ("is it footwear? is it paper?"). Needs a quick icon-naming pilot before art is final.
- **Binary-trait realism.** "Up before dawn vs out past midnight" is only in-fiction exclusive. The two-sides callout declares the closed world and each Evidence Index row carries its warrant, but a sharp student may argue edge cases; the module's answer ("the Index is station doctrine") must satisfy playtest.
- **Mastermind load.** 6 suspects × 4 icons = 24 icons on screen plus 5 held facts. Cleared cards graying out and free re-reads mitigate; if playtest shows overload, the first lever is dropping Mastermind to 3 items + guaranteed neutrals.
- **Silent stamping.** A dyad could grind stamps by trial-and-error without talking. Strikes (default 1) make that ruinous, and the required *item citation* means even a lucky silent stamp had to survive a 1-in-2-to-4 item pick — but this is SLP-supervised by design, like every module.
- **Ceremonial final tap.** MARK is locked until forced, so the last tap can't be wrong. Accepted trade: the real decisions are the cited clears, and the lock is what forces the full spoken chain.
- **Legend memorization.** A veteran Agent may internalize the 12-row Evidence Index, thinning (not closing — the case file still lives only in the manual) the gap. Role-swapping is the standing answer.
- **Negations in the easy-read edition.** "Did NOT walk" is a known comprehension hazard at 3rd–5th grade level; the two-sides table is the scaffold, but this row of the design should be watched specifically in ambiguity/CX testing.

## 11. Why this beats the obvious alternative

The obvious build is a description-matching lineup — the Handler reads the courier's attributes, the Agent picks the matching face — which is a single perceptual hop, forces naming but no reasoning, and would near-duplicate the existing Spot the Contact module; worse, its conversation collapses the moment the Agent spots the match, and nothing ever obliges a "because." Cover Story's conclusion is printed nowhere: the screen holds evidence without meanings, the manual holds meanings and facts without faces, and the answer exists only after a two-premise chain (item → proven fact → broken file) is assembled across the gap — then the UI makes that chain the committed move by demanding the *cited* breaking item under stamp-is-a-promise stakes. Systems-wise it stays as clean as the naive version: six binary traits, twelve evidence rows, six case tables, and a decoy-per-fact bijection that makes 3000-seed unambiguity a construction property rather than a search — a contract a competent dev implements in a day, and a manual whose tables read like tradecraft.
