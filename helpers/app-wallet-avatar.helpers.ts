const GRID_SIZE = 5;
const HALF_COLUMNS = Math.ceil(GRID_SIZE / 2);

/** FNV-1a: a small, stable string hash. */
function hashString(value: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index++) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** mulberry32: a deterministic sequence of numbers in [0, 1) from a seed. */
function createRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let next = Math.imul(state ^ (state >>> 15), 1 | state);
    next = (next + Math.imul(next ^ (next >>> 7), 61 | next)) ^ next;
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * A symmetric 5x5 pattern derived from the wallet address, rendered locally
 * as an SVG data URI. The same address always gives the same avatar.
 */
export function getAppWalletAvatarDataUri(address: string): string {
  const random = createRandom(hashString(address.trim().toLowerCase()));
  const hue = Math.floor(random() * 360);
  const foreground = `hsl(${hue}, 70%, 60%)`;
  const background = `hsl(${(hue + 150) % 360}, 35%, 16%)`;

  const cells: string[] = [];
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let column = 0; column < HALF_COLUMNS; column++) {
      if (random() < 0.5) {
        continue;
      }
      const mirrored = GRID_SIZE - 1 - column;
      const columns = mirrored === column ? [column] : [column, mirrored];
      for (const x of columns) {
        cells.push(`<rect x="${x}" y="${row}" width="1" height="1"/>`);
      }
    }
  }

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${GRID_SIZE} ${GRID_SIZE}" shape-rendering="crispEdges">` +
    `<rect width="${GRID_SIZE}" height="${GRID_SIZE}" fill="${background}"/>` +
    `<g fill="${foreground}">${cells.join("")}</g></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
