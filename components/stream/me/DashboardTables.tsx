"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import {
  actionLabel,
  EditionClose,
  editionResultText,
  OneOfOneClose,
  WorkCell,
  workHref,
} from "@/components/stream/browse/cells";
import { partyNames, thumbnailOf } from "@/components/stream/browse/reads";
import StreamTable from "@/components/stream/browse/StreamTable";
import { useStreamNow } from "@/components/stream/data/StreamProvider";
import type {
  DashboardBid,
  DashboardClaim,
  DashboardHolding,
  DashboardWallet,
} from "@/components/stream/me/dashboardBoard";
import {
  ActionMessage,
  Empty,
  useStreamAction,
} from "@/components/stream/pages/common";
import { AddressChip } from "@/components/stream/ui/AddressChip";
import { formatEth } from "@/components/stream/ui/EthAmount";
import StatusBadge, { variantBadge } from "@/components/stream/ui/StatusBadge";
import { STREAM_BUTTON_SECONDARY } from "@/components/stream/ui/styles";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import {
  formatInteger,
  formatList,
  formatPercent,
  selectPluralCategory,
} from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/stream";
import { SPLITS_DENOMINATOR } from "@/lib/stream/constants";
import type { StreamActions, TxResult } from "@/lib/stream/dataSource";
import type { Address } from "@/lib/stream/types";

type Run = ReturnType<typeof useStreamAction>["run"];
type Send = (
  actions: StreamActions,
  from: Address
) => Promise<TxResult<unknown>>;

const ROW_BUTTON = `${STREAM_BUTTON_SECONDARY} tw-whitespace-nowrap tw-px-3 tw-py-1.5`;

function ActionButton({
  label,
  subject,
  send,
  run,
  pending,
  disabled = false,
}: {
  readonly label: string;
  /** What the row is about, for the button's accessible name. */
  readonly subject: string;
  readonly send: Send;
  readonly run: Run;
  readonly pending: boolean;
  readonly disabled?: boolean;
}) {
  const locale = useBrowserLocale();
  return (
    <button
      type="button"
      className={ROW_BUTTON}
      aria-label={actionLabel(locale, label, subject)}
      disabled={pending || disabled}
      onClick={() => {
        void run(send);
      }}
    >
      {label}
    </button>
  );
}

function ActionLink({
  href,
  label,
  subject,
}: {
  readonly href: string;
  readonly label: string;
  readonly subject: string;
}) {
  const locale = useBrowserLocale();
  return (
    <Link
      href={href}
      aria-label={actionLabel(locale, label, subject)}
      className={`${ROW_BUTTON} tw-no-underline`}
    >
      {label}
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Live bids
// ---------------------------------------------------------------------------

function BidStatus({
  row,
  locale,
}: {
  readonly row: DashboardBid;
  readonly locale: SupportedLocale;
}) {
  if (row.kind === "oneOfOne") {
    if (row.bid.leading) {
      return row.auction.state === "ENDED" ? (
        <StatusBadge tone="success" label={t(locale, "stream.me.status.won")} />
      ) : (
        <StatusBadge
          tone="live"
          label={t(locale, "stream.me.status.leading")}
        />
      );
    }
    return (
      <StatusBadge
        tone="warning"
        label={t(locale, "stream.me.status.outbid")}
      />
    );
  }
  switch (row.bid.status) {
    case "in":
      return (
        <StatusBadge tone="live" label={t(locale, "stream.me.status.in")} />
      );
    case "partly":
      return (
        <StatusBadge
          tone="warning"
          label={t(locale, "stream.me.status.partly", {
            won: formatInteger(locale, row.bid.won),
            qty: formatInteger(locale, row.bid.qty),
          })}
        />
      );
    case "out":
      return (
        <StatusBadge tone="muted" label={t(locale, "stream.me.status.out")} />
      );
  }
}

function oneOfOneAction(
  row: Extract<DashboardBid, { kind: "oneOfOne" }>,
  locale: SupportedLocale,
  run: Run,
  pending: boolean
): ReactNode {
  const { auction, bid, work } = row;
  if (auction.state === "ENDED") {
    return (
      <ActionButton
        subject={row.work.title}
        label={t(locale, "stream.me.action.settle")}
        send={(actions, from) =>
          actions.sale("ENGLISH_AUCTION").settle(from, auction.saleId)
        }
        run={run}
        pending={pending}
      />
    );
  }
  if (auction.state === "PAUSED" && bid.leading) {
    return (
      <ActionButton
        subject={row.work.title}
        label={t(locale, "stream.me.action.withdraw")}
        send={(actions, from) =>
          actions.sale("ENGLISH_AUCTION").withdrawBid(from, auction.saleId)
        }
        run={run}
        pending={pending}
      />
    );
  }
  if (auction.state === "ACTIVE" && !bid.leading) {
    return (
      <ActionLink
        subject={row.work.title}
        href={workHref(work)}
        label={t(locale, "stream.me.action.bidAgain")}
      />
    );
  }
  return null;
}

function editionSettleAction(
  row: Extract<DashboardBid, { kind: "edition" }>,
  locale: SupportedLocale,
  run: Run,
  pending: boolean
): ReactNode {
  const { auction } = row;
  const oneOfOne = auction.oneOfOne;
  if (oneOfOne !== null && oneOfOne.state === "ENDED") {
    return (
      <ActionButton
        subject={row.work.title}
        label={t(locale, "stream.me.action.settleOneOfOne")}
        send={(actions, from) =>
          actions.sale("ENGLISH_AUCTION").settle(from, oneOfOne.saleId)
        }
        run={run}
        pending={pending}
      />
    );
  }
  if (
    !auction.editionCreated &&
    auction.clearing.count > 0 &&
    auction.master !== null
  ) {
    const master = auction.master;
    return (
      <ActionButton
        subject={row.work.title}
        label={t(locale, "stream.me.action.createEdition")}
        send={(actions, from) => actions.createEdition(from, master)}
        run={run}
        pending={pending}
      />
    );
  }
  return (
    <ActionButton
      subject={row.work.title}
      label={t(locale, "stream.me.action.settle")}
      send={(actions, from) =>
        actions.sale("UNIFORM_EDITION_AUCTION").settle(from, auction.edition)
      }
      run={run}
      pending={pending}
    />
  );
}

function editionAction(
  row: Extract<DashboardBid, { kind: "edition" }>,
  locale: SupportedLocale,
  run: Run,
  pending: boolean
): ReactNode {
  const { auction, bid, raisePrice } = row;
  if (auction.withdrawalsOpen) {
    return (
      <ActionButton
        subject={row.work.title}
        label={t(locale, "stream.me.action.withdraw")}
        send={(actions, from) =>
          actions
            .sale("UNIFORM_EDITION_AUCTION")
            .withdraw(from, auction.edition, bid.bidId)
        }
        run={run}
        pending={pending}
      />
    );
  }
  if (auction.biddingOpen) {
    const step = bid.raiseToGetIn;
    if (bid.status === "in" || step === null || raisePrice === null) {
      return null;
    }
    return (
      <ActionButton
        subject={row.work.title}
        label={t(locale, "stream.me.action.raise", {
          price: formatEth(locale, raisePrice),
        })}
        send={(actions, from) =>
          actions
            .sale("UNIFORM_EDITION_AUCTION")
            .raise(from, auction.edition, bid.bidId, step)
        }
        run={run}
        pending={pending}
      />
    );
  }
  return auction.phase === "closed"
    ? editionSettleAction(row, locale, run, pending)
    : null;
}

function bidCells(
  row: DashboardBid,
  now: number,
  locale: SupportedLocale,
  run: Run,
  pending: boolean
): ReactNode[] {
  const work = (
    <WorkCell
      key="work"
      href={workHref(row.work)}
      title={row.work.title}
      detail={t(
        locale,
        row.kind === "oneOfOne"
          ? "stream.browse.oneOfOne"
          : "stream.browse.editions"
      )}
      thumbnail={thumbnailOf(row.work)}
    />
  );
  const status = <BidStatus key="status" row={row} locale={locale} />;
  if (row.kind === "oneOfOne") {
    return [
      work,
      formatEth(locale, row.bid.amount),
      status,
      row.auction.highBidder === null
        ? t(locale, "stream.browse.noBidsYet")
        : formatEth(locale, row.auction.highBid),
      <OneOfOneClose
        key="close"
        auction={row.auction}
        now={now}
        locale={locale}
      />,
      oneOfOneAction(row, locale, run, pending),
    ];
  }
  return [
    work,
    <span key="bid" className="tw-whitespace-nowrap">
      {t(locale, "stream.browse.kAtP", {
        count: formatInteger(locale, row.bid.qty),
        price: formatEth(locale, row.bid.price),
      })}
    </span>,
    status,
    editionResultText(locale, row.auction),
    <EditionClose
      key="close"
      auction={row.auction}
      now={now}
      locale={locale}
    />,
    editionAction(row, locale, run, pending),
  ];
}

export function BidsTable({
  bids,
  locale,
}: {
  readonly bids: readonly DashboardBid[];
  readonly locale: SupportedLocale;
}) {
  const now = useStreamNow();
  const { run, pending, message } = useStreamAction(locale);
  return (
    <>
      {bids.length === 0 ? (
        <Empty text={t(locale, "stream.me.bidsEmpty")} />
      ) : (
        <StreamTable
          caption={t(locale, "stream.me.bids")}
          columns={[
            { key: "work", label: t(locale, "stream.browse.col.work") },
            {
              key: "bid",
              label: t(locale, "stream.me.col.yourBid"),
              numeric: true,
            },
            { key: "status", label: t(locale, "stream.me.col.status") },
            {
              key: "now",
              label: t(locale, "stream.browse.col.now"),
              numeric: true,
              wide: true,
            },
            {
              key: "closes",
              label: t(locale, "stream.browse.col.closes"),
              numeric: true,
            },
            { key: "action", label: t(locale, "stream.me.col.action") },
          ]}
          rows={bids.map((row) => ({
            key:
              row.kind === "oneOfOne"
                ? `1of1:${row.bid.saleId}`
                : `edition:${row.auction.edition}:${row.bid.bidId}`,
            cells: bidCells(row, now, locale, run, pending),
          }))}
        />
      )}
      <ActionMessage message={message} />
    </>
  );
}

// ---------------------------------------------------------------------------
// Claims
// ---------------------------------------------------------------------------

/** "3 editions, 0.0122 ETH back", "3 editions" or a refund alone. */
function editionClaimText(
  locale: SupportedLocale,
  editions: number,
  refund: bigint
): string {
  if (editions === 0) {
    return formatEth(locale, refund);
  }
  const count = formatInteger(locale, editions);
  const plural =
    selectPluralCategory(locale, editions) === "one" ? "one" : "other";
  return refund === 0n
    ? t(locale, `stream.me.claim.editionsOnly.${plural}`, { editions: count })
    : t(locale, `stream.me.claim.editionsAmount.${plural}`, {
        editions: count,
        refund: formatEth(locale, refund),
      });
}

function claimCells(
  { item, work }: DashboardClaim,
  locale: SupportedLocale,
  run: Run,
  pending: boolean
): ReactNode[] {
  const workCell =
    work === null ? (
      t(locale, "stream.me.claim.anyAuction")
    ) : (
      <WorkCell
        key="work"
        href={workHref(work)}
        title={work.title}
        thumbnail={thumbnailOf(work)}
      />
    );
  const claim = (send: Send) => (
    <ActionButton
      key="action"
      label={t(locale, "stream.me.action.claim")}
      subject={work?.title ?? t(locale, "stream.me.claim.credit")}
      send={send}
      run={run}
      pending={pending}
    />
  );
  switch (item.kind) {
    case "auction-credit":
      return [
        t(locale, "stream.me.claim.credit"),
        workCell,
        formatEth(locale, item.amount),
        claim((actions, from) =>
          actions.sale("ENGLISH_AUCTION").claimCredits(from, from)
        ),
      ];
    case "edition-bid":
      return [
        t(
          locale,
          item.editions > 0
            ? "stream.me.claim.editions"
            : "stream.me.claim.refund"
        ),
        workCell,
        editionClaimText(locale, item.editions, item.refund),
        claim((actions, from) =>
          actions
            .sale("UNIFORM_EDITION_AUCTION")
            .claim(from, item.edition, item.bidId, from)
        ),
      ];
    case "pending-delivery":
      return [
        t(locale, "stream.me.claim.delivery"),
        workCell,
        t(locale, "stream.browse.oneOfOne"),
        claim((actions, from) =>
          actions.sale("ENGLISH_AUCTION").claimDelivery(from, item.saleId, from)
        ),
      ];
  }
}

function claimKey({ item }: DashboardClaim): string {
  switch (item.kind) {
    case "auction-credit":
      return item.kind;
    case "edition-bid":
      return `${item.kind}:${item.edition}:${item.bidId}`;
    case "pending-delivery":
      return `${item.kind}:${item.saleId}`;
  }
}

export function ClaimsTable({
  claims,
  locale,
}: {
  readonly claims: readonly DashboardClaim[];
  readonly locale: SupportedLocale;
}) {
  const { run, pending, message } = useStreamAction(locale);
  return (
    <>
      {claims.length === 0 ? (
        <Empty text={t(locale, "stream.me.claimsEmpty")} />
      ) : (
        <StreamTable
          caption={t(locale, "stream.me.claims")}
          columns={[
            { key: "what", label: t(locale, "stream.me.col.what") },
            { key: "work", label: t(locale, "stream.browse.col.work") },
            {
              key: "amount",
              label: t(locale, "stream.me.col.amount"),
              numeric: true,
            },
            { key: "action", label: t(locale, "stream.me.col.action") },
          ]}
          rows={claims.map((claim) => ({
            key: claimKey(claim),
            cells: claimCells(claim, locale, run, pending),
          }))}
        />
      )}
      <ActionMessage message={message} />
    </>
  );
}

// ---------------------------------------------------------------------------
// Owned works
// ---------------------------------------------------------------------------

export function HoldingsTable({
  holdings,
  locale,
}: {
  readonly holdings: readonly DashboardHolding[];
  readonly locale: SupportedLocale;
}) {
  if (holdings.length === 0) {
    return <Empty text={t(locale, "stream.me.ownedEmpty")} />;
  }
  return (
    <StreamTable
      caption={t(locale, "stream.me.owned")}
      columns={[
        { key: "work", label: t(locale, "stream.browse.col.work") },
        {
          key: "product",
          label: t(locale, "stream.artist.col.product"),
          wide: true,
        },
        { key: "held", label: t(locale, "stream.me.col.held"), numeric: true },
      ]}
      rows={holdings.map(({ work, quantity }) => ({
        key: work.key,
        cells: [
          <WorkCell
            key="work"
            href={workHref(work)}
            title={work.title}
            detail={partyNames(work)}
            thumbnail={thumbnailOf(work)}
          />,
          t(locale, variantBadge(work.variant).label),
          formatInteger(locale, quantity),
        ],
      }))}
    />
  );
}

// ---------------------------------------------------------------------------
// Split wallets
// ---------------------------------------------------------------------------

function walletCells(
  row: DashboardWallet,
  locale: SupportedLocale,
  run: Run,
  pending: boolean
): ReactNode[] {
  const share = formatPercent(locale, row.share / SPLITS_DENOMINATOR, 3);
  const royalty = row.kind === "royalty";
  const titles = formatList(
    locale,
    row.works.map((work) => work.title)
  );
  return [
    <span key="wallet" className="tw-flex tw-flex-col tw-gap-0.5">
      <AddressChip address={row.wallet.address} locale={locale} />
      <span className="tw-text-xs tw-text-iron-400">
        {t(
          locale,
          royalty ? "stream.me.wallet.royalty" : "stream.me.wallet.sales"
        )}
      </span>
    </span>,
    titles,
    royalty ? t(locale, "stream.me.wallet.toSplit", { share }) : share,
    formatEth(locale, row.wallet.received),
    formatEth(locale, row.releasable),
    <ActionButton
      key="action"
      label={t(
        locale,
        royalty ? "stream.me.action.moveRoyalties" : "stream.me.action.release"
      )}
      subject={titles}
      send={(actions, from) =>
        actions.releaseSplit(from, row.wallet.address, row.payeeIndex)
      }
      run={run}
      pending={pending}
      disabled={row.releasable === 0n}
    />,
  ];
}

export function WalletsTable({
  wallets,
  locale,
}: {
  readonly wallets: readonly DashboardWallet[];
  readonly locale: SupportedLocale;
}) {
  const { run, pending, message } = useStreamAction(locale);
  return (
    <>
      {wallets.length === 0 ? (
        <Empty text={t(locale, "stream.me.walletsEmpty")} />
      ) : (
        <StreamTable
          caption={t(locale, "stream.me.wallets")}
          columns={[
            { key: "wallet", label: t(locale, "stream.artist.col.wallet") },
            {
              key: "works",
              label: t(locale, "stream.artist.col.works"),
              wide: true,
            },
            {
              key: "share",
              label: t(locale, "stream.me.col.share"),
              numeric: true,
            },
            {
              key: "received",
              label: t(locale, "stream.artist.col.received"),
              numeric: true,
              wide: true,
            },
            {
              key: "ready",
              label: t(locale, "stream.me.col.ready"),
              numeric: true,
            },
            { key: "action", label: t(locale, "stream.me.col.action") },
          ]}
          rows={wallets.map((row) => ({
            key: `${row.kind}:${row.wallet.address}:${row.payeeIndex}`,
            cells: walletCells(row, locale, run, pending),
          }))}
        />
      )}
      <ActionMessage message={message} />
    </>
  );
}
