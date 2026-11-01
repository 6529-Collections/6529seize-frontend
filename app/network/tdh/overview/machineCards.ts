import type { FactBook } from "@/lib/explained/facts";
import { MEME_ART } from "./art";
import type { MachineCard } from "./Machine";

/**
 * The machine's cards (TDH-DESIGN.md §5.1): three with art, then the newest
 * card while it is still minting, counted at its claim floor. The facts
 * layer knows a card's floor only from its recorded claim limit; when it
 * cannot say what the newest card counts as (a card below the threshold
 * whose edition equals its minted count), or the newest card has finished
 * minting, the fourth card is the design's #562, with its art.
 */
const FLOOR_CARD = MEME_ART[562];

function newestStillMinting(book: FactBook): number | null {
  const list = book.maybe<number[][]>("memes.editions")?.value ?? [];
  const threshold = book.maybe<number>("rules.editionThreshold")?.value;
  const newest = list.reduce<number[] | null>(
    (best, row) => ((row[0] ?? 0) > (best?.[0] ?? 0) ? row : best),
    null
  );
  if (newest === null || threshold === undefined) return null;
  const [id = 0, , minted = 0, edition = 0] = newest;
  return minted < threshold && edition > minted ? id : null;
}

export function machineCards(book: FactBook): MachineCard[] {
  const art = [MEME_ART[2], MEME_ART[4], MEME_ART[3]];
  const cards: MachineCard[] = art.map((entry) => ({
    id: entry.id,
    title: entry.title,
    art: entry.src,
    original: entry.original,
  }));
  const minting = newestStillMinting(book);
  return [
    ...cards,
    minting === null
      ? {
          id: FLOOR_CARD.id,
          title: FLOOR_CARD.title,
          art: FLOOR_CARD.src,
          original: FLOOR_CARD.original,
        }
      : // The newest card's scaled art is often not made yet, and a
        // missing image is a console error, so it draws its frame.
        { id: minting, title: null, art: null },
  ];
}
