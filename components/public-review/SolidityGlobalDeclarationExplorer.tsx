"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { compareLocalized, formatInteger } from "@/i18n/format";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";

export interface SolidityGlobalDeclarationListItem {
  readonly definitionName?: string | undefined;
  readonly href: string;
  readonly key: string;
  readonly kind: "function" | "event" | "error";
  readonly name: string;
  readonly scope: string;
  readonly selectorOrTopic: string;
  readonly signature: string;
  readonly sourcePath: string;
  readonly syntheticGetter: boolean;
  readonly topLevel: boolean;
}

const INITIAL_RESULT_LIMIT = 100;
const INPUT_CLASSES =
  "tw-min-h-11 tw-w-full tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-950 tw-px-3 tw-py-2 tw-text-base tw-text-iron-50 tw-outline-none focus:tw-border-primary-400 focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400/40";

function matchesQuery(
  item: SolidityGlobalDeclarationListItem,
  normalizedQuery: string
): boolean {
  if (!normalizedQuery) {
    return true;
  }
  return [
    item.name,
    item.signature,
    item.selectorOrTopic,
    item.sourcePath,
    item.definitionName ?? "",
  ]
    .join(" ")
    .toLocaleLowerCase(DEFAULT_LOCALE)
    .includes(normalizedQuery);
}

export function SolidityGlobalDeclarationExplorer({
  items,
}: {
  readonly items: readonly SolidityGlobalDeclarationListItem[];
}) {
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("");
  const [scope, setScope] = useState("");
  const [location, setLocation] = useState("");
  const [resultLimit, setResultLimit] = useState(INITIAL_RESULT_LIMIT);
  const scopes = useMemo(
    () =>
      Array.from(new Set(items.map((item) => item.scope))).sort((left, right) =>
        compareLocalized(DEFAULT_LOCALE, left, right)
      ),
    [items]
  );
  const normalizedQuery = query.trim().toLocaleLowerCase(DEFAULT_LOCALE);
  const filteredItems = useMemo(
    () =>
      items.filter(
        (item) =>
          matchesQuery(item, normalizedQuery) &&
          (!kind || item.kind === kind) &&
          (!scope || item.scope === scope) &&
          (!location ||
            (location === "file-scope" ? item.topLevel : !item.topLevel))
      ),
    [items, kind, location, normalizedQuery, scope]
  );
  const visibleItems = filteredItems.slice(0, resultLimit);

  return (
    <section aria-labelledby="solidity-global-declarations">
      <h2
        id="solidity-global-declarations"
        className="tw-m-0 tw-text-2xl tw-font-semibold tw-text-white"
      >
        {t(DEFAULT_LOCALE, "publicReview.reference.globalDeclarations")}
      </h2>
      <p className="tw-mb-0 tw-mt-2 tw-max-w-4xl tw-text-sm tw-leading-6 tw-text-iron-300">
        {t(
          DEFAULT_LOCALE,
          "publicReview.reference.globalDeclarationsDescription"
        )}
      </p>
      <div className="tw-mt-5 tw-grid tw-gap-4 tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-900/70 tw-p-4 sm:tw-grid-cols-2 xl:tw-grid-cols-4">
        <label className="tw-block tw-text-sm tw-font-medium tw-text-iron-200 sm:tw-col-span-2 xl:tw-col-span-1">
          <span className="tw-mb-1.5 tw-block">
            {t(
              DEFAULT_LOCALE,
              "publicReview.reference.searchAllDeclarations"
            )}
          </span>
          <input
            className={INPUT_CLASSES}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t(
              DEFAULT_LOCALE,
              "publicReview.reference.searchAllDeclarationsPlaceholder"
            )}
            type="search"
            value={query}
          />
        </label>
        <label className="tw-block tw-text-sm tw-font-medium tw-text-iron-200">
          <span className="tw-mb-1.5 tw-block">
            {t(
              DEFAULT_LOCALE,
              "publicReview.reference.filterDeclarationKind"
            )}
          </span>
          <select
            className={INPUT_CLASSES}
            onChange={(event) => setKind(event.target.value)}
            value={kind}
          >
            <option value="">
              {t(DEFAULT_LOCALE, "publicReview.reference.all")}
            </option>
            <option value="function">
              {t(DEFAULT_LOCALE, "publicReview.reference.functions")}
            </option>
            <option value="event">
              {t(DEFAULT_LOCALE, "publicReview.reference.events")}
            </option>
            <option value="error">
              {t(DEFAULT_LOCALE, "publicReview.reference.errors")}
            </option>
          </select>
        </label>
        <label className="tw-block tw-text-sm tw-font-medium tw-text-iron-200">
          <span className="tw-mb-1.5 tw-block">
            {t(DEFAULT_LOCALE, "publicReview.reference.filterScope")}
          </span>
          <select
            className={INPUT_CLASSES}
            onChange={(event) => setScope(event.target.value)}
            value={scope}
          >
            <option value="">
              {t(DEFAULT_LOCALE, "publicReview.reference.all")}
            </option>
            {scopes.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label className="tw-block tw-text-sm tw-font-medium tw-text-iron-200">
          <span className="tw-mb-1.5 tw-block">
            {t(DEFAULT_LOCALE, "publicReview.reference.declarationLocation")}
          </span>
          <select
            className={INPUT_CLASSES}
            onChange={(event) => setLocation(event.target.value)}
            value={location}
          >
            <option value="">
              {t(DEFAULT_LOCALE, "publicReview.reference.all")}
            </option>
            <option value="definition">
              {t(DEFAULT_LOCALE, "publicReview.reference.definitionScope")}
            </option>
            <option value="file-scope">
              {t(DEFAULT_LOCALE, "publicReview.reference.fileScope")}
            </option>
          </select>
        </label>
      </div>
      <p className="tw-mb-0 tw-mt-4 tw-text-sm tw-text-iron-400" role="status">
        {t(
          DEFAULT_LOCALE,
          "publicReview.reference.declarationResultsCount",
          {
            total: formatInteger(DEFAULT_LOCALE, filteredItems.length),
            visible: formatInteger(DEFAULT_LOCALE, visibleItems.length),
          }
        )}
      </p>
      <ul className="tw-mb-0 tw-mt-5 tw-list-none tw-space-y-2 tw-p-0">
        {visibleItems.map((item) => (
          <li key={item.key}>
            <Link
              className="tw-grid tw-gap-3 tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-p-4 tw-no-underline hover:tw-border-iron-600 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-white lg:tw-grid-cols-[7rem_minmax(0,1fr)_minmax(13rem,auto)] lg:tw-items-center"
              href={item.href}
            >
              <span className="tw-flex tw-flex-wrap tw-gap-2">
                <span className="tw-w-fit tw-rounded-full tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-2.5 tw-py-1 tw-text-[0.7rem] tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-300">
                  {item.kind}
                </span>
                {item.syntheticGetter ? (
                  <span className="tw-w-fit tw-rounded-full tw-bg-sky-400/10 tw-px-2.5 tw-py-1 tw-text-[0.7rem] tw-font-semibold tw-text-sky-200">
                    {t(
                      DEFAULT_LOCALE,
                      "publicReview.reference.syntheticGetter"
                    )}
                  </span>
                ) : null}
              </span>
              <span className="tw-min-w-0">
                <code className="tw-block tw-break-all tw-text-sm tw-text-white">
                  {item.signature}
                </code>
                <span className="tw-mt-1 tw-block tw-break-all tw-font-mono tw-text-xs tw-text-iron-500">
                  {item.definitionName
                    ? `${item.definitionName} · ${item.sourcePath}`
                    : item.sourcePath}
                </span>
              </span>
              <code className="tw-break-all tw-text-xs tw-text-sky-300 lg:tw-text-right">
                {item.selectorOrTopic}
              </code>
            </Link>
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
          {t(
            DEFAULT_LOCALE,
            "publicReview.reference.showMoreDeclarations"
          )}
        </button>
      ) : null}
    </section>
  );
}
