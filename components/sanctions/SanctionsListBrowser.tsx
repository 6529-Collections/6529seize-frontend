"use client";

import { formatInteger, selectPluralCategory } from "@/i18n/format";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { useId, useMemo, useState } from "react";

/** One listing, with every value already formatted on the server. */
export interface SanctionsBrowserRow {
  readonly key: string;
  readonly address: string;
  readonly chain: string;
  readonly reference: string;
  readonly entity: string;
  readonly listed: string;
  readonly validUntil: string | null;
  /** Lower-case text the search matches against. */
  readonly searchText: string;
}

export interface SanctionsBrowserGroup {
  readonly key: string;
  readonly title: string;
  readonly subtitle: string;
  readonly lapsed: boolean;
  readonly intro: string | null;
  readonly meta: ReadonlyArray<string>;
  readonly sourceUrl: string;
  readonly emptyText: string | null;
  readonly rows: ReadonlyArray<SanctionsBrowserRow>;
}

export interface SanctionsBrowserLabels {
  readonly searchLabel: string;
  readonly searchHint: string;
  /** Singular and plural forms; each contains `{count}`. */
  readonly searchResultsOne: string;
  readonly searchResultsOther: string;
  readonly searchEmpty: string;
  readonly sourceLink: string;
  readonly lapsedLabel: string;
  readonly chain: string;
  readonly reference: string;
  readonly name: string;
  readonly listed: string;
  readonly validUntil: string;
}

interface SanctionsListBrowserProps {
  readonly groups: ReadonlyArray<SanctionsBrowserGroup>;
  readonly labels: SanctionsBrowserLabels;
}

/**
 * The search status line. The page's copy is rendered in the source locale on
 * the server, so the count uses the same locale.
 */
function searchStatus(
  needle: string,
  matchCount: number,
  labels: SanctionsBrowserLabels
): string {
  if (needle === "") {
    return "";
  }
  if (matchCount === 0) {
    return labels.searchEmpty;
  }
  const template =
    selectPluralCategory(DEFAULT_LOCALE, matchCount) === "one"
      ? labels.searchResultsOne
      : labels.searchResultsOther;
  return template.replace("{count}", formatInteger(DEFAULT_LOCALE, matchCount));
}

function SanctionsEntry({
  row,
  labels,
}: {
  readonly row: SanctionsBrowserRow;
  readonly labels: SanctionsBrowserLabels;
}) {
  return (
    <li className="tw-min-w-0 tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-900/55 tw-p-3">
      <code className="tw-block tw-break-all tw-bg-transparent tw-p-0 tw-font-mono tw-text-sm tw-text-iron-50">
        {row.address}
      </code>
      <dl className="tw-mb-0 tw-mt-2 tw-grid tw-grid-cols-[auto_minmax(0,1fr)] tw-gap-x-3 tw-gap-y-1 tw-text-xs tw-leading-5">
        <dt className="tw-text-iron-400">{labels.chain}</dt>
        <dd className="tw-m-0 tw-text-iron-300">{row.chain}</dd>
        <dt className="tw-text-iron-400">{labels.reference}</dt>
        <dd className="tw-m-0 tw-break-words tw-text-iron-300">
          {row.reference}
        </dd>
        <dt className="tw-text-iron-400">{labels.name}</dt>
        <dd className="tw-m-0 tw-break-words tw-text-iron-300">{row.entity}</dd>
        <dt className="tw-text-iron-400">{labels.listed}</dt>
        <dd className="tw-m-0 tw-text-iron-300">{row.listed}</dd>
        {row.validUntil === null ? null : (
          <>
            <dt className="tw-text-iron-400">{labels.validUntil}</dt>
            <dd className="tw-m-0 tw-text-iron-300">{row.validUntil}</dd>
          </>
        )}
      </dl>
    </li>
  );
}

function SanctionsGroupSection({
  group,
  rows,
  labels,
}: {
  readonly group: SanctionsBrowserGroup;
  readonly rows: ReadonlyArray<SanctionsBrowserRow>;
  readonly labels: SanctionsBrowserLabels;
}) {
  const headingId = useId();
  return (
    <section aria-labelledby={headingId} className="tw-mt-10 first:tw-mt-0">
      <h3
        id={headingId}
        className="tw-m-0 tw-flex tw-flex-wrap tw-items-baseline tw-gap-x-3 tw-gap-y-1 tw-text-lg tw-font-semibold tw-leading-7 tw-text-iron-50"
      >
        <span>{group.title}</span>
        {group.lapsed ? <span className="tw-sr-only">, </span> : null}
        {group.lapsed ? (
          <span className="tw-rounded-full tw-border tw-border-solid tw-border-iron-600 tw-px-2 tw-py-0.5 tw-text-xs tw-font-medium tw-text-iron-300">
            {labels.lapsedLabel}
          </span>
        ) : null}
      </h3>
      <p className="tw-mb-0 tw-mt-1 tw-text-sm tw-text-iron-400">
        {group.subtitle}
      </p>
      <p className="tw-mb-0 tw-mt-2 tw-flex tw-flex-wrap tw-gap-x-4 tw-gap-y-1 tw-text-sm tw-text-iron-400">
        {group.meta.map((item) => (
          <span key={item}>{item}</span>
        ))}
        <a
          href={group.sourceUrl}
          rel="noopener noreferrer"
          target="_blank"
          className="tw-text-primary-300 tw-underline tw-underline-offset-[3px] hover:tw-text-primary-400 focus-visible:tw-rounded-sm focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-300"
        >
          {labels.sourceLink}
        </a>
      </p>
      {group.intro ? (
        <p className="tw-mb-0 tw-mt-3 tw-max-w-3xl tw-text-sm tw-leading-6 tw-text-iron-300">
          {group.intro}
        </p>
      ) : null}
      {rows.length > 0 ? (
        <ul className="tw-m-0 tw-mt-4 tw-grid tw-list-none tw-grid-cols-1 tw-gap-3 tw-p-0 md:tw-grid-cols-2">
          {rows.map((row) => (
            <SanctionsEntry key={row.key} row={row} labels={labels} />
          ))}
        </ul>
      ) : (
        <p className="tw-mb-0 tw-mt-4 tw-text-sm tw-text-iron-400">
          {group.emptyText}
        </p>
      )}
    </section>
  );
}

/**
 * The searchable list on `/sanctions`. Every value arrives formatted and
 * translated from the server; this island only filters what it was given and
 * makes no requests.
 */
export default function SanctionsListBrowser({
  groups,
  labels,
}: SanctionsListBrowserProps) {
  const [query, setQuery] = useState("");
  const inputId = useId();
  const hintId = useId();
  const needle = query.trim().toLowerCase();

  const filtered = useMemo(
    () =>
      groups.map((group) => ({
        group,
        rows:
          needle === ""
            ? group.rows
            : group.rows.filter((row) => row.searchText.includes(needle)),
      })),
    [groups, needle]
  );
  const matchCount = filtered.reduce((sum, item) => sum + item.rows.length, 0);
  const visible =
    needle === "" ? filtered : filtered.filter((item) => item.rows.length > 0);

  return (
    <div>
      <div className="tw-max-w-xl">
        <label
          htmlFor={inputId}
          className="tw-block tw-text-sm tw-font-medium tw-text-iron-50"
        >
          {labels.searchLabel}
        </label>
        <p id={hintId} className="tw-mb-0 tw-mt-1 tw-text-xs tw-text-iron-400">
          {labels.searchHint}
        </p>
        {/* Test harnesses and browser extensions can add attributes (for
            example an inline caret-color) to this server-rendered input before
            React hydrates it; that is not a mismatch worth a console error. */}
        <input
          id={inputId}
          suppressHydrationWarning
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-describedby={hintId}
          autoComplete="off"
          spellCheck={false}
          className="tw-mt-2 tw-w-full tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-3 tw-py-2 tw-text-sm tw-text-iron-50 placeholder:tw-text-iron-500 focus:tw-border-primary-300 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-300"
        />
        <p
          role="status"
          aria-live="polite"
          className="tw-mb-0 tw-mt-2 tw-min-h-5 tw-text-xs tw-text-iron-400"
        >
          {searchStatus(needle, matchCount, labels)}
        </p>
      </div>
      <div className="tw-mt-6">
        {visible.map(({ group, rows }) => (
          <SanctionsGroupSection
            key={group.key}
            group={group}
            rows={rows}
            labels={labels}
          />
        ))}
      </div>
    </div>
  );
}
