"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { compareLocalized, formatInteger } from "@/i18n/format";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";

export interface SolidityDefinitionListItem {
  readonly classification: string;
  readonly errorCount: number;
  readonly eventCount: number;
  readonly functionCount: number;
  readonly href: string;
  readonly key: string;
  readonly kind: string;
  readonly name: string;
  readonly scope: string;
  readonly sourcePath: string;
  readonly tracked: boolean;
  readonly warningCount: number;
}

const INPUT_CLASSES =
  "tw-min-h-11 tw-w-full tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-950 tw-px-3 tw-py-2 tw-text-base tw-text-iron-50 tw-outline-none focus:tw-border-primary-400 focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400/40";
const INITIAL_RESULT_LIMIT = 50;

function getDistinctValues(
  items: readonly SolidityDefinitionListItem[],
  field: "classification" | "kind" | "scope"
): readonly string[] {
  return Array.from(new Set(items.map((item) => item[field]))).sort(
    (left, right) => compareLocalized(DEFAULT_LOCALE, left, right)
  );
}

function matchesFilter(
  item: SolidityDefinitionListItem,
  {
    classification,
    kind,
    query,
    scope,
  }: {
    readonly classification: string;
    readonly kind: string;
    readonly query: string;
    readonly scope: string;
  }
): boolean {
  const normalizedQuery = query.trim().toLocaleLowerCase(DEFAULT_LOCALE);
  const searchValue =
    `${item.name} ${item.sourcePath} ${item.classification}`.toLocaleLowerCase(
      DEFAULT_LOCALE
    );
  return (
    (!normalizedQuery || searchValue.includes(normalizedQuery)) &&
    (!classification || item.classification === classification) &&
    (!kind || item.kind === kind) &&
    (!scope || item.scope === scope)
  );
}

function FilterSelect({
  label,
  onChange,
  options,
  value,
}: {
  readonly label: string;
  readonly onChange: (value: string) => void;
  readonly options: readonly string[];
  readonly value: string;
}) {
  return (
    <label className="tw-block tw-text-sm tw-font-medium tw-text-iron-200">
      <span className="tw-mb-1.5 tw-block">{label}</span>
      <select
        className={INPUT_CLASSES}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">
          {t(DEFAULT_LOCALE, "publicReview.reference.all")}
        </option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option.replaceAll("_", " ")}
          </option>
        ))}
      </select>
    </label>
  );
}

export function SolidityDefinitionExplorer({
  items,
}: {
  readonly items: readonly SolidityDefinitionListItem[];
}) {
  const [query, setQuery] = useState("");
  const [classification, setClassification] = useState("");
  const [kind, setKind] = useState("");
  const [scope, setScope] = useState("");
  const [resultLimit, setResultLimit] = useState(INITIAL_RESULT_LIMIT);
  const focusResultsAfterExpansion = useRef(false);
  const resultsStatusRef = useRef<HTMLParagraphElement>(null);
  const filterOptions = useMemo(
    () => ({
      classifications: getDistinctValues(items, "classification"),
      kinds: getDistinctValues(items, "kind"),
      scopes: getDistinctValues(items, "scope"),
    }),
    [items]
  );
  const filteredItems = useMemo(
    () =>
      items.filter((item) =>
        matchesFilter(item, { classification, kind, query, scope })
      ),
    [classification, items, kind, query, scope]
  );
  const visibleItems = filteredItems.slice(0, resultLimit);

  useEffect(() => {
    if (!focusResultsAfterExpansion.current) {
      return;
    }
    focusResultsAfterExpansion.current = false;
    resultsStatusRef.current?.focus();
  }, [resultLimit]);

  const showMoreDefinitions = (): void => {
    const nextResultLimit = resultLimit + INITIAL_RESULT_LIMIT;
    focusResultsAfterExpansion.current =
      nextResultLimit >= filteredItems.length;
    setResultLimit(nextResultLimit);
  };

  return (
    <section aria-labelledby="solidity-definition-inventory">
      <h2
        id="solidity-definition-inventory"
        className="tw-m-0 tw-scroll-mt-28 tw-text-2xl tw-font-semibold tw-text-white"
      >
        {t(DEFAULT_LOCALE, "publicReview.reference.definitions")}
      </h2>
      <div className="tw-mt-5 tw-grid tw-gap-4 tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-900/70 tw-p-4 sm:tw-grid-cols-2 xl:tw-grid-cols-4">
        <label className="tw-block tw-text-sm tw-font-medium tw-text-iron-200 sm:tw-col-span-2 xl:tw-col-span-1">
          <span className="tw-mb-1.5 tw-block">
            {t(DEFAULT_LOCALE, "publicReview.reference.searchDefinitions")}
          </span>
          <input
            className={INPUT_CLASSES}
            type="search"
            value={query}
            placeholder={t(
              DEFAULT_LOCALE,
              "publicReview.reference.searchDefinitionsPlaceholder"
            )}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <FilterSelect
          label={t(DEFAULT_LOCALE, "publicReview.reference.filterScope")}
          onChange={setScope}
          options={filterOptions.scopes}
          value={scope}
        />
        <FilterSelect
          label={t(DEFAULT_LOCALE, "publicReview.reference.filterKind")}
          onChange={setKind}
          options={filterOptions.kinds}
          value={kind}
        />
        <FilterSelect
          label={t(
            DEFAULT_LOCALE,
            "publicReview.reference.filterClassification"
          )}
          onChange={setClassification}
          options={filterOptions.classifications}
          value={classification}
        />
      </div>

      <p
        className="tw-mb-0 tw-mt-4 tw-text-sm tw-text-iron-400"
        ref={resultsStatusRef}
        role="status"
        tabIndex={-1}
      >
        {t(DEFAULT_LOCALE, "publicReview.reference.resultsCount", {
          visible: formatInteger(DEFAULT_LOCALE, visibleItems.length),
          total: formatInteger(DEFAULT_LOCALE, items.length),
        })}
      </p>

      {filteredItems.length === 0 ? (
        <p className="tw-mb-0 tw-mt-5 tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-900 tw-p-5 tw-text-iron-300">
          {t(DEFAULT_LOCALE, "publicReview.reference.noDefinitions")}
        </p>
      ) : (
        <ul className="tw-mb-0 tw-mt-5 tw-grid tw-list-none tw-gap-3 tw-p-0 lg:tw-grid-cols-2">
          {visibleItems.map((item) => (
            <li key={item.key}>
              <Link
                href={item.href}
                aria-label={t(
                  DEFAULT_LOCALE,
                  "publicReview.reference.openDefinition",
                  { name: item.name }
                )}
                className="tw-block tw-h-full tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-p-4 tw-no-underline hover:tw-border-iron-600 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-white"
              >
                <div className="tw-flex tw-flex-wrap tw-items-start tw-justify-between tw-gap-3">
                  <div className="tw-min-w-0">
                    <h3 className="tw-m-0 tw-break-words tw-font-mono tw-text-base tw-font-semibold tw-text-white">
                      {item.name}
                    </h3>
                    <p className="tw-mb-0 tw-mt-1 tw-break-all tw-font-mono tw-text-xs tw-text-iron-500">
                      {item.sourcePath}
                    </p>
                  </div>
                  <span className="tw-flex tw-flex-wrap tw-justify-end tw-gap-2">
                    <span className="tw-rounded-full tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-2.5 tw-py-1 tw-text-[0.7rem] tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-300">
                      {item.kind}
                    </span>
                    <span className="tw-rounded-full tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-2.5 tw-py-1 tw-text-[0.7rem] tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-300">
                      {item.scope}
                    </span>
                  </span>
                </div>
                <div className="tw-mt-3 tw-flex tw-flex-wrap tw-items-center tw-gap-2">
                  <p className="tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-300">
                    {item.classification.replaceAll("_", " ")}
                  </p>
                  <span
                    className={`tw-rounded-full tw-px-2 tw-py-0.5 tw-text-[0.7rem] tw-font-semibold ${
                      item.tracked
                        ? "tw-bg-emerald-400/10 tw-text-emerald-200"
                        : "tw-bg-iron-900 tw-text-iron-400"
                    }`}
                  >
                    {t(
                      DEFAULT_LOCALE,
                      item.tracked
                        ? "publicReview.reference.releaseTracked"
                        : "publicReview.reference.releaseNotTracked"
                    )}
                  </span>
                </div>
                <dl className="tw-mb-0 tw-mt-4 tw-grid tw-grid-cols-4 tw-gap-2 tw-text-xs">
                  {[
                    [
                      t(DEFAULT_LOCALE, "publicReview.reference.functions"),
                      item.functionCount,
                    ],
                    [
                      t(DEFAULT_LOCALE, "publicReview.reference.events"),
                      item.eventCount,
                    ],
                    [
                      t(DEFAULT_LOCALE, "publicReview.reference.errors"),
                      item.errorCount,
                    ],
                    [
                      t(DEFAULT_LOCALE, "publicReview.reference.warnings"),
                      item.warningCount,
                    ],
                  ].map(([label, count]) => (
                    <div
                      key={String(label)}
                      className="tw-rounded-lg tw-bg-iron-900 tw-p-2 tw-text-center"
                    >
                      <dt className="tw-break-words tw-text-[0.65rem] tw-font-semibold tw-leading-4 tw-text-iron-500">
                        {label}
                      </dt>
                      <dd className="tw-m-0 tw-mt-1 tw-font-mono tw-text-iron-200">
                        {formatInteger(DEFAULT_LOCALE, Number(count))}
                      </dd>
                    </div>
                  ))}
                </dl>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {visibleItems.length < filteredItems.length ? (
        <button
          className="tw-mt-5 tw-inline-flex tw-min-h-11 tw-items-center tw-rounded-lg tw-border tw-border-solid tw-border-iron-600 tw-bg-iron-900 tw-px-4 tw-py-2 tw-font-semibold tw-text-white focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-white"
          onClick={showMoreDefinitions}
          type="button"
        >
          {t(DEFAULT_LOCALE, "publicReview.reference.showMoreDefinitions")}
        </button>
      ) : null}
    </section>
  );
}
