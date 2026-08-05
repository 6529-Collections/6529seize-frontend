"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import {
  PUBLIC_REVIEW_INPUT_CLASSES,
  PublicReviewSelect,
} from "@/components/public-review/PublicReviewFormControls";
import { compareLocalized, formatInteger } from "@/i18n/format";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type { SolidityNatSpecGap } from "@/lib/public-review/solidityReferenceTypes";

export interface SolidityNatSpecGapListItem extends SolidityNatSpecGap {
  readonly declarationHref?: string | undefined;
  readonly sourceHref: string;
}

const INITIAL_RESULT_LIMIT = 50;

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
      className="tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/[0.08] tw-py-8"
    >
      <h2
        id="solidity-natspec-gaps"
        className="tw-m-0 tw-scroll-mt-28 tw-text-2xl tw-font-semibold tw-text-white"
      >
        {t(DEFAULT_LOCALE, "publicReview.reference.natSpecGaps")}
      </h2>
      <p className="tw-mb-0 tw-mt-2 tw-max-w-4xl tw-text-pretty tw-text-sm tw-leading-6 tw-text-iron-300">
        {t(DEFAULT_LOCALE, "publicReview.reference.natSpecGapsDescription")}
      </p>
      <div className="tw-mt-5 tw-grid tw-gap-4 tw-rounded-xl tw-bg-iron-950 tw-p-6 tw-shadow-lg tw-ring-1 tw-ring-white/[0.03] md:tw-grid-cols-3">
        <label className="tw-block tw-text-sm tw-font-medium tw-text-iron-200">
          <span className="tw-mb-1.5 tw-block">
            {t(
              DEFAULT_LOCALE,
              "publicReview.reference.searchDocumentationGaps"
            )}
          </span>
          <input
            className={PUBLIC_REVIEW_INPUT_CLASSES}
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
          <PublicReviewSelect
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
          </PublicReviewSelect>
        </label>
        <label className="tw-block tw-text-sm tw-font-medium tw-text-iron-200">
          <span className="tw-mb-1.5 tw-block">
            {t(DEFAULT_LOCALE, "publicReview.reference.documentationGapStatus")}
          </span>
          <PublicReviewSelect
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
          </PublicReviewSelect>
        </label>
      </div>
      <p className="tw-mb-0 tw-mt-4 tw-text-sm tw-text-iron-400" role="status">
        {t(DEFAULT_LOCALE, "publicReview.reference.documentationGapResults", {
          total: formatInteger(DEFAULT_LOCALE, filteredItems.length),
          visible: formatInteger(DEFAULT_LOCALE, visibleItems.length),
        })}
      </p>
      {visibleItems.length ? (
        <ul className="tw-mb-0 tw-mt-5 tw-list-none tw-rounded-xl tw-bg-iron-950 tw-p-6 tw-shadow-lg tw-ring-1 tw-ring-white/[0.03]">
          {visibleItems.map((item) => (
            <li
              className="tw-rounded-lg tw-px-4 tw-py-3.5 tw-transition-colors desktop-hover:hover:tw-bg-iron-900/40"
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
                    className="tw-text-white tw-no-underline hover:tw-underline focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
                    href={item.declarationHref}
                  >
                    {item.contract}.{item.signature}
                  </Link>
                ) : (
                  `${item.contract}.${item.signature}`
                )}
              </h3>
              <p className="tw-mb-0 tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-300">
                {item.reason}
              </p>
              <p className="tw-mb-0 tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-400">
                <span className="tw-font-semibold tw-text-iron-300">
                  {t(DEFAULT_LOCALE, "publicReview.reference.followUp")}{" "}
                </span>
                {item.follow_up}
              </p>
              <Link
                className="tw-mt-3 tw-inline-flex tw-break-all tw-font-mono tw-text-xs tw-text-sky-300 tw-no-underline hover:tw-underline focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
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
          className="tw-mt-5 tw-inline-flex tw-min-h-11 tw-items-center tw-rounded-lg tw-border tw-border-solid tw-border-iron-600 tw-bg-iron-900 tw-px-4 tw-py-2 tw-font-semibold tw-text-white focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
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
