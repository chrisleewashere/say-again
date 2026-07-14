import { mulberry32, pick } from '../../engine/rng';
import type { Difficulty, PuzzleInstance } from '../../engine/types';
import {
  FIELD_BY_ID,
  FIELD_RULES,
  FORM_BY_ID,
  FORMS_BY_DIFFICULTY,
  type Facts,
  type FieldId,
  type FormId,
  type VerdictId,
} from './rules';

/**
 * Everything the Agent sees: the interview form letter stamped on the
 * statement plus the five observed facts. The verdict is derivable only by
 * walking the printed question flow for that form — which is exactly what
 * the Handler does out loud.
 */
export interface AssetInterviewState {
  formId: FormId;
  facts: Facts;
}

/** Answer = the verdict id the flow's leaf dictates. */
export type AssetInterviewAnswer = VerdictId;

export function generateAssetInterview(
  seed: number,
  difficulty: Difficulty,
): PuzzleInstance<AssetInterviewState> {
  const rng = mulberry32(seed);
  const form = pick(rng, FORMS_BY_DIFFICULTY[difficulty]);
  const facts = Object.fromEntries(
    FIELD_RULES.map((field) => [field.id, pick(rng, field.values).id]),
  ) as Facts;

  return {
    moduleId: 'asset-interview',
    difficulty,
    seed,
    state: { formId: form.id, facts },
  };
}

/**
 * Robot Handler: walk the form's question flow (the same FORMS table the
 * manual prints as numbered steps), answering each question from the facts,
 * until a verdict leaf is reached. Flows are forward-only, so the walk
 * always terminates.
 */
export function solveAssetInterview(state: AssetInterviewState): AssetInterviewAnswer {
  const form = FORM_BY_ID[state.formId];
  let index = 0;
  for (let hops = 0; hops < form.nodes.length; hops++) {
    const node = form.nodes[index];
    const value = state.facts[node.ask];
    const branch = node.branches.find((b) => b.values.includes(value));
    if (!branch) {
      throw new Error(`Form ${state.formId} step ${index + 1} has no branch for ${node.ask}=${value}`);
    }
    if (branch.verdict !== undefined) return branch.verdict;
    index = branch.goTo!;
  }
  throw new Error(`Form ${state.formId} never reached a verdict`);
}

export function validateAssetInterview(
  state: AssetInterviewState,
  answer: AssetInterviewAnswer,
): boolean {
  return answer === solveAssetInterview(state);
}

/* ------------------------------------------------------------------ */
/* Shared description text — used for aria-labels (2D), face region    */
/* labels (3D), and consistent with the manual's fact language.        */
/* ------------------------------------------------------------------ */

/** e.g. "Time of day: night" — exactly what the Agent reads off a row. */
export function describeFact(fieldId: FieldId, facts: Facts): string {
  const field = FIELD_BY_ID[fieldId];
  const value = field.values.find((v) => v.id === facts[fieldId]);
  if (!value) throw new Error(`Unknown ${fieldId} value: ${facts[fieldId]}`);
  return `${field.label}: ${value.label}`;
}

/** Full spoken readout of the statement card. */
export function statementReadout(state: AssetInterviewState): string {
  const rows = FIELD_RULES.map((field) => describeFact(field.id, state.facts)).join('. ');
  return `Interview form ${state.formId}. ${rows}.`;
}
