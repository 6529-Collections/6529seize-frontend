"use client";

import Image from "next/image";
import Link from "next/link";
import { type ReactNode, useState } from "react";

import {
  useStream,
  useStreamNow,
  useStreamQuery,
} from "@/components/stream/data/StreamProvider";
import Countdown from "@/components/stream/ui/Countdown";
import EthAmount from "@/components/stream/ui/EthAmount";
import { txErrorMessage } from "@/components/stream/ui/GasNote";
import {
  auctionStateBadge,
  editionPhaseBadge,
  SpecBadge,
  variantBadge,
} from "@/components/stream/ui/StatusBadge";
import {
  STREAM_BUTTON_SECONDARY,
  STREAM_CARD,
  STREAM_FOCUS,
  STREAM_HEADING,
  STREAM_HELP,
  STREAM_LABEL,
  STREAM_TEXT,
} from "@/components/stream/ui/styles";
import { formatInteger } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/stream";
import type { StreamActions, TxResult } from "@/lib/stream/dataSource";
import type { Address, StreamWork, WorkKey } from "@/lib/stream/types";
import { STREAM_ROUTES } from "@/lib/stream/workKey";

export function PageHeader({
  title,
  intro,
  children,
}: {
  readonly title: string;
  readonly intro?: string;
  readonly children?: ReactNode;
}) {
  return (
    <header className="tw-pb-6">
      <h1 className={`${STREAM_HEADING} tw-text-2xl sm:tw-text-3xl`}>
        {title}
      </h1>
      {intro === undefined ? null : (
        <p className="tw-m-0 tw-mt-3 tw-max-w-3xl tw-text-base tw-leading-7 tw-text-iron-300">
          {intro}
        </p>
      )}
      {children}
    </header>
  );
}

export function Section({
  title,
  children,
  aside,
}: {
  readonly title: string;
  readonly children: ReactNode;
  readonly aside?: ReactNode;
}) {
  return (
    <section className="tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.07] tw-py-6">
      <div className="tw-mb-4 tw-flex tw-flex-wrap tw-items-baseline tw-justify-between tw-gap-2">
        <h2 className={`${STREAM_HEADING} tw-text-lg`}>{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

/** Marks a page whose full version a later change builds on this foundation. */
export function PlaceholderNote({
  locale,
}: {
  readonly locale: SupportedLocale;
}) {
  return (
    <p className={`${STREAM_HELP} tw-mt-2`}>
      {t(locale, "stream.placeholder.note")}
    </p>
  );
}

export function Loading() {
  return (
    <div
      className={`${STREAM_CARD} tw-h-32 tw-animate-pulse`}
      aria-busy="true"
    />
  );
}

export function Empty({ text }: { readonly text: string }) {
  return <p className={`${STREAM_TEXT} tw-text-iron-400`}>{text}</p>;
}

export function NotFoundNote({ locale }: { readonly locale: SupportedLocale }) {
  return (
    <div className={`${STREAM_CARD} tw-p-6`}>
      <h1 className={`${STREAM_HEADING} tw-text-xl`}>
        {t(locale, "stream.notFound.title")}
      </h1>
      <p className={`${STREAM_TEXT} tw-mt-2`}>
        {t(locale, "stream.notFound.body")}
      </p>
      <Link
        href={STREAM_ROUTES.home}
        className={`${STREAM_BUTTON_SECONDARY} tw-mt-4 tw-no-underline`}
      >
        {t(locale, "stream.notFound.back")}
      </Link>
    </div>
  );
}

/** Label-over-value facts, for cards and record panels. */
export function Facts({
  items,
}: {
  readonly items: readonly {
    readonly label: string;
    readonly value: ReactNode;
  }[];
}) {
  return (
    <dl className="tw-m-0 tw-grid tw-grid-cols-2 tw-gap-x-4 tw-gap-y-3 sm:tw-grid-cols-3">
      {items.map((item) => (
        <div key={item.label} className="tw-min-w-0">
          <dt className={STREAM_LABEL}>{item.label}</dt>
          <dd className="tw-m-0 tw-mt-1 tw-break-words tw-text-sm tw-tabular-nums tw-text-iron-50">
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** The image a card or list shows for a work: its inline image or generated preview. */
function thumbnailOf(work: StreamWork): string | null {
  const preview = work.media.find(
    (file) => file.role === "PREVIEW"
  )?.displayUri;
  const primary = work.media.find((file) => file.role === "PRIMARY");
  if (primary?.kind === "image" && primary.displayUri !== null) {
    return primary.displayUri;
  }
  return preview ?? null;
}

function Thumb({
  uri,
  title,
  locale,
}: {
  readonly uri: string | null;
  readonly title: string;
  readonly locale: SupportedLocale;
}) {
  return (
    <div className="tw-relative tw-aspect-square tw-w-full tw-overflow-hidden tw-rounded-lg tw-bg-iron-900">
      {uri === null ? null : (
        <Image
          src={uri}
          alt={t(locale, "stream.media.alt", { title })}
          fill
          unoptimized
          sizes="(min-width: 1024px) 25vw, 50vw"
          className="tw-object-cover"
        />
      )}
    </div>
  );
}

function SaleLine({
  work,
  locale,
}: {
  readonly work: StreamWork;
  readonly locale: SupportedLocale;
}) {
  const now = useStreamNow();
  const isEdition = work.standard === "ERC1155";
  const { data: auction } = useStreamQuery(
    "auction-for-work",
    [work.key],
    (source) =>
      isEdition ? Promise.resolve(null) : source.auctionForWork(work.key)
  );
  const { data: edition } = useStreamQuery(
    "edition-auction",
    [work.key],
    (source) =>
      isEdition ? source.getEditionAuction(work.key) : Promise.resolve(null)
  );
  if (auction) {
    return (
      <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2 tw-text-sm tw-text-iron-200">
        <SpecBadge spec={auctionStateBadge(auction.state)} locale={locale} />
        {auction.settlement !== null &&
        auction.settlement.outcome !== "collector" ? (
          <span>
            {t(locale, `stream.card.outcome.${auction.settlement.outcome}`)}
          </span>
        ) : (
          <EthAmount wei={auction.highBid} locale={locale} />
        )}
        {auction.state === "ACTIVE" ? (
          <Countdown
            endTime={auction.endTime}
            now={now}
            locale={locale}
            closeWindow={auction.config.extensionWindow}
            className="tw-text-xs tw-text-iron-400"
          />
        ) : null}
      </div>
    );
  }
  if (edition) {
    return (
      <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2 tw-text-sm tw-text-iron-200">
        <SpecBadge spec={editionPhaseBadge(edition.phase)} locale={locale} />
        {edition.clearing.count > 0 ? (
          <span>
            {t(locale, "stream.card.editionsAt", {
              count: formatInteger(locale, edition.clearing.count),
            })}{" "}
            <EthAmount wei={edition.clearing.price} locale={locale} />
          </span>
        ) : null}
      </div>
    );
  }
  return null;
}

/** A work in a grid: image, title, artist, variant and its sale at a glance. */
function WorkCard({
  workKey,
  locale,
}: {
  readonly workKey: WorkKey;
  readonly locale: SupportedLocale;
}) {
  const { data: work } = useStreamQuery("work", [workKey], (source) =>
    source.getWork(workKey)
  );
  if (work === undefined) {
    return <Loading />;
  }
  if (work === null) {
    return null;
  }
  const href =
    work.standard === "ERC1155"
      ? STREAM_ROUTES.edition(work.key)
      : STREAM_ROUTES.work(work.key);
  return (
    <article className={`${STREAM_CARD} tw-flex tw-flex-col tw-gap-3 tw-p-3`}>
      <Thumb uri={thumbnailOf(work)} title={work.title} locale={locale} />
      <div className="tw-min-w-0">
        <h3 className={`${STREAM_HEADING} tw-truncate tw-text-base`}>
          <Link
            href={href}
            className={`tw-text-iron-50 tw-no-underline hover:tw-underline ${STREAM_FOCUS}`}
          >
            {work.title}
          </Link>
        </h3>
        <p className={`${STREAM_HELP} tw-mt-0.5 tw-truncate`}>
          {work.parties.map((party) => party.displayName).join(" · ")}
        </p>
      </div>
      <div className="tw-flex tw-flex-wrap tw-gap-2">
        <SpecBadge spec={variantBadge(work.variant)} locale={locale} />
      </div>
      <SaleLine work={work} locale={locale} />
    </article>
  );
}

export function WorkGrid({
  keys,
  locale,
  empty,
}: {
  readonly keys: readonly WorkKey[];
  readonly locale: SupportedLocale;
  readonly empty: string;
}) {
  if (keys.length === 0) {
    return <Empty text={empty} />;
  }
  return (
    <ul className="tw-m-0 tw-grid tw-list-none tw-grid-cols-1 tw-gap-4 tw-p-0 sm:tw-grid-cols-2 lg:tw-grid-cols-4">
      {keys.map((key) => (
        <li key={key} className="tw-min-w-0">
          <WorkCard workKey={key} locale={locale} />
        </li>
      ))}
    </ul>
  );
}

/**
 * Runs a write for the connected account and keeps its outcome for display.
 * Lanes use it for every button that sends a transaction.
 */
export function useStreamAction(locale: SupportedLocale) {
  const { client, account } = useStream();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  async function run<T>(
    send: (actions: StreamActions, from: Address) => Promise<TxResult<T>>
  ): Promise<TxResult<T> | null> {
    if (client === null || account === null) {
      setMessage(t(locale, "stream.tx.connect"));
      return null;
    }
    setPending(true);
    try {
      const result = await send(client.actions, account);
      setMessage(
        result.ok
          ? t(locale, "stream.tx.done")
          : txErrorMessage(locale, result.error)
      );
      return result;
    } finally {
      setPending(false);
    }
  }
  return { run, pending, message, account };
}

export function ActionMessage({
  message,
}: {
  readonly message: string | null;
}) {
  return (
    <p className={`${STREAM_HELP} tw-min-h-5`} role="status" aria-live="polite">
      {message ?? ""}
    </p>
  );
}
