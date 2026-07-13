/**
 * Procedural patina: canvas-generated roughness/color maps so the case reads
 * field-used (per DESIGN_DIRECTION.md) with zero external assets. Deterministic
 * via a tiny seeded PRNG so the wear pattern is stable between sessions.
 */
import * as THREE from 'three';

function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeCanvas(size: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  return [canvas, ctx];
}

/**
 * Brushed + scuffed roughness map for the aluminum shell: fine horizontal
 * brushing, blotchy handling marks, and a few long directional scratches.
 */
export function aluminumRoughnessTexture(): THREE.CanvasTexture {
  const size = 512;
  const [canvas, ctx] = makeCanvas(size);
  const rand = rng(20260713);

  // base roughness (mid gray = the material's base value scales this)
  ctx.fillStyle = '#8f8f8f';
  ctx.fillRect(0, 0, size, size);

  // fine brushing lines
  for (let y = 0; y < size; y += 1) {
    const v = 128 + Math.floor((rand() - 0.5) * 26);
    ctx.fillStyle = `rgb(${v},${v},${v})`;
    if (rand() < 0.6) ctx.fillRect(0, y, size, 1);
  }

  // blotchy handling wear
  for (let i = 0; i < 40; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = 20 + rand() * 70;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    const light = rand() < 0.5;
    g.addColorStop(0, light ? 'rgba(210,210,210,0.10)' : 'rgba(90,90,90,0.10)');
    g.addColorStop(1, 'rgba(128,128,128,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }

  // long directional scratches (shinier = smoother = darker in roughness)
  ctx.strokeStyle = 'rgba(70,70,70,0.5)';
  for (let i = 0; i < 14; i++) {
    ctx.lineWidth = 0.6 + rand() * 1.2;
    ctx.beginPath();
    const x0 = rand() * size;
    const y0 = rand() * size;
    ctx.moveTo(x0, y0);
    ctx.lineTo(x0 + (rand() - 0.3) * 220, y0 + (rand() - 0.5) * 30);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

/**
 * Subtle color unevenness for the phenolic plates — faded patches where
 * hands have rubbed, slightly darker corners.
 */
export function phenolicColorTexture(): THREE.CanvasTexture {
  const size = 256;
  const [canvas, ctx] = makeCanvas(size);
  const rand = rng(1962);

  ctx.fillStyle = '#221d19';
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 24; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = 16 + rand() * 60;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, rand() < 0.6 ? 'rgba(58,50,43,0.28)' : 'rgba(18,15,12,0.28)');
    g.addColorStop(1, 'rgba(34,29,25,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }

  // vignette toward the corners (accumulated grime)
  const v = ctx.createRadialGradient(size / 2, size / 2, size * 0.35, size / 2, size / 2, size * 0.75);
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, 'rgba(0,0,0,0.22)');
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
