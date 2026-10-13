"use client";

import clsx from "clsx";
import {
  useDeferredValue,
  useEffect,
  useId,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { formatInteger, selectPluralCategory } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";

import { isSameTimeZone } from "./timeZoneClock";
import { formatOffsetLabel, getDstLabel } from "./timeZoneLabels";
import {
  filterTimeZoneRows,
  sortTimeZoneRows,
  type TimeZoneRow,
  type TimeZoneSortDirection,
  type TimeZoneSortKey,
} from "./timeZoneRows";

type WorldTimeZoneTableProps = {
  readonly locale: SupportedLocale;
  // null while loading.
  readonly rows: readonly TimeZoneRow[] | null;
  readonly unsupportedCount: number;
  readonly viewerTimeZone: string | null;
};

type SortState = {
  readonly key: TimeZoneSortKey;
  readonly direction: TimeZoneSortDirection;
};

// Screen readers hear the result count only after typing pauses, and only
// when the count changes; minute updates never announce.
const ANNOUNCEMENT_DELAY_MS = 750;
const SKELETON_ROW_IDS = Array.from(
  { length: 8 },
  (_, position) => `skeleton-row-${position}`
);
// The unfiltered list starts short so the page stays scannable; search always
// covers every zone and "Show all" expands in place.
const INITIAL_ROW_LIMIT = 40;
const COLUMN_COUNT = 5;

const HEADER_CELL_CLASS_NAME =
  "tw-px-3 tw-py-2 tw-text-left tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-400";
const CELL_CLASS_NAME = "tw-px-3 tw-py-2.5 tw-align-top";
const REGION_CELL_VISIBILITY = "tw-hidden md:tw-table-cell";
const DST_CELL_VISIBILITY = "tw-hidden sm:tw-table-cell";

function getResultCountText(
  locale: SupportedLocale,
  count: number,
  shown: number
) {
  if (shown < count) {
    return t(locale, "tools.timeZones.table.showing", {
      shown: formatInteger(locale, shown),
      total: formatInteger(locale, count),
    });
  }
  const key =
    selectPluralCategory(locale, count) === "one"
      ? "tools.timeZones.table.resultCount.one"
      : "tools.timeZones.table.resultCount.other";
  return t(locale, key, { count: formatInteger(locale, count) });
}

function SortIcon({
  direction,
}: {
  readonly direction: TimeZoneSortDirection | null;
}) {
  let path = "M7 4l3 4H4l3-4zm0 8l-3-4h6l-3 4z";
  if (direction === "ascending") {
    path = "M7 4l4 6H3l4-6z";
  } else if (direction === "descending") {
    path = "M7 12L3 6h8l-4 6z";
  }
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 14 16"
      className={clsx(
        "tw-size-3.5 tw-shrink-0",
        direction === null ? "tw-text-iron-600" : "tw-text-iron-200"
      )}
      fill="currentColor"
    >
      <path d={path} />
    </svg>
  );
}

function SortableHeader({
  sortKey,
  sort,
  onSort,
  className,
  children,
}: {
  readonly sortKey: TimeZoneSortKey;
  readonly sort: SortState;
  readonly onSort: (key: TimeZoneSortKey) => void;
  readonly className?: string | undefined;
  readonly children: ReactNode;
}) {
  const direction = sort.key === sortKey ? sort.direction : null;
  return (
    <th
      scope="col"
      aria-sort={direction ?? undefined}
      className={clsx(HEADER_CELL_CLASS_NAME, className)}
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className="-tw-mx-1 tw-inline-flex tw-min-h-6 tw-items-center tw-gap-1 tw-rounded-md tw-border-0 tw-bg-transparent tw-px-1 tw-py-0.5 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-300 tw-transition-colors hover:tw-text-iron-50 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
      >
        {children}
        <SortIcon direction={direction} />
      </button>
    </th>
  );
}

// One real row while loading: screen readers hear the loading text, and the
// decorative skeleton bars inside it reserve the table's space.
function LoadingRow({ label }: { readonly label: string }) {
  return (
    <tr>
      <td colSpan={COLUMN_COUNT} className={CELL_CLASS_NAME}>
        <span className="tw-sr-only">{label}</span>
        <div aria-hidden="true" className="tw-space-y-5 tw-py-2">
          {SKELETON_ROW_IDS.map((id) => (
            <div
              key={id}
              className="tw-h-9 tw-animate-pulse tw-rounded-md tw-bg-iron-800/80 motion-reduce:tw-animate-none"
            />
          ))}
        </div>
      </td>
    </tr>
  );
}

function ZoneRow({
  row,
  locale,
  isViewerZone,
}: {
  readonly row: TimeZoneRow;
  readonly locale: SupportedLocale;
  readonly isViewerZone: boolean;
}) {
  const dstLabel = getDstLabel(locale, row.dst);
  return (
    <tr
      className={clsx(
        "tw-border-0 tw-border-t tw-border-solid tw-border-white/5",
        isViewerZone && "tw-bg-primary-500/10"
      )}
    >
      <th
        scope="row"
        className={clsx(CELL_CLASS_NAME, "tw-text-left tw-font-normal")}
      >
        <span className="tw-block tw-text-sm tw-font-semibold tw-text-iron-50">
          {row.city}
          {isViewerZone ? (
            <span className="tw-ml-2 tw-inline-flex tw-rounded-full tw-border tw-border-solid tw-border-white/20 tw-px-1.5 tw-text-[11px] tw-font-medium tw-text-iron-100">
              {t(locale, "tools.timeZones.table.yourZone")}
            </span>
          ) : null}
        </span>
        <span className="tw-block tw-break-all tw-font-mono tw-text-xs tw-text-iron-400">
          {row.id}
        </span>
        <span className="tw-block tw-text-xs tw-text-iron-300">
          {row.genericName}
        </span>
      </th>
      <td
        className={clsx(
          CELL_CLASS_NAME,
          REGION_CELL_VISIBILITY,
          "tw-text-sm tw-text-iron-300"
        )}
      >
        {row.regionLabel}
      </td>
      <td
        className={clsx(
          CELL_CLASS_NAME,
          "tw-whitespace-nowrap tw-text-sm tw-tabular-nums tw-text-iron-100"
        )}
      >
        {formatOffsetLabel(locale, row.offsetMinutes)}
        <span className="tw-block tw-whitespace-normal tw-text-xs tw-text-iron-400 sm:tw-hidden">
          {dstLabel}
        </span>
      </td>
      <td className={clsx(CELL_CLASS_NAME, "tw-whitespace-nowrap")}>
        <span className="tw-block tw-text-sm tw-font-medium tw-tabular-nums tw-text-iron-50">
          {row.time}
        </span>
        <span className="tw-block tw-text-xs tw-text-iron-400">{row.date}</span>
      </td>
      <td
        className={clsx(
          CELL_CLASS_NAME,
          DST_CELL_VISIBILITY,
          "tw-text-sm tw-text-iron-300"
        )}
      >
        {dstLabel}
      </td>
    </tr>
  );
}

function useResultAnnouncement(text: string | null, enabled: boolean) {
  const [announcement, setAnnouncement] = useState("");
  useEffect(() => {
    if (!enabled || text === null) {
      return;
    }
    const timeout = setTimeout(
      () => setAnnouncement(text),
      ANNOUNCEMENT_DELAY_MS
    );
    return () => clearTimeout(timeout);
  }, [enabled, text]);
  return announcement;
}

export default function WorldTimeZoneTable({
  locale,
  rows,
  unsupportedCount,
  viewerTimeZone,
}: WorldTimeZoneTableProps) {
  const searchId = useId();
  const hintId = useId();
  const countId = useId();
  const [query, setQuery] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [sort, setSort] = useState<SortState>({
    key: "offset",
    direction: "ascending",
  });
  const deferredQuery = useDeferredValue(query);
  const visibleRows = useMemo(
    () =>
      rows === null
        ? null
        : sortTimeZoneRows(
            filterTimeZoneRows(rows, deferredQuery),
            sort.key,
            sort.direction,
            locale
          ),
    [rows, deferredQuery, sort, locale]
  );
  const isFiltered = deferredQuery.trim().length > 0;
  const displayedRows =
    visibleRows === null || showAll || isFiltered
      ? visibleRows
      : visibleRows.slice(0, INITIAL_ROW_LIMIT);
  const canToggleRows =
    !isFiltered && (visibleRows?.length ?? 0) > INITIAL_ROW_LIMIT;
  const countText =
    visibleRows === null || displayedRows === null
      ? null
      : getResultCountText(locale, visibleRows.length, displayedRows.length);
  const viewerRowId = useMemo(
    () =>
      viewerTimeZone === null
        ? null
        : ((
            rows?.find((row) => row.id === viewerTimeZone) ??
            rows?.find((row) => isSameTimeZone(row.id, viewerTimeZone))
          )?.id ?? null),
    [rows, viewerTimeZone]
  );
  const announcement = useResultAnnouncement(countText, hasSearched);

  const handleSort = (key: TimeZoneSortKey) => {
    setSort((current) => ({
      key,
      direction:
        current.key === key && current.direction === "ascending"
          ? "descending"
          : "ascending",
    }));
  };

  const unsupportedKey =
    selectPluralCategory(locale, unsupportedCount) === "one"
      ? "tools.timeZones.table.unsupported.one"
      : "tools.timeZones.table.unsupported.other";

  return (
    <section
      aria-labelledby="world-time-zones-table-heading"
      className="tw-mt-10"
    >
      <h2
        id="world-time-zones-table-heading"
        className="tw-m-0 tw-text-xl tw-font-semibold tw-leading-7 tw-tracking-tight tw-text-iron-50"
      >
        {t(locale, "tools.timeZones.table.heading")}
      </h2>
      <div className="tw-mt-4 tw-flex tw-flex-col tw-gap-2 sm:tw-flex-row sm:tw-items-end sm:tw-justify-between">
        <div className="tw-w-full sm:tw-max-w-md">
          <label
            htmlFor={searchId}
            className="tw-mb-1.5 tw-block tw-text-sm tw-font-medium tw-text-iron-200"
          >
            {t(locale, "tools.timeZones.table.searchLabel")}
          </label>
          <input
            id={searchId}
            type="search"
            value={query}
            autoComplete="off"
            spellCheck={false}
            aria-describedby={`${hintId} ${countId}`}
            onChange={(event) => {
              setQuery(event.target.value);
              setHasSearched(true);
            }}
            className="tw-block tw-h-11 tw-w-full tw-rounded-lg tw-border-0 tw-bg-iron-900 tw-px-3 tw-text-base tw-text-iron-50 tw-ring-1 tw-ring-inset tw-ring-iron-700 placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary-400 sm:tw-text-sm"
          />
          <p
            id={hintId}
            className="tw-m-0 tw-mt-1.5 tw-text-xs tw-text-iron-400"
          >
            {t(locale, "tools.timeZones.table.searchHint")}
          </p>
        </div>
        <p
          id={countId}
          className="tw-m-0 tw-min-h-5 tw-text-sm tw-tabular-nums tw-text-iron-300"
        >
          {countText}
        </p>
      </div>
      <p className="tw-sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </p>
      {unsupportedCount > 0 ? (
        <p className="tw-m-0 tw-mt-3 tw-text-xs tw-text-iron-400">
          {t(locale, unsupportedKey, {
            count: formatInteger(locale, unsupportedCount),
          })}
        </p>
      ) : null}
      <div className="tw-mt-4 tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950">
        <table className="tw-w-full tw-border-collapse">
          <caption className="tw-sr-only">
            {t(locale, "tools.timeZones.table.caption")}
          </caption>
          <thead>
            <tr>
              <SortableHeader sortKey="zone" sort={sort} onSort={handleSort}>
                {t(locale, "tools.timeZones.table.columns.zone")}
              </SortableHeader>
              <SortableHeader
                sortKey="region"
                sort={sort}
                onSort={handleSort}
                className={REGION_CELL_VISIBILITY}
              >
                {t(locale, "tools.timeZones.table.columns.region")}
              </SortableHeader>
              <SortableHeader sortKey="offset" sort={sort} onSort={handleSort}>
                {t(locale, "tools.timeZones.table.columns.offset")}
              </SortableHeader>
              <th scope="col" className={HEADER_CELL_CLASS_NAME}>
                {t(locale, "tools.timeZones.table.columns.time")}
              </th>
              <th
                scope="col"
                className={clsx(HEADER_CELL_CLASS_NAME, DST_CELL_VISIBILITY)}
              >
                {t(locale, "tools.timeZones.table.columns.dst")}
              </th>
            </tr>
          </thead>
          <tbody>
            {visibleRows === null ? (
              <LoadingRow label={t(locale, "tools.timeZones.table.loading")} />
            ) : null}
            {displayedRows?.map((row) => (
              <ZoneRow
                key={row.id}
                row={row}
                locale={locale}
                isViewerZone={row.id === viewerRowId}
              />
            ))}
            {visibleRows?.length === 0 ? (
              <tr>
                <td
                  colSpan={COLUMN_COUNT}
                  className={clsx(
                    CELL_CLASS_NAME,
                    "tw-py-6 tw-text-sm tw-text-iron-300"
                  )}
                >
                  {t(locale, "tools.timeZones.table.empty", {
                    query: deferredQuery.trim(),
                  })}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      {canToggleRows ? (
        <button
          type="button"
          onClick={() => setShowAll((current) => !current)}
          className="tw-mt-4 tw-min-h-11 tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-iron-900 tw-px-4 tw-text-sm tw-font-semibold tw-text-iron-50 tw-transition-colors hover:tw-bg-iron-800 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
        >
          {showAll
            ? t(locale, "tools.timeZones.table.showFewer")
            : t(locale, "tools.timeZones.table.showAll", {
                count: formatInteger(locale, visibleRows?.length ?? 0),
              })}
        </button>
      ) : null}
    </section>
  );
}
