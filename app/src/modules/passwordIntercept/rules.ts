/**
 * Password Intercept — rule tables.
 *
 * SINGLE SOURCE OF TRUTH: the engine's solver AND the printed manual are both
 * generated from the data in this file. Never hand-edit manual prose for this
 * module; edit these tables.
 *
 * Original game content, authored for this project. Every card pairs a clue
 * word with a relation (synonym / opposite / means-definition) and an answer
 * key of accepted words. Distractor pools are verified non-matches by tests.
 */

export const RELATIONS = ['synonym', 'opposite', 'means'] as const;
export type Relation = (typeof RELATIONS)[number];

/**
 * Print symbols paired with the relation words in the manual table, so the
 * relation is never carried by a single channel (word + symbol).
 */
export const RELATION_SYMBOLS: Record<Relation, string> = {
  synonym: '=',
  opposite: '≠',
  means: '▸',
};

export interface InterceptCard {
  /** Printed card number the Agent's screen shows and the Handler looks up. */
  id: number;
  /** Clue word (synonym/opposite) or definition phrase (means). */
  clue: string;
  relation: Relation;
  /** Primary accepted word first, then accepted alternates. */
  correctAnswers: readonly string[];
  /**
   * Verified non-matches for this card. Tier-3 pools lean on near-misses:
   * same first letter, wrong-direction traps (synonyms of the clue on an
   * OPPOSITE card), and related-but-wrong meanings.
   */
  distractors: readonly string[];
  /** 1 = concrete high-frequency, 2 = everyday academic, 3 = tier-2 vocabulary. */
  tier: 1 | 2 | 3;
}

/**
 * The full intercept card table, keyed by printed card number. The Handler's
 * manual reproduces exactly this table (number, relation, clue); the answer
 * key and distractor pools never appear in print or on the Agent's screen.
 */
export const CARDS: readonly InterceptCard[] = [
  /* ---------------- Tier 1: concrete, high-frequency ---------------- */
  { id: 1, clue: 'fast', relation: 'synonym', tier: 1,
    correctAnswers: ['quick', 'speedy'],
    distractors: ['slow', 'loud', 'tall', 'wet', 'round', 'heavy'] },
  { id: 2, clue: 'happy', relation: 'synonym', tier: 1,
    correctAnswers: ['glad', 'cheerful'],
    distractors: ['sad', 'angry', 'tired', 'hungry', 'cold', 'busy'] },
  { id: 3, clue: 'big', relation: 'synonym', tier: 1,
    correctAnswers: ['large', 'huge'],
    distractors: ['tiny', 'thin', 'low', 'short', 'narrow', 'light'] },
  { id: 4, clue: 'cold', relation: 'opposite', tier: 1,
    correctAnswers: ['hot', 'warm'],
    distractors: ['icy', 'chilly', 'frozen', 'cool', 'wet', 'windy'] },
  { id: 5, clue: 'day', relation: 'opposite', tier: 1,
    correctAnswers: ['night'],
    distractors: ['morning', 'noon', 'sun', 'week', 'hour', 'sky'] },
  { id: 6, clue: 'open', relation: 'opposite', tier: 1,
    correctAnswers: ['closed', 'shut'],
    distractors: ['wide', 'tall', 'loud', 'soft', 'new', 'round'] },
  { id: 7, clue: 'begin', relation: 'synonym', tier: 1,
    correctAnswers: ['start'],
    distractors: ['stop', 'end', 'wait', 'rest', 'finish', 'pause'] },
  { id: 8, clue: 'a place where you borrow books', relation: 'means', tier: 1,
    correctAnswers: ['library'],
    distractors: ['kitchen', 'museum', 'garage', 'bakery', 'office', 'stadium'] },
  { id: 9, clue: 'frozen water', relation: 'means', tier: 1,
    correctAnswers: ['ice'],
    distractors: ['steam', 'rain', 'mud', 'fog', 'wind', 'dust'] },
  { id: 10, clue: 'the meal you eat in the morning', relation: 'means', tier: 1,
    correctAnswers: ['breakfast'],
    distractors: ['dinner', 'lunch', 'supper', 'snack', 'dessert', 'picnic'] },
  { id: 11, clue: 'loud', relation: 'opposite', tier: 1,
    correctAnswers: ['quiet', 'silent', 'soft'],
    distractors: ['noisy', 'deep', 'sharp', 'high', 'clear', 'rough'] },
  { id: 12, clue: 'small', relation: 'synonym', tier: 1,
    correctAnswers: ['little', 'tiny'],
    distractors: ['huge', 'giant', 'wide', 'tall', 'deep', 'long'] },
  { id: 13, clue: 'shout', relation: 'synonym', tier: 1,
    correctAnswers: ['yell', 'scream'],
    distractors: ['whisper', 'mumble', 'hum', 'sigh', 'laugh', 'sing'] },
  { id: 14, clue: 'empty', relation: 'opposite', tier: 1,
    correctAnswers: ['full'],
    distractors: ['hollow', 'bare', 'blank', 'clean', 'light', 'open'] },

  /* ---------------- Tier 2: everyday academic ---------------- */
  { id: 15, clue: 'ancient', relation: 'opposite', tier: 2,
    correctAnswers: ['modern', 'new', 'recent'],
    distractors: ['old', 'aged', 'antique', 'historic', 'ruined', 'dusty'] },
  { id: 16, clue: 'brave', relation: 'synonym', tier: 2,
    correctAnswers: ['courageous', 'fearless', 'bold'],
    distractors: ['afraid', 'timid', 'strong', 'proud', 'calm', 'honest'] },
  { id: 17, clue: 'rare', relation: 'opposite', tier: 2,
    correctAnswers: ['common', 'ordinary'],
    distractors: ['scarce', 'unusual', 'precious', 'strange', 'valuable', 'hidden'] },
  { id: 18, clue: 'a person who fixes teeth', relation: 'means', tier: 2,
    correctAnswers: ['dentist'],
    distractors: ['doctor', 'surgeon', 'barber', 'vet', 'nurse', 'chemist'] },
  { id: 19, clue: 'error', relation: 'synonym', tier: 2,
    correctAnswers: ['mistake', 'blunder'],
    distractors: ['answer', 'excuse', 'problem', 'trick', 'lesson', 'warning'] },
  { id: 20, clue: 'expand', relation: 'opposite', tier: 2,
    correctAnswers: ['shrink', 'contract'],
    distractors: ['explode', 'extend', 'enlarge', 'stretch', 'explore', 'expend'] },
  { id: 21, clue: 'to say you are sorry', relation: 'means', tier: 2,
    correctAnswers: ['apologize'],
    distractors: ['argue', 'agree', 'admit', 'apply', 'appear', 'announce'] },
  { id: 22, clue: 'fragile', relation: 'synonym', tier: 2,
    correctAnswers: ['delicate', 'breakable'],
    distractors: ['sturdy', 'flexible', 'frantic', 'frozen', 'solid', 'smooth'] },
  { id: 23, clue: 'vacant', relation: 'synonym', tier: 2,
    correctAnswers: ['empty', 'unoccupied'],
    distractors: ['crowded', 'vast', 'valuable', 'vivid', 'busy', 'velvet'] },
  { id: 24, clue: 'ally', relation: 'opposite', tier: 2,
    correctAnswers: ['enemy', 'foe', 'rival', 'opponent'],
    distractors: ['friend', 'partner', 'stranger', 'leader', 'neighbor', 'helper'] },
  { id: 25, clue: 'a drawing of a place that shows streets and borders', relation: 'means', tier: 2,
    correctAnswers: ['map'],
    distractors: ['globe', 'photo', 'poster', 'graph', 'mural', 'sketch'] },
  { id: 26, clue: 'seldom', relation: 'synonym', tier: 2,
    correctAnswers: ['rarely'],
    distractors: ['often', 'always', 'sometimes', 'never', 'usually', 'soon'] },
  { id: 27, clue: 'genuine', relation: 'opposite', tier: 2,
    correctAnswers: ['fake', 'false', 'phony'],
    distractors: ['real', 'honest', 'gentle', 'generous', 'plain', 'rare'] },

  /* ---------------- Tier 3: tier-2 vocabulary, near-miss distractors -------- */
  { id: 28, clue: 'reluctant', relation: 'synonym', tier: 3,
    correctAnswers: ['hesitant', 'unwilling'],
    distractors: ['eager', 'reliable', 'relaxed', 'resentful', 'careless', 'rejected'] },
  { id: 29, clue: 'abundant', relation: 'opposite', tier: 3,
    correctAnswers: ['scarce', 'sparse'],
    distractors: ['plentiful', 'ancient', 'ample', 'abandoned', 'average', 'shallow'] },
  { id: 30, clue: 'candid', relation: 'synonym', tier: 3,
    correctAnswers: ['frank', 'honest', 'truthful'],
    distractors: ['cautious', 'clever', 'secretive', 'polite', 'curious', 'calm'] },
  { id: 31, clue: 'to make something less severe or easier to bear', relation: 'means', tier: 3,
    correctAnswers: ['alleviate', 'ease'],
    distractors: ['aggravate', 'allocate', 'alternate', 'elevate', 'accelerate', 'abbreviate'] },
  { id: 32, clue: 'diligent', relation: 'synonym', tier: 3,
    correctAnswers: ['hardworking', 'industrious'],
    distractors: ['lazy', 'delicate', 'distant', 'dominant', 'careless', 'brilliant'] },
  { id: 33, clue: 'novice', relation: 'opposite', tier: 3,
    correctAnswers: ['expert', 'veteran', 'master'],
    distractors: ['beginner', 'novelist', 'notice', 'learner', 'amateur', 'student'] },
  { id: 34, clue: 'obsolete', relation: 'synonym', tier: 3,
    correctAnswers: ['outdated', 'antiquated'],
    distractors: ['obstinate', 'observant', 'modern', 'obscure', 'ordinary', 'current'] },
  { id: 35, clue: 'prosper', relation: 'synonym', tier: 3,
    correctAnswers: ['thrive', 'flourish'],
    distractors: ['propose', 'protest', 'struggle', 'ponder', 'decline', 'provide'] },
  { id: 36, clue: 'timid', relation: 'opposite', tier: 3,
    correctAnswers: ['bold', 'confident', 'daring'],
    distractors: ['shy', 'tiny', 'tired', 'bashful', 'nervous', 'quiet'] },
  { id: 37, clue: 'lasting for only a short time', relation: 'means', tier: 3,
    correctAnswers: ['temporary', 'brief', 'fleeting'],
    distractors: ['permanent', 'tedious', 'tender', 'timely', 'lengthy', 'eternal'] },
  { id: 38, clue: 'transparent', relation: 'opposite', tier: 3,
    correctAnswers: ['opaque'],
    distractors: ['translucent', 'transient', 'clear', 'glassy', 'trivial', 'visible'] },
  { id: 39, clue: 'meticulous', relation: 'synonym', tier: 3,
    correctAnswers: ['careful', 'precise', 'thorough'],
    distractors: ['messy', 'metallic', 'merciful', 'hasty', 'moderate', 'mysterious'] },
  { id: 40, clue: 'hostile', relation: 'opposite', tier: 3,
    correctAnswers: ['friendly', 'welcoming'],
    distractors: ['angry', 'harsh', 'honest', 'humble', 'fierce', 'distant'] },
];

const CARD_BY_ID = new Map(CARDS.map((c) => [c.id, c]));

export function getCard(id: number): InterceptCard {
  const card = CARD_BY_ID.get(id);
  if (!card) throw new Error(`Unknown intercept card ${id}`);
  return card;
}

/** Rounds per difficulty (1 = Rookie, 2 = Agent, 3 = Mastermind). */
export const ROUNDS_PER_DIFFICULTY: Record<1 | 2 | 3, number> = { 1: 2, 2: 3, 3: 4 };

/** Every round shows exactly one accepted word plus these many distractors. */
export const DISTRACTORS_PER_ROUND = 4;
export const CANDIDATES_PER_ROUND = DISTRACTORS_PER_ROUND + 1;

/** Manual card tables are split into chunks of this many rows for readability. */
export const MANUAL_TABLE_CHUNK = 10;
