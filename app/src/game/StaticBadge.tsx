import './game.css';

/**
 * Marks a module that runs the Static Protocol (repair drills): the Handler
 * answers the Agent's first description(s) with escalating neutral
 * clarification requests before acting — the protocol page in the printed
 * manual has the script. The badge shows the stack depth as pips so depth is
 * never conveyed by text alone (and vice versa).
 */
export function StaticBadge({ depth }: { depth: number }) {
  if (depth <= 0) return null;
  return (
    <span
      className="static-badge"
      role="img"
      aria-label={`Static on this channel: the Handler runs the Static Protocol with ${depth} clarification ${depth === 1 ? 'request' : 'requests'}`}
    >
      <svg viewBox="0 0 20 14" width="18" height="13" aria-hidden="true">
        {/* interference bars */}
        <rect x="1" y="5" width="2.6" height="4" rx="1" />
        <rect x="5.4" y="2" width="2.6" height="10" rx="1" />
        <rect x="9.8" y="6.5" width="2.6" height="2.5" rx="1" />
        <rect x="14.2" y="3.5" width="2.6" height="7" rx="1" />
      </svg>
      STATIC
      <span className="static-badge-pips" aria-hidden="true">
        {Array.from({ length: depth }, (_, i) => (
          <span key={i} className="static-badge-pip" />
        ))}
      </span>
    </span>
  );
}
