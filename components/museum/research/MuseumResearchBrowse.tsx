"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { museumResearchHref } from "@/lib/museum/publication/routes";

export interface MuseumResearchBrowseEntry {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly kindLabel?: string;
  readonly subjectLabels?: readonly string[];
  readonly description?: string;
  readonly sourcePath?: string;
  readonly publicationUri?: string;
}

export interface MuseumResearchBrowseGroup {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly entries: readonly MuseumResearchBrowseEntry[];
}

export interface MuseumResearchBrowseLabels {
  readonly eyebrow: string;
  readonly searchLabel: string;
  readonly searchPlaceholder: string;
  readonly filterLabel: string;
  readonly allSubjectsLabel: string;
  readonly noResultsLabel: string;
  readonly resultCountOne: string;
  readonly resultCountOther: string;
  readonly sourceLabel: string;
  readonly opensInNewTab: string;
}

function resultCountText(
  labels: MuseumResearchBrowseLabels,
  count: number
): string {
  const template =
    count === 1 ? labels.resultCountOne : labels.resultCountOther;
  return template.replace("{count}", String(count));
}

export function MuseumResearchBrowse({
  groups,
  title,
  description,
  labels,
}: {
  readonly groups: readonly MuseumResearchBrowseGroup[];
  readonly title: string;
  readonly description: string;
  readonly labels: MuseumResearchBrowseLabels;
}) {
  const [query, setQuery] = useState("");
  const [groupId, setGroupId] = useState("all");
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const filteredGroups = useMemo(
    () =>
      groups
        .filter((group) => groupId === "all" || group.id === groupId)
        .map((group) => ({
          ...group,
          entries: group.entries.filter((entry) => {
            if (normalizedQuery.length === 0) return true;
            return [
              entry.title,
              entry.kindLabel,
              entry.description,
              ...(entry.subjectLabels ?? []),
            ]
              .filter((value): value is string => value !== undefined)
              .join(" ")
              .toLocaleLowerCase()
              .includes(normalizedQuery);
          }),
        }))
        .filter((group) => group.entries.length > 0),
    [groupId, groups, normalizedQuery]
  );
  const resultCount = filteredGroups.reduce(
    (count, group) => count + group.entries.length,
    0
  );
  const [announcedResultCount, setAnnouncedResultCount] = useState(resultCount);

  useEffect(() => {
    const timeout = window.setTimeout(
      () => setAnnouncedResultCount(resultCount),
      350
    );
    return () => window.clearTimeout(timeout);
  }, [resultCount]);

  return (
    <section
      className="tw-mt-4 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-8"
      aria-labelledby="museum-research-reference-title"
    >
      <div className="tw-min-w-0">
        <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.16em] tw-text-primary-300">
          {labels.eyebrow}
        </p>
        <h2
          id="museum-research-reference-title"
          className="tw-m-0 tw-mt-2 tw-text-2xl tw-font-semibold tw-text-iron-50 sm:tw-text-3xl"
        >
          {title}
        </h2>
        <p className="tw-m-0 tw-mt-3 tw-max-w-3xl tw-text-base tw-leading-7 tw-text-iron-300">
          {description}
        </p>
      </div>

      <div className="tw-mt-7 tw-grid tw-min-w-0 tw-gap-4 sm:tw-grid-cols-[minmax(0,1fr)_minmax(12rem,16rem)]">
        <div>
          <label
            htmlFor="museum-research-search"
            className="tw-text-sm tw-font-semibold tw-text-iron-200"
          >
            {labels.searchLabel}
          </label>
          <input
            id="museum-research-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={labels.searchPlaceholder}
            className="tw-mt-2 tw-block tw-min-h-11 tw-w-full tw-border tw-border-solid tw-border-iron-700 tw-bg-black tw-px-3 tw-py-2 tw-text-base tw-text-iron-100 placeholder:tw-text-iron-500 focus:tw-border-primary-400 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary-400"
          />
        </div>
        <div>
          <label
            htmlFor="museum-research-filter"
            className="tw-text-sm tw-font-semibold tw-text-iron-200"
          >
            {labels.filterLabel}
          </label>
          <select
            id="museum-research-filter"
            value={groupId}
            onChange={(event) => setGroupId(event.target.value)}
            className="tw-mt-2 tw-block tw-min-h-11 tw-w-full tw-border tw-border-solid tw-border-iron-700 tw-bg-black tw-px-3 tw-py-2 tw-text-base tw-text-iron-100 focus:tw-border-primary-400 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary-400"
          >
            <option value="all">{labels.allSubjectsLabel}</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.title}
              </option>
            ))}
          </select>
        </div>
      </div>
      <p
        aria-hidden="true"
        className="tw-m-0 tw-mt-4 tw-text-sm tw-text-iron-400"
      >
        {resultCountText(labels, resultCount)}
      </p>
      <span className="tw-sr-only" aria-live="polite" aria-atomic="true">
        {resultCountText(labels, announcedResultCount)}
      </span>

      <div className="tw-mt-5 tw-min-w-0">
        {filteredGroups.length === 0 ? (
          <p className="tw-m-0 tw-border-y tw-border-solid tw-border-iron-800 tw-py-6 tw-text-base tw-leading-7 tw-text-iron-300">
            {labels.noResultsLabel}
          </p>
        ) : (
          filteredGroups.map((group) => (
            <section
              key={group.id}
              aria-labelledby={`museum-research-library-${group.id}`}
              className="tw-min-w-0 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-py-6 last:tw-border-b"
            >
              <h3
                id={`museum-research-library-${group.id}`}
                className="tw-m-0 tw-min-w-0 tw-break-words tw-text-lg tw-font-semibold tw-text-iron-100"
              >
                {group.title}
              </h3>
              <ul className="tw-m-0 tw-mt-3 tw-min-w-0 tw-list-none tw-divide-y tw-divide-iron-800 tw-p-0">
                {group.entries.map((entry) => (
                  <li
                    key={entry.id}
                    className="tw-flex tw-min-w-0 tw-flex-col tw-gap-2 tw-py-4 sm:tw-flex-row sm:tw-items-start sm:tw-justify-between sm:tw-gap-6"
                  >
                    <Link
                      href={museumResearchHref(entry.slug)}
                      className="tw-group tw-min-w-0 tw-flex-1 tw-no-underline focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
                    >
                      <span className="group-hover:tw-text-primary-200 tw-block tw-min-w-0 tw-break-words tw-text-base tw-font-semibold tw-leading-6 tw-text-iron-100">
                        {entry.title}
                      </span>
                      <span className="tw-mt-1 tw-block tw-min-w-0 tw-break-words tw-text-sm tw-leading-6 tw-text-iron-400">
                        {[entry.kindLabel, entry.subjectLabels?.join(" / ")]
                          .filter(Boolean)
                          .join(" / ")}
                      </span>
                      {entry.description === undefined ? null : (
                        <span className="tw-mt-1 tw-block tw-min-w-0 tw-break-words tw-text-sm tw-leading-6 tw-text-iron-500">
                          {entry.description}
                        </span>
                      )}
                    </Link>
                    {entry.publicationUri === undefined ? null : (
                      <a
                        href={entry.publicationUri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:tw-text-primary-200 tw-inline-flex tw-min-h-11 tw-shrink-0 tw-items-center tw-self-start tw-text-sm tw-font-semibold tw-text-primary-300 tw-underline tw-underline-offset-4 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
                      >
                        {labels.sourceLabel}
                        <span className="tw-sr-only">
                          {` ${labels.opensInNewTab}`}
                        </span>
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}
      </div>
    </section>
  );
}
