"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { formatInteger } from "@/i18n/format";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";

export interface SolidityDeclarationListItem {
  readonly href: string;
  readonly key: string;
  readonly kind: "function" | "event" | "error";
  readonly name: string;
  readonly selectorOrTopic: string;
  readonly signature: string;
  readonly stateMutability?: string | undefined;
  readonly visibility?: string | undefined;
}

const INPUT_CLASSES =
  "tw-min-h-11 tw-w-full tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-950 tw-px-3 tw-py-2 tw-text-base tw-text-iron-50 tw-outline-none focus:tw-border-primary-400 focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400/40";

export function SolidityDeclarationExplorer({
  items,
}: {
  readonly items: readonly SolidityDeclarationListItem[];
}) {
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("");
  const normalizedQuery = query.trim().toLocaleLowerCase(DEFAULT_LOCALE);
  const visibleItems = useMemo(
    () =>
      items.filter((item) => {
        const searchValue =
          `${item.name} ${item.signature} ${item.selectorOrTopic}`.toLocaleLowerCase(
            DEFAULT_LOCALE
          );
        return (
          (!kind || item.kind === kind) &&
          (!normalizedQuery || searchValue.includes(normalizedQuery))
        );
      }),
    [items, kind, normalizedQuery]
  );

  return (
    <section
      aria-labelledby="solidity-local-declarations"
      className="tw-rounded-2xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-p-5 sm:tw-p-7"
    >
      <h2
        id="solidity-local-declarations"
        className="tw-m-0 tw-text-2xl tw-font-semibold tw-text-white"
      >
        {t(DEFAULT_LOCALE, "publicReview.reference.declarations")}
      </h2>
      <div className="tw-mt-5 tw-grid tw-gap-4 sm:tw-grid-cols-[minmax(0,1fr)_14rem]">
        <label className="tw-block tw-text-sm tw-font-medium tw-text-iron-200">
          <span className="tw-mb-1.5 tw-block">
            {t(DEFAULT_LOCALE, "publicReview.reference.searchDeclarations")}
          </span>
          <input
            className={INPUT_CLASSES}
            type="search"
            value={query}
            placeholder={t(
              DEFAULT_LOCALE,
              "publicReview.reference.searchDeclarationsPlaceholder"
            )}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <label className="tw-block tw-text-sm tw-font-medium tw-text-iron-200">
          <span className="tw-mb-1.5 tw-block">
            {t(DEFAULT_LOCALE, "publicReview.reference.filterDeclarationKind")}
          </span>
          <select
            className={INPUT_CLASSES}
            value={kind}
            onChange={(event) => setKind(event.target.value)}
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
      </div>
      <p role="status" className="tw-mb-0 tw-mt-4 tw-text-sm tw-text-iron-400">
        {t(DEFAULT_LOCALE, "publicReview.reference.declarationResultsCount", {
          visible: formatInteger(DEFAULT_LOCALE, visibleItems.length),
          total: formatInteger(DEFAULT_LOCALE, items.length),
        })}
      </p>
      {visibleItems.length === 0 ? (
        <p className="tw-mb-0 tw-mt-5 tw-rounded-xl tw-bg-iron-900 tw-p-4 tw-text-iron-300">
          {t(DEFAULT_LOCALE, "publicReview.reference.noDeclarations")}
        </p>
      ) : (
        <ul className="tw-mb-0 tw-mt-5 tw-list-none tw-space-y-2 tw-p-0">
          {visibleItems.map((item) => (
            <li key={item.key}>
              <Link
                href={item.href}
                className="tw-grid tw-gap-3 tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-900/70 tw-p-4 tw-no-underline hover:tw-border-iron-600 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-white lg:tw-grid-cols-[7rem_minmax(0,1fr)_minmax(10rem,auto)] lg:tw-items-center"
              >
                <span className="tw-w-fit tw-rounded-full tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-950 tw-px-2.5 tw-py-1 tw-text-[0.7rem] tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-300">
                  {item.kind}
                </span>
                <code className="tw-break-all tw-text-sm tw-text-white">
                  {item.signature}
                </code>
                <span className="tw-break-all tw-font-mono tw-text-xs tw-text-sky-300 lg:tw-text-right">
                  {item.selectorOrTopic}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
