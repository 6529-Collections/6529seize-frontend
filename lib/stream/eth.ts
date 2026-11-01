import { WEI_PER_ETH } from "@/lib/stream/constants";
import type { Wei } from "@/lib/stream/types";

/**
 * Wei ⇄ ETH text without floating point. The UI shows amounts through
 * `formatDecimalString` (locale grouping and separator) on top of these.
 */

/** Plain decimal ETH ("0.0511", "4.088", "12"), trimmed of trailing zeros. */
export function weiToEthString(wei: Wei, maxFractionDigits = 18): string {
  const negative = wei < 0n;
  const absolute = negative ? -wei : wei;
  const whole = absolute / WEI_PER_ETH;
  const fraction = (absolute % WEI_PER_ETH).toString().padStart(18, "0");
  if (maxFractionDigits >= 18) {
    return compose(negative, whole, fraction);
  }
  const rounded = roundFraction(whole, fraction, maxFractionDigits);
  return compose(negative, rounded.whole, rounded.fraction);
}

function roundFraction(
  whole: bigint,
  fraction18: string,
  digits: number
): { readonly whole: bigint; readonly fraction: string } {
  const kept = fraction18.slice(0, digits);
  const nextDigit = Number(fraction18.charAt(digits) || "0");
  if (nextDigit < 5) {
    return { whole, fraction: kept };
  }
  const scale = 10n ** BigInt(digits);
  const value = whole * scale + BigInt(kept === "" ? "0" : kept) + 1n;
  return {
    whole: value / scale,
    fraction:
      digits === 0 ? "" : (value % scale).toString().padStart(digits, "0"),
  };
}

function compose(negative: boolean, whole: bigint, fraction: string): string {
  const trimmed = fraction.replace(/0+$/, "");
  const sign = negative ? "-" : "";
  return trimmed === "" ? `${sign}${whole}` : `${sign}${whole}.${trimmed}`;
}

/**
 * Significant-figure display for prices: at most `significant` significant
 * fraction digits after the leading zeros, so 0.000123456 ETH shows as
 * "0.000123" and 1.23456 ETH as "1.2346".
 */
export function weiToEthDisplay(wei: Wei, significant = 4): string {
  const absolute = wei < 0n ? -wei : wei;
  if (absolute >= WEI_PER_ETH) {
    return weiToEthString(wei, significant);
  }
  const fraction = absolute.toString().padStart(18, "0");
  const leadingZeros = fraction.length - fraction.replace(/^0+/, "").length;
  return weiToEthString(wei, Math.min(18, leadingZeros + significant));
}

const DIGITS = /^\d+$/;

/** Parses user-typed ETH ("0.05", "1") into wei; null if invalid ("1.", ".5", "abc"). */
export function parseEthToWei(text: string): Wei | null {
  const [whole, fraction, extra] = text.trim().split(".");
  if (
    extra !== undefined ||
    whole === undefined ||
    whole.length > 12 ||
    !DIGITS.test(whole) ||
    (fraction !== undefined && (fraction.length > 18 || !DIGITS.test(fraction)))
  ) {
    return null;
  }
  return BigInt(whole) * WEI_PER_ETH + BigInt((fraction ?? "").padEnd(18, "0"));
}
