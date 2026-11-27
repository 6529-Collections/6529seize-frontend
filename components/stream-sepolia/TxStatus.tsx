"use client";

import { t } from "@/i18n/messages";
import type { MessageKey } from "@/i18n/messages/en-US.complete";
import "@/i18n/namespaces/stream-sepolia";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";

import { sepoliaTxUrl } from "./format";
import type { TxState } from "./useStreamTx";

const KNOWN_ERRORS: Record<string, MessageKey> = {
  rejected: "streamSepolia.tx.error.rejected",
  failed: "streamSepolia.tx.error.failed",
  BidTooLow: "streamSepolia.tx.error.bidTooLow",
  RestartTooEarly: "streamSepolia.tx.error.restartTooEarly",
  InvalidAuctionState: "streamSepolia.tx.error.state",
  AuctionNotActive: "streamSepolia.tx.error.state",
  EnforcedPause: "streamSepolia.tx.error.paused",
  InsufficientFunds: "streamSepolia.tx.error.funds",
};

const LINK_CLASS =
  "tw-font-medium tw-text-primary-300 tw-underline tw-decoration-primary-400/50 tw-underline-offset-4 hover:tw-text-primary-400";

/** One line that always says where a transaction stands, with its Etherscan link. */
export function TxStatus({ state }: { readonly state: TxState }) {
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
    case "done":
      text = t(locale, "streamSepolia.tx.done");
      tone = "tw-text-emerald-400";
      break;
    case "error": {
      const key = KNOWN_ERRORS[state.error ?? "failed"];
      text = key
        ? t(locale, key)
        : t(locale, "streamSepolia.tx.error.named", { name: state.error ?? "" });
      tone = "tw-text-red";
    }
  }
  return (
    <p role="status" aria-live="polite" className={`tw-mb-0 tw-mt-2 tw-text-sm ${tone}`}>
      {text} {link}
    </p>
  );
}
