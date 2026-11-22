import { formatDecimalString } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";

/** $fake6529 has 18 decimals; amounts show at most 6. */
const DECIMALS = 18;
const SHOWN = 6;
const UNIT = 10n ** BigInt(DECIMALS);
const STEP = 10n ** BigInt(DECIMALS - SHOWN);

/**
 * An amount in base units as a localized decimal. `roundUp` for limits such
 * as a fee's "at most", so the shown amount is never below the real one.
 */
export function formatFake6529(
  locale: SupportedLocale,
  amount: bigint,
  roundUp = false
): string {
  const rounded =
    roundUp && amount % STEP !== 0n
      ? (amount / STEP + 1n) * STEP
      : (amount / STEP) * STEP;
  const whole = rounded / UNIT;
  const fraction = (rounded % UNIT)
    .toString()
    .padStart(DECIMALS, "0")
    .slice(0, SHOWN)
    .replace(/0+$/, "");
  return formatDecimalString(
    locale,
    fraction ? `${whole.toString()}.${fraction}` : whole.toString()
  );
}

/** A typed decimal amount in base units, or null when it isn't one. */
const DIGITS = /^\d+$/;

export function parseFake6529(input: string): bigint | null {
  const [whole = "", fraction, extra] = input.trim().split(".");
  if (
    extra !== undefined ||
    !DIGITS.test(whole) ||
    whole.length > 30 ||
    (fraction !== undefined &&
      (!DIGITS.test(fraction) || fraction.length > DECIMALS))
  ) {
    return null;
  }
  return BigInt(whole) * UNIT + BigInt((fraction ?? "").padEnd(DECIMALS, "0"));
}
