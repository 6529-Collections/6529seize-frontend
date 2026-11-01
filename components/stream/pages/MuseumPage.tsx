"use client";

import {
  actionLabel,
  WorkCell,
  workHref,
} from "@/components/stream/browse/cells";
import { partyNames, thumbnailOf } from "@/components/stream/browse/reads";
import StreamTable from "@/components/stream/browse/StreamTable";
import { useStreamQuery } from "@/components/stream/data/StreamProvider";
import {
  type MuseumBoard,
  readMuseumBoard,
} from "@/components/stream/museum/museumBoard";
import {
  ActionMessage,
  Empty,
  Facts,
  Loading,
  PageHeader,
  Section,
  useStreamAction,
} from "@/components/stream/pages/common";
import { AddressChip } from "@/components/stream/ui/AddressChip";
import StatusBadge from "@/components/stream/ui/StatusBadge";
import {
  STREAM_BUTTON_SECONDARY,
  STREAM_TEXT,
} from "@/components/stream/ui/styles";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger, formatUtcDate } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/stream";
import type { Hex32 } from "@/lib/stream/types";

function shortHash(hash: Hex32): string {
  return `${hash.slice(0, 10)}…${hash.slice(-6)}`;
}

function HoldingsTable({
  board,
  locale,
}: {
  readonly board: MuseumBoard;
  readonly locale: SupportedLocale;
}) {
  if (board.holdings.length === 0) {
    return <Empty text={t(locale, "stream.museum.empty")} />;
  }
  return (
    <StreamTable
      caption={t(locale, "stream.museum.holdings")}
      columns={[
        { key: "work", label: t(locale, "stream.browse.col.work") },
        { key: "how", label: t(locale, "stream.museum.col.how") },
        {
          key: "arrived",
          label: t(locale, "stream.museum.col.arrived"),
          numeric: true,
        },
        { key: "tx", label: t(locale, "stream.museum.col.tx"), wide: true },
      ]}
      rows={board.holdings.map(({ holding, work }) => ({
        key: holding.work,
        cells: [
          work === null ? (
            holding.work
          ) : (
            <WorkCell
              key="work"
              href={workHref(work)}
              title={work.title}
              detail={partyNames(work)}
              thumbnail={thumbnailOf(work)}
            />
          ),
          <StatusBadge
            key="how"
            tone={holding.reason === "no-bids" ? "info" : "warning"}
            label={t(locale, `stream.museum.reason.${holding.reason}`)}
          />,
          formatUtcDate(locale, holding.arrivedAt * 1_000),
          <span key="tx" className="tw-font-mono tw-text-xs tw-text-iron-400">
            {shortHash(holding.txHash)}
          </span>,
        ],
      }))}
    />
  );
}

function IncomingTable({
  board,
  locale,
}: {
  readonly board: MuseumBoard;
  readonly locale: SupportedLocale;
}) {
  const { run, pending, message } = useStreamAction(locale);
  return (
    <>
      {board.incoming.length === 0 ? (
        <Empty text={t(locale, "stream.museum.incomingEmpty")} />
      ) : (
        <StreamTable
          caption={t(locale, "stream.museum.incoming")}
          columns={[
            { key: "work", label: t(locale, "stream.browse.col.work") },
            {
              key: "ended",
              label: t(locale, "stream.museum.col.ended"),
              numeric: true,
            },
            { key: "action", label: t(locale, "stream.me.col.action") },
          ]}
          rows={board.incoming.map(({ work, auction }) => ({
            key: work.key,
            cells: [
              <WorkCell
                key="work"
                href={workHref(work)}
                title={work.title}
                detail={partyNames(work)}
                thumbnail={thumbnailOf(work)}
              />,
              formatUtcDate(locale, auction.endTime * 1_000),
              <button
                key="action"
                type="button"
                className={`${STREAM_BUTTON_SECONDARY} tw-whitespace-nowrap tw-px-3 tw-py-1.5`}
                aria-label={actionLabel(
                  locale,
                  t(locale, "stream.me.action.settle"),
                  work.title
                )}
                disabled={pending}
                onClick={() => {
                  void run((actions, from) =>
                    actions.sale("ENGLISH_AUCTION").settle(from, auction.saleId)
                  );
                }}
              >
                {t(locale, "stream.me.action.settle")}
              </button>,
            ],
          }))}
        />
      )}
      <ActionMessage message={message} />
    </>
  );
}

/** /stream/museum: the 6529 Network Museum's works and how each arrived. */
export function MuseumPage() {
  const locale = useBrowserLocale();
  const { data: board } = useStreamQuery("museum-board", [], readMuseumBoard);
  return (
    <div>
      <PageHeader
        title={t(locale, "stream.museum.title")}
        intro={t(locale, "stream.museum.intro")}
      >
        <p className={`${STREAM_TEXT} tw-mt-2`}>
          {t(locale, "stream.museum.rule")}
        </p>
      </PageHeader>
      {board === undefined ? (
        <Loading />
      ) : (
        <>
          <Facts
            items={[
              {
                label: t(locale, "stream.museum.address"),
                value: <AddressChip address={board.address} locale={locale} />,
              },
              {
                label: t(locale, "stream.museum.held"),
                value: formatInteger(locale, board.holdings.length),
              },
            ]}
          />
          <Section title={t(locale, "stream.museum.holdings")}>
            <HoldingsTable board={board} locale={locale} />
          </Section>
          <Section title={t(locale, "stream.museum.incoming")}>
            <IncomingTable board={board} locale={locale} />
          </Section>
        </>
      )}
    </div>
  );
}
