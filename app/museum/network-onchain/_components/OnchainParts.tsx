import Link from "next/link";
import type { ReactNode } from "react";
import { formatInteger, formatUtcDate } from "@/i18n/format";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type { MessageKey } from "@/i18n/messages/en-US.complete";
import type {
  OnchainMuseumRecord,
  OnchainRecordState,
} from "@/lib/museum/onchain/museum";
import {
  humanizeLiteral,
  onchainMuseumRecordHref,
} from "@/lib/museum/onchain/presentation";

const locale = DEFAULT_LOCALE;

const FOCUS_RING =
  "focus-visible:tw-rounded-sm focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400";
export const TEXT_LINK = `tw-text-primary-300 tw-underline tw-decoration-primary-300/40 tw-underline-offset-4 hover:tw-text-primary-200 ${FOCUS_RING}`;

const ENTITY_TYPE_KEYS: Readonly<Record<string, MessageKey>> = {
  WORK: "museum.onchain.entityType.WORK",
  ARTIST: "museum.onchain.entityType.ARTIST",
  PROJECT_OR_SERIES: "museum.onchain.entityType.PROJECT_OR_SERIES",
  COLLECTION: "museum.onchain.entityType.COLLECTION",
  CURATED_ACQUISITION: "museum.onchain.entityType.CURATED_ACQUISITION",
  ACQUISITION_PROGRAM: "museum.onchain.entityType.ACQUISITION_PROGRAM",
  ACCESSION: "museum.onchain.entityType.ACCESSION",
  INSTITUTION: "museum.onchain.entityType.INSTITUTION",
  ORGANIZATION: "museum.onchain.entityType.ORGANIZATION",
  AGENT: "museum.onchain.entityType.AGENT",
  RESEARCH_PUBLICATION: "museum.onchain.entityType.RESEARCH_PUBLICATION",
  MEDIA_REFERENCE: "museum.onchain.entityType.MEDIA_REFERENCE",
};

const STATE_KEYS: Readonly<Record<OnchainRecordState, MessageKey>> = {
  verified: "museum.onchain.state.verified",
  mismatch: "museum.onchain.state.mismatch",
  unavailable: "museum.onchain.state.unavailable",
  unsupported: "museum.onchain.state.unsupported",
  deleted: "museum.onchain.state.deleted",
};

/** Registry literals are identifiers; types without copy fall back to words. */
export function entityTypeLabel(type: string): string {
  const key = ENTITY_TYPE_KEYS[type];
  return key === undefined ? humanizeLiteral(type) : t(locale, key);
}

export function literalLabel(literal: string | null): string {
  return literal ?? t(locale, "museum.onchain.unknown");
}

function stateLabel(state: OnchainRecordState): string {
  return t(locale, STATE_KEYS[state]);
}

export function formatUtcDateTime(seconds: number): string {
  return t(locale, "museum.onchain.utcDateTime", {
    date: formatUtcDate(locale, seconds * 1000, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }),
  });
}

export function formatCount(value: number): string {
  return formatInteger(locale, value);
}

export function algorithmLabel(algorithm: number): string {
  if (algorithm === 1) return t(locale, "museum.onchain.algorithm.1");
  if (algorithm === 2) return t(locale, "museum.onchain.algorithm.2");
  return t(locale, "museum.onchain.algorithm.unknown", { id: algorithm });
}

export function OnchainFrame({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="tailwind-scope tw-min-h-screen tw-min-w-0 tw-overflow-x-clip tw-bg-black tw-text-iron-100">
      <div
        role="note"
        className="tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-yellow-400/30 tw-bg-yellow-400/10 tw-px-4 tw-py-3 tw-text-sm tw-leading-6 tw-text-yellow-100 sm:tw-px-6 lg:tw-px-8"
      >
        <p className="tw-m-0 tw-mx-auto tw-w-full tw-max-w-[1324px]">
          {t(locale, "museum.onchain.notice")}
        </p>
      </div>
      <div className="tw-mx-auto tw-w-full tw-min-w-0 tw-max-w-[1324px] tw-px-4 tw-py-8 sm:tw-px-6 sm:tw-py-12 lg:tw-px-8 lg:tw-py-16">
        {children}
      </div>
    </div>
  );
}

export function PageHeading({
  eyebrow,
  title,
  intro,
  aside,
}: Readonly<{
  eyebrow: string;
  title: string;
  intro?: string | undefined;
  aside?: ReactNode;
}>) {
  return (
    <header className="tw-mb-10 tw-max-w-4xl">
      <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.16em] tw-text-primary-300">
        {eyebrow}
      </p>
      <h1 className="tw-m-0 tw-mt-3 tw-break-words tw-text-3xl tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-iron-50 sm:tw-text-4xl">
        {title}
      </h1>
      {intro === undefined ? null : (
        <p className="tw-m-0 tw-mt-4 tw-max-w-3xl tw-text-base tw-leading-7 tw-text-iron-300">
          {intro}
        </p>
      )}
      {aside}
    </header>
  );
}

export function SectionHeading({
  id,
  children,
}: Readonly<{ id: string; children: ReactNode }>) {
  return (
    <h2
      id={id}
      className="tw-m-0 tw-text-2xl tw-font-semibold tw-tracking-tight tw-text-iron-50"
    >
      {children}
    </h2>
  );
}

const STATE_TONES: Readonly<Record<OnchainRecordState, string>> = {
  verified: "tw-border-emerald-400/40 tw-bg-emerald-400/10 tw-text-emerald-200",
  mismatch: "tw-border-red-400/50 tw-bg-red-400/10 tw-text-red-200",
  unavailable: "tw-border-yellow-400/40 tw-bg-yellow-400/10 tw-text-yellow-100",
  unsupported: "tw-border-yellow-400/40 tw-bg-yellow-400/10 tw-text-yellow-100",
  deleted: "tw-border-iron-500/50 tw-bg-iron-800 tw-text-iron-200",
};

export function StateBadge({ state }: Readonly<{ state: OnchainRecordState }>) {
  return (
    <span
      data-verification-state={state}
      className={`tw-inline-flex tw-shrink-0 tw-items-center tw-whitespace-nowrap tw-rounded-md tw-border tw-border-solid tw-px-2 tw-py-0.5 tw-text-xs tw-font-medium ${STATE_TONES[state]}`}
    >
      {stateLabel(state)}
    </span>
  );
}

export function RecordList({
  records,
  showPath = false,
  labelledBy,
}: Readonly<{
  records: readonly OnchainMuseumRecord[];
  showPath?: boolean;
  labelledBy: string;
}>) {
  return (
    <ul
      aria-labelledby={labelledBy}
      className="tw-m-0 tw-grid tw-list-none tw-gap-x-8 tw-gap-y-1 tw-p-0 md:tw-grid-cols-2"
    >
      {records.map((record) => (
        <li
          key={record.subjectId}
          className="tw-flex tw-min-w-0 tw-items-baseline tw-justify-between tw-gap-3 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-py-2"
        >
          <span className="tw-min-w-0">
            <Link
              href={onchainMuseumRecordHref(record.subjectId)}
              className={`hover:tw-text-primary-200 tw-break-words tw-text-base tw-text-iron-50 tw-no-underline ${FOCUS_RING}`}
            >
              {record.label}
            </Link>
            {showPath && record.documentPath !== null ? (
              <span className="tw-mt-0.5 tw-block tw-break-all tw-font-mono tw-text-xs tw-text-iron-500">
                {record.documentPath}
              </span>
            ) : null}
          </span>
          {record.state === "verified" ? (
            <span className="tw-sr-only">{stateLabel(record.state)}</span>
          ) : (
            <StateBadge state={record.state} />
          )}
        </li>
      ))}
    </ul>
  );
}

export function FactList({
  facts,
  labelledBy,
}: Readonly<{
  facts: readonly { label: string; value: ReactNode }[];
  labelledBy?: string;
}>) {
  return (
    <dl
      aria-labelledby={labelledBy}
      className="tw-m-0 tw-grid tw-gap-x-6 tw-gap-y-3 sm:tw-grid-cols-[minmax(9rem,12rem)_minmax(0,1fr)]"
    >
      {facts.map((fact) => (
        <div key={fact.label} className="tw-contents">
          <dt className="tw-text-sm tw-font-medium tw-text-iron-400">
            {fact.label}
          </dt>
          <dd className="tw-m-0 tw-min-w-0 tw-break-words tw-text-sm tw-leading-6 tw-text-iron-100">
            {fact.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function Mono({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <code className="tw-break-all tw-font-mono tw-text-[0.8125rem] tw-text-iron-100">
      {children}
    </code>
  );
}

function PayloadValue({ value }: Readonly<{ value: unknown }>): ReactNode {
  if (value === null) return <span className="tw-text-iron-500">null</span>;
  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="tw-text-iron-500">[]</span>;
    return (
      <ol className="tw-m-0 tw-list-decimal tw-space-y-2 tw-pl-5">
        {(value as unknown[]).map((item: unknown, index) => (
          // Array order is the record's order; items have no other identity.
          <li key={index} className="tw-min-w-0">
            <PayloadValue value={item} />
          </li>
        ))}
      </ol>
    );
  }
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0)
      return <span className="tw-text-iron-500">{"{}"}</span>;
    return (
      <dl className="tw-m-0 tw-space-y-2 tw-border-y-0 tw-border-l-2 tw-border-r-0 tw-border-solid tw-border-iron-800 tw-pl-3">
        {entries.map(([key, item]) => (
          <div key={key} className="tw-min-w-0">
            <dt className="tw-font-mono tw-text-xs tw-text-iron-400">{key}</dt>
            <dd className="tw-m-0 tw-min-w-0 tw-break-words">
              <PayloadValue value={item} />
            </dd>
          </div>
        ))}
      </dl>
    );
  }
  if (typeof value === "string" && /^https:\/\//u.test(value)) {
    return (
      <a href={value} rel="noreferrer" className={`tw-break-all ${TEXT_LINK}`}>
        {value}
      </a>
    );
  }
  return (
    <span className="tw-break-words">
      {typeof value === "string" ? value : JSON.stringify(value)}
    </span>
  );
}

export function PayloadTree({
  payload,
}: Readonly<{ payload: Record<string, unknown> }>) {
  return (
    <div className="tw-text-sm tw-leading-6 tw-text-iron-200">
      <PayloadValue value={payload} />
    </div>
  );
}
