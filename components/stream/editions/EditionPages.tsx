"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import {
  useStream,
  useStreamNow,
  useStreamQuery,
} from "@/components/stream/data/StreamProvider";
import EditionAuctionPanel from "@/components/stream/editions/EditionAuctionPanel";
import {
  clockText,
  editionsText,
  ethText,
  priceText,
  sameAddress,
} from "@/components/stream/editions/format";
import { PANEL_ACTION, PANEL_NOTE } from "@/components/stream/editions/parts";
import {
  Empty,
  Facts,
  Loading,
  NotFoundNote,
  PageHeader,
  Section,
} from "@/components/stream/pages/common";
import { AddressChip, ArtistChip } from "@/components/stream/ui/AddressChip";
import Countdown from "@/components/stream/ui/Countdown";
import {
  editionPhaseBadge,
  SpecBadge,
} from "@/components/stream/ui/StatusBadge";
import {
  STREAM_CARD,
  STREAM_FOCUS,
  STREAM_HEADING,
  STREAM_LABEL,
} from "@/components/stream/ui/styles";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { type MessageKey, t } from "@/i18n/messages";
import "@/i18n/namespaces/stream";
import type {
  EditionAuction,
  EditionAuctionPhase,
  OneOfOneAuction,
  StreamWork,
  WorkKey,
} from "@/lib/stream/types";
import { parseWorkKey, STREAM_ROUTES, workKeyFor } from "@/lib/stream/workKey";

/** The image a list or header shows: the inline image, else the generated preview. */
function imageOf(work: StreamWork | null | undefined): string | null {
  if (work === null || work === undefined) {
    return null;
  }
  const primary = work.media.find((file) => file.role === "PRIMARY");
  if (primary?.kind === "image" && primary.displayUri !== null) {
    return primary.displayUri;
  }
  return work.media.find((file) => file.role === "PREVIEW")?.displayUri ?? null;
}

function Thumb({
  work,
  size,
  locale,
}: {
  readonly work: StreamWork | null | undefined;
  readonly size: string;
  readonly locale: SupportedLocale;
}) {
  const uri = imageOf(work);
  return (
    <div
      className={`tw-relative tw-flex-none tw-overflow-hidden tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.07] tw-bg-iron-900 ${size}`}
    >
      {uri === null || work === null || work === undefined ? null : (
        <Image
          src={uri}
          alt={t(locale, "stream.media.alt", { title: work.title })}
          fill
          unoptimized
          sizes="168px"
          className="tw-object-cover"
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// /stream/editions
// ---------------------------------------------------------------------------

type Group = "live" | "closed" | "done";

const GROUP_OF: Readonly<Record<EditionAuctionPhase, Group>> = {
  opening: "live",
  open: "live",
  oneOfOneEnded: "live",
  extended: "live",
  disputed: "live",
  closed: "closed",
  settling: "closed",
  noBids: "closed",
  settled: "done",
  void: "done",
};

const GROUP_TITLE: Readonly<Record<Group, MessageKey>> = {
  live: "stream.editionPages.list.live",
  closed: "stream.editionPages.list.closed",
  done: "stream.editionPages.list.done",
};

function groupOf(auction: EditionAuction): Group {
  // A sale with no bids that settled reads as done.
  return auction.settled ? "done" : GROUP_OF[auction.phase];
}

function resultText(locale: SupportedLocale, auction: EditionAuction): string {
  if (auction.phase === "void") {
    return t(locale, "stream.editionPages.list.void");
  }
  if (auction.clearing.count === 0) {
    return t(
      locale,
      auction.biddingOpen || auction.status === "NONE"
        ? "stream.editionPages.list.noBidsYet"
        : "stream.editionPages.list.noEditions"
    );
  }
  return t(locale, "stream.editionPages.list.result", {
    editions: editionsText(locale, auction.clearing.count),
    price: priceText(locale, auction.clearing.price),
  });
}

function EditionRow({
  auction,
  locale,
  now,
}: {
  readonly auction: EditionAuction;
  readonly locale: SupportedLocale;
  readonly now: number;
}) {
  const { data: work } = useStreamQuery("work", [auction.edition], (source) =>
    source.getWork(auction.edition)
  );
  const open = auction.biddingOpen || auction.status === "NONE";
  return (
    <li
      className={`${STREAM_CARD} tw-grid tw-grid-cols-[3rem_minmax(0,1fr)] tw-items-center tw-gap-x-3 tw-gap-y-2 tw-p-3 sm:tw-grid-cols-[3rem_minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)] sm:tw-gap-x-4`}
    >
      <Thumb work={work} size="tw-size-12" locale={locale} />
      <div className="tw-min-w-0">
        <Link
          href={STREAM_ROUTES.edition(auction.edition)}
          className={`tw-block tw-truncate tw-rounded-sm tw-text-sm tw-font-semibold tw-text-iron-50 tw-no-underline hover:tw-underline ${STREAM_FOCUS}`}
        >
          {work?.title ?? auction.edition}
        </Link>
        <p className="tw-m-0 tw-truncate tw-text-xs tw-text-iron-400">
          {work?.parties.map((party) => party.displayName).join(" · ") ?? ""}
        </p>
      </div>
      <p className="tw-col-start-2 tw-m-0 tw-text-sm tw-tabular-nums tw-text-iron-200 sm:tw-col-start-auto">
        {resultText(locale, auction)}
      </p>
      <div className="tw-col-start-2 tw-flex tw-flex-wrap tw-items-center tw-gap-x-2 tw-gap-y-1 sm:tw-col-start-auto sm:tw-justify-end">
        <SpecBadge spec={editionPhaseBadge(auction.phase)} locale={locale} />
        {open && auction.status !== "NONE" && auction.phase !== "disputed" ? (
          <Countdown
            endTime={auction.times.editionEnd}
            now={now}
            locale={locale}
            className="tw-text-xs tw-text-iron-400"
          />
        ) : null}
      </div>
    </li>
  );
}

/** /stream/editions: every 6529 Stream Editions sale, live first. */
export function EditionsIndexPage() {
  const locale = useBrowserLocale();
  const now = useStreamNow();
  const { data: auctions } = useStreamQuery("edition-auctions", [], (source) =>
    source.listEditionAuctions()
  );
  const groups: Record<Group, EditionAuction[]> = {
    live: [],
    closed: [],
    done: [],
  };
  for (const auction of auctions ?? []) {
    groups[groupOf(auction)].push(auction);
  }
  groups.live.sort((a, b) => a.times.editionEnd - b.times.editionEnd);
  groups.closed.sort((a, b) => b.times.editionEnd - a.times.editionEnd);
  groups.done.sort((a, b) => b.times.editionEnd - a.times.editionEnd);
  return (
    <div>
      <PageHeader
        title={t(locale, "stream.editions.title")}
        intro={t(locale, "stream.editionPages.list.intro")}
      />
      {auctions === undefined ? <Loading /> : null}
      {auctions?.length === 0 ? (
        <Empty text={t(locale, "stream.editions.empty")} />
      ) : null}
      {(["live", "closed", "done"] as const).map((group) =>
        groups[group].length === 0 ? null : (
          <Section key={group} title={t(locale, GROUP_TITLE[group])}>
            <ul className="tw-m-0 tw-grid tw-list-none tw-gap-2 tw-p-0">
              {groups[group].map((auction) => (
                <EditionRow
                  key={auction.edition}
                  auction={auction}
                  locale={locale}
                  now={now}
                />
              ))}
            </ul>
          </Section>
        )
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// /stream/editions/[id]
// ---------------------------------------------------------------------------

function oneOfOneText(
  locale: SupportedLocale,
  auction: OneOfOneAuction
): string {
  const settlement = auction.settlement;
  switch (auction.state) {
    case "ACTIVE":
      return auction.bids.length === 0
        ? t(locale, "stream.editionPages.one.noBidsYet")
        : t(locale, "stream.editionPages.one.top", {
            amount: ethText(locale, auction.highBid),
            bids: formatInteger(locale, auction.bids.length),
          });
    case "PAUSED":
      return t(locale, "stream.editionPages.one.paused");
    case "ENDED":
      return t(locale, "stream.editionPages.one.ended");
    case "CANCELLED":
      return t(locale, "stream.editionPages.one.cancelled");
    case "SETTLED":
      if (settlement?.outcome === "museum") {
        return t(locale, "stream.editionPages.one.museum");
      }
      if (settlement?.outcome === "artist") {
        return t(locale, "stream.editionPages.one.artist");
      }
      return t(locale, "stream.editionPages.one.sold", {
        amount: ethText(locale, settlement?.price ?? auction.highBid),
      });
    case "NONE":
      return t(locale, "stream.editionPages.one.none");
  }
}

/** The master's 1/1 in one box: its state, its end, and a link to it. */
function OneOfOneBox({
  master,
  locale,
  now,
}: {
  readonly master: WorkKey;
  readonly locale: SupportedLocale;
  readonly now: number;
}) {
  const { data: auction } = useStreamQuery(
    "edition-master-auction",
    [master],
    (source) => source.auctionForWork(master)
  );
  const { data: work } = useStreamQuery("work", [master], (source) =>
    source.getWork(master)
  );
  if (auction === undefined || auction === null) {
    return null;
  }
  return (
    <div
      className={`${STREAM_CARD} tw-mt-3 tw-grid tw-max-w-[520px] tw-gap-0.5 tw-px-3.5 tw-py-3`}
    >
      <div className="tw-flex tw-items-baseline tw-justify-between tw-gap-2">
        <p className={STREAM_LABEL}>
          {t(locale, "stream.editionPages.one.label")}
        </p>
        <Link
          href={STREAM_ROUTES.work(master)}
          className={`tw-rounded-sm tw-text-xs tw-font-medium tw-text-primary-300 tw-no-underline hover:tw-underline ${STREAM_FOCUS}`}
        >
          {t(locale, "stream.editionPages.one.link", {
            title: work?.title ?? "",
          })}
        </Link>
      </div>
      <p className="tw-m-0 tw-text-base tw-font-semibold tw-tabular-nums tw-text-iron-50">
        {oneOfOneText(locale, auction)}
      </p>
      {auction.state === "ACTIVE" ? (
        <p className={`${PANEL_NOTE} tw-tabular-nums`}>
          {t(locale, "stream.editionPages.one.ends", {
            time: clockText(locale, auction.endTime, now),
          })}{" "}
          <Countdown
            endTime={auction.endTime}
            now={now}
            locale={locale}
            closeWindow={auction.config.extensionWindow}
          />
        </p>
      ) : null}
    </div>
  );
}

function suppliedText(
  locale: SupportedLocale,
  auction: EditionAuction
): string {
  if (auction.settled) {
    return editionsText(locale, auction.clearing.count);
  }
  if (auction.phase === "void") {
    return t(locale, "stream.editionPages.facts.none");
  }
  return t(
    locale,
    auction.status === "SETTLING"
      ? "stream.editionPages.facts.settling"
      : "stream.editionPages.facts.atClose"
  );
}

function EditionFacts({
  auction,
  work,
  master,
  locale,
}: {
  readonly auction: EditionAuction;
  readonly work: StreamWork | null | undefined;
  readonly master: StreamWork | null | undefined;
  readonly locale: SupportedLocale;
}) {
  const items: { label: string; value: ReactNode }[] = [];
  if (auction.master !== null) {
    items.push({
      label: t(locale, "stream.editionPages.facts.master"),
      value: (
        <Link
          href={STREAM_ROUTES.work(auction.master)}
          className={`tw-rounded-sm tw-text-primary-300 tw-no-underline hover:tw-underline ${STREAM_FOCUS}`}
        >
          {master?.title ?? auction.master}
        </Link>
      ),
    });
  }
  items.push(
    {
      label: t(locale, "stream.editionPages.facts.supply"),
      value: suppliedText(locale, auction),
    },
    {
      label: t(locale, "stream.editionPages.facts.minted"),
      value: formatInteger(locale, work?.editionSupply ?? 0),
    },
    {
      label: t(locale, "stream.editionPages.facts.cap"),
      value:
        auction.terms.cap === 0
          ? t(locale, "stream.editionPages.facts.noCap")
          : formatInteger(locale, auction.terms.cap),
    },
    {
      label: t(locale, "stream.editionPages.facts.license"),
      value: work?.license?.spdxId ?? master?.license?.spdxId ?? "–",
    },
    {
      label: t(locale, "stream.editionPages.facts.id"),
      value: work === null || work === undefined ? "–" : `#${work.tokenId}`,
    }
  );
  return <Facts items={items} />;
}

function Holders({
  edition,
  locale,
}: {
  readonly edition: WorkKey;
  readonly locale: SupportedLocale;
}) {
  const { account } = useStream();
  const { data: holders } = useStreamQuery(
    "edition-holders",
    [edition],
    (source) => source.editionHolders(edition)
  );
  if (holders === undefined) {
    return <Loading />;
  }
  if (holders.length === 0) {
    return <Empty text={t(locale, "stream.editionPages.holders.empty")} />;
  }
  return (
    <div className="tw-overflow-x-auto">
      <table className="tw-w-full tw-max-w-xl tw-border-collapse tw-text-left tw-text-sm tw-tabular-nums">
        <caption className="tw-sr-only">
          {t(locale, "stream.editionPages.holders.caption")}
        </caption>
        <thead>
          <tr className="tw-border-0 tw-border-b tw-border-solid tw-border-white/[0.07]">
            <th scope="col" className={`${STREAM_LABEL} tw-pb-2 tw-pr-3`}>
              {t(locale, "stream.editionPages.holders.holder")}
            </th>
            <th scope="col" className={`${STREAM_LABEL} tw-pb-2 tw-text-right`}>
              {t(locale, "stream.editionPages.holders.editions")}
            </th>
          </tr>
        </thead>
        <tbody>
          {holders.map((holder) => (
            <tr
              key={holder.account}
              className="tw-border-0 tw-border-b tw-border-solid tw-border-white/[0.07]"
            >
              <td className="tw-py-2 tw-pr-3">
                <AddressChip address={holder.account} locale={locale} />
                {sameAddress(holder.account, account) ? (
                  <span className="tw-ml-2 tw-text-xs tw-font-semibold tw-text-primary-300">
                    {t(locale, "stream.editionAuction.activity.you")}
                  </span>
                ) : null}
              </td>
              <td className="tw-py-2 tw-text-right tw-text-iron-100">
                {formatInteger(locale, holder.balance)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const HOW_STEPS: readonly MessageKey[] = [
  "stream.editionPages.how.one",
  "stream.editionPages.how.two",
  "stream.editionPages.how.three",
  "stream.editionPages.how.four",
];

function HowItWorks({ locale }: { readonly locale: SupportedLocale }) {
  return (
    <ol className="tw-m-0 tw-grid tw-max-w-[62ch] tw-list-none tw-gap-3.5 tw-p-0">
      {HOW_STEPS.map((key, index) => (
        <li
          key={key}
          className="tw-grid tw-grid-cols-[1.75rem_minmax(0,1fr)] tw-gap-3 tw-text-[15px] tw-leading-6 tw-text-iron-200"
        >
          <span
            aria-hidden="true"
            className="tw-flex tw-size-7 tw-items-center tw-justify-center tw-rounded-lg tw-bg-iron-800 tw-text-[13px] tw-font-semibold tw-text-iron-200"
          >
            {formatInteger(locale, index + 1)}
          </span>
          <span>{t(locale, key)}</span>
        </li>
      ))}
    </ol>
  );
}

/** Mock only: other bidders join, so the price and the count can be seen moving. */
function MockBidders({
  edition,
  locale,
}: {
  readonly edition: WorkKey;
  readonly locale: SupportedLocale;
}) {
  const { client } = useStream();
  const dev = client?.dev ?? null;
  if (dev === null) {
    return null;
  }
  return (
    <div className="tw-mb-4 tw-flex tw-flex-wrap tw-items-center tw-gap-2 tw-rounded-lg tw-border tw-border-dashed tw-border-white/15 tw-px-3 tw-py-2">
      <span className="tw-text-[11px] tw-font-bold tw-uppercase tw-tracking-[0.14em] tw-text-amber-300">
        {t(locale, "stream.editionPages.mock.label")}
      </span>
      <span className="tw-text-[13px] tw-text-iron-400">
        {t(locale, "stream.editionPages.mock.note")}
      </span>
      <button
        type="button"
        className={PANEL_ACTION}
        onClick={() => dev.simulateEditionBids(edition, 1)}
      >
        {t(locale, "stream.editionPages.mock.one")}
      </button>
      <button
        type="button"
        className={PANEL_ACTION}
        onClick={() => dev.simulateEditionBids(edition, 10)}
      >
        {t(locale, "stream.editionPages.mock.ten")}
      </button>
    </div>
  );
}

function EditionHeader({
  auction,
  work,
  master,
  locale,
  now,
}: {
  readonly auction: EditionAuction;
  readonly work: StreamWork | null | undefined;
  readonly master: StreamWork | null | undefined;
  readonly locale: SupportedLocale;
  readonly now: number;
}) {
  const lead = (work ?? master)?.parties[0];
  return (
    <header className="tw-flex tw-flex-col tw-gap-4 tw-pb-6 sm:tw-flex-row sm:tw-items-start sm:tw-gap-6">
      <Thumb
        work={work ?? master}
        size="tw-aspect-[4/5] tw-w-32 sm:tw-w-[168px]"
        locale={locale}
      />
      <div className="tw-grid tw-min-w-0 tw-flex-1 tw-gap-1">
        <p className={STREAM_LABEL}>
          {t(
            locale,
            auction.program === "federated"
              ? "stream.editionPages.page.labelFederated"
              : "stream.editionPages.page.label"
          )}
        </p>
        <h1
          className={`${STREAM_HEADING} tw-text-[26px] tw-leading-tight sm:tw-text-4xl`}
        >
          {work?.title ?? master?.title ?? auction.edition}
        </h1>
        {lead === undefined ? null : (
          <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2 tw-text-sm tw-text-iron-400">
            <span>{t(locale, "stream.editionPages.page.by")}</span>
            <ArtistChip
              artistId={lead.artistId}
              name={lead.displayName}
              locale={locale}
            />
          </div>
        )}
        {auction.master === null ? null : (
          <OneOfOneBox master={auction.master} locale={locale} now={now} />
        )}
      </div>
    </header>
  );
}

function EditionPageBody({ editionKey }: { readonly editionKey: WorkKey }) {
  const locale = useBrowserLocale();
  const now = useStreamNow();
  const { data: auction } = useStreamQuery(
    "edition-auction",
    [editionKey],
    (source) => source.getEditionAuction(editionKey)
  );
  const { data: work } = useStreamQuery("work", [editionKey], (source) =>
    source.getWork(editionKey)
  );
  const masterKey = auction?.master ?? null;
  const { data: master } = useStreamQuery(
    "work",
    [masterKey ?? ""],
    (source) =>
      masterKey === null ? Promise.resolve(null) : source.getWork(masterKey)
  );
  if (auction === undefined) {
    return <Loading />;
  }
  if (auction === null) {
    return <NotFoundNote locale={locale} />;
  }
  return (
    <div>
      <EditionHeader
        auction={auction}
        work={work}
        master={master}
        locale={locale}
        now={now}
      />
      {auction.biddingOpen ? (
        <MockBidders edition={auction.edition} locale={locale} />
      ) : null}
      <EditionAuctionPanel sale={auction} locale={locale} now={now} />
      <div className="tw-mt-10">
        <Section title={t(locale, "stream.editionPages.facts.title")}>
          <EditionFacts
            auction={auction}
            work={work}
            master={master}
            locale={locale}
          />
        </Section>
        <Section title={t(locale, "stream.editionPages.holders.title")}>
          <Holders edition={auction.edition} locale={locale} />
        </Section>
        <Section title={t(locale, "stream.editionPages.how.title")}>
          <HowItWorks locale={locale} />
        </Section>
      </div>
    </div>
  );
}

/**
 * /stream/editions/[id]: one edition and its sale. A bare number is the 6529
 * Stream Editions edition of that master (the edition ID is the master's token
 * ID); `<contract>-<id>` is a federated edition.
 */
export function EditionPage({ param }: { readonly param: string }) {
  const { client } = useStream();
  const parsed = parseWorkKey(param);
  const contracts = client?.dataSource.source().contracts ?? null;
  let editionKey: WorkKey = param;
  if (parsed?.kind === "stream" && contracts !== null) {
    editionKey = workKeyFor(
      contracts.editions,
      parsed.tokenId,
      contracts.stream
    );
  }
  return <EditionPageBody editionKey={editionKey} />;
}
