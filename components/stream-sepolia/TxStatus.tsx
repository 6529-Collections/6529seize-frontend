"use client";

import { t } from "@/i18n/messages";
import type { MessageKey } from "@/i18n/messages/en-US.complete";
import "@/i18n/namespaces/stream-sepolia";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";

import { sepoliaTxUrl } from "./format";
import type { TxState } from "./useStreamTx";

const KNOWN_ERRORS: Record<string, MessageKey> = {
  rejected: "streamSepolia.tx.error.rejected",
  chain: "streamSepolia.tx.error.chain",
  failed: "streamSepolia.tx.error.failed",
  BidTooLow: "streamSepolia.tx.error.bidTooLow",
  RestartTooEarly: "streamSepolia.tx.error.restartTooEarly",
  InvalidAuctionState: "streamSepolia.tx.error.state",
  SalePaused: "streamSepolia.tx.error.paused",
  BiddingClosed: "streamSepolia.tx.error.biddingClosed",
  IncorrectPayment: "streamSepolia.tx.error.payment",
  InvalidStep: "streamSepolia.tx.error.price",
  InvalidQuantity: "streamSepolia.tx.error.quantity",
  SettlementNotReady: "streamSepolia.tx.error.notReady",
  InvalidSettlementOrder: "streamSepolia.tx.error.tryAgain",
  NotAbandonable: "streamSepolia.tx.error.notReady",
  AuctionExists: "streamSepolia.tx.error.alreadyOpen",
  NoOneOfOneAuction: "streamSepolia.tx.error.noOneOfOne",
  NothingToClaim: "streamSepolia.tx.error.nothingToClaim",
  ClaimFailed: "streamSepolia.tx.error.claimFailed",
  NotHighBidder: "streamSepolia.tx.error.notHighBidder",
  NoPendingDelivery: "streamSepolia.tx.error.nothingToClaim",
  RefusalTooEarly: "streamSepolia.tx.error.notReady",
  DeliveryInsufficientGas: "streamSepolia.tx.error.gas",
  TargetNotAllowed: "streamSepolia.tx.error.notListed",
  NotBidder: "streamSepolia.tx.error.notYourBid",
  UnknownBid: "streamSepolia.tx.error.notYourBid",
  InvalidRecipient: "streamSepolia.tx.error.recipient",
  InvalidSaleTerms: "streamSepolia.tx.error.terms",
  UnknownAuction: "streamSepolia.tx.error.state",
  ItemNotApproved: "streamSepolia.tx.error.notApproved",
  NotListable: "streamSepolia.tx.error.notListable",
  NotArtist: "streamSepolia.tx.error.notArtist",
  InvalidSignature: "streamSepolia.tx.error.signature",
  SignatureExpired: "streamSepolia.tx.error.signature",
  notSent: "streamSepolia.tx.error.notSent",
  gateClosed: "streamSepolia.tx.error.gateClosed",
  AccessManagedUnauthorized: "streamSepolia.tx.error.gateClosed",
  NotApproved: "streamSepolia.tx.error.gateClosed",
  contentMinted: "streamSepolia.tx.error.contentMinted",
  ContentAlreadyMinted: "streamSepolia.tx.error.contentMinted",
  ContentUsed: "streamSepolia.tx.error.contentMinted",
  packageRevoked: "streamSepolia.tx.error.packageRevoked",
  PackageNotApproved: "streamSepolia.tx.error.packageRevoked",
  wrongAccount: "streamSepolia.tx.error.wrongAccount",
  digestMismatch: "streamSepolia.tx.error.digestMismatch",
  noNonce: "streamSepolia.tx.error.noNonce",
  notStarted: "streamSepolia.tx.error.notStarted",
  PartyNotAccepted: "streamSepolia.tx.error.notAccepted",
  ProfileMismatch: "streamSepolia.tx.error.profileMismatch",
  MoveNonceUsed: "streamSepolia.tx.error.nonceUsed",
  UnknownCollection: "streamSepolia.tx.error.unknownCollection",
  InvalidItem: "streamSepolia.tx.error.invalidItem",
};

const LINK_CLASS =
  "tw-font-medium tw-text-primary-300 tw-underline tw-decoration-primary-400/50 tw-underline-offset-4 hover:tw-text-primary-400";

/** One line that always says where a transaction stands, with its Etherscan link. */
export function TxStatus({
  state,
  doneText,
}: {
  readonly state: TxState;
  /** What happened, said after it lands (e.g. "You have the top bid at 0.05 ETH."). */
  readonly doneText?: string | undefined;
}) {
  const locale = useBrowserLocale();
  if (state.phase === "idle") return null;
  const link = state.hash ? (
    <a href={sepoliaTxUrl(state.hash)} target="_blank" rel="noreferrer" className={LINK_CLASS}>
      {t(locale, "streamSepolia.tx.view")}
    </a>
  ) : null;
  let text: string;
  let tone = "tw-text-iron-300";
  switch (state.phase) {
    case "wallet":
      text = t(locale, "streamSepolia.tx.wallet");
      break;
    case "pending":
      text = t(locale, "streamSepolia.tx.pending");
      break;
    case "slow":
      text = t(locale, "streamSepolia.tx.slow");
      break;
    case "done":
      text = doneText ?? t(locale, "streamSepolia.tx.done");
      tone = "tw-text-emerald-400";
      break;
    case "error": {
      const key = KNOWN_ERRORS[state.error ?? "failed"];
      text = key ? t(locale, key) : t(locale, "streamSepolia.tx.error.other");
      tone = "tw-text-red";
    }
  }
  return (
    <p role="status" aria-live="polite" className={`tw-mb-0 tw-mt-2 tw-text-sm ${tone}`}>
      {text} {link}
    </p>
  );
}
