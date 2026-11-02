#!/usr/bin/env node
/**
 * Writes lib/explained/data/editionsSnapshot.json: The Memes as 6529.io's
 * public API reports them now, the copy the facts layer falls back to when
 * the API cannot be read during a render (lib/explained/feed.server.ts).
 * Each row is [id, season, edition_size, edition_size_floor, first mint];
 * the facts layer derives each card's minted count and edition from them
 * exactly as it does from a live read, and prints the snapshot's read time
 * wherever it prints the editions' source. Run it at ship time:
 *
 *   ./bin/6529 run explained:snapshot-editions
 */
import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const API = "https://api.6529.io";
const MEMES = "0x33FD426905F149f8376e227d0C9D3340AaD17aF1";
const PAGE = 100;
const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../.."
);
const OUT = path.join(ROOT, "lib/explained/data/editionsSnapshot.json");

async function pages(url) {
  const rows = [];
  for (let page = 1; page <= 20; page += 1) {
    const response = await fetch(`${url}&page_size=${PAGE}&page=${page}`, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
    const body = await response.json();
    rows.push(...(body.data ?? []));
    if (!body.next) break;
  }
  return rows;
}

const readAt = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
const [extended, nfts] = await Promise.all([
  pages(`${API}/api/memes_extended_data?`),
  pages(`${API}/api/nfts?contract=${MEMES}`),
]);
const mints = new Map(
  nfts
    .filter(
      (row) => typeof row.id === "number" && typeof row.mint_date === "string"
    )
    .map((row) => [
      row.id,
      new Date(row.mint_date).toISOString().replace(/\.\d{3}Z$/, "Z"),
    ])
);
const cards = [
  ...new Map(
    extended
      .filter(
        (row) =>
          typeof row.id === "number" &&
          typeof row.season === "number" &&
          typeof row.edition_size === "number"
      )
      .map((row) => [
        row.id,
        [
          row.id,
          row.season,
          row.edition_size,
          typeof row.edition_size_floor === "number"
            ? row.edition_size_floor
            : null,
          mints.get(row.id) ?? null,
        ],
      ])
  ).values(),
].sort((a, b) => a[0] - b[0]);
writeFileSync(
  OUT,
  `${JSON.stringify(
    {
      note: "The Memes as 6529.io's public API reported them at readAt: [id, season, edition_size, edition_size_floor, first mint (UTC)]. Written by scripts/explained/snapshot-editions.mjs; the facts layer uses it only when the API cannot be read, and says when it was read.",
      readAt,
      source: "6529.io API memes_extended_data",
      cards,
    },
    null,
    0
  ).replace(/\],\[/g, "],\n[")}\n`
);
console.log(
  `wrote ${cards.length} cards, read ${readAt}, to ${path.relative(ROOT, OUT)}`
);
