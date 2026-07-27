"use client";

import { useMemo, useState } from "react";

import { compareLocalized, formatInteger } from "@/i18n/format";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type { SolidityReadinessRequirement } from "@/lib/public-review/solidityReferenceTypes";

export interface SolidityReadinessListItem extends Pick<
  SolidityReadinessRequirement,
  "id" | "notes" | "owner" | "phase" | "status"
> {
  readonly evidence: readonly {
    readonly href: string;
    readonly path: string;
    readonly sha256: string;
  }[];
}

const INPUT_CLASSES =
  "tw-min-h-11 tw-w-full tw-rounded-lg tw-border tw-border-solid tw-border-iron-600 tw-bg-iron-950 tw-px-3 tw-py-2 tw-text-base tw-text-iron-50 tw-outline-none focus:tw-border-primary-400 focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400/40";

function humanize(value: string): string {
  return value.replaceAll("_", " ");
}

export function SolidityReadinessExplorer({
  items,
}: {
  readonly items: readonly SolidityReadinessListItem[];
}) {
  const [query, setQuery] = useState("");
  const [phase, setPhase] = useState("");
  const [status, setStatus] = useState("");
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
          [item.id, item.notes, item.owner]
            .join(" ")
            .toLocaleLowerCase(DEFAULT_LOCALE)
            .includes(normalizedQuery) &&
          (!phase || item.phase === phase) &&
          (!status || item.status === status)
      ),
    [items, normalizedQuery, phase, status]
  );

  return (
    <section
      aria-labelledby="solidity-release-readiness"
      className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-p-5"
    >
      <h2
        id="solidity-release-readiness"
        className="tw-m-0 tw-scroll-mt-28 tw-text-2xl tw-font-semibold tw-text-white"
      >
        {t(DEFAULT_LOCALE, "publicReview.reference.releaseReadiness")}
      </h2>
      <p className="tw-mb-0 tw-mt-2 tw-max-w-4xl tw-text-sm tw-leading-6 tw-text-iron-300">
        {t(
          DEFAULT_LOCALE,
          "publicReview.reference.releaseReadinessDescription"
        )}
      </p>
      <div className="tw-mt-5 tw-grid tw-gap-4 tw-rounded-xl tw-bg-iron-900/70 tw-p-4 md:tw-grid-cols-3">
        <label className="tw-block tw-text-sm tw-font-medium tw-text-iron-200">
          <span className="tw-mb-1.5 tw-block">
            {t(DEFAULT_LOCALE, "publicReview.reference.searchRequirements")}
          </span>
          <input
            className={INPUT_CLASSES}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t(
              DEFAULT_LOCALE,
              "publicReview.reference.searchRequirementsPlaceholder"
            )}
            type="search"
            value={query}
          />
        </label>
        <label className="tw-block tw-text-sm tw-font-medium tw-text-iron-200">
          <span className="tw-mb-1.5 tw-block">
            {t(DEFAULT_LOCALE, "publicReview.reference.releasePhase")}
          </span>
          <select
            className={INPUT_CLASSES}
            onChange={(event) => setPhase(event.target.value)}
            value={phase}
          >
            <option value="">
              {t(DEFAULT_LOCALE, "publicReview.reference.all")}
            </option>
            <option value="public_beta">
              {t(DEFAULT_LOCALE, "publicReview.reference.publicBeta")}
            </option>
            <option value="production_release">
              {t(DEFAULT_LOCALE, "publicReview.reference.productionRelease")}
            </option>
          </select>
        </label>
        <label className="tw-block tw-text-sm tw-font-medium tw-text-iron-200">
          <span className="tw-mb-1.5 tw-block">
            {t(DEFAULT_LOCALE, "publicReview.reference.requirementStatus")}
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
        {t(DEFAULT_LOCALE, "publicReview.reference.requirementResults", {
          total: formatInteger(DEFAULT_LOCALE, filteredItems.length),
        })}
      </p>
      <ul className="tw-mb-0 tw-mt-5 tw-list-none tw-space-y-3 tw-p-0">
        {filteredItems.map((item) => (
          <li key={`${item.phase}:${item.id}`}>
            <details className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-900/60 tw-p-4">
              <summary className="tw-cursor-pointer tw-text-white focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-white">
                <span className="tw-font-mono tw-text-sm tw-font-semibold">
                  {humanize(item.id)}
                </span>
                <span className="tw-mt-2 tw-flex tw-flex-wrap tw-gap-2">
                  <span className="tw-rounded-full tw-bg-iron-800 tw-px-2.5 tw-py-1 tw-text-xs tw-font-normal tw-text-iron-300">
                    {humanize(item.phase)}
                  </span>
                  <span className="tw-rounded-full tw-bg-amber-400/10 tw-px-2.5 tw-py-1 tw-text-xs tw-font-normal tw-text-amber-200">
                    {humanize(item.status)}
                  </span>
                </span>
              </summary>
              <p className="tw-mb-0 tw-mt-4 tw-text-sm tw-leading-6 tw-text-iron-200">
                {item.notes}
              </p>
              <p className="tw-mb-0 tw-mt-3 tw-text-sm tw-text-iron-400">
                <span className="tw-font-semibold tw-text-iron-300">
                  {t(DEFAULT_LOCALE, "publicReview.reference.owner")}{" "}
                </span>
                {item.owner}
              </p>
              {item.evidence.length ? (
                <ul className="tw-mb-0 tw-mt-4 tw-list-none tw-space-y-2 tw-p-0">
                  {item.evidence.map((artifact) => (
                    <li key={artifact.path}>
                      <a
                        className="tw-break-all tw-font-mono tw-text-xs tw-text-sky-300 tw-no-underline hover:tw-underline focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-white"
                        href={artifact.href}
                        rel="noreferrer"
                        target="_blank"
                      >
                        {artifact.path}
                        <span className="tw-sr-only">
                          {" "}
                          (
                          {t(
                            DEFAULT_LOCALE,
                            "publicReview.markdown.externalLink"
                          )}
                          )
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="tw-mb-0 tw-mt-3 tw-text-sm tw-text-iron-500">
                  {t(
                    DEFAULT_LOCALE,
                    "publicReview.reference.noEvidenceRetained"
                  )}
                </p>
              )}
            </details>
          </li>
        ))}
      </ul>
    </section>
  );
}
