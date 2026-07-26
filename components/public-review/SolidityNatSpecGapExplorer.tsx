"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { compareLocalized, formatInteger } from "@/i18n/format";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type { SolidityNatSpecGap } from "@/lib/public-review/solidityReferenceTypes";

export interface SolidityNatSpecGapListItem extends SolidityNatSpecGap {
  readonly declarationHref?: string | undefined;
  readonly sourceHref: string;
}

const INITIAL_RESULT_LIMIT = 50;
const INPUT_CLASSES =
  "tw-min-h-11 tw-w-full tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-950 tw-px-3 tw-py-2 tw-text-base tw-text-iron-50 tw-outline-none focus:tw-border-primary-400 focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400/40";

function humanize(value: string): string {
  return value.replaceAll("_", " ");
}

function matchesQuery(
  item: SolidityNatSpecGapListItem,
  query: string
): boolean {
  return [
    item.contract,
    item.signature,
    item.source,
    item.reason,
    item.follow_up,
  ]
    .join(" ")
    .toLocaleLowerCase(DEFAULT_LOCALE)
    .includes(query);
}

export function SolidityNatSpecGapExplorer({
  items,
}: {
  readonly items: readonly SolidityNatSpecGapListItem[];
}) {
  const [query, setQuery] = useState("");
  const [gapType, setGapType] = useState("");
  const [status, setStatus] = useState("");
  const [resultLimit, setResultLimit] = useState(INITIAL_RESULT_LIMIT);
  const gapTypes = useMemo(
    () =>
      Array.from(new Set(items.map((item) => item.gapType))).sort(
        (left, right) => compareLocalized(DEFAULT_LOCALE, left, right)
      ),
    [items]
  );
  const statuses = useMemo(
    () =>
      Array.from(new Set(items.map((item) => item.status))).sort(
        (left, right) => compareLocalized(DEFAULT_LOCALE, left, right)
      ),
    [items]
  );
  const normalizedQuery = query.trim().toLocaleLowerCase(DEFAULT_LOCALE);
  const filteredItems = useMemo(
    () =>
      items.filter(
        (item) =>
          matchesQuery(item, normalizedQuery) &&
          (!gapType || item.gapType === gapType) &&
          (!status || item.status === status)
      ),
    [gapType, items, normalizedQuery, status]
  );
  const visibleItems = filteredItems.slice(0, resultLimit);

  return (
    <section
      aria-labelledby="solidity-natspec-gaps"
      className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-p-5"
    >
      <h2
        id="solidity-natspec-gaps"
        className="tw-scroll-mt-28 tw-m-0 tw-text-2xl tw-font-semibold tw-text-white"
      >
        {t(DEFAULT_LOCALE, "publicReview.reference.natSpecGaps")}
      </h2>
      <p className="tw-mb-0 tw-mt-2 tw-max-w-4xl tw-text-sm tw-leading-6 tw-text-iron-300">
        {t(DEFAULT_LOCALE, "publicReview.reference.natSpecGapsDescription")}
      </p>
      <div className="tw-mt-5 tw-grid tw-gap-4 tw-rounded-xl tw-bg-iron-900/70 tw-p-4 md:tw-grid-cols-3">
        <label className="tw-block tw-text-sm tw-font-medium tw-text-iron-200">
          <span className="tw-mb-1.5 tw-block">
            {t(DEFAULT_LOCALE, "publicReview.reference.searchDocumentationGaps")}
          </span>
          <input
            className={INPUT_CLASSES}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t(
              DEFAULT_LOCALE,
              "publicReview.reference.searchDocumentationGapsPlaceholder"
            )}
            type="search"
            value={query}
          />
        </label>
        <label className="tw-block tw-text-sm tw-font-medium tw-text-iron-200">
          <span className="tw-mb-1.5 tw-block">
            {t(DEFAULT_LOCALE, "publicReview.reference.documentationGapType")}
          </span>
          <select
            className={INPUT_CLASSES}
            onChange={(event) => setGapType(event.target.value)}
            value={gapType}
          >
            <option value="">
              {t(DEFAULT_LOCALE, "publicReview.reference.all")}
            </option>
            {gapTypes.map((option) => (
              <option key={option} value={option}>
                {humanize(option)}
              </option>
            ))}
          </select>
        </label>
        <label className="tw-block tw-text-sm tw-font-medium tw-text-iron-200">
          <span className="tw-mb-1.5 tw-block">
            {t(DEFAULT_LOCALE, "publicReview.reference.documentationGapStatus")}
          </span>
          <select
            className={INPUT_CLASSES}
            onChange={(event) => setStatus(event.target.value)}
            value={status}
          >
            <option value="">
              {t(DEFAULT_LOCALE, "publicReview.reference.all")}
            </option>
            {statuses.map((option) => (
              <option key={option} value={option}>
                {humanize(option)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="tw-mb-0 tw-mt-4 tw-text-sm tw-text-iron-400" role="status">
        {t(DEFAULT_LOCALE, "publicReview.reference.documentationGapResults", {
          total: formatInteger(DEFAULT_LOCALE, filteredItems.length),
          visible: formatInteger(DEFAULT_LOCALE, visibleItems.length),
        })}
      </p>
      {visibleItems.length ? (
        <ul className="tw-mb-0 tw-mt-5 tw-list-none tw-space-y-3 tw-p-0">
          {visibleItems.map((item) => (
            <li
              className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-900/60 tw-p-4"
              key={item.id}
            >
              <div className="tw-flex tw-flex-wrap tw-gap-2">
                <span className="tw-rounded-full tw-bg-amber-400/10 tw-px-2.5 tw-py-1 tw-text-xs tw-font-semibold tw-text-amber-200">
                  {humanize(item.gapType)}
                </span>
                <span className="tw-rounded-full tw-bg-iron-800 tw-px-2.5 tw-py-1 tw-text-xs tw-text-iron-300">
                  {humanize(item.status)}
                </span>
              </div>
              <h3 className="tw-mb-0 tw-mt-3 tw-break-all tw-font-mono tw-text-base tw-font-semibold tw-text-white">
                {item.declarationHref ? (
                  <Link
                    className="tw-text-white tw-no-underline hover:tw-underline focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-white"
                    href={item.declarationHref}
                  >
                    {item.contract}.{item.signature}
                  </Link>
                ) : (
                  `${item.contract}.${item.signature}`
                )}
              </h3>
              <p className="tw-mb-0 tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-200">
                {item.reason}
              </p>
              <p className="tw-mb-0 tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-400">
                <span className="tw-font-semibold tw-text-iron-300">
                  {t(DEFAULT_LOCALE, "publicReview.reference.followUp")}{" "}
                </span>
                {item.follow_up}
              </p>
              <Link
                className="tw-mt-3 tw-inline-flex tw-break-all tw-font-mono tw-text-xs tw-text-sky-300 tw-no-underline hover:tw-underline focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-white"
                href={item.sourceHref}
              >
                {item.source}
                {item.line === null ? "" : `:${item.line}`}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="tw-mb-0 tw-mt-5 tw-text-sm tw-text-iron-300">
          {t(DEFAULT_LOCALE, "publicReview.reference.noDocumentationGaps")}
        </p>
      )}
      {visibleItems.length < filteredItems.length ? (
        <button
          className="tw-mt-5 tw-inline-flex tw-min-h-11 tw-items-center tw-rounded-lg tw-border tw-border-solid tw-border-iron-600 tw-bg-iron-900 tw-px-4 tw-py-2 tw-font-semibold tw-text-white focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-white"
          onClick={() =>
            setResultLimit((current) => current + INITIAL_RESULT_LIMIT)
          }
          type="button"
        >
          {t(DEFAULT_LOCALE, "publicReview.reference.showMoreGaps")}
        </button>
      ) : null}
    </section>
  );
}
