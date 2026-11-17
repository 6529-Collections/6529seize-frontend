"use client";

import {
  AdjustmentsHorizontalIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  Squares2X2Icon,
  TableCellsIcon,
  XMarkIcon,
} from "@heroicons/react/20/solid";
import {
  Fragment,
  useCallback,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import type { AiMedium, AiModelFacets } from "@/lib/ai-page/models";
import { SHEET_ID, useSheetFocus } from "./useSheetFocus";

type Media = AiMedium | "any";
type Sort = "memory" | "newest" | "name";
type View = "cards" | "table";

type Filter = {
  readonly query: string;
  readonly runs: boolean;
  readonly reads: Media;
  readonly makes: Media;
  /** The most memory a model may need, in GB; null for any size. */
  readonly memory: number | null;
};

const NO_FILTER: Filter = {
  query: "",
  runs: false,
  reads: "any",
  makes: "any",
  memory: null,
};

/** The memory choices, in GB: a laptop GPU up to a data-center GPU. */
const MEMORY_STEPS = [8, 16, 24, 48, 80] as const;

/** One model, as the filter, the order and the table need it. */
export type AiModelRow = {
  readonly id: string;
  readonly name: string;
  readonly maker: string;
  /** The smallest version's files and memory, as the page prints them. */
  readonly size: string;
  readonly memory: string;
  readonly facets: AiModelFacets;
};

export type AiModelsSection = {
  readonly id: string;
  readonly title: string;
  readonly line: string;
  readonly count: string;
  readonly rows: readonly AiModelRow[];
};

type AiMediaChoices = {
  readonly label: string;
  readonly choices: Readonly<Record<Media, string>>;
};

export type AiModelsText = {
  readonly label: string;
  readonly search: string;
  readonly runs: string;
  readonly reads: AiMediaChoices;
  readonly makes: AiMediaChoices;
  readonly memory: string;
  readonly anySize: string;
  /** "Up to {size}", one per memory step, in GB order. */
  readonly upTo: readonly string[];
  readonly memoryHint: string;
  readonly sort: string;
  readonly sorts: Readonly<Record<Sort, string>>;
  readonly view: string;
  readonly views: Readonly<Record<View, string>>;
  readonly section: string;
  readonly sections: string;
  /** "{shown} of {total} models", with the two placeholders. */
  readonly count: string;
  readonly clear: string;
  readonly none: string;
  /** "Filters", the phone sheet's title, and "Filters ({count})". */
  readonly filters: string;
  readonly filtersCount: string;
  /** "Show {shown} models", the sheet's closing button. */
  readonly showCount: string;
  /** What the mark on a score means, said once. */
  readonly legend: string;
  readonly table: {
    readonly model: string;
    readonly maker: string;
    readonly size: string;
    readonly memory: string;
    /** "GPU", the memory column's heading on a phone. */
    readonly memoryShort: string;
    /** "GPU: GPU memory needed", the phone's note on that heading. */
    readonly memoryNote: string;
    readonly inApp: string;
    /** "App", the same column's heading on a phone. */
    readonly inAppShort: string;
    readonly yes: string;
    readonly open: string;
  };
};

/**
 * What splits a name into words, on both sides of the search: spaces and
 * the marks between a name's parts, not the dot in "0.8B".
 */
const WORD_BREAK = /[\s/_(),-]+/;

/** The search's words, as the names are split. */
function searchWords(query: string): string[] {
  return query.toLowerCase().split(WORD_BREAK).filter(Boolean);
}

/**
 * Whether each word of the search starts a word of the model's name,
 * publisher, packager or id: "qwen 8b" finds Qwen3-8B, not Qwen3.5-0.8B,
 * and a pasted id ("qwen3-4b-mlx-4bit") finds its model.
 */
function found(facets: AiModelFacets, words: readonly string[]): boolean {
  const own = facets.search.split(WORD_BREAK);
  return words.every((word) => own.some((part) => part.startsWith(word)));
}

const VIEW_KEY = "6529-ai-models-view";
const PHONE = "(max-width: 639px)";

function noSubscription(): () => void {
  return () => undefined;
}

function readStoredView(): View | null {
  try {
    const value = globalThis.localStorage.getItem(VIEW_KEY);
    return value === "cards" || value === "table" ? value : null;
  } catch {
    return null;
  }
}

function noView(): View | null {
  return null;
}

function storeView(view: View): void {
  try {
    globalThis.localStorage.setItem(VIEW_KEY, view);
  } catch {
    // The choice holds for this visit only.
  }
}

function subscribePhone(change: () => void): () => void {
  if (typeof globalThis.matchMedia !== "function") {
    return () => undefined;
  }
  const query = globalThis.matchMedia(PHONE);
  query.addEventListener("change", change);
  return () => query.removeEventListener("change", change);
}

function isPhone(): boolean {
  return (
    typeof globalThis.matchMedia === "function" &&
    globalThis.matchMedia(PHONE).matches
  );
}

function notPhone(): boolean {
  return false;
}

function matches(
  facets: AiModelFacets,
  filter: Filter,
  words: readonly string[]
) {
  if (!found(facets, words)) {
    return false;
  }
  if (filter.runs && !facets.runs) {
    return false;
  }
  if (filter.reads !== "any" && !facets.reads.includes(filter.reads)) {
    return false;
  }
  if (filter.makes !== "any" && !facets.makes.includes(filter.makes)) {
    return false;
  }
  if (filter.memory !== null) {
    const needs = filter.runs ? facets.runnableMemoryGB : facets.memoryGB;
    return needs !== null && needs <= filter.memory;
  }
  return true;
}

function compare(sort: Sort, runs: boolean) {
  const byName = (a: AiModelRow, b: AiModelRow) => a.name.localeCompare(b.name);
  if (sort === "name") {
    return byName;
  }
  if (sort === "newest") {
    return (a: AiModelRow, b: AiModelRow) =>
      b.facets.published.localeCompare(a.facets.published) || byName(a, b);
  }
  const memory = (row: AiModelRow) =>
    (runs ? row.facets.runnableMemoryGB : null) ?? row.facets.memoryGB;
  return (a: AiModelRow, b: AiModelRow) =>
    memory(a) - memory(b) || byName(a, b);
}

const SELECT =
  "tw-h-11 tw-cursor-pointer tw-appearance-none tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-iron-900 tw-bg-[length:16px] tw-bg-[right_0.5rem_center] tw-bg-no-repeat tw-pl-3 tw-pr-8 tw-text-sm tw-font-medium tw-text-iron-100 tw-transition hover:tw-border-white/20 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 sm:tw-h-9";
// A chevron for the native select, drawn as a background so it keeps the
// select's own keyboard and screen reader behaviour.
const CHEVRON = {
  backgroundImage:
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%239b9ba3'%3E%3Cpath fill-rule='evenodd' d='M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z' clip-rule='evenodd'/%3E%3C/svg%3E\")",
};

function MediaSelect({
  choices,
  value,
  onChange,
}: {
  readonly choices: AiMediaChoices;
  readonly value: Media;
  readonly onChange: (value: Media) => void;
}) {
  return (
    <select
      aria-label={choices.label}
      value={value}
      onChange={(event) => onChange(event.target.value as Media)}
      className={`${SELECT} tw-flex-none`}
      style={CHEVRON}
    >
      {(["any", "text", "image", "audio"] as const).map((medium) => (
        <option key={medium} value={medium}>
          {choices.choices[medium]}
        </option>
      ))}
    </select>
  );
}

/** How many filters are on, for the phone's Filters button. */
function filterCount(filter: Filter): number {
  return [
    filter.runs,
    filter.reads !== "any",
    filter.makes !== "any",
    filter.memory !== null,
  ].filter(Boolean).length;
}

function Bar({
  text,
  filter,
  setFilter,
  sort,
  setSort,
  view,
  setView,
  sections,
  sheet,
  setSheet,
  count,
}: {
  readonly text: AiModelsText;
  readonly filter: Filter;
  readonly setFilter: (filter: Filter) => void;
  readonly sort: Sort;
  readonly setSort: (sort: Sort) => void;
  readonly view: View;
  readonly setView: (view: View) => void;
  readonly sections: readonly { id: string; title: string; shown: number }[];
  /** Whether a phone shows the filters, in a sheet over the page. */
  readonly sheet: boolean;
  readonly setSheet: (open: boolean) => void;
  readonly count: string;
}) {
  return (
    <fieldset
      aria-label={text.label}
      className="tw-m-0 tw-flex tw-min-w-0 tw-flex-col tw-gap-3 tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.08] tw-bg-iron-950/90 tw-p-3 lg:tw-sticky lg:tw-top-3 lg:tw-z-20 lg:tw-shadow-[0_12px_32px_-16px_rgba(0,0,0,0.9)] lg:tw-backdrop-blur-md"
    >
      <div className="tw-flex tw-items-center tw-gap-2">
        <label className="tw-relative tw-min-w-0 tw-flex-1">
          <span className="tw-sr-only">{text.search}</span>
          <MagnifyingGlassIcon
            aria-hidden="true"
            className="tw-pointer-events-none tw-absolute tw-left-3 tw-top-1/2 tw-size-4 -tw-translate-y-1/2 tw-text-iron-500"
          />
          <input
            type="search"
            value={filter.query}
            placeholder={text.search}
            onChange={(event) =>
              setFilter({ ...filter, query: event.target.value })
            }
            className="tw-h-11 tw-w-full tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-iron-900 tw-pl-9 tw-pr-3 tw-text-[15px] tw-text-iron-50 tw-transition placeholder:tw-text-iron-500 hover:tw-border-white/20 focus:tw-border-primary-400/60 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 sm:tw-h-9 sm:tw-text-sm"
          />
        </label>
        <fieldset
          aria-label={text.view}
          className="tw-m-0 tw-flex tw-flex-none tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-iron-900 tw-p-0.5"
        >
          {(["cards", "table"] as const).map((key) => (
            <button
              key={key}
              type="button"
              aria-pressed={view === key}
              onClick={() => setView(key)}
              className={`tw-inline-flex tw-min-h-10 tw-items-center tw-gap-1.5 tw-rounded-md tw-border-0 tw-px-2.5 tw-text-sm tw-font-medium tw-transition focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 sm:tw-min-h-8 ${view === key ? "tw-bg-iron-100 tw-text-iron-950" : "tw-bg-transparent tw-text-iron-400 hover:tw-text-iron-100"}`}
            >
              {key === "cards" ? (
                <Squares2X2Icon aria-hidden="true" className="tw-size-4" />
              ) : (
                <TableCellsIcon aria-hidden="true" className="tw-size-4" />
              )}
              <span className="max-sm:tw-sr-only">{text.views[key]}</span>
            </button>
          ))}
        </fieldset>
        <select
          aria-label={text.section}
          value=""
          onChange={(event) => {
            if (event.target.value) {
              globalThis.location.hash = event.target.value;
            }
          }}
          className={`${SELECT} tw-hidden tw-w-44 tw-flex-none xl:tw-block`}
          style={CHEVRON}
        >
          <option value="">{text.section}</option>
          {sections.map((section) => (
            <option
              key={section.id}
              value={section.id}
              disabled={section.shown === 0}
            >
              {section.title} ({section.shown})
            </option>
          ))}
        </select>
      </div>
      {sheet && (
        <button
          type="button"
          tabIndex={-1}
          aria-hidden="true"
          onClick={() => setSheet(false)}
          className="tw-fixed tw-inset-0 tw-z-40 tw-cursor-default tw-border-0 tw-bg-black/70 tw-p-0 sm:tw-hidden"
        />
      )}
      <div
        id={SHEET_ID}
        className={`tw-flex-wrap tw-items-center tw-gap-x-3 tw-gap-y-2 sm:tw-flex ${sheet ? "max-sm:tw-fixed max-sm:tw-inset-x-0 max-sm:tw-bottom-0 max-sm:tw-z-50 max-sm:tw-flex max-sm:tw-max-h-[85dvh] max-sm:tw-flex-col max-sm:tw-items-stretch max-sm:tw-gap-3 max-sm:tw-overflow-y-auto max-sm:tw-rounded-t-2xl max-sm:tw-border-0 max-sm:tw-border-t max-sm:tw-border-solid max-sm:tw-border-white/10 max-sm:tw-bg-iron-950 max-sm:tw-px-4 max-sm:tw-pb-6 max-sm:tw-pt-4 max-sm:tw-shadow-[0_-16px_48px_-12px_rgba(0,0,0,0.9)]" : "max-sm:tw-hidden"}`}
      >
        <p className="tw-m-0 tw-text-base tw-font-semibold tw-text-iron-50 sm:tw-hidden">
          {text.filters}
        </p>
        <label className="tw-flex tw-min-h-11 tw-flex-none tw-cursor-pointer tw-items-center tw-gap-2.5 tw-whitespace-nowrap tw-text-sm tw-font-medium tw-text-iron-100 sm:tw-min-h-9">
          <input
            type="checkbox"
            checked={filter.runs}
            onChange={(event) =>
              setFilter({ ...filter, runs: event.target.checked })
            }
            className="tw-peer tw-sr-only"
          />
          <span
            aria-hidden="true"
            className="tw-relative tw-h-5 tw-w-9 tw-flex-none tw-rounded-full tw-bg-iron-700 tw-transition after:tw-absolute after:tw-left-0.5 after:tw-top-0.5 after:tw-size-4 after:tw-rounded-full after:tw-bg-white after:tw-transition after:tw-content-[''] peer-checked:tw-bg-emerald-500 peer-checked:after:tw-translate-x-4 peer-focus-visible:tw-ring-2 peer-focus-visible:tw-ring-primary-400"
          />
          {text.runs}
        </label>
        <MediaSelect
          choices={text.reads}
          value={filter.reads}
          onChange={(reads) => setFilter({ ...filter, reads })}
        />
        <MediaSelect
          choices={text.makes}
          value={filter.makes}
          onChange={(makes) => setFilter({ ...filter, makes })}
        />
        <select
          aria-label={text.memory}
          value={filter.memory ?? ""}
          onChange={(event) =>
            setFilter({
              ...filter,
              memory:
                event.target.value === "" ? null : Number(event.target.value),
            })
          }
          className={`${SELECT} tw-flex-none`}
          style={CHEVRON}
        >
          <option value="">{text.anySize}</option>
          {MEMORY_STEPS.map((step, index) => (
            <option key={step} value={step}>
              {text.upTo[index]}
            </option>
          ))}
        </select>
        <select
          aria-label={text.sort}
          value={sort}
          onChange={(event) => setSort(event.target.value as Sort)}
          className={`${SELECT} tw-flex-none`}
          style={CHEVRON}
        >
          {(["memory", "newest", "name"] as const).map((key) => (
            <option key={key} value={key}>
              {text.sorts[key]}
            </option>
          ))}
        </select>
        <p className="tw-m-0 tw-text-[13px] tw-leading-5 tw-text-iron-500">
          {text.memoryHint}
        </p>
        <button
          type="button"
          onClick={() => setSheet(false)}
          className="tw-inline-flex tw-min-h-12 tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-primary-500 tw-px-4 tw-text-[15px] tw-font-semibold tw-text-white focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-300 sm:tw-hidden"
        >
          {count}
        </button>
      </div>
    </fieldset>
  );
}

function Table({
  rows,
  cards,
  open,
  toggle,
  text,
}: {
  readonly rows: readonly AiModelRow[];
  readonly cards: Readonly<Record<string, ReactNode>>;
  readonly open: ReadonlySet<string>;
  readonly toggle: (id: string) => void;
  readonly text: AiModelsText["table"];
}) {
  const head =
    "tw-px-2 tw-py-2 tw-text-[11px] tw-font-semibold tw-uppercase tw-tracking-wider tw-text-iron-500 sm:tw-px-3";
  const cell = "tw-px-2 tw-py-2.5 tw-align-top sm:tw-px-3";
  const columns = 5;
  return (
    <div className="tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.08]">
      <table className="tw-w-full tw-border-collapse tw-text-left tw-text-sm tw-leading-5">
        <thead className="tw-bg-white/[0.03]">
          <tr>
            <th scope="col" className={head}>
              {text.model}
            </th>
            <th scope="col" className={`${head} max-md:tw-hidden`}>
              {text.maker}
            </th>
            <th
              scope="col"
              className={`${head} tw-text-right max-sm:tw-hidden`}
            >
              {text.size}
            </th>
            <th scope="col" className={`${head} tw-text-right`}>
              <span aria-hidden="true" className="sm:tw-hidden">
                {text.memoryShort}
              </span>
              <span className="max-sm:tw-sr-only">{text.memory}</span>
            </th>
            <th scope="col" className={`${head} tw-text-center`}>
              <span className="sm:tw-hidden">{text.inAppShort}</span>
              <span className="max-sm:tw-hidden">{text.inApp}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const expanded = open.has(row.id);
            return (
              <Fragment key={row.id}>
                <tr
                  onClick={() => toggle(row.id)}
                  className="tw-cursor-pointer tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.06] tw-transition hover:tw-bg-white/[0.03]"
                >
                  <td className={cell}>
                    <button
                      type="button"
                      aria-expanded={expanded}
                      aria-controls={`row-${row.id}`}
                      aria-label={`${text.open}: ${row.name}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        toggle(row.id);
                      }}
                      className="tw-flex tw-items-start tw-gap-1.5 tw-border-0 tw-bg-transparent tw-p-0 tw-text-left tw-font-medium tw-text-iron-50 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
                    >
                      <ChevronDownIcon
                        aria-hidden="true"
                        className={`tw-mt-0.5 tw-size-4 tw-flex-none tw-text-iron-500 tw-transition ${expanded ? "" : "-tw-rotate-90"}`}
                      />
                      <span className="tw-min-w-0 tw-break-words">
                        {row.name}
                      </span>
                    </button>
                    <span className="tw-block tw-pl-[1.375rem] tw-text-xs tw-text-iron-500 md:tw-hidden">
                      {row.maker}
                    </span>
                  </td>
                  <td className={`${cell} tw-text-iron-400 max-md:tw-hidden`}>
                    {row.maker}
                  </td>
                  <td
                    className={`${cell} tw-whitespace-nowrap tw-text-right tw-tabular-nums tw-text-iron-300 max-sm:tw-hidden`}
                  >
                    {row.size}
                  </td>
                  <td
                    className={`${cell} tw-whitespace-nowrap tw-text-right tw-tabular-nums tw-text-iron-300`}
                  >
                    {row.memory}
                  </td>
                  <td className={`${cell} tw-text-center`}>
                    {row.facets.runs ? (
                      <>
                        <CheckCircleIcon
                          aria-hidden="true"
                          className="tw-inline tw-size-4 tw-text-emerald-400"
                        />
                        <span className="tw-sr-only">{text.yes}</span>
                      </>
                    ) : (
                      <span aria-hidden="true" className="tw-text-iron-600">
                        –
                      </span>
                    )}
                  </td>
                </tr>
                {expanded && (
                  <tr id={`row-${row.id}`}>
                    <td
                      colSpan={columns}
                      className="tw-bg-black/20 tw-p-2 sm:tw-p-3"
                    >
                      {cards[row.id]}
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Every model by section, as cards or as a table, with a search, filters
 * for what runs in the app today, what a model reads and makes and the
 * memory it needs, and an order. A row of the table opens its card.
 */
export default function AiModelsView({
  sections,
  cards,
  text,
}: {
  readonly sections: readonly AiModelsSection[];
  readonly cards: Readonly<Record<string, ReactNode>>;
  readonly text: AiModelsText;
}) {
  const [filter, setFilter] = useState<Filter>(NO_FILTER);
  const [sort, setSort] = useState<Sort>("memory");
  const [chosen, setChosen] = useState<View | null>(null);
  const stored = useSyncExternalStore(noSubscription, readStoredView, noView);
  const phone = useSyncExternalStore(subscribePhone, isPhone, notPhone);
  // A phone opens on the table, the shorter page; a visitor's own choice,
  // kept in this browser, wins.
  const view: View = chosen ?? stored ?? (phone ? "table" : "cards");
  const setView = (next: View) => {
    setChosen(next);
    storeView(next);
  };
  const [sheet, setSheet] = useState(false);
  const filtersButton = useRef<HTMLButtonElement>(null);
  const closeSheet = useCallback(() => setSheet(false), []);
  useSheetFocus(sheet, closeSheet, filtersButton);
  const [open, setOpen] = useState<ReadonlySet<string>>(new Set());

  const shown = useMemo(() => {
    const words = searchWords(filter.query);
    const order = compare(sort, filter.runs);
    return sections.map((section) => ({
      section,
      rows: section.rows
        .filter((row) => matches(row.facets, filter, words))
        .sort(order),
    }));
  }, [sections, filter, sort]);

  const total = sections.reduce((sum, section) => sum + section.rows.length, 0);
  const count = shown.reduce((sum, { rows }) => sum + rows.length, 0);
  const filtered =
    filter.query.trim() !== "" ||
    filter.runs ||
    filter.reads !== "any" ||
    filter.makes !== "any" ||
    filter.memory !== null;
  const jump = shown.map(({ section, rows }) => ({
    id: section.id,
    title: section.title,
    shown: rows.length,
  }));
  const toggle = (id: string) => {
    const next = new Set(open);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setOpen(next);
  };

  return (
    <>
      <Bar
        text={text}
        filter={filter}
        setFilter={setFilter}
        sort={sort}
        setSort={setSort}
        view={view}
        setView={setView}
        sections={jump}
        sheet={sheet}
        setSheet={setSheet}
        count={text.showCount.replace("{shown}", String(count))}
      />
      <div className="tw-mt-3 tw-flex tw-min-h-9 tw-flex-wrap tw-items-center tw-gap-x-3 tw-px-1">
        <button
          type="button"
          aria-expanded={sheet}
          ref={filtersButton}
          aria-controls={SHEET_ID}
          onClick={() => setSheet(true)}
          className="tw-inline-flex tw-min-h-11 tw-items-center tw-gap-1.5 tw-rounded-lg tw-border tw-border-solid tw-border-white/15 tw-bg-iron-900 tw-px-3 tw-text-sm tw-font-semibold tw-text-iron-100 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 sm:tw-hidden"
        >
          <AdjustmentsHorizontalIcon aria-hidden="true" className="tw-size-4" />
          {text.filtersCount.replace("{count}", String(filterCount(filter)))}
        </button>
        <p
          aria-live="polite"
          className="tw-m-0 tw-text-sm tw-tabular-nums tw-text-iron-400"
        >
          {text.count
            .replace("{shown}", String(count))
            .replace("{total}", String(total))}
        </p>
        {filtered && (
          <button
            type="button"
            onClick={() => setFilter(NO_FILTER)}
            className="tw-inline-flex tw-min-h-11 tw-items-center tw-gap-1 tw-rounded-md tw-border-0 tw-bg-transparent tw-px-1.5 tw-text-sm tw-font-medium tw-text-primary-300 tw-transition hover:tw-text-white focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 sm:tw-min-h-9"
          >
            <XMarkIcon aria-hidden="true" className="tw-size-4" />
            {text.clear}
          </button>
        )}
        <p
          className={`tw-m-0 tw-ml-auto tw-text-[13px] tw-text-iron-500 ${view === "table" ? "max-sm:tw-hidden" : ""}`}
        >
          {text.legend}
        </p>
        {view === "table" && (
          <p className="tw-m-0 tw-basis-full tw-pt-1 tw-text-[13px] tw-text-iron-500 sm:tw-hidden">
            {text.table.memoryNote}
          </p>
        )}
      </div>
      <nav
        aria-label={text.sections}
        className="-tw-mx-4 tw-mt-2 tw-overflow-x-auto tw-px-4 max-sm:tw-hidden xl:tw-hidden"
      >
        <ul className="tw-m-0 tw-flex tw-w-max tw-list-none tw-gap-2 tw-p-0 tw-pb-1">
          {jump
            .filter((section) => section.shown > 0)
            .map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="tw-inline-flex tw-min-h-11 tw-items-center tw-gap-2 tw-whitespace-nowrap tw-rounded-full tw-border tw-border-solid tw-border-white/10 tw-px-3.5 tw-text-sm tw-text-iron-300 tw-no-underline focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 sm:tw-min-h-9"
                >
                  {section.title}
                  <span className="tw-tabular-nums tw-text-iron-500">
                    {section.shown}
                  </span>
                </a>
              </li>
            ))}
        </ul>
      </nav>
      {count === 0 && (
        <div className="tw-mt-10 tw-flex tw-flex-col tw-items-start tw-gap-3 tw-rounded-xl tw-border tw-border-dashed tw-border-white/10 tw-p-6">
          <p className="tw-m-0 tw-text-[15px] tw-text-iron-200">{text.none}</p>
          <button
            type="button"
            onClick={() => setFilter(NO_FILTER)}
            className="tw-inline-flex tw-min-h-11 tw-items-center tw-rounded-lg tw-border tw-border-solid tw-border-white/15 tw-bg-iron-900 tw-px-3.5 tw-text-sm tw-font-semibold tw-text-iron-100 tw-transition hover:tw-border-primary-400/60 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-300 sm:tw-min-h-9"
          >
            {text.clear}
          </button>
        </div>
      )}
      {shown.map(({ section, rows }) =>
        rows.length === 0 ? null : (
          <section
            key={section.id}
            aria-labelledby={section.id}
            className={`tw-flex tw-flex-col tw-gap-4 ${view === "table" ? "tw-mt-10" : "tw-mt-12"}`}
          >
            <header className="tw-flex tw-flex-col tw-gap-1">
              <h2
                id={section.id}
                className="tw-m-0 tw-scroll-mt-40 tw-text-xl tw-font-semibold tw-leading-7 tw-tracking-tight tw-text-iron-50"
              >
                {section.title}
              </h2>
              <p className="tw-m-0 tw-text-[13px] tw-tabular-nums tw-leading-5 tw-text-iron-500">
                {section.count}
              </p>
              <p className="tw-m-0 tw-max-w-3xl tw-text-sm tw-leading-6 tw-text-iron-400 max-sm:tw-line-clamp-2 max-sm:tw-text-[13px] max-sm:tw-leading-5">
                {section.line}
              </p>
            </header>
            {view === "table" ? (
              <Table
                rows={rows}
                cards={cards}
                open={open}
                toggle={toggle}
                text={text.table}
              />
            ) : (
              <ul className="tw-m-0 tw-flex tw-list-none tw-flex-col tw-gap-3 tw-p-0">
                {rows.map((row) => (
                  <li key={row.id}>{cards[row.id]}</li>
                ))}
              </ul>
            )}
          </section>
        )
      )}
    </>
  );
}
