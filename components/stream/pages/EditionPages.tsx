"use client";

import Link from "next/link";

import {
  useStream,
  useStreamNow,
  useStreamQuery,
} from "@/components/stream/data/StreamProvider";
import BarList from "@/components/stream/diagrams/BarList";
import OrderBookTable from "@/components/stream/diagrams/OrderBookTable";
import {
  Empty,
  Facts,
  Loading,
  NotFoundNote,
  PageHeader,
  PlaceholderNote,
  Section,
} from "@/components/stream/pages/common";
import Countdown from "@/components/stream/ui/Countdown";
import EthAmount, { formatEth } from "@/components/stream/ui/EthAmount";
import {
  editionPhaseBadge,
  SpecBadge,
} from "@/components/stream/ui/StatusBadge";
import {
  STREAM_CARD,
  STREAM_FOCUS,
  STREAM_HEADING,
  STREAM_HELP,
  STREAM_LABEL,
} from "@/components/stream/ui/styles";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger, formatPercent } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { type MessageKey, t } from "@/i18n/messages";
import "@/i18n/namespaces/stream";
import { acceptsBids } from "@/lib/stream/editionTiming";
import type {
  EditionAuction,
  EditionCandidate,
  WorkKey,
} from "@/lib/stream/types";
import { parseWorkKey, STREAM_ROUTES, workKeyFor } from "@/lib/stream/workKey";

/** /stream/editions: every 6529 Stream Editions auction. */
export function EditionsIndexPage() {
  const locale = useBrowserLocale();
  const now = useStreamNow();
  const { data: auctions } = useStreamQuery("edition-auctions", [], (source) =>
    source.listEditionAuctions()
  );
  return (
    <div>
      <PageHeader
        title={t(locale, "stream.editions.title")}
        intro={t(locale, "stream.editions.intro")}
      >
        <PlaceholderNote locale={locale} />
      </PageHeader>
      {auctions === undefined ? <Loading /> : null}
      {auctions?.length === 0 ? (
        <Empty text={t(locale, "stream.editions.empty")} />
      ) : null}
      <ul className="tw-m-0 tw-grid tw-list-none tw-gap-3 tw-p-0">
        {(auctions ?? []).map((auction) => (
          <li
            key={auction.edition}
            className={`${STREAM_CARD} tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-3 tw-p-4`}
          >
            <Link
              href={STREAM_ROUTES.edition(auction.edition)}
              className={`tw-text-sm tw-font-semibold tw-text-iron-50 tw-no-underline hover:tw-underline ${STREAM_FOCUS}`}
            >
              <EditionTitle edition={auction.edition} />
            </Link>
            <span className="tw-flex tw-flex-wrap tw-items-center tw-gap-3 tw-text-sm tw-text-iron-200">
              <SpecBadge
                spec={editionPhaseBadge(auction.phase)}
                locale={locale}
              />
              {auction.clearing.count > 0 ? (
                <span className="tw-tabular-nums">
                  {t(locale, "stream.card.editionsAt", {
                    count: formatInteger(locale, auction.clearing.count),
                  })}{" "}
                  <EthAmount wei={auction.clearing.price} locale={locale} />
                </span>
              ) : null}
              <Countdown
                endTime={auction.times.editionEnd}
                now={now}
                locale={locale}
                className="tw-text-xs tw-text-iron-400"
              />
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function EditionTitle({ edition }: { readonly edition: WorkKey }) {
  const { data: work } = useStreamQuery("work", [edition], (source) =>
    source.getWork(edition)
  );
  return <>{work?.title ?? edition}</>;
}

function resultLabel(auction: EditionAuction): MessageKey {
  if (auction.settled || auction.phase === "void") {
    return "stream.edition.final";
  }
  return acceptsBids(auction.phase)
    ? "stream.edition.ifClosedNow"
    : "stream.edition.closedSettle";
}

function ResultCard({
  auction,
  locale,
}: {
  readonly auction: EditionAuction;
  readonly locale: SupportedLocale;
}) {
  const now = useStreamNow();
  const { clearing } = auction;
  return (
    <div className={`${STREAM_CARD} tw-p-5`}>
      <p className={STREAM_LABEL}>{t(locale, resultLabel(auction))}</p>
      <p className={`${STREAM_HEADING} tw-mt-2 tw-text-2xl tw-tabular-nums`}>
        {clearing.count === 0
          ? t(locale, "stream.edition.noEditions")
          : t(locale, "stream.edition.result", {
              count: formatInteger(locale, clearing.count),
              price: formatEth(locale, clearing.price),
            })}
      </p>
      {clearing.count === 0 ? null : (
        <p className={`${STREAM_HELP} tw-mt-1`}>
          {t(locale, "stream.edition.raised", {
            revenue: formatEth(locale, clearing.revenue),
            artist: formatEth(locale, clearing.sellerShare),
            network: formatEth(locale, clearing.networkShare),
          })}
        </p>
      )}
      <div className="tw-mt-4">
        <Facts
          items={[
            {
              label: t(locale, "stream.edition.state"),
              value: (
                <SpecBadge
                  spec={editionPhaseBadge(auction.phase)}
                  locale={locale}
                />
              ),
            },
            {
              label: t(locale, "stream.edition.closes"),
              value: (
                <Countdown
                  endTime={auction.times.editionEnd}
                  now={now}
                  locale={locale}
                  closeWindow={auction.terms.softWindow}
                  extended={auction.phase === "extended"}
                />
              ),
            },
            {
              label: t(locale, "stream.edition.cap"),
              value:
                auction.terms.cap === 0
                  ? t(locale, "stream.sale.edition.noCap")
                  : formatInteger(locale, auction.terms.cap),
            },
          ]}
        />
      </div>
    </div>
  );
}

function candidateTag(
  candidate: EditionCandidate,
  locale: SupportedLocale
): { readonly tag?: string } {
  if (candidate.chosen) {
    return { tag: t(locale, "stream.edition.tagSells") };
  }
  return candidate.best ? { tag: t(locale, "stream.edition.tagMost") } : {};
}

function Candidates({
  edition,
  locale,
}: {
  readonly edition: WorkKey;
  readonly locale: SupportedLocale;
}) {
  const { data: candidates } = useStreamQuery(
    "candidates",
    [edition],
    (source) => source.candidates(edition)
  );
  if (candidates === undefined) {
    return <Loading />;
  }
  if (candidates.length === 0) {
    return <Empty text={t(locale, "stream.edition.candidatesEmpty")} />;
  }
  return (
    <BarList
      label={t(locale, "stream.edition.candidates")}
      marker={0.9}
      markerLabel={t(locale, "stream.edition.thresholdNote", {
        share: formatPercent(locale, 0.9, 0),
      })}
      items={candidates.map((candidate) => ({
        key: String(candidate.step),
        label: t(locale, "stream.edition.candidate", {
          count: formatInteger(locale, candidate.count),
          price: formatEth(locale, candidate.price),
        }),
        fraction: candidate.shareOfBestBps / 10_000,
        value: formatEth(locale, candidate.revenue),
        emphasis: candidate.chosen,
        ...candidateTag(candidate, locale),
      }))}
    />
  );
}

function YourBids({
  edition,
  open,
  locale,
}: {
  readonly edition: WorkKey;
  /** Bidding is open, so the lowest step that gets in means something. */
  readonly open: boolean;
  readonly locale: SupportedLocale;
}) {
  const { account } = useStream();
  const { data: bids } = useStreamQuery(
    "edition-bids",
    [edition, account],
    (source) =>
      account === null
        ? Promise.resolve([])
        : source.editionBids(edition, account)
  );
  const { data: lowest } = useStreamQuery("lowest-in", [edition, 1], (source) =>
    source.lowestStepFullyIn(edition, 1)
  );
  const { data: prices } = useStreamQuery("ladder", [edition], (source) =>
    source.ladder(edition)
  );
  const priceOf = (step: number | null | undefined) =>
    step === null || step === undefined ? null : (prices?.[step] ?? null);
  const lowestPrice = priceOf(lowest);
  return (
    <div className="tw-space-y-3">
      {!open || lowestPrice === null ? null : (
        <p className={STREAM_HELP}>
          {t(locale, "stream.edition.lowestIn", {
            price: formatEth(locale, lowestPrice),
          })}
        </p>
      )}
      {bids === undefined || bids.length === 0 ? (
        <Empty text={t(locale, "stream.edition.noBidsYours")} />
      ) : (
        <ul className="tw-m-0 tw-list-none tw-space-y-2 tw-p-0">
          {bids.map((bid) => {
            const raise = priceOf(bid.raiseToGetIn);
            return (
              <li
                key={bid.bidId}
                className="tw-text-sm tw-tabular-nums tw-text-iron-200"
              >
                {t(locale, `stream.edition.bid.${bid.status}`, {
                  qty: formatInteger(locale, bid.qty),
                  won: formatInteger(locale, bid.won),
                  price: formatEth(locale, bid.price),
                  refund: formatEth(locale, bid.refund),
                })}
                {raise === null ? null : (
                  <span className="tw-ml-2 tw-text-primary-300">
                    {t(locale, "stream.edition.raiseTo", {
                      price: formatEth(locale, raise),
                    })}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function EditionBody({
  auction,
  locale,
}: {
  readonly auction: EditionAuction;
  readonly locale: SupportedLocale;
}) {
  const { account } = useStream();
  const { data: rows } = useStreamQuery(
    "step-totals",
    [auction.edition],
    (source) => source.stepTotals(auction.edition)
  );
  const { data: mine } = useStreamQuery(
    "edition-bids",
    [auction.edition, account],
    (source) =>
      account === null
        ? Promise.resolve([])
        : source.editionBids(auction.edition, account)
  );
  const mineByStep = new Map<number, number>();
  for (const bid of mine ?? []) {
    if (!bid.withdrawn) {
      mineByStep.set(bid.step, (mineByStep.get(bid.step) ?? 0) + bid.qty);
    }
  }
  return (
    <>
      <div className="tw-grid tw-gap-4 lg:tw-grid-cols-2">
        <ResultCard auction={auction} locale={locale} />
        <div className={`${STREAM_CARD} tw-p-5`}>
          <p className={STREAM_LABEL}>{t(locale, "stream.edition.yourBids")}</p>
          <div className="tw-mt-3">
            <YourBids
              edition={auction.edition}
              open={acceptsBids(auction.phase)}
              locale={locale}
            />
          </div>
        </div>
      </div>
      <Section title={t(locale, "stream.edition.book")}>
        {rows === undefined ? (
          <Loading />
        ) : (
          <OrderBookTable
            rows={rows}
            count={auction.clearing.count}
            clearingStep={auction.clearing.step}
            locale={locale}
            mine={mineByStep}
          />
        )}
      </Section>
      <Section title={t(locale, "stream.edition.why")}>
        <Candidates edition={auction.edition} locale={locale} />
      </Section>
    </>
  );
}

/**
 * /stream/editions/[id]: one edition auction. A bare number is the 6529 Stream
 * Editions edition of that master (the edition ID is the master's token ID);
 * `<contract>-<id>` is a federated edition.
 */
export function EditionPage({ param }: { readonly param: string }) {
  const { client } = useStream();
  const parsed = parseWorkKey(param);
  const editions = client?.dataSource.source().contracts.editions ?? null;
  let editionKey: WorkKey = param;
  if (parsed?.kind === "stream" && editions !== null) {
    editionKey = workKeyFor(
      editions,
      parsed.tokenId,
      client?.dataSource.source().contracts.stream ?? editions
    );
  }
  return <EditionPageBody editionKey={editionKey} />;
}

function EditionPageBody({ editionKey }: { readonly editionKey: WorkKey }) {
  const locale = useBrowserLocale();
  const { data: auction } = useStreamQuery(
    "edition-auction",
    [editionKey],
    (source) => source.getEditionAuction(editionKey)
  );
  const { data: work } = useStreamQuery("work", [editionKey], (source) =>
    source.getWork(editionKey)
  );
  if (auction === undefined) {
    return <Loading />;
  }
  if (auction === null) {
    return <NotFoundNote locale={locale} />;
  }
  return (
    <div>
      <PageHeader
        title={work?.title ?? t(locale, "stream.editions.title")}
        intro={t(locale, "stream.edition.rule")}
      >
        <PlaceholderNote locale={locale} />
      </PageHeader>
      <EditionBody auction={auction} locale={locale} />
    </div>
  );
}
