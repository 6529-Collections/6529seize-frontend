/**
 * Extension of contract section 6 for history moved out of an unencrypted
 * 6529.io DM (6529chain D146). An imported message is an ordinary `msg`
 * payload with one extra field, `imp`, so clients that predate it (unknown
 * fields are ignored) still show it as a message from the importer whose
 * text starts with a plain-language header. Clients that know `imp` show
 * the original author and time instead, labelled imported and unverified:
 * the importer's device signs the message, but nothing proves the original
 * author wrote it.
 *
 * Wire shape (short keys keep it inside the 64 KiB message bucket):
 *
 *   imp: { v: 1, src: "6529.io/dm",
 *          w: legacy wave id, d: legacy drop id, p: part index,
 *          n: legacy serial number, a: author profile id,
 *          ah: author handle or null, at: original time (ms),
 *          e: edit time (ms) or null, r: legacy drop id replied to or null,
 *          hl: length of the fallback header at the start of `text`,
 *          mx: media of the original that were not imported,
 *          rx: [[reaction, count], ...] at import time }
 *
 * Receivers keep the first message per (w, d, p) in sequence order and
 * ignore later copies, so two members importing the same history, or a
 * resumed import, never duplicate a message.
 */

export const IMPORT_SOURCE = "6529.io/dm";

export interface ImportedPayload {
  v: 1;
  src: typeof IMPORT_SOURCE;
  w: string;
  d: string;
  p: number;
  n: number;
  a: string;
  ah: string | null;
  at: number;
  e: number | null;
  r: string | null;
  hl: number;
  mx: number;
  rx: [string, number][];
}

const MAX_ID_CHARS = 100;
const MAX_HANDLE_CHARS = 64;
const MAX_REACTION_CHARS = 64;
const MAX_REACTIONS = 50;
const MAX_PARTS = 1000;

type Json = Record<string, unknown>;

const isRecord = (value: unknown): value is Json =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isCount = (value: unknown): value is number =>
  typeof value === "number" && Number.isSafeInteger(value) && value >= 0;

const isId = (value: unknown): value is string =>
  typeof value === "string" &&
  value.length > 0 &&
  value.length <= MAX_ID_CHARS &&
  !/\s/u.test(value);

const isOptional = <T>(
  value: unknown,
  check: (value: unknown) => value is T
): value is T | null => value === null || check(value);

const isHandle = (value: unknown): value is string =>
  typeof value === "string" &&
  value.length > 0 &&
  value.length <= MAX_HANDLE_CHARS;

function parseReactions(value: unknown): [string, number][] | null {
  if (value === undefined) {
    return [];
  }
  if (!Array.isArray(value) || value.length > MAX_REACTIONS) {
    return null;
  }
  const out: [string, number][] = [];
  for (const entry of value) {
    if (
      !Array.isArray(entry) ||
      entry.length !== 2 ||
      typeof entry[0] !== "string" ||
      entry[0].length === 0 ||
      [...entry[0]].length > MAX_REACTION_CHARS ||
      !isCount(entry[1])
    ) {
      return null;
    }
    out.push([entry[0], entry[1]]);
  }
  return out;
}

function hasValidIdentity(value: Json): boolean {
  return (
    value["v"] === 1 &&
    value["src"] === IMPORT_SOURCE &&
    isId(value["w"]) &&
    isId(value["d"]) &&
    isCount(value["p"]) &&
    value["p"] < MAX_PARTS &&
    isCount(value["n"]) &&
    isId(value["a"]) &&
    isOptional(value["ah"], isHandle) &&
    isCount(value["at"])
  );
}

function hasValidDetails(value: Json, text: string): boolean {
  return (
    isOptional(value["e"], isCount) &&
    isOptional(value["r"], isId) &&
    isCount(value["hl"]) &&
    value["hl"] <= text.length &&
    isCount(value["mx"])
  );
}

/** Validates `imp` against the message text; null when malformed. */
export function parseImported(
  value: unknown,
  text: string
): ImportedPayload | null {
  if (
    !isRecord(value) ||
    !hasValidIdentity(value) ||
    !hasValidDetails(value, text)
  ) {
    return null;
  }
  const rx = parseReactions(value["rx"]);
  if (rx === null) {
    return null;
  }
  return {
    v: 1,
    src: IMPORT_SOURCE,
    w: value["w"] as string,
    d: value["d"] as string,
    p: value["p"] as number,
    n: value["n"] as number,
    a: value["a"] as string,
    ah: (value["ah"] as string | null) ?? null,
    at: value["at"] as number,
    e: (value["e"] as number | null) ?? null,
    r: (value["r"] as string | null) ?? null,
    hl: value["hl"] as number,
    mx: value["mx"] as number,
    rx,
  };
}

/**
 * The plain header older clients show before the original text. It is
 * protocol text, not UI copy: English, UTC, no locale formatting.
 */
export function importedHeader(input: {
  readonly authorHandle: string | null;
  readonly createdAt: number;
}): string {
  const who = input.authorHandle ? `@${input.authorHandle}` : "unknown";
  const when = new Date(input.createdAt)
    .toISOString()
    .slice(0, 16)
    .replace("T", " ");
  return `[Imported from unencrypted DM, not verified] ${who}, ${when} UTC:\n`;
}
