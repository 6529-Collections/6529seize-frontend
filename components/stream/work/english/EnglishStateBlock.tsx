"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { formatDuration } from "@/components/stream/ui/Countdown";
import EthAmount, { formatEth } from "@/components/stream/ui/EthAmount";
import {
  STREAM_FOCUS,
  STREAM_HELP,
  STREAM_LABEL,
} from "@/components/stream/ui/styles";
import StreamTime from "@/components/stream/work/StreamTime";
import {
  BidForm,
  ClaimDelivery,
  SettleButton,
  WithdrawButton,
} from "@/components/stream/work/english/EnglishActions";
import {
  type EnglishPanelContext,
  isDelisted,
} from "@/components/stream/work/english/context";
import { formatPercent } from "@/i18n/format";
import { type MessageKey, t } from "@/i18n/messages";
import "@/i18n/namespaces/stream";
import {
  DISPUTE_DECISION_DELAY,
  SPLITS_DENOMINATOR,
} from "@/lib/stream/constants";
import { STREAM_ROUTES } from "@/lib/stream/workKey";

type Tone = "neutral" | "warning" | "danger" | "success";

const TONES: Readonly<Record<Tone, string>> = {
  neutral: "tw-border-white/[0.07] tw-bg-iron-900",
  warning: "tw-border-amber-400/25 tw-bg-amber-400/[0.06]",
  danger: "tw-border-error/30 tw-bg-error/[0.06]",
  success: "tw-border-primary-400/25 tw-bg-primary-500/[0.06]",
};

/** One line of a notice, keyed by what it says. */
interface NoticeLine {
  readonly key: string;
  readonly content: ReactNode;
}

function line(key: string, content: ReactNode): NoticeLine {
  return { key, content };
}

/** A short state note: a heading line, one line per idea, then any action. */
function Notice({
  tone,
  title,
  lines,
  children,
}: {
  readonly tone: Tone;
  readonly title: ReactNode;
  readonly lines?: readonly NoticeLine[];
  readonly children?: ReactNode;
}) {
  return (
    <div
      className={`tw-flex tw-flex-col tw-gap-3 tw-rounded-lg tw-border tw-border-solid tw-p-3 ${TONES[tone]}`}
    >
      <div>
        <p className="tw-m-0 tw-text-sm tw-font-medium tw-text-iron-50">
          {title}
        </p>
        {lines === undefined || lines.length === 0 ? null : (
          <ul className="tw-m-0 tw-mt-1.5 tw-list-none tw-space-y-1 tw-p-0">
            {lines.map((entry) => (
              <li key={entry.key} className={STREAM_HELP}>
                {entry.content}
              </li>
            ))}
          </ul>
        )}
      </div>
      {children}
    </div>
  );
}

function SmallFact({
  label,
  children,
}: {
  readonly label: string;
  readonly children: ReactNode;
}) {
  return (
    <div className="tw-min-w-0">
      <dt className={STREAM_LABEL}>{label}</dt>
      <dd className="tw-m-0 tw-mt-0.5 tw-text-sm tw-tabular-nums tw-text-iron-100">
        {children}
      </dd>
    </div>
  );
}

function PausedBlock({ context }: { readonly context: EnglishPanelContext }) {
  const { auction, locale, editions } = context;
  const pausedAt = auction.pause.pausedAt ?? auction.endTime;
  const lines: NoticeLine[] = [
    line("stopped", t(locale, "stream.english.paused.stopped")),
    line("upheld", t(locale, "stream.english.paused.upheld")),
    line("rejected", t(locale, "stream.english.paused.rejected")),
  ];
  if (editions !== null) {
    lines.push(line("editions", t(locale, "stream.english.paused.editions")));
  }
  if (auction.bidder === null && auction.bid > 0n) {
    lines.push(
      line(
        "reserve",
        t(locale, "stream.english.paused.reserve", {
          amount: formatEth(locale, auction.bid),
        })
      )
    );
  }
  return (
    <Notice
      tone="warning"
      title={t(locale, "stream.english.paused.title")}
      lines={lines}
    >
      <dl className="tw-m-0 tw-grid tw-grid-cols-1 tw-gap-2 sm:tw-grid-cols-3">
        <SmallFact label={t(locale, "stream.english.paused.since")}>
          <StreamTime seconds={pausedAt} locale={locale} />
        </SmallFact>
        <SmallFact label={t(locale, "stream.english.paused.decisionFrom")}>
          <StreamTime
            seconds={pausedAt + DISPUTE_DECISION_DELAY}
            locale={locale}
          />
        </SmallFact>
        <SmallFact label={t(locale, "stream.english.paused.expires")}>
          <StreamTime
            seconds={auction.pause.expiresAt ?? pausedAt}
            locale={locale}
          />
        </SmallFact>
      </dl>
      <WithdrawButton context={context} />
    </Notice>
  );
}

function endedPreviewKey(context: EnglishPanelContext): MessageKey {
  const { auction } = context;
  if (auction.bidder !== null) {
    return isDelisted(context)
      ? "stream.english.ended.delisted"
      : "stream.english.ended.sold";
  }
  return auction.program === "canonical"
    ? "stream.english.ended.toMuseum"
    : "stream.english.ended.toArtist";
}

function EndedBlock({ context }: { readonly context: EnglishPanelContext }) {
  const { auction, locale, label } = context;
  const winner = auction.recipient ?? auction.bidder;
  return (
    <Notice
      tone="neutral"
      title={t(locale, "stream.english.ended.title")}
      lines={[
        line(
          "preview",
          t(locale, endedPreviewKey(context), {
            name: winner === null ? "" : (label(winner) ?? winner),
          })
        ),
      ]}
    >
      <SettleButton context={context} />
    </Notice>
  );
}

function shareText(context: EnglishPanelContext, share: number): string {
  return formatPercent(context.locale, share / SPLITS_DENOMINATOR, 1);
}

function SoldBlock({ context }: { readonly context: EnglishPanelContext }) {
  const { auction, locale, label } = context;
  const settlement = auction.settlement;
  const winner = settlement?.to ?? null;
  if (settlement === null || winner === null) {
    return null;
  }
  const pending = auction.pendingDelivery;
  const feeShare = auction.terms.feeShare;
  return (
    <Notice
      tone={pending === null ? "success" : "warning"}
      title={t(locale, "stream.english.sold.title", {
        name: label(winner) ?? winner,
        price: formatEth(locale, settlement.price),
      })}
      lines={
        pending === null
          ? [line("delivered", t(locale, "stream.english.sold.delivered"))]
          : [
              line("refused", t(locale, "stream.english.sold.refused")),
              line("pending", t(locale, "stream.english.sold.pending")),
            ]
      }
    >
      <dl className="tw-m-0 tw-grid tw-grid-cols-2 tw-gap-2">
        <SmallFact
          label={t(locale, "stream.english.sold.artistSide", {
            share: shareText(context, SPLITS_DENOMINATOR - feeShare),
          })}
        >
          <EthAmount wei={settlement.sellerProceeds} locale={locale} />
        </SmallFact>
        <SmallFact
          label={t(locale, "stream.english.sold.network", {
            share: shareText(context, feeShare),
          })}
        >
          <EthAmount wei={settlement.fee} locale={locale} />
        </SmallFact>
      </dl>
      {pending === null ? null : (
        <ClaimDelivery context={context} recipient={pending} />
      )}
    </Notice>
  );
}

function UnsoldBlock({ context }: { readonly context: EnglishPanelContext }) {
  const { auction, locale } = context;
  const toMuseum = auction.settlement?.outcome === "museum";
  let reason: MessageKey = "stream.english.unsold.noBids";
  if (auction.bids.length > 0) {
    reason = isDelisted(context)
      ? "stream.english.unsold.delisted"
      : "stream.english.unsold.noWinner";
  }
  return (
    <Notice
      tone="neutral"
      title={t(locale, reason)}
      lines={[
        line(
          "where",
          toMuseum
            ? t(locale, "stream.english.unsold.museum")
            : t(locale, "stream.english.unsold.artist")
        ),
      ]}
    >
      {toMuseum ? (
        <Link
          href={STREAM_ROUTES.museum}
          className={`tw-text-sm tw-text-primary-300 tw-no-underline hover:tw-underline ${STREAM_FOCUS}`}
        >
          {t(locale, "stream.english.unsold.museumLink")}
        </Link>
      ) : null}
    </Notice>
  );
}

function CancelledBlock({
  context,
}: {
  readonly context: EnglishPanelContext;
}) {
  const { locale, editions, work } = context;
  const outcome = work?.dispute.statements.findLast(
    (statement) => statement.kind === "DISPUTE_OUTCOME"
  );
  const lines: NoticeLine[] = [
    line("refunded", t(locale, "stream.english.cancelled.refunded")),
  ];
  if (editions !== null) {
    lines.push(
      line("editions", t(locale, "stream.english.cancelled.editions"))
    );
  }
  if (outcome !== undefined) {
    lines.push(
      line(
        "statement",
        t(locale, "stream.english.cancelled.statement", {
          summary: outcome.summary,
        })
      )
    );
  }
  return (
    <Notice
      tone="danger"
      title={t(locale, "stream.english.cancelled.title")}
      lines={lines}
    />
  );
}

/** What the auction needs or shows now: bid, withdraw, settle, claim, or its result. */
export function EnglishStateBlock({
  context,
}: {
  readonly context: EnglishPanelContext;
}) {
  const { auction, locale } = context;
  switch (auction.state) {
    case "NONE":
      return (
        <p className={STREAM_HELP}>{t(locale, "stream.english.notStarted")}</p>
      );
    case "ACTIVE":
      return <BidForm context={context} />;
    case "PAUSED":
      return <PausedBlock context={context} />;
    case "ENDED":
      return <EndedBlock context={context} />;
    case "SETTLED":
      return auction.settlement?.outcome === "collector" ? (
        <SoldBlock context={context} />
      ) : (
        <UnsoldBlock context={context} />
      );
    case "CANCELLED":
      return <CancelledBlock context={context} />;
  }
}

/** After a dispute pause that ended without a cancel: the auction resumed. */
export function ResumedNote({
  context,
}: {
  readonly context: EnglishPanelContext;
}) {
  const { auction, locale } = context;
  const resumed =
    auction.pause.used &&
    auction.pause.pausedAt === null &&
    auction.state !== "CANCELLED";
  if (!resumed) {
    return null;
  }
  return (
    <p className={`${STREAM_HELP} tw-mt-3`}>
      {t(locale, "stream.english.resumed", {
        time: formatDuration(locale, auction.pause.pausedTotal),
      })}
    </p>
  );
}
