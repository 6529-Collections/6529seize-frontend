"use client";

import { useMemo, useState } from "react";

import { compareLocalized, formatInteger } from "@/i18n/format";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type { SolidityRiskRegisterEntry } from "@/lib/public-review/solidityReferenceTypes";

export type SolidityRiskListItem = Pick<
  SolidityRiskRegisterEntry,
  | "area"
  | "id"
  | "mitigation"
  | "owner"
  | "residual_risk"
  | "severity"
  | "status"
  | "target_gate"
  | "title"
  | "tracking"
>;

const INITIAL_RESULT_LIMIT = 25;
const INPUT_CLASSES =
  "tw-min-h-11 tw-w-full tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-950 tw-px-3 tw-py-2 tw-text-base tw-text-iron-50 tw-outline-none focus:tw-border-primary-400 focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400/40";

function humanize(value: string): string {
  return value.replaceAll("_", " ");
}

function matchesQuery(
  item: SolidityRiskListItem,
  query: string
): boolean {
  return [
    item.id,
    item.title,
    item.area,
    item.mitigation,
    item.residual_risk,
    item.owner,
  ]
    .join(" ")
    .toLocaleLowerCase(DEFAULT_LOCALE)
    .includes(query);
}

export function SolidityRiskExplorer({
  items,
}: {
  readonly items: readonly SolidityRiskListItem[];
}) {
  const [query, setQuery] = useState("");
  const [area, setArea] = useState("");
  const [status, setStatus] = useState("");
  const [resultLimit, setResultLimit] = useState(INITIAL_RESULT_LIMIT);
  const areas = useMemo(
    () =>
      Array.from(new Set(items.map((item) => item.area))).sort((left, right) =>
        compareLocalized(DEFAULT_LOCALE, left, right)
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
          (!area || item.area === area) &&
          (!status || item.status === status)
      ),
    [area, items, normalizedQuery, status]
  );
  const visibleItems = filteredItems.slice(0, resultLimit);

  return (
    <section
      aria-labelledby="solidity-risk-register"
      className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-p-5"
    >
      <h2
        id="solidity-risk-register"
        className="tw-scroll-mt-28 tw-m-0 tw-text-2xl tw-font-semibold tw-text-white"
      >
        {t(DEFAULT_LOCALE, "publicReview.reference.riskRegister")}
      </h2>
      <p className="tw-mb-0 tw-mt-2 tw-max-w-4xl tw-text-sm tw-leading-6 tw-text-iron-300">
        {t(DEFAULT_LOCALE, "publicReview.reference.riskRegisterDescription")}
      </p>
      <div className="tw-mt-5 tw-grid tw-gap-4 tw-rounded-xl tw-bg-iron-900/70 tw-p-4 md:tw-grid-cols-3">
        <label className="tw-block tw-text-sm tw-font-medium tw-text-iron-200">
          <span className="tw-mb-1.5 tw-block">
            {t(DEFAULT_LOCALE, "publicReview.reference.searchRisks")}
          </span>
          <input
            className={INPUT_CLASSES}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t(
              DEFAULT_LOCALE,
              "publicReview.reference.searchRisksPlaceholder"
            )}
            type="search"
            value={query}
          />
        </label>
        <label className="tw-block tw-text-sm tw-font-medium tw-text-iron-200">
          <span className="tw-mb-1.5 tw-block">
            {t(DEFAULT_LOCALE, "publicReview.reference.riskArea")}
          </span>
          <select
            className={INPUT_CLASSES}
            onChange={(event) => setArea(event.target.value)}
            value={area}
          >
            <option value="">
              {t(DEFAULT_LOCALE, "publicReview.reference.all")}
            </option>
            {areas.map((option) => (
              <option key={option} value={option}>
                {humanize(option)}
              </option>
            ))}
          </select>
        </label>
        <label className="tw-block tw-text-sm tw-font-medium tw-text-iron-200">
          <span className="tw-mb-1.5 tw-block">
            {t(DEFAULT_LOCALE, "publicReview.reference.riskStatus")}
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
        {t(DEFAULT_LOCALE, "publicReview.reference.riskResults", {
          total: formatInteger(DEFAULT_LOCALE, filteredItems.length),
          visible: formatInteger(DEFAULT_LOCALE, visibleItems.length),
        })}
      </p>
      <ul className="tw-mb-0 tw-mt-5 tw-list-none tw-space-y-3 tw-p-0">
        {visibleItems.map((item) => (
          <li key={item.id}>
            <details className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-900/60 tw-p-4">
              <summary className="tw-cursor-pointer tw-text-white focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-white">
                <span className="tw-font-mono tw-text-xs tw-text-sky-300">
                  {item.id}
                </span>
                <span className="tw-mt-1 tw-block tw-font-semibold">
                  {item.title}
                </span>
                <span className="tw-mt-2 tw-flex tw-flex-wrap tw-gap-2">
                  {[item.severity, item.status, item.area].map((value) => (
                    <span
                      className="tw-rounded-full tw-bg-iron-800 tw-px-2.5 tw-py-1 tw-text-xs tw-font-normal tw-text-iron-300"
                      key={value}
                    >
                      {humanize(value)}
                    </span>
                  ))}
                </span>
              </summary>
              <dl className="tw-mb-0 tw-mt-5 tw-grid tw-gap-4">
                <div>
                  <dt className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-500">
                    {t(DEFAULT_LOCALE, "publicReview.reference.mitigation")}
                  </dt>
                  <dd className="tw-m-0 tw-mt-1 tw-text-sm tw-leading-6 tw-text-iron-200">
                    {item.mitigation}
                  </dd>
                </div>
                <div>
                  <dt className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-500">
                    {t(DEFAULT_LOCALE, "publicReview.reference.residualRisk")}
                  </dt>
                  <dd className="tw-m-0 tw-mt-1 tw-text-sm tw-leading-6 tw-text-iron-200">
                    {item.residual_risk}
                  </dd>
                </div>
                <div className="tw-grid tw-gap-4 sm:tw-grid-cols-2">
                  <div>
                    <dt className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-500">
                      {t(DEFAULT_LOCALE, "publicReview.reference.owner")}
                    </dt>
                    <dd className="tw-m-0 tw-mt-1 tw-text-sm tw-text-iron-200">
                      {item.owner}
                    </dd>
                  </div>
                  <div>
                    <dt className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-500">
                      {t(DEFAULT_LOCALE, "publicReview.reference.targetGate")}
                    </dt>
                    <dd className="tw-m-0 tw-mt-1 tw-text-sm tw-text-iron-200">
                      {item.target_gate}
                    </dd>
                  </div>
                </div>
              </dl>
              {item.tracking.length ? (
                <ul className="tw-mb-0 tw-mt-4 tw-flex tw-list-none tw-flex-wrap tw-gap-3 tw-p-0">
                  {item.tracking.map((href, index) => (
                    <li key={href}>
                      <a
                        className="tw-text-sm tw-text-sky-300 tw-no-underline hover:tw-underline focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-white"
                        href={href}
                        rel="noreferrer"
                        target="_blank"
                      >
                        {t(DEFAULT_LOCALE, "publicReview.reference.trackingLink", {
                          number: index + 1,
                        })}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : null}
            </details>
          </li>
        ))}
      </ul>
      {visibleItems.length < filteredItems.length ? (
        <button
          className="tw-mt-5 tw-inline-flex tw-min-h-11 tw-items-center tw-rounded-lg tw-border tw-border-solid tw-border-iron-600 tw-bg-iron-900 tw-px-4 tw-py-2 tw-font-semibold tw-text-white focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-white"
          onClick={() =>
            setResultLimit((current) => current + INITIAL_RESULT_LIMIT)
          }
          type="button"
        >
          {t(DEFAULT_LOCALE, "publicReview.reference.showMoreRisks")}
        </button>
      ) : null}
    </section>
  );
}
