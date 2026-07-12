import './game.css';

/**
 * The corner indicator: one lamp per module attempt. Amber while working,
 * flashes red on a wrong pick, stays red when the module fails, green when
 * passed. Pips below show wrong answers committed vs the module's limit.
 * Color never stands alone: the state is also written next to the lamp.
 */
export type LampState = 'active' | 'wrong' | 'failed' | 'solved';

const LAMP_COLOR: Record<LampState, string> = {
  active: 'var(--amber)',
  wrong: 'var(--danger)',
  failed: 'var(--danger)',
  solved: 'var(--success)',
};

const LAMP_TEXT: Record<LampState, string> = {
  active: 'LIVE',
  wrong: 'WRONG',
  failed: 'FAILED',
  solved: 'PASSED',
};

export function ModuleLamp({
  state,
  wrongs,
  limit,
}: {
  state: LampState;
  wrongs: number;
  limit: number;
}) {
  return (
    <div
      className={`module-lamp module-lamp-${state}`}
      role="status"
      aria-label={`Module status: ${LAMP_TEXT[state].toLowerCase()}. ${wrongs} of ${limit} wrong answers used.`}
    >
      <svg viewBox="0 0 26 26" width="26" height="26" aria-hidden="true">
        <circle cx="13" cy="13" r="10" fill={LAMP_COLOR[state]} className="module-lamp-jewel" />
        <circle cx="13" cy="13" r="10" fill="none" stroke="var(--line)" strokeWidth="2" />
        <circle cx="9.5" cy="9.5" r="2.6" fill="rgba(255,255,255,0.45)" />
      </svg>
      <span className="module-lamp-text" aria-hidden="true">{LAMP_TEXT[state]}</span>
      <span className="module-lamp-pips" aria-hidden="true">
        {Array.from({ length: limit }, (_, i) => (
          <svg key={i} viewBox="0 0 10 10" width="10" height="10">
            <circle cx="5" cy="5" r="4" fill={i < wrongs ? 'var(--danger)' : 'none'} stroke="var(--line)" strokeWidth="1.5" />
          </svg>
        ))}
      </span>
    </div>
  );
}
