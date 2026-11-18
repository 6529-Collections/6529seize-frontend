import type { ReactNode } from "react";

import {
  BODY,
  SECTION_HEADING,
} from "@/components/validator-page/validatorStyles";

const BADGE =
  "tw-rounded-full tw-border tw-border-solid tw-px-2.5 tw-py-0.5 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-50";

/** One fact of a release, such as its channel, with its words. */
export type ReleaseFact = {
  readonly term: string;
  readonly value: ReactNode;
};

/**
 * One release on a section's page of releases (the release standard's
 * R65), anchored by its version so `/{p}/releases#{v}` lands on it: its
 * name with a Latest or Unsafe badge, the list's facts, its notes as plain
 * text, then its files. An entry the list gives without notes or files,
 * as a producer may shorten old entries, shows what it has and nothing in
 * their place.
 */
export default function ReleaseHistoryEntry({
  version,
  latest,
  unsafe,
  facts,
  notes,
  filesHeading,
  files,
}: {
  readonly version: string;
  /** The Latest badge's words, for the newest release only. */
  readonly latest?: string | undefined;
  /** The Unsafe badge's words and the line under the name, when listed. */
  readonly unsafe?:
    | { readonly badge: string; readonly line: ReactNode }
    | undefined;
  readonly facts: readonly ReleaseFact[];
  /** Plain text; line breaks are kept and nothing is read as HTML. */
  readonly notes: string | null;
  readonly filesHeading: string;
  /** The files; undefined when the list names none. */
  readonly files?: ReactNode;
}) {
  const headingId = `release-${version}`;
  return (
    <section
      id={version}
      aria-labelledby={headingId}
      className="tw-scroll-mt-24 tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.06] tw-pt-8"
    >
      <h2
        id={headingId}
        className={`tw-flex tw-flex-wrap tw-items-center tw-gap-3 ${SECTION_HEADING}`}
      >
        <span className="tw-break-all tw-font-mono">{version}</span>
        {latest && (
          <span
            className={`${BADGE} tw-border-primary-400/60 tw-bg-primary-500/10`}
          >
            {latest}
          </span>
        )}
        {unsafe && (
          <span className={`${BADGE} tw-border-error/50 tw-bg-error/15`}>
            {unsafe.badge}
          </span>
        )}
      </h2>
      {unsafe && <p className={`tw-mb-0 tw-mt-3 ${BODY}`}>{unsafe.line}</p>}
      <dl className="tw-mb-0 tw-mt-3 tw-grid tw-gap-x-6 tw-gap-y-1 sm:tw-grid-cols-[max-content_1fr]">
        {facts.map((fact) => (
          <div key={fact.term} className="tw-contents">
            <dt className="tw-text-sm tw-font-semibold tw-leading-6 tw-text-iron-400">
              {fact.term}
            </dt>
            <dd className="tw-m-0 tw-min-w-0 tw-break-all tw-text-sm tw-leading-6 tw-text-iron-200 max-sm:tw-mb-2">
              {fact.value}
            </dd>
          </div>
        ))}
      </dl>
      {notes && (
        <p className={`tw-mb-0 tw-mt-4 tw-whitespace-pre-line ${BODY}`}>
          {notes}
        </p>
      )}
      {files !== undefined && (
        <>
          <h3 className="tw-mb-3 tw-mt-6 tw-text-base tw-font-semibold tw-text-iron-50">
            {filesHeading}
          </h3>
          {files}
        </>
      )}
    </section>
  );
}
