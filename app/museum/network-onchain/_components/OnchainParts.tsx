import type { ReactNode } from "react";
import AiCopyButton from "@/components/ai-page/AiCopyButton";
import { formatInteger, formatUtcDate } from "@/i18n/format";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type { MessageKey } from "@/i18n/messages/en-US.complete";
import type {
  OnchainMuseumRecord,
  OnchainRecordState,
} from "@/lib/museum/onchain/museum";
import { onchainMuseumRecordHref } from "@/lib/museum/onchain/fields";
import { type OnchainMuseumView } from "@/lib/museum/onchain/presentation";
import { workImage } from "@/lib/museum/onchain/works";
import type { FilterableGroupsCopy, FilterableItem } from "./FilterableGroups";
import { registryValueLabel } from "./labels";

const locale = DEFAULT_LOCALE;

const FOCUS_RING =
  "focus-visible:tw-rounded-sm focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400";
/** Links inside sentences. */
export const TEXT_LINK = `tw-text-primary-300 tw-underline tw-decoration-primary-300/40 tw-underline-offset-4 hover:tw-text-primary-200 ${FOCUS_RING}`;
/** Links that are list entries: the same color and focus as every link here. */
export const LIST_LINK = `tw-break-words tw-text-primary-300 tw-no-underline hover:tw-text-primary-200 hover:tw-underline ${FOCUS_RING}`;

const STATE_KEYS: Readonly<Record<OnchainRecordState, MessageKey>> = {
  verified: "museum.onchain.state.verified",
  nonconforming: "museum.onchain.state.nonconforming",
  mismatch: "museum.onchain.state.mismatch",
  unavailable: "museum.onchain.state.unavailable",
  unsupported: "museum.onchain.state.unsupported",
  deleted: "museum.onchain.state.deleted",
};

const STATE_TONES: Readonly<Record<OnchainRecordState, string>> = {
  verified: "tw-border-emerald-400/40 tw-bg-emerald-400/10 tw-text-emerald-200",
  nonconforming: "tw-border-red-400/50 tw-bg-red-400/10 tw-text-red-200",
  mismatch: "tw-border-red-400/50 tw-bg-red-400/10 tw-text-red-200",
  unavailable: "tw-border-yellow-400/40 tw-bg-yellow-400/10 tw-text-yellow-100",
  unsupported: "tw-border-yellow-400/40 tw-bg-yellow-400/10 tw-text-yellow-100",
  deleted: "tw-border-iron-500/50 tw-bg-iron-800 tw-text-iron-200",
};

export function literalLabel(literal: string | null): string {
  return literal ?? t(locale, "museum.onchain.unknown");
}

export function stateLabel(state: OnchainRecordState): string {
  return t(locale, STATE_KEYS[state]);
}

/** The literal, with its plain name when the messages know it. */
export function canonicalizationLabel(literal: string | null): string {
  if (literal === null) return t(locale, "museum.onchain.unknown");
  return registryValueLabel("canonical", literal);
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

export function filterCopy(): FilterableGroupsCopy {
  return {
    image: {
      checking: t(locale, "museum.onchain.image.checking"),
      failed: t(locale, "museum.onchain.image.failed"),
      unavailable: t(locale, "museum.onchain.image.unavailable"),
      retry: t(locale, "museum.onchain.image.retry"),
    },
    showAll: t(locale, "museum.onchain.filter.showAll"),
    label: t(locale, "museum.onchain.filter.label"),
    placeholder: t(locale, "museum.onchain.filter.placeholder"),
    empty: t(locale, "museum.onchain.filter.empty"),
    count: t(locale, "museum.onchain.filter.count"),
  };
}

/** A list row for a record: its readable label, and a badge only on failure. */
export function filterableItem(
  view: OnchainMuseumView,
  record: OnchainMuseumRecord,
  secondary?: string
): FilterableItem {
  const image = workImage(view, record);
  return {
    image:
      image === null
        ? undefined
        : { derivatives: image.image.derivatives, alt: image.image.altText },
    key: record.subjectId,
    href: onchainMuseumRecordHref(record.subjectId),
    label: view.labelOf(record),
    secondary,
    badge:
      record.state === "verified"
        ? undefined
        : { label: stateLabel(record.state), tone: STATE_TONES[record.state] },
  };
}

export function OnchainFrame({
  children,
  fixture,
}: Readonly<{ children: ReactNode; fixture: boolean }>) {
  return (
    <div className="tailwind-scope tw-min-h-screen tw-min-w-0 tw-overflow-x-clip tw-bg-black tw-text-iron-100">
      <div
        role="note"
        className="tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-yellow-400/30 tw-bg-yellow-400/10 tw-px-4 tw-py-2 tw-text-[0.8125rem] tw-leading-5 tw-text-yellow-100 sm:tw-px-6 lg:tw-px-8"
      >
        <p className="tw-m-0 tw-mx-auto tw-w-full tw-max-w-[1324px]">
          {t(
            locale,
            fixture ? "museum.onchain.noticeFixture" : "museum.onchain.notice"
          )}
        </p>
      </div>
      <div className="tw-mx-auto tw-w-full tw-min-w-0 tw-max-w-[1324px] tw-px-4 tw-py-6 sm:tw-px-6 sm:tw-py-10 lg:tw-px-8 lg:tw-py-14">
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
  eyebrow: ReactNode;
  title: string;
  intro?: ReactNode;
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
        <div className="tw-m-0 tw-mt-4 tw-max-w-3xl tw-text-base tw-leading-7 tw-text-iron-300">
          {intro}
        </div>
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
      className="tw-m-0 tw-scroll-mt-24 tw-text-2xl tw-font-semibold tw-tracking-tight tw-text-iron-50"
    >
      {children}
    </h2>
  );
}

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

export function JumpNav({
  links,
  id,
}: Readonly<{
  links: readonly { href: string; label: string }[];
  id?: string;
}>) {
  return (
    <nav
      id={id}
      aria-label={t(locale, "museum.onchain.jump.label")}
      className="tw-mb-10 tw-scroll-mt-24"
    >
      <ul className="tw-m-0 tw-flex tw-list-none tw-gap-2 tw-overflow-x-auto tw-p-0 tw-pb-1 sm:tw-flex-wrap sm:tw-overflow-visible sm:tw-pb-0">
        {links.map((link) => (
          <li key={link.href} className="tw-shrink-0">
            <a
              href={link.href}
              className="hover:tw-text-primary-200 tw-inline-flex tw-min-h-11 tw-items-center tw-whitespace-nowrap tw-rounded-full tw-border tw-border-solid tw-border-iron-700 tw-px-4 tw-text-sm tw-text-iron-100 tw-no-underline hover:tw-border-primary-400 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 sm:tw-min-h-9"
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function FactList({
  facts,
}: Readonly<{
  facts: readonly { label: string; value: ReactNode }[];
}>) {
  return (
    <dl className="tw-m-0 tw-grid tw-gap-x-6 tw-gap-y-3 sm:tw-grid-cols-[minmax(9rem,12rem)_minmax(0,1fr)]">
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

/** A hash, address or ID, wrapped anywhere, with a copy control. */
export function CopyValue({
  value,
  field,
  href,
}: Readonly<{ value: string; field: string; href?: string | undefined }>) {
  return (
    <span className="tw-flex tw-items-start tw-gap-2">
      <span className="tw-min-w-0">
        {href === undefined ? (
          <Mono>{value}</Mono>
        ) : (
          <a href={href} rel="noreferrer" className={TEXT_LINK}>
            <Mono>{value}</Mono>
          </a>
        )}
      </span>
      <AiCopyButton
        value={value}
        text={t(locale, "museum.onchain.copy.text")}
        copiedText={t(locale, "museum.onchain.copy.copied")}
        failedText={t(locale, "museum.onchain.copy.failed")}
        label={t(locale, "museum.onchain.copy.label", { field })}
      />
    </span>
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

/** Every field of a verified record, in a bounded scrolling region. */
export function PayloadTree({
  payload,
}: Readonly<{ payload: Record<string, unknown> }>) {
  return (
    <div>
      <div className="tw-mb-3">
        <AiCopyButton
          value={JSON.stringify(payload, null, 2)}
          text={t(locale, "museum.onchain.copy.record")}
          copiedText={t(locale, "museum.onchain.copy.copied")}
          failedText={t(locale, "museum.onchain.copy.failed")}
          label={t(locale, "museum.onchain.copy.record")}
        />
      </div>
      {/* A scrollable region must be focusable so keyboard users can scroll it. */}
      <section
        tabIndex={0}
        aria-label={t(locale, "museum.onchain.record.payloadRegion")}
        className="tw-max-h-[70vh] tw-overflow-y-auto tw-overscroll-contain tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-p-4 tw-text-sm tw-leading-6 tw-text-iron-200 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
      >
        <PayloadValue value={payload} />
      </section>
    </div>
  );
}
