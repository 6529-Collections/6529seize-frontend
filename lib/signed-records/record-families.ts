/**
 * Record streams are named `<family>/<owner>` in the event's signed `wave`
 * field. A drop's wave never contains `/`, so the two never collide.
 * @api
 */
export type RecordFamily =
  | "ps"
  | "pv"
  | "dr"
  | "dv"
  | "cv"
  | "bl"
  | "bk"
  | "md";

interface FamilyWave {
  readonly family: RecordFamily;
  readonly owner: string;
}

const FAMILIES: readonly RecordFamily[] = [
  "ps",
  "pv",
  "dr",
  "dv",
  "cv",
  "bl",
  "bk",
  "md",
];

const PRINCIPAL_FAMILIES: readonly RecordFamily[] = ["ps", "pv", "bk"];
const PRINCIPAL_ID_PATTERN = /^0x[0-9a-f]{64}$/;
const WALLET_PATTERN = /^0x[0-9a-f]{40}$/;
// dr, dv, cv, bl and md owners: 0x and 1 to 128 lowercase hex digits, as
// the relays take them.
const OWNER_PATTERN = /^0x[0-9a-f]{1,128}$/;

const isRecordFamily = (value: string): value is RecordFamily =>
  (FAMILIES as readonly string[]).includes(value);

/**
 * A principal for ps, pv and bk; for ps also a bare wallet bound to no
 * principal (subscriptions); a lane-defined id for the other families.
 */
function isValidOwner(family: RecordFamily, owner: string): boolean {
  if (!PRINCIPAL_FAMILIES.includes(family)) {
    return OWNER_PATTERN.test(owner);
  }
  return (
    PRINCIPAL_ID_PATTERN.test(owner) ||
    (family === "ps" && WALLET_PATTERN.test(owner))
  );
}

/**
 * Parses a record stream; null for a drop's wave or a malformed stream.
 * @api
 */
export function parseFamilyWave(wave: string): FamilyWave | null {
  const slash = wave.indexOf("/");
  if (slash < 0 || slash !== wave.lastIndexOf("/")) {
    return null;
  }
  const family = wave.slice(0, slash);
  const owner = wave.slice(slash + 1);
  if (!isRecordFamily(family)) {
    return null;
  }
  return isValidOwner(family, owner) ? { family, owner } : null;
}

/** @api */
export function familyWave(family: RecordFamily, owner: string): string {
  const wave = `${family}/${owner}`;
  if (!parseFamilyWave(wave)) {
    throw new Error(`Invalid ${family} owner: ${owner}`);
  }
  return wave;
}
