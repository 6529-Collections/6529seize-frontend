"use client";

import { useId, useState } from "react";
import { isAddress } from "viem";

import { useStreamQuery } from "@/components/stream/data/StreamProvider";
import EthAmount, { formatEth } from "@/components/stream/ui/EthAmount";
import GasNote from "@/components/stream/ui/GasNote";
import {
  STREAM_BUTTON_PRIMARY,
  STREAM_BUTTON_SECONDARY,
  STREAM_FOCUS,
  STREAM_HELP,
  STREAM_LABEL,
} from "@/components/stream/ui/styles";
import {
  type EnglishPanelContext,
  isDelisted,
  sameAddress,
} from "@/components/stream/work/english/context";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/stream";
import { parseEthToWei, weiToEthString } from "@/lib/stream/eth";
import { GAS_ESTIMATES } from "@/lib/stream/gas";
import type { Address } from "@/lib/stream/types";

const INPUT = `tw-w-full tw-min-w-0 tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-iron-900 tw-px-3 tw-py-2 tw-text-sm tw-tabular-nums tw-text-iron-50 placeholder:tw-text-iron-500 aria-[invalid=true]:tw-border-error ${STREAM_FOCUS}`;

function bidHelp(
  context: EnglishPanelContext,
  wei: bigint | null,
  leading: boolean
): string {
  const { auction, locale } = context;
  const minimum = formatEth(locale, auction.minimumNextBid);
  if (wei === null) {
    return t(locale, "stream.english.bid.invalid");
  }
  if (wei < auction.minimumNextBid) {
    return t(locale, "stream.english.bid.tooLow", { minimum });
  }
  return leading
    ? t(locale, "stream.english.bid.leading")
    : t(locale, "stream.english.bid.minimum", { minimum });
}

/** `bid(saleId, recipient, payment)`: prefilled with `minimumBid(saleId)`. */
export function BidForm({
  context,
}: {
  readonly context: EnglishPanelContext;
}) {
  const { auction, locale, action } = context;
  const inputId = useId();
  const helpId = useId();
  const [text, setText] = useState<string | null>(null);
  const value = text ?? weiToEthString(auction.minimumNextBid);
  const wei = parseEthToWei(value);
  const leading = sameAddress(auction.highBidder, action.account);
  if (isDelisted(context)) {
    return (
      <p className="tw-m-0 tw-text-sm tw-text-error">
        {t(locale, "stream.english.delistedBid")}
      </p>
    );
  }
  const submit = async () => {
    if (wei === null) {
      return;
    }
    const result = await action.run((actions, from) =>
      actions.sale("ENGLISH_AUCTION").bid(from, auction.saleId, wei)
    );
    if (result?.ok === true) {
      setText(null);
    }
  };
  const invalid = wei === null || wei < auction.minimumNextBid;
  return (
    <form
      className="tw-flex tw-flex-col tw-gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <label htmlFor={inputId} className={STREAM_LABEL}>
        {t(locale, "stream.english.bid.label")}
      </label>
      <div className="tw-flex tw-gap-2">
        <input
          id={inputId}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          spellCheck={false}
          value={value}
          onChange={(event) => setText(event.target.value)}
          aria-describedby={helpId}
          aria-invalid={invalid}
          className={INPUT}
        />
        <button
          type="submit"
          className={`${STREAM_BUTTON_PRIMARY} tw-flex-none`}
          disabled={action.pending || invalid}
        >
          {t(locale, "stream.english.bid.submit")}
        </button>
      </div>
      <p id={helpId} className={STREAM_HELP}>
        {bidHelp(context, wei, leading)}
      </p>
      <GasNote estimate={GAS_ESTIMATES.auctionBid} locale={locale} />
    </form>
  );
}

/** `settle(saleId)`: anyone, once the auction has ended. */
export function SettleButton({
  context,
}: {
  readonly context: EnglishPanelContext;
}) {
  const { auction, locale, action } = context;
  return (
    <div className="tw-flex tw-flex-col tw-items-start tw-gap-2">
      <button
        type="button"
        className={STREAM_BUTTON_PRIMARY}
        disabled={action.pending}
        onClick={() =>
          void action.run((actions, from) =>
            actions.sale("ENGLISH_AUCTION").settle(from, auction.saleId)
          )
        }
      >
        {t(locale, "stream.english.settle.submit")}
      </button>
      <p className={STREAM_HELP}>{t(locale, "stream.english.settle.anyone")}</p>
      <GasNote estimate={GAS_ESTIMATES.auctionSettle} locale={locale} />
    </div>
  );
}

/** `withdrawBid(saleId)`: the high bidder, while the auction is paused. */
export function WithdrawButton({
  context,
}: {
  readonly context: EnglishPanelContext;
}) {
  const { auction, locale, action } = context;
  if (auction.highBidder === null) {
    return null;
  }
  if (!sameAddress(auction.highBidder, action.account)) {
    return (
      <p className={STREAM_HELP}>
        {t(locale, "stream.english.withdraw.onlyLeader")}
      </p>
    );
  }
  return (
    <div className="tw-flex tw-flex-col tw-items-start tw-gap-2">
      <button
        type="button"
        className={STREAM_BUTTON_SECONDARY}
        disabled={action.pending}
        onClick={() =>
          void action.run((actions, from) =>
            actions.sale("ENGLISH_AUCTION").withdrawBid(from, auction.saleId)
          )
        }
      >
        {t(locale, "stream.english.withdraw.submit")}
      </button>
      <p className={STREAM_HELP}>{t(locale, "stream.english.withdraw.help")}</p>
    </div>
  );
}

/** `claimDelivery(saleId, to)`: the winner whose wallet refused the token. */
export function ClaimDelivery({
  context,
  recipient,
}: {
  readonly context: EnglishPanelContext;
  readonly recipient: Address;
}) {
  const { auction, locale, action, label } = context;
  const inputId = useId();
  const helpId = useId();
  const [text, setText] = useState<string | null>(null);
  if (!sameAddress(recipient, action.account)) {
    return (
      <p className={STREAM_HELP}>
        {t(locale, "stream.english.delivery.waiting", {
          name: label(recipient) ?? recipient,
        })}
      </p>
    );
  }
  const value = text ?? action.account ?? "";
  const to: Address | null = isAddress(value, { strict: false }) ? value : null;
  return (
    <form
      className="tw-flex tw-flex-col tw-gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        if (to === null) {
          return;
        }
        void action.run((actions, from) =>
          actions
            .sale("ENGLISH_AUCTION")
            .claimDelivery(from, auction.saleId, to)
        );
      }}
    >
      <label htmlFor={inputId} className={STREAM_LABEL}>
        {t(locale, "stream.english.delivery.to")}
      </label>
      <div className="tw-flex tw-flex-col tw-gap-2 sm:tw-flex-row">
        <input
          id={inputId}
          type="text"
          autoComplete="off"
          spellCheck={false}
          value={value}
          onChange={(event) => setText(event.target.value)}
          aria-describedby={helpId}
          aria-invalid={to === null}
          className={`${INPUT} tw-font-mono tw-text-xs`}
        />
        <button
          type="submit"
          className={`${STREAM_BUTTON_PRIMARY} tw-flex-none`}
          disabled={action.pending || to === null}
        >
          {t(locale, "stream.english.delivery.submit")}
        </button>
      </div>
      <p id={helpId} className={STREAM_HELP}>
        {t(locale, "stream.english.delivery.help")}
      </p>
    </form>
  );
}

/** `claimable(account, ETH)` and `claim(ETH, to)`: outbid and refunded bids, pulled. */
export function Credits({
  context,
}: {
  readonly context: EnglishPanelContext;
}) {
  const { locale, action } = context;
  const account = action.account;
  const { data: credit = 0n } = useStreamQuery(
    "claimable-credits",
    [account],
    (source) =>
      account === null ? Promise.resolve(0n) : source.claimableCredits(account)
  );
  if (account === null || credit === 0n) {
    return null;
  }
  return (
    <div className="tw-mt-4 tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-3 tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.07] tw-bg-iron-900 tw-p-3">
      <div className="tw-min-w-0">
        <p className="tw-m-0 tw-text-sm tw-text-iron-100">
          {t(locale, "stream.english.credits.label")}{" "}
          <EthAmount wei={credit} locale={locale} className="tw-font-medium" />
        </p>
        <p className={STREAM_HELP}>
          {t(locale, "stream.english.credits.help")}
        </p>
      </div>
      <button
        type="button"
        className={STREAM_BUTTON_SECONDARY}
        disabled={action.pending}
        onClick={() =>
          void action.run((actions, from) =>
            actions.sale("ENGLISH_AUCTION").claimCredits(from, from)
          )
        }
      >
        {t(locale, "stream.english.credits.submit")}
      </button>
    </div>
  );
}
