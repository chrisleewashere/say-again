# Double Meaning (double-meaning, lens: therapy)

Tagline: Intercepted mail hides orders inside everyday phrases — work out what each card really means.
Primary: vocabulary / secondary: pragmatics, expressive
Minutes: {"1":4,"2":5,"3":6}

Core loop: The Agent draws intercepted postcards one at a time; each carries one sentence with an idiom (or, at higher tiers, a multiple-meaning word) underlined. The Agent reads the card aloud; the Handler finds the phrase in the printed Phrasebook and reads its scripted CHECK question — a literal-referent probe ("Did real beans get spilled in your sentence?") — and the Agent must answer from the sentence, quoting the words that prove it. A plain (literal) reading means the card is ordinary mail and the Agent taps the ROUTINE MAIL tray; a code (figurative) reading sends the Handler back to the row for the meaning gloss and the drop-point tile the Agent must find and tap. Neither side can move alone: the Handler never sees the sentence or the tiles, and the Agent never sees the glosses, the check questions, or the phrase-to-drop mapping — the literal/figurative judgment is the hinge every single card turns on.

---

# Double Meaning — module design spec

Module id: `double-meaning` · Primary target: **vocabulary** (semantics / figurative language) · Secondary: pragmatics, expressive

**Why `vocabulary` is the primary TherapyTarget.** The `TherapyTarget` enum has no dedicated figurative-language slot; of the five, `vocabulary` ("Vocabulary & categories") is the one that names *word and phrase meaning* as the thing being exercised, and idiom/polysemy work is a semantics intervention — the student's job on every card is to select the correct sense of a lexical item in context. `pragmatics` is a strong secondary (every card runs a scripted probe-and-justify exchange, and both editions script repair moves), and `expressive` is earned by the justification requirement ("which words tell you that?"). But the load-bearing cognitive act — the thing the SLP tallies — is a semantic judgment about meaning, so `vocabulary` it is. It also fills a gap: the current 10-module roster has two vocabulary modules (categories, semantic features) and nothing touching figurative language, which the research shortlist flags as a top unmet need for high schoolers with language disorders.

---

## 1. Concept & fiction

**Codename: DOUBLE MEANING.** Tagline: *"Intercepted mail hides orders inside everyday phrases — work out what each card really means."*

The rival network has stopped using ciphers. Their new trick is worse: they hide orders inside ordinary-looking postcards, and the signal is an everyday phrase. If the phrase is used **as code** — figuratively — the card is a live order, and the network's Phrasebook (which our side captured and reprinted as the Handler's manual chapter) says which dead-drop the card is routing couriers to. If the phrase is meant **plain** — the sentence really is about beans, ice, or towels — the card is innocent mail from an innocent citizen, and it goes in the ROUTINE MAIL tray.

The enemy is counting on censors who take every sentence literally. That is the joke and the therapy in one: a literal-minded reader waves real intelligence through, and an over-eager reader routes grandma's postcard to a dead-drop. The Agent sits at the intercept desk with the mailbag; the Handler holds the Phrasebook. Only together can they tell which meaning each card is carrying.

**Therapy-first origin.** The ideal exchange was written before the mechanic: *Student A reads a sentence containing an idiom aloud; Student B asks a concrete probe about the literal referent; Student A answers literal-or-figurative and quotes the words in the sentence that prove it; Student B supplies the figurative gloss aloud and describes where it routes.* Everything below exists to make that exact exchange necessary, card after card. This is the evidence-based idiom-intervention format (contrastive literal/figurative judgment in context, with justification) with the meaning problem split down the middle: the Agent holds the **context**, the Handler holds the **candidate meanings**, and neither half is worth anything alone.

## 2. What the Agent sees

A single rack slot (standard faceplate, `slots: 1`), styled as an intercept desk.

- **Top strip:** `MAILBAG — CARD 2 OF 3` counter, plus small done-ticks for completed cards. No other chrome text.
- **The card (upper ~55%):** one postcard, large. Its printed side shows **one sentence in large type (max ~18 words)** with the target phrase **underlined** (thick amber underline — the only highlighted element, so "the underlined part" is always describable). In the corner, a postage stamp; at Mastermind the stamp is one of two visibly different designs (a **bird** or a **ship** — shape-distinct, never color-only), and at lower tiers the corner shows a plain postmark instead. Nothing else on the card: no definitions, no hints about meaning, no model numbers.
- **The routing board (lower ~45%):** six **drop-point tiles** in a 3×2 grid — CLOCK TOWER, FOUNTAIN, NEWSSTAND, BOATHOUSE, GREENHOUSE, TRAM DEPOT — each a big line-art icon with a one-word label beneath (icon + label, ≥ 88 pt touch targets). Below the grid, one wide tray-shaped button: **ROUTINE MAIL**, with a rubber-stamp icon.
- **Interaction:** tap a tile or the tray to **arm** it (it lifts and glows); tap the brass **SEND** key to commit, or tap elsewhere to disarm. Two-step commit is deliberate slip-protection for impulsive tappers — the *arm* state is also a natural "I'm about to send it to the fountain — confirm?" talk beat. On commit: correct → the card whooshes into the pneumatic tube (or thunks into the tray) and the next card slides in; wrong → strike, and the card stays exactly as it was.

Reading load: exactly one sentence per screen, and it is the stimulus itself — figurative language cannot be pictured without giving away the answer. Sentences are capped at 18 words, rendered huge, dyslexia-font/large-text aware. All other Agent-side text is single words (tile labels) or icons.

## 3. What the Handler has

All of the following lives in `rules.ts` as typed rows carrying game semantics **and** both prose editions; the manual chapter and the solver are generated from the same objects.

### 3a. The drop points (all tiers)

`DROP_POINTS: readonly DropPointRule[]` — `{ id, label, icon, standard, simplified }`

| Drop point | How to spot the tile (standard) | (simplified) |
|---|---|---|
| CLOCK TOWER | A tall tower with a clock face at the top. | A tower with a clock. |
| FOUNTAIN | A bowl with water arcing up from the middle. | Water spraying up from a bowl. |
| NEWSSTAND | A little kiosk with newspapers stacked on the counter. | A stand that sells newspapers. |
| BOATHOUSE | A shed at the water's edge with a rowboat at the door. | A little house with a boat. |
| GREENHOUSE | A glass house with plants showing through the panes. | A glass house full of plants. |
| TRAM DEPOT | A tram car parked under a wide roof. | A tram under a roof. |

### 3b. The plain-mail rule (all tiers) — the rule that makes the module

`PLAIN_MAIL_RULE` (analog of Bad Intel's `BAD_INTEL_RULE`):

- **standard:** "Not every card is code. Run the CHECK question printed with the phrase. If the answer is YES — the sentence really is about the actual things the words name — the phrase is PLAIN, the card is ordinary mail, and there is no drop: the Agent taps the ROUTINE MAIL tray. If the answer is NO, the phrase is CODE: read its meaning aloud, then route the card to its drop point. Sending plain mail to a drop is a wrong answer — and so is stamping a coded card ROUTINE."
- **simplified:** "Some cards are just normal mail. Ask the CHECK question for the phrase. If the sentence is really about the real things — real beans, real ice — the card is PLAIN. Tap ROUTINE MAIL. If not, the phrase is CODE. Read what it means. Send the card to its drop point. Do not send plain mail to a drop. Do not stamp a code card ROUTINE."

### 3c. Rookie Phrasebook (Difficulty 1 — complete)

`IdiomEntry` rows: `{ kind: 'idiom', id, phrase, difficulty, gloss: {standard, simplified}, check: {standard, simplified}, drop, literalCues, figurativeCues, contexts }`. The manual prints Phrase / If it's code, it means… / Check question / Drop point; both editions below. (Idioms are public-domain phrases; every gloss, check, and context sentence is original prose.)

| Phrase | If it's code, it means… (standard / simplified) | Check question (standard / simplified) | Drop |
|---|---|---|---|
| piece of cake | something so easy it takes no effort / really easy | Ask: is there real cake anyone could eat in the sentence? / Ask: is there real cake? | CLOCK TOWER |
| in hot water | in trouble with someone / in trouble | Ask: is anything in the sentence actually wet or being heated? / Ask: is there real hot water? | GREENHOUSE |
| cold feet | too nervous to go through with a plan / too scared to do it | Ask: does the sentence say the person's feet are actually cold? / Ask: are their real feet cold? | BOATHOUSE |
| spill the beans | let a secret out / tell a secret | Ask: did real beans get dropped or spilled? / Ask: did real beans spill? | FOUNTAIN |
| break the ice | get strangers talking and comfortable / help new people start talking | Ask: is there real, frozen ice that broke? / Ask: did real ice break? | TRAM DEPOT |
| let the cat out of the bag | give away a secret by accident / tell a secret without meaning to | Ask: is there a real cat in the sentence? / Ask: is there a real cat? | NEWSSTAND |
| hit the road | leave and get going / leave now | Ask: did something actually bang against a road? / Ask: did a real thing hit a real road? | TRAM DEPOT |
| throw in the towel | give up on something hard / quit | Ask: did somebody really throw a towel somewhere? / Ask: did a real towel get thrown? | CLOCK TOWER |

**Rookie tier note** (`TIER_NOTES[1]`, warning): standard — "Every Rookie mailbag holds at least one coded card and at least one plain card. Never assume — run the check question on every sentence." simplified — "Some cards are code. Some are plain mail. Check every card."

**Working a card** (printed `steps`, standard edition):
1. Have the Agent read the whole card aloud, then say which words are underlined (on Mastermind, also which stamp is in the corner).
2. Find the underlined phrase in the Phrasebook and read its CHECK question exactly as printed.
3. Make the Agent answer from the sentence only. Ask: "Which words tell you that?" — don't accept a yes or no without proof.
4. Check comes back PLAIN? No drop. The Agent taps the ROUTINE MAIL tray.
5. Check comes back CODE? Read the meaning aloud, then the drop point. Describe the tile — don't just name it — and have the Agent say what they see on it before pressing SEND.

Simplified edition: 1. Ask the Agent to read the card out loud. Ask which words have a line under them. 2. Find that phrase in the book. Read the CHECK question. 3. Ask: "Which words tell you?" 4. Plain? Tap ROUTINE MAIL. 5. Code? Read what it means. Say the drop point. Say what the tile looks like. Then the Agent presses SEND.

Plus a tip callout (both editions), mirroring Bad Intel: "A wrong drop and a wrong ROUTINE both count as wrong answers, and the card stays where it is. Talking it through first costs nothing." / "Not sure? Ask again. Asking is free. A wrong tap counts against you."

### 3d. Agent tier (Difficulty 2 — sketch)

Structure: a fresh 10-row Phrasebook of **less transparent idioms**, same columns as Rookie, **plus the Word Ledger** — `WordEntry` rows `{ kind: 'word', id, word, difficulty, senses: [ {id, gloss:{standard,simplified}, drop, cues}, {…} ], contexts }`. Word cards are never plain mail: **both senses route**, so the Agent can never shortcut them. The manual prints: Word / Meaning A → drop / Meaning B → drop, and the scripted probe is generated as "Ask: in this sentence, is it *[gloss A]* or *[gloss B]*?"

Sample idiom rows:

| Phrase | If it's code… | Check question | Drop |
|---|---|---|---|
| left in the dark | kept from knowing what is going on | Ask: is the place actually dark, with no light? | NEWSSTAND |
| on thin ice | one mistake away from real trouble | Ask: is there real frozen ice under someone? | BOATHOUSE |
| up in the air | not decided yet | Ask: is anything actually floating or flying? | CLOCK TOWER |

Sample Word Ledger rows:

| Word | Meaning A → drop | Meaning B → drop |
|---|---|---|
| bank | the ground along the edge of a river → FOUNTAIN | the place where money is kept → CLOCK TOWER |
| wave | water rising and curling on a lake or sea → BOATHOUSE | a hand motion for hello or goodbye → TRAM DEPOT |
| bark | the sound a dog makes → NEWSSTAND | the rough outer skin of a tree → GREENHOUSE |

Tier note (`TIER_NOTES[2]`, tip): "Plain cards still ride in every mailbag. A phrase is only code when the sentence fails its check." / "A card can still be plain mail. Always ask the check."

### 3e. Mastermind tier (Difficulty 3 — sketch)

Structure: a 10-row Phrasebook of **opaque idioms**, where the Drop column splits in two — **Drop (bird stamp) / Drop (ship stamp)** — selected by the stamp printed on the card, which only the Agent can see and must describe. Word Ledger rows continue (1–2 word cards per bag), single-drop per sense. No tier note at all (`TIER_NOTES[3] = null`): remembering that plain mail exists, unprompted, is the Mastermind subtlety lever, exactly as Bad Intel drops its warning at tier 3.

Sample rows:

| Phrase | If it's code… | Check question | Drop (bird) | Drop (ship) |
|---|---|---|---|---|
| miss the boat | lose a chance by waiting too long | Ask: is there a real boat someone failed to get on? | BOATHOUSE | FOUNTAIN |
| clear the air | settle an argument so nobody stays upset | Ask: is real smoke, dust, or smell being cleared? | GREENHOUSE | CLOCK TOWER |
| on the back burner | set aside to deal with later | Ask: is there a real stove or pot in the sentence? | NEWSSTAND | TRAM DEPOT |

## 4. The conversation loop

One full Rookie solve (3 cards; this instance is the worked example from §9). *Annotations in brackets.* The module carries a STATIC badge this mission, so the Handler must answer the first description of the first card with a scripted neutral clarification request before acting.

> **AGENT:** Card one. There's a sentence and part of it is underlined.
> **HANDLER** *(Static Protocol, scripted line read from the manual's repair page):* Say again? Tell me a different way, with more detail.
> *[Repair drill: the lazy first description is rejected by script, not by the Handler's judgment. The rephrase must actually carry the stimulus.]*
> **AGENT:** Okay — it's a postcard. The sentence says: "Dad spilled the beans about the surprise trip, so now everyone knows where we're going." The underlined words are "spilled the beans."
> *[Rich first description: full read-aloud plus naming the target — this is what constraint 10 wants, and the sentence makes it unavoidable; there is no "it's a 7" shortcut.]*
> **HANDLER:** Found it — "spill the beans." Check question: did real beans get dropped or spilled in your sentence?
> *[The Handler contributes the probe they cannot answer; the Agent holds the context they cannot interpret without the probe.]*
> **AGENT:** No. No real beans anywhere.
> **HANDLER:** Which words tell you that?
> *[Scripted justification demand — the tally moment. The SLP marks a correct figurative judgment with evidence.]*
> **AGENT:** It says "surprise trip" and "now everyone knows" — so he told the secret. Nothing actually spilled.
> **HANDLER:** Then it's code. It means someone let a secret out. Drop point: the fountain — the tile with water arcing up out of a bowl.
> **AGENT:** I see one with water spraying up from a bowl, bottom left. Arming it… confirm fountain? Sending.
> *[Referential description of the tile runs the other direction — the Handler describes, the Agent confirms before commit.]*
> **AGENT:** Card two. "The bag ripped and spilled the beans, and we spent ten minutes sweeping them up." Underlined: "spilled the beans."
> **HANDLER:** Same phrase! Check: did real beans get dropped or spilled?
> **AGENT:** …Yes. Actually yes — they swept them up. Real beans on the floor.
> **HANDLER:** Then it's plain mail. No drop — tap the ROUTINE MAIL tray.
> *[The contrastive pair is the intervention: same phrase, opposite reading, and the pair must not pattern-match "underlined = figurative." Over-interpretation is punished exactly like literal-mindedness.]*
> **AGENT:** Card three. "Nobody talked at first, but Coach's terrible joke broke the ice and the new kids finally laughed." Underlined: "broke the ice."
> **HANDLER:** "Break the ice." Check: is there real, frozen ice that broke?
> **AGENT:** No — it's about people not talking, then laughing. The joke made them comfortable.
> **HANDLER:** Code. It means getting strangers talking and comfortable. Drop: the tram depot — a tram car parked under a wide roof.
> **AGENT:** Tram under a roof, top right. Sending… mailbag clear.

Every card forces a minimum of four target-bearing utterances (read-aloud, probe answer, quoted evidence, tile confirmation) — high exchange density with zero dead taps.

## 5. Difficulty tiers

| | Rookie (1) | Agent (2) | Mastermind (3) |
|---|---|---|---|
| Cards per bag | 3 | 4 | 5 |
| Idiom pool | 8 transparent, high-frequency idioms | 10 semi-transparent idioms | 10 opaque idioms |
| Word cards (polysemy) | — | exactly 1 | 1–2 |
| Drop mapping | phrase → one drop | phrase → one drop; word → drop per sense | idiom → drop **by stamp design** (bird/ship, Agent must describe); word → drop per sense |
| Manual reminder about plain mail | warning | tip | none — spotting plain mail unprompted is the subtlety lever |
| Minutes | ~4 | ~5 | ~6 |

What scales is semantic difficulty (idiom transparency, polysemy) and description load (the stamp column) — never speed, never clock.

## 6. Generation & solvability

**State shape** (everything the Agent sees; nothing more):

```ts
export interface MeaningCard {
  entryId: string;    // IdiomEntry or WordEntry id — names the Phrasebook row
  contextId: string;  // which authored context sentence is printed on the card
  stamp: 'bird' | 'ship' | null;  // non-null only at difficulty 3
}
export interface DoubleMeaningState { cards: MeaningCard[] }
export type MeaningMove = { kind: 'routine' } | { kind: 'drop'; drop: DropId };
export type DoubleMeaningAnswer = MeaningMove[];
```

Context rows live in `rules.ts`: `{ id, entryId, text, reading: 'plain' | 'code' }` for idioms, `{ id, entryId, text, sense: 'a' | 'b' }` for words — the sentence text and its authored reading are one row, exactly as Bad Intel's model id names a printed sequence. ≥3 contexts per reading/sense per entry in production.

**generate(seed, difficulty):** `mulberry32(seed)`; card count 3/4/5. Composition: D1 — 3 idiom entries sampled without replacement, coded count `1 + randInt(rng, 0, 1)` (so always ≥1 code AND ≥1 plain); D2 — 3 idioms (coded `randInt(1, 2)`) + 1 word entry; D3 — `w = randInt(1, 2)` word entries + `5 − w` idioms with coded `randInt(1, idioms − 1)` (≥1 code, ≥1 plain). Each card draws one context of its assigned reading/sense uniformly; word cards flip a fair sense coin; D3 assigns each card a stamp. Card order shuffled. Same seed + difficulty ⇒ identical bag, forever.

**solve(state)** uses only the exported tables: for each card, look up the entry; if word → context row's sense → that sense's `drop`; if idiom → context row's `reading`; `plain` → `{kind:'routine'}`; `code` → `{kind:'drop', drop: entry.drop}` (D3: `entry.dropByStamp[card.stamp]`). **validate** compares move-by-move against `solve` (same `sameMove` pattern as Bad Intel).

**Exactly one defensible answer.** Mechanically: the correct move is a total, deterministic function of `(entryId, contextId, stamp)` through table lookups — no search, no ties, one accepted array. Human-defensibly: the pair's decision procedure (read sentence → answer printed check question → follow the row) is isomorphic to the robot's lookup, and the isomorphism is *enforced by construction*: every context row must be answerable one way by its entry's check question. That authoring discipline is backed by a structural property test over the whole table — each entry carries disjoint `literalCues` / `figurativeCues` lexicons (e.g. spill-the-beans literal: floor, swept, jar, ripped; figurative: secret, surprise, knows, told), and the test asserts every context's text contains ≥1 cue from its own reading's lexicon and 0 from the opposite one, that the entry's phrase appears verbatim exactly once, and that texts stay ≤18 words. The robot cannot verify *truth* of the semantics — no test can — but it verifies the contract that makes the human call determinate; the residue is an authoring review task (§10). Property suite mirrors Bad Intel's: 1000 seeds × 3 tiers assert well-formedness, `validate(state, solve(state))`, rejection of mutated answers (routine↔drop flips, wrong tile, right-tile-wrong-stamp at D3, truncation), ≥1 code and ≥1 plain idiom card per bag, and coverage (across seeds every entry, every context row, both senses of every word, and both stamps of every D3 idiom occur).

## 7. Answer & validation model

The Agent answers one card at a time: arm a drop tile **or** the ROUTINE MAIL tray, then tap SEND to commit (arming/disarming is free). A committed move is correct iff it equals `solve(state)` at that card's index; correct advances to the next card, and the module solves when the last card commits correctly (`onSolved`). A wrong commit — plain mail sent to any drop, a coded card stamped ROUTINE, the right reading but the wrong tile, or (D3) the right idiom but the other stamp's column — is a strike (`onStrike`); the card stays exactly as it was, and 1–3 strikes (SLP-set) seal the module. Per-move detail flows through `onAttempt` for the tally.

## 8. Static Protocol & hints

**Static Protocol fit:** the first description of a card is inherently rich — a full sentence read-aloud plus the underlined phrase (plus the stamp at D3) — so the scripted neutral clarification requests ("Say again? Tell me a different way." / "Say again — I only need the part that's underlined." style, from the engine's printed repair script) have real material to operate on: the Agent can re-read more slowly, isolate the phrase, or paraphrase the rest of the sentence, and each rephrase is a scoreable repair. There is no single-token first description possible in this module.

**Hints (escalating, communication-coaching, verbatim):**
1. "Read the whole sentence to your Handler exactly as it's printed — then tell them which words are underlined."
2. "Ask your Handler for the check question, and answer it using only the sentence. Say the exact words on the card that prove your answer."
3. "Ask your Handler to read the code meaning out loud. Then say: 'In this sentence it means ___ because ___' — and your *because* has to come from the card."

## 9. Worked example

`generate(seed, 1)` emits (as replayed in §4):

```json
{ "moduleId": "double-meaning", "difficulty": 1, "seed": 7241,
  "state": { "cards": [
    { "entryId": "spill-the-beans", "contextId": "stb-code-1", "stamp": null },
    { "entryId": "spill-the-beans-…" }
] } }
```

Concretely, three cards (context rows shown with their table data):

| # | Card sentence (screen) | entryId | contextId | reading |
|---|---|---|---|---|
| 1 | "Dad **spilled the beans** about the surprise trip, so now everyone knows where we're going." | spill-the-beans | stb-code-1 | code |
| 2 | "The bag ripped and **spilled the beans**, and we spent ten minutes sweeping them up." | spill-the-beans | stb-plain-2 | plain |
| 3 | "Nobody talked at first, but Coach's terrible joke **broke the ice** and the new kids finally laughed." | break-the-ice | bti-code-1 | code |

*(Note: production generation samples entries without replacement, so cards 1–2 would use two different idioms; this hand-built bag repeats "spill the beans" deliberately to show the contrastive pair — the authored context pool makes both readings of every idiom available, and a "contrast bag" variant that intentionally re-deals one phrase both ways is a cheap, high-value generator flag worth shipping on by default at Rookie.)*

Solve, from the tables alone: **Card 1** — entry `spill-the-beans`; context `stb-code-1` has reading `code`; its cue check passes (contains "surprise", "knows"; no literal cues); Phrasebook row's drop = FOUNTAIN → `{kind:'drop', drop:'fountain'}`. **Card 2** — same entry; `stb-plain-2` reading `plain` (cues "ripped", "sweeping") → `PLAIN_MAIL_RULE` → `{kind:'routine'}`. **Card 3** — entry `break-the-ice`; `bti-code-1` reading `code` → row drop = TRAM DEPOT → `{kind:'drop', drop:'tram-depot'}`. `validate` accepts exactly `[drop fountain, routine, drop tram-depot]`; any deviation at any index is a strike. A judge can replay this against §3c line by line.

## 10. Risks & open questions

- **Semantic ambiguity is the real test surface.** The cue-lexicon property test enforces the *contract*, not the *truth* — a context could pass structurally yet still read ambiguously to a human ("hit the road" literal uses are the shakiest in the Rookie pool). Mitigation: every context row gets an SLP read-through against a two-question checklist (does the check question answer one way only? could a literal-minded reader defend the other answer?), and the ambiguity playtest should specifically probe the plain contexts, which are harder to author naturally than the figurative ones.
- **Agent-side reading load is the highest in the roster** — one full sentence per card, unavoidable because the sentence *is* the stimulus and the Handler must not see it. Mitigations: 18-word cap, huge type, dyslexia-font/large-text support, and honest guidance in the SLP notes that this module assumes sentence-level decoding; the mission builder's target filter already lets an SLP skip it for nonreaders.
- **Handler capture.** A strong Handler could make the literal/figurative call themselves the moment the sentence is read, reducing the Agent to a tapper. The printed steps script against it ("Make the Agent answer… don't accept a yes or no without proof"), but this is a facilitation risk the SLP must police; consider a debrief prompt naming it.
- **Static manual = memorizable drops.** Across many replays a sharp Agent may learn "spill the beans → fountain." The reading judgment still gates every card, D3's stamp split halves the value of memorization, and per-tier pools of 8–10 phrases slow it — but a second printed Phrasebook edition ("reprint B") is the clean long-term fix and is cheap under rules-as-data.
- **Plain-mail base rate.** If students learn "most cards are code," response bias creeps in. Generation keeps plain cards at 33–50% of idiom cards every bag; worth verifying the felt distribution in playtest.
- **contextId carries the reading label.** The reading lives in a table the manual doesn't print (printing sentence→reading would delete the therapy). This is the same shape as Bad Intel's `model` id naming a printed sequence, and the printed check questions are the human-side derivation path — but it's worth flagging to the ambiguity reviewers as the module's epistemic hinge.

## 11. Why this beats the obvious alternative

The obvious module is a quiz in a trench coat: the screen shows an idiom with four definitions, the Handler's manual holds the answer key, and the Agent taps what they're told — a one-way gap, near-zero exchange density, and the student never actually performs the target skill, because the Handler *reads* the answer instead of the Agent *deriving* it. Double Meaning splits the meaning problem itself: the Agent holds the only copy of the context, the Handler holds the only copy of the candidate meanings and the probe, and the literal/figurative judgment — the exact skill the research shortlist names — is the hinge every routing decision turns on, spoken aloud with quoted evidence where the SLP can hear and tally it. It also surfaces the deficit's *both* failure modes as distinct, loggable wrong answers (literal-minded ROUTINE on a coded card; over-figurative drop on plain mail), which no definition quiz can separate, and its contrastive same-phrase-both-ways cards are the intervention format the idiom literature actually supports rather than a trivia wrapper around it.
