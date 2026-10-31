import { formatNumber } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { type MessageKey, t } from "@/i18n/messages";
import "@/i18n/namespaces/stream";
import type { TxError } from "@/lib/stream/dataSource";
import type { GasEstimate } from "@/lib/stream/gas";

function compactGas(locale: SupportedLocale, gas: number): string {
  return formatNumber(locale, gas, {
    notation: "compact",
    maximumSignificantDigits: 3,
  });
}

/** "About 169K gas · Sepolia r2, Glamsterdam, measured 11 Oct 2026". Always labelled. */
function formatGas(locale: SupportedLocale, estimate: GasEstimate): string {
  const low = compactGas(locale, estimate.low);
  const high = compactGas(locale, estimate.high);
  return t(locale, "stream.gas.about", {
    amount: low === high ? low : t(locale, "stream.gas.range", { low, high }),
    source: t(locale, `stream.gas.source.${estimate.source}`),
  });
}

export default function GasNote({
  estimate,
  locale,
}: {
  readonly estimate: GasEstimate | null;
  readonly locale: SupportedLocale;
}) {
  if (estimate === null) {
    return null;
  }
  return (
    <p className="tw-m-0 tw-text-xs tw-leading-5 tw-text-iron-400">
      {formatGas(locale, estimate)}
    </p>
  );
}

/** Contract custom errors the UI explains in words. */
const TX_ERRORS: Readonly<Record<string, MessageKey>> = {
  BidTooLow: "stream.tx.error.bidTooLow",
  InvalidAuctionState: "stream.tx.error.invalidAuctionState",
  InsufficientBalance: "stream.tx.error.insufficientBalance",
  NothingToClaim: "stream.tx.error.nothingToClaim",
  NotHighBidder: "stream.tx.error.notHighBidder",
  NoPendingDelivery: "stream.tx.error.noPendingDelivery",
  TargetNotAllowed: "stream.tx.error.targetNotAllowed",
  UnpauseTooEarly: "stream.tx.error.unpauseTooEarly",
  PauseExhausted: "stream.tx.error.pauseExhausted",
  BiddingClosed: "stream.tx.error.biddingClosed",
  WithdrawalsClosed: "stream.tx.error.withdrawalsClosed",
  SettlementNotReady: "stream.tx.error.settlementNotReady",
  EditionNotCreated: "stream.tx.error.editionNotCreated",
  UnknownBid: "stream.tx.error.unknownBid",
  NotBidder: "stream.tx.error.notBidder",
  InvalidStep: "stream.tx.error.invalidStep",
  InvalidQuantity: "stream.tx.error.invalidQuantity",
  IncorrectPayment: "stream.tx.error.incorrectPayment",
  AuctionExists: "stream.tx.error.auctionExists",
  NoOneOfOneAuction: "stream.tx.error.noOneOfOneAuction",
  NotWorkArtist: "stream.tx.error.notWorkArtist",
  MoveNotSigned: "stream.tx.error.moveNotSigned",
  PartiesNotAccepted: "stream.tx.error.partiesNotAccepted",
  NothingToRelease: "stream.tx.error.nothingToRelease",
};

/** A reverted transaction in words; unknown errors show their contract name. */
export function txErrorMessage(
  locale: SupportedLocale,
  error: TxError
): string {
  const key = Object.hasOwn(TX_ERRORS, error.code)
    ? TX_ERRORS[error.code]
    : undefined;
  return key === undefined
    ? t(locale, "stream.tx.error.unknown", { code: error.code })
    : t(locale, key);
}
