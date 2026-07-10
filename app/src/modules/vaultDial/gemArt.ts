/**
 * Shared SVG geometry for gems. Used by BOTH the on-screen component and the
 * printed manual figure, so the shapes the Agent describes always match the
 * glossary the Handler reads.
 */
import type { GemShape } from './rules';

const f = (n: number): number => Number(n.toFixed(2));

/** SVG path for a gem shape centered at (cx, cy) with radius r. The 'ring' path needs fill-rule/clip-rule "evenodd". */
export function gemShapePath(shape: GemShape, cx: number, cy: number, r: number): string {
  switch (shape) {
    case 'teardrop': {
      const br = f(r * 0.62); // bulb radius
      const by = f(cy + r * 0.3); // bulb center y
      return [
        `M ${cx} ${f(cy - r)}`,
        `C ${f(cx + r * 0.28)} ${f(cy - r * 0.52)} ${f(cx + br)} ${f(cy - r * 0.12)} ${f(cx + br)} ${by}`,
        `A ${br} ${br} 0 1 1 ${f(cx - br)} ${by}`,
        `C ${f(cx - br)} ${f(cy - r * 0.12)} ${f(cx - r * 0.28)} ${f(cy - r * 0.52)} ${cx} ${f(cy - r)}`,
        'Z',
      ].join(' ');
    }
    case 'star': {
      const pts: string[] = [];
      for (let i = 0; i < 10; i++) {
        const rad = i % 2 === 0 ? r : r * 0.45;
        const ang = -Math.PI / 2 + (i * Math.PI) / 5;
        pts.push(`${f(cx + rad * Math.cos(ang))} ${f(cy + rad * Math.sin(ang))}`);
      }
      return `M ${pts.join(' L ')} Z`;
    }
    case 'hexagon': {
      const pts: string[] = [];
      for (let i = 0; i < 6; i++) {
        const ang = -Math.PI / 2 + (i * Math.PI) / 3;
        pts.push(`${f(cx + r * Math.cos(ang))} ${f(cy + r * Math.sin(ang))}`);
      }
      return `M ${pts.join(' L ')} Z`;
    }
    case 'ring': {
      const ir = f(r * 0.45);
      return (
        `M ${f(cx - r)} ${cy} a ${r} ${r} 0 1 0 ${f(2 * r)} 0 a ${r} ${r} 0 1 0 ${f(-2 * r)} 0 Z ` +
        `M ${f(cx - ir)} ${cy} a ${ir} ${ir} 0 1 0 ${f(2 * ir)} 0 a ${ir} ${ir} 0 1 0 ${f(-2 * ir)} 0 Z`
      );
    }
    case 'wedge':
      return `M ${f(cx - r * 0.92)} ${f(cy - r * 0.72)} L ${f(cx + r * 0.92)} ${f(cy - r * 0.72)} L ${cx} ${f(cy + r)} Z`;
  }
}

/** Band marking: horizontal bar across the gem's middle (clip it to the shape path). */
export function bandRect(cx: number, cy: number, r: number): { x: number; y: number; width: number; height: number } {
  return { x: f(cx - r), y: f(cy - r * 0.16), width: f(2 * r), height: f(r * 0.32) };
}

/** Core-dot marking: filled dot at the gem's center. */
export function coreDotRadius(r: number): number {
  return f(r * 0.2);
}
