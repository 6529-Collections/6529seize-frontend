import type { ReactNode } from "react";
import type { SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import { formatUtcDate } from "@/i18n/format";
import type {
  VerificationDay,
  VerificationIndexDay,
} from "@/lib/tdh/verification/schema";
import { dayRunNote } from "@/lib/tdh/verification/states";
import CaseSafe from "../../shared/CaseSafe";
import TdhCopyButton from "../../shared/TdhCopyButton";
import { middleTruncate } from "./verificationFormat";

/**
 * The parts of Provenance that the day's headline shares: a hash with its
 * copy button, a label-and-value row, what run wrote the day's file, whether
 * a stated SHA-256 matches the bytes read, and the feed's own statement.
 */

export const DT =
  "tw-text-xs tw-font-medium tw-uppercase tw-tracking-wide tw-text-iron-400";
const DD = "tw-m-0 tw-min-w-0 tw-text-sm tw-leading-6 tw-text-iron-200";

export function Hash({
  locale,
  value,
  name,
}: {
  readonly locale: SupportedLocale;
  readonly value: string;
  readonly name: string;
}) {
  return (
    <span className="tw-inline-flex tw-items-center tw-gap-1 tw-whitespace-nowrap tw-align-middle">
      <code
        className="tw-font-mono tw-text-xs tw-leading-6 tw-text-iron-200"
        title={value}
      >
        {middleTruncate(value)}
      </code>
      <TdhCopyButton
        value={value}
        label={t(locale, "network.tdh.shared.copyNamed", {
          name: `${name} ${value}`,
        })}
        copiedLabel={t(locale, "network.tdh.shared.copied")}
        failedLabel={t(locale, "network.tdh.shared.copyFailed")}
      />
    </span>
  );
}

export function Row({
  label,
  children,
}: {
  readonly label: string;
  readonly children: ReactNode;
}) {
  return (
    <div className="tw-grid tw-min-w-0 tw-grid-cols-1 tw-gap-x-6 tw-gap-y-1 tw-py-3 sm:tw-grid-cols-[10rem_minmax(0,1fr)] sm:tw-items-baseline">
      <dt className={DT}>
        <CaseSafe text={label} />
      </dt>
      <dd className={DD}>{children}</dd>
    </div>
  );
}

const UTC_TIME = {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZoneName: "short",
} as const;

/**
 * What the day's file says about the run that wrote it, from its own date
 * and `generatedAt` (`dayRunNote`): the first runs of October 15, a later
 * recomputation, or a file written well after the scheduled run.
 */
export function DayRunNoteText({
  locale,
  date,
  generatedAt,
}: {
  readonly locale: SupportedLocale;
  readonly date: string;
  readonly generatedAt: string | null;
}) {
  const note = dayRunNote(date, generatedAt);
  if (note === null) {
    return null;
  }
  if (note.kind === "firstRun") {
    return <>{t(locale, "network.tdh.verify.provenance.run.firstRun")}</>;
  }
  const values = {
    date: formatUtcDate(locale, note.generatedAt, {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    time: formatUtcDate(locale, note.generatedAt, {
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }),
  };
  return (
    <>
      {t(
        locale,
        note.kind === "recomputed"
          ? "network.tdh.verify.provenance.run.recomputed"
          : "network.tdh.verify.provenance.run.later",
        values
      )}
    </>
  );
}

/**
 * Whether a SHA-256 the feed states is the one of the bytes this page read,
 * said of the stated hash (beside it) or of the read one (beside that).
 */
export function ShaMatch({
  locale,
  stated,
  read,
  of = "stated",
}: {
  readonly locale: SupportedLocale;
  readonly stated: string;
  readonly read: string;
  readonly of?: "stated" | "read";
}) {
  const same = stated === read;
  let key: MessageKey = same
    ? "network.tdh.verify.provenance.feedShaMatch"
    : "network.tdh.verify.provenance.feedShaDiffer";
  if (of === "read") {
    key = same
      ? "network.tdh.verify.dayHero.statedSame"
      : "network.tdh.verify.dayHero.statedOther";
  }
  return (
    <span className={same ? "tw-text-success" : "tw-text-amber-200"}>
      {t(locale, key)}
    </span>
  );
}

/**
 * What the feed itself states about the day's file, when it states it:
 * when the file and the index were written, what run that was, and the
 * SHA-256 the index (or the file) gives, checked against the SHA-256 of the
 * bytes this page read.
 */
export function FeedStatement({
  locale,
  day,
  entry,
  indexGeneratedAt,
  daySha256,
}: {
  readonly locale: SupportedLocale;
  readonly day: VerificationDay | null;
  readonly entry: VerificationIndexDay | null;
  readonly indexGeneratedAt: string | null;
  readonly daySha256: string | null;
}) {
  const generatedAt = day?.generatedAt ?? entry?.generatedAt ?? null;
  const stated = entry?.sha256 ?? day?.sha256 ?? null;
  const hasRunNote = day !== null && dayRunNote(day.date, generatedAt) !== null;
  if (
    generatedAt === null &&
    stated === null &&
    indexGeneratedAt === null &&
    !hasRunNote
  ) {
    return null;
  }
  const line = "tw-flex tw-flex-wrap tw-items-center tw-gap-x-2";
  return (
    <Row label={t(locale, "network.tdh.verify.provenance.feed")}>
      <span className="tw-flex tw-flex-col tw-gap-1">
        {generatedAt !== null && (
          <span className={line}>
            <span className="tw-text-iron-400">
              {t(locale, "network.tdh.verify.provenance.generatedAt")}
            </span>
            <time dateTime={generatedAt} className="tw-tabular-nums">
              {formatUtcDate(locale, generatedAt, UTC_TIME)}
            </time>
          </span>
        )}
        {hasRunNote && (
          <span className="tw-max-w-[38em] tw-text-iron-300">
            <DayRunNoteText
              locale={locale}
              date={day.date}
              generatedAt={generatedAt}
            />
          </span>
        )}
        {indexGeneratedAt !== null && (
          <span className={line}>
            <span className="tw-text-iron-400">
              {t(locale, "network.tdh.verify.provenance.indexGeneratedAt")}
            </span>
            <time dateTime={indexGeneratedAt} className="tw-tabular-nums">
              {formatUtcDate(locale, indexGeneratedAt, UTC_TIME)}
            </time>
          </span>
        )}
        {stated !== null && (
          <span className={line}>
            <span className="tw-text-iron-400">
              {t(locale, "network.tdh.verify.provenance.feedSha")}
            </span>
            <Hash
              locale={locale}
              value={stated}
              name={t(locale, "network.tdh.verify.provenance.feedSha")}
            />
            {daySha256 !== null && (
              <ShaMatch locale={locale} stated={stated} read={daySha256} />
            )}
          </span>
        )}
      </span>
    </Row>
  );
}
