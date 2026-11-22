/**
 * Record streams are named `<family>/<owner>` in the event's signed `wave`
 * field. A drop's wave never contains `/`, so the two never collide.
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
const OWNER_PATTERN = /^[0-9A-Za-z._:-]{1,128}$/;

const isRecordFamily = (value: string): value is RecordFamily =>
  (FAMILIES as readonly string[]).includes(value);

/** Parses a record stream; null for a drop's wave or a malformed stream. */
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
  const valid = PRINCIPAL_FAMILIES.includes(family)
    ? PRINCIPAL_ID_PATTERN.test(owner)
    : OWNER_PATTERN.test(owner);
  return valid ? { family, owner } : null;
}

export function familyWave(family: RecordFamily, owner: string): string {
  const wave = `${family}/${owner}`;
  if (!parseFamilyWave(wave)) {
    throw new Error(`Invalid ${family} owner: ${owner}`);
  }
  return wave;
}
