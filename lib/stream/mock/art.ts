/**
 * Generated placeholder art for the mock: deterministic SVG and one HTML
 * canvas piece per seed. No real artwork is used anywhere in the mock.
 */

export type ArtStyle = "orbits" | "bands" | "grid" | "field" | "canvas";

const PALETTES: readonly (readonly string[])[] = [
  ["#0f172a", "#f97316", "#facc15", "#f8fafc", "#38bdf8"],
  ["#111111", "#e11d48", "#fda4af", "#fafaf9", "#a3a3a3"],
  ["#052e16", "#4ade80", "#bbf7d0", "#fef08a", "#15803d"],
  ["#1e1b4b", "#a78bfa", "#f0abfc", "#e0e7ff", "#6366f1"],
  ["#1c1917", "#d6d3d1", "#78716c", "#fbbf24", "#f5f5f4"],
  ["#082f49", "#22d3ee", "#e0f2fe", "#f43f5e", "#0ea5e9"],
];

/** mulberry32: a small deterministic PRNG. */
function random(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function pick<T>(items: readonly T[], next: () => number): T {
  const item = items[Math.floor(next() * items.length) % items.length];
  if (item === undefined) {
    throw new RangeError("empty list");
  }
  return item;
}

function round(value: number): string {
  return value.toFixed(1);
}

function orbits(next: () => number, colors: readonly string[]): string {
  const rings: string[] = [];
  const cx = 300 + next() * 400;
  const cy = 300 + next() * 400;
  for (let index = 0; index < 14; index += 1) {
    const radius = 40 + index * (30 + next() * 25);
    const dash = round(20 + next() * 220);
    rings.push(
      `<circle cx="${round(cx)}" cy="${round(cy)}" r="${round(radius)}" fill="none" stroke="${pick(colors.slice(1), next)}" stroke-width="${round(2 + next() * 18)}" stroke-dasharray="${dash} ${round(10 + next() * 60)}" opacity="${round(0.5 + next() * 0.5)}"/>`
    );
  }
  return rings.join("");
}

function bands(next: () => number, colors: readonly string[]): string {
  const paths: string[] = [];
  const count = 9 + Math.floor(next() * 6);
  for (let index = 0; index < count; index += 1) {
    const y = (1000 / count) * index;
    const amplitude = 20 + next() * 60;
    const wave = `M0 ${round(y)} C 330 ${round(y - amplitude)}, 660 ${round(y + amplitude)}, 1000 ${round(y)} L1000 1000 L0 1000 Z`;
    paths.push(
      `<path d="${wave}" fill="${pick(colors.slice(1), next)}" opacity="${round(0.35 + next() * 0.5)}"/>`
    );
  }
  return paths.join("");
}

function grid(next: () => number, colors: readonly string[]): string {
  const cells: string[] = [];
  const size = 125;
  for (let x = 0; x < 8; x += 1) {
    for (let y = 0; y < 8; y += 1) {
      const angle = Math.floor(next() * 4) * 45;
      const inset = 10 + next() * 30;
      cells.push(
        `<rect x="${round(x * size + inset)}" y="${round(y * size + inset)}" width="${round(size - inset * 2)}" height="${round(size - inset * 2)}" fill="${pick(colors.slice(1), next)}" transform="rotate(${angle} ${round(x * size + size / 2)} ${round(y * size + size / 2)})" opacity="${round(0.6 + next() * 0.4)}"/>`
      );
    }
  }
  return cells.join("");
}

function field(next: () => number, colors: readonly string[]): string {
  const marks: string[] = [];
  for (let index = 0; index < 220; index += 1) {
    const x = next() * 1000;
    const y = next() * 1000;
    const length = 20 + next() * 90;
    const angle = (Math.sin(x / 160) + Math.cos(y / 140)) * Math.PI;
    marks.push(
      `<line x1="${round(x)}" y1="${round(y)}" x2="${round(x + Math.cos(angle) * length)}" y2="${round(y + Math.sin(angle) * length)}" stroke="${pick(colors.slice(1), next)}" stroke-width="${round(1 + next() * 5)}" stroke-linecap="round"/>`
    );
  }
  return marks.join("");
}

const SVG_STYLES = { orbits, bands, grid, field } as const;

/** A 1000×1000 SVG for `seed`. The canvas style gets a still preview. */
export function generateSvg(seed: number, style: ArtStyle): string {
  const next = random(seed);
  const colors = pick(PALETTES, next);
  const draw = style === "canvas" ? field : SVG_STYLES[style];
  const background = colors[0] ?? "#000000";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="1000" height="1000"><rect width="1000" height="1000" fill="${background}"/>${draw(next, colors)}</svg>`;
}

/** An HTML page with a small seeded canvas animation, like a generative work. */
export function generateHtml(seed: number): string {
  const colors = pick(PALETTES, random(seed));
  // Only hex colours from PALETTES reach the page; escape `<` anyway so the
  // JSON can never close the script element.
  const safe = colors.filter((color) => /^#[0-9a-f]{3,8}$/i.test(color));
  const palette = JSON.stringify(safe).replace(/</g, "\\u003c");
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0;height:100%;background:${safe[0] ?? "#000"}}canvas{display:block;width:100%;height:100%}</style></head><body><canvas id="c"></canvas><script>(function(){var s=${Math.trunc(seed) >>> 0};function r(){s=(s+0x6d2b79f5)>>>0;var v=Math.imul(s^(s>>>15),s|1);v^=v+Math.imul(v^(v>>>7),v|61);return((v^(v>>>14))>>>0)/4294967296}var P=${palette};var c=document.getElementById("c"),x=c.getContext("2d");function z(){c.width=c.clientWidth;c.height=c.clientHeight}z();addEventListener("resize",z);var p=[];for(var i=0;i<160;i++)p.push({x:r(),y:r(),a:r()*6.28,k:P[1+Math.floor(r()*(P.length-1))]});function f(){x.fillStyle=P[0]+"22";x.fillRect(0,0,c.width,c.height);p.forEach(function(q){q.a+=Math.sin(q.x*9+q.y*7)*0.05;q.x=(q.x+Math.cos(q.a)*0.002+1)%1;q.y=(q.y+Math.sin(q.a)*0.002+1)%1;x.fillStyle=q.k;x.fillRect(q.x*c.width,q.y*c.height,3,3)});requestAnimationFrame(f)}if(!matchMedia("(prefers-reduced-motion: reduce)").matches){f()}else{f=function(){};p.forEach(function(q){x.fillStyle=q.k;x.fillRect(q.x*c.width,q.y*c.height,3,3)})}})();</script></body></html>`;
}

function base64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

export function svgDataUri(svg: string): string {
  return `data:image/svg+xml;base64,${base64(svg)}`;
}

export function htmlDataUri(html: string): string {
  return `data:text/html;base64,${base64(html)}`;
}
