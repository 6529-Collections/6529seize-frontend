import type { Browser, Device } from "./wire";

/**
 * Countries where no `fp` is sent (C52a safeguard): the EU and EEA, including
 * EU outermost regions with their own codes, and the UK with Gibraltar and the
 * Crown Dependencies. An unknown country also sends none.
 */
const NO_FP_COUNTRIES = new Set(
  (
    "AT BE BG HR CY CZ DK EE FI FR DE GR HU IE IT LV LT LU MT NL PL PT RO SK SI ES SE " +
    "IS LI NO GB UK GI JE GG IM AX GF GP MQ RE YT MF"
  ).split(" ")
);

export const isFingerprintAllowed = (country: string | null | undefined) => {
  const code = (country ?? "").trim().toUpperCase();
  return /^[A-Z]{2}$/.test(code) && !NO_FP_COUNTRIES.has(code);
};

export type FingerprintTraits = {
  readonly timeZone: string;
  readonly language: string;
  readonly screenWidth: number;
  readonly screenHeight: number;
  readonly device: Device;
  readonly browser: Browser;
  readonly browserMajor: string;
};

const bucket = (px: number) =>
  Number.isFinite(px) ? Math.round(px / 100) * 100 : 0;

// cyrb53: a small non-cryptographic 53-bit string hash.
const hash53 = (input: string): string => {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 =
    Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^
    Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 =
    Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^
    Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0))
    .toString(36)
    .padStart(11, "0");
};

/**
 * A short hash of coarse traits plus the UTC day, so the value itself changes
 * every day. Raw trait values never leave this function. The server mixes it
 * into its daily-salted uniques hash and discards it (R14 §3.3, C52a).
 */
export function computeFingerprint(
  traits: FingerprintTraits,
  now: Date = new Date()
): string {
  const day = now.toISOString().slice(0, 10);
  const primaryLanguage = traits.language.split(",")[0]!.trim().toLowerCase();
  return hash53(
    [
      day,
      traits.timeZone,
      primaryLanguage,
      bucket(traits.screenWidth),
      bucket(traits.screenHeight),
      traits.device,
      traits.browser,
      traits.browserMajor,
    ].join("|")
  );
}
