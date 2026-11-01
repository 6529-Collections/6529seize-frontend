import {
  formatDate,
  formatDecimalString,
  formatInteger,
  selectPluralCategory,
} from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/stream";
import { weiToEthDisplay, weiToEthString } from "@/lib/stream/eth";
import type { EditionBidView, Wei } from "@/lib/stream/types";

const WEI_PER_ETH = 10n ** 18n;

/**
 * A ladder price, three significant figures, no unit: "0.0511", "0.01",
 * "1.00", "21.5", "953". From 1 ETH up, trailing zeros stay, so "1 at 1.00"
 * reads as a price.
 */
export function priceText(locale: SupportedLocale, wei: Wei): string {
  if (wei < WEI_PER_ETH) {
    return formatDecimalString(locale, weiToEthDisplay(wei, 3));
  }
  const whole = (wei / WEI_PER_ETH).toString();
  const decimals = Math.max(0, 3 - whole.length);
  const text = weiToEthString(wei, decimals);
  const [integer = text, fraction = ""] = text.split(".");
  return formatDecimalString(
    locale,
    decimals === 0 ? integer : `${integer}.${fraction.padEnd(decimals, "0")}`
  );
}

/** The price of `step` on a ladder, or a dash. */
export function stepText(
  locale: SupportedLocale,
  prices: readonly Wei[] | undefined,
  step: number | null
): string {
  const price = step === null ? undefined : prices?.[step];
  return price === undefined ? "–" : priceText(locale, price);
}

/** An exact ETH amount, no unit: "4.088". */
export function ethText(locale: SupportedLocale, wei: Wei): string {
  return formatDecimalString(locale, weiToEthString(wei));
}

const CENTI_ETH = 10n ** 16n;

/** A short amount for a narrow column: three decimals, or three significant figures below 0.01. */
export function shortEthText(locale: SupportedLocale, wei: Wei): string {
  return formatDecimalString(
    locale,
    wei >= CENTI_ETH ? weiToEthString(wei, 3) : weiToEthDisplay(wei, 3)
  );
}

/** "1 edition", "80 editions". */
export function editionsText(locale: SupportedLocale, count: number): string {
  return t(
    locale,
    selectPluralCategory(locale, count) === "one"
      ? "stream.editionAuction.editions.one"
      : "stream.editionAuction.editions.other",
    { count: formatInteger(locale, count) }
  );
}

const DAY = 86_400;

/**
 * A UTC clock time ("6:35 PM"): with the weekday when it falls on another day
 * than `now`, and with seconds when it is not on the minute (a soft close).
 */
export function clockText(
  locale: SupportedLocale,
  at: number,
  now: number
): string {
  const sameDay = Math.floor(at / DAY) === Math.floor(now / DAY);
  return formatDate(locale, at * 1_000, {
    ...(sameDay ? {} : { weekday: "short" }),
    hour: "numeric",
    minute: "2-digit",
    ...(at % 60 === 0 ? {} : { second: "2-digit" }),
    timeZone: "UTC",
  });
}

/** "0x12ab…cd34". */
export function shortAddress(address: string): string {
  return address.length > 12
    ? `${address.slice(0, 6)}…${address.slice(-4)}`
    : address;
}

export function sameAddress(
  left: string | null | undefined,
  right: string | null | undefined
): boolean {
  if (!left || !right) {
    return false;
  }
  return left.toLowerCase() === right.toLowerCase();
}

/** A bid still in the book: not withdrawn and not claimed. */
export function isLive(bid: EditionBidView): boolean {
  return !bid.withdrawn && !bid.claimed;
}

/** What a set of bids wins, pays and gets back at a clearing price. */
interface BidTotals {
  readonly bids: number;
  readonly wanted: number;
  readonly won: number;
  readonly held: Wei;
  readonly pay: Wei;
  readonly back: Wei;
}

export function bidTotals(
  bids: readonly EditionBidView[],
  clearingPrice: Wei
): BidTotals {
  let wanted = 0;
  let won = 0;
  let held = 0n;
  let back = 0n;
  for (const bid of bids) {
    wanted += bid.quantity;
    won += bid.unitsWon;
    held += bid.escrow;
    back += bid.refund;
  }
  const pay = BigInt(won) * clearingPrice;
  return { bids: bids.length, wanted, won, held, pay, back };
}
