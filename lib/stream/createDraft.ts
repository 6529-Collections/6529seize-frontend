/**
 * The create form's draft and its checks, kept free of React so they can be
 * tested on their own.
 */

export interface Draft {
  readonly media: { bytes: Uint8Array; mimeType: string } | null;
  readonly title: string;
  readonly description: string;
  readonly artistName: string;
  readonly royalty: string;
  readonly editions: boolean;
  readonly cap: string;
}

/** The largest edition cap the contracts take (uint32). */
const MAX_CAP = 4_294_967_295;

/** The edition cap typed: empty is 0 (no cap); otherwise a whole number from 1 below the uint32 limit. */
export function parseCap(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === "") return 0;
  if (!/^\d+$/.test(trimmed)) return null;
  const number = Number(trimmed);
  return number > 0 && number < MAX_CAP ? number : null;
}

/** Royalty on resales typed in percent (0 to 25), as a rate out of 100,000. */
export function parseRoyalty(value: string): number | null {
  const trimmed = value.trim().replace(",", ".");
  // Digits and at most one decimal point; Number() alone would also take "1e1" or "0x5".
  const [whole = "", fraction = "", ...rest] = trimmed.split(".");
  const digits = (part: string) => [...part].every((character) => character >= "0" && character <= "9");
  if (rest.length > 0 || whole === "" || !digits(whole) || !digits(fraction)) return null;
  if (trimmed.includes(".") && fraction === "") return null;
  const number = Number(trimmed);
  if (number < 0 || number > 25) return null;
  return Math.round(number * 1000);
}

/** Whether the form can go to review: art, a title, a valid cap, and (Independent) a valid royalty. */
export function draftReady(draft: Draft, curated: boolean): boolean {
  const capValid = !draft.editions || parseCap(draft.cap) !== null;
  const base = !!draft.media && draft.title.trim().length > 0 && capValid;
  return curated ? base : base && parseRoyalty(draft.royalty) !== null;
}
