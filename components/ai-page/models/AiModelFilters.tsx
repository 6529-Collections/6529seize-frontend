"use client";

import { XMarkIcon } from "@heroicons/react/20/solid";
import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { AiMedium, AiModelFacets } from "@/lib/ai-page/models";

type Media = AiMedium | "any";

type Filter = {
  readonly runs: boolean;
  readonly reads: Media;
  readonly makes: Media;
  /** The most memory a model may need, in GB; null for any size. */
  readonly memory: number | null;
};

const NO_FILTER: Filter = {
  runs: false,
  reads: "any",
  makes: "any",
  memory: null,
};

/** The memory choices, in GB: a laptop GPU up to a data-center GPU. */
const MEMORY_STEPS = [8, 16, 24, 48, 80] as const;

type Shown = {
  readonly filter: Filter;
  readonly setFilter: (filter: Filter) => void;
  readonly visible: ReadonlySet<string>;
  readonly total: number;
};

const ShownContext = createContext<Shown | null>(null);

function useShown(): Shown {
  const shown = useContext(ShownContext);
  if (!shown) {
    throw new Error("AiModelFilters parts need AiModelFilterProvider");
  }
  return shown;
}

function matches(facets: AiModelFacets, filter: Filter): boolean {
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

/** Holds the filter and which models it shows. */
export function AiModelFilterProvider({
  facets,
  children,
}: {
  /** Every model's facets, by its id. */
  readonly facets: Readonly<Record<string, AiModelFacets>>;
  readonly children: ReactNode;
}) {
  const [filter, setFilter] = useState<Filter>(NO_FILTER);
  const shown = useMemo<Shown>(() => {
    const entries = Object.entries(facets);
    return {
      filter,
      setFilter,
      visible: new Set(
        entries.filter(([, model]) => matches(model, filter)).map(([id]) => id)
      ),
      total: entries.length,
    };
  }, [facets, filter]);
  return (
    <ShownContext.Provider value={shown}>{children}</ShownContext.Provider>
  );
}

type AiMediaChoices = {
  readonly label: string;
  readonly choices: Readonly<Record<Media, string>>;
};

export type AiModelFilterText = {
  readonly label: string;
  readonly runs: string;
  /** Each select's name, and its choices: "Reads anything", "Reads text". */
  readonly reads: AiMediaChoices;
  readonly makes: AiMediaChoices;
  readonly memory: string;
  readonly anySize: string;
  /** "Up to {size}", one per memory step, in GB order. */
  readonly upTo: readonly string[];
  /** "{shown} of {total} models", with the two placeholders. */
  readonly count: string;
  readonly clear: string;
  readonly none: string;
  readonly section: string;
  readonly allSections: string;
};

type AiModelJumpSection = {
  readonly id: string;
  readonly title: string;
  readonly ids: readonly string[];
};

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

/** The filters, the number of models they show, and a way to clear them. */
export function AiModelFilterBar({
  text,
  sections,
}: {
  readonly text: AiModelFilterText;
  /** The sections to go to, from 1024 px, where the bar stays in view. */
  readonly sections: readonly AiModelJumpSection[];
}) {
  const { filter, setFilter, visible, total } = useShown();
  const filtered =
    filter.runs ||
    filter.reads !== "any" ||
    filter.makes !== "any" ||
    filter.memory !== null;
  return (
    <>
      <div
        role="group"
        aria-label={text.label}
        className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-3 tw-gap-y-3 tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.08] tw-bg-iron-950/90 tw-px-3.5 tw-py-3 tw-backdrop-blur-md lg:tw-sticky lg:tw-top-3 lg:tw-z-20 lg:tw-py-2.5 lg:tw-shadow-[0_12px_32px_-16px_rgba(0,0,0,0.9)] xl:tw-flex-nowrap"
      >
        <label className="tw-flex tw-min-h-11 tw-w-full tw-flex-none tw-cursor-pointer tw-items-center tw-gap-2.5 tw-whitespace-nowrap tw-text-sm tw-font-medium tw-text-iron-100 sm:tw-min-h-9 sm:tw-w-auto">
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
        <span
          aria-hidden="true"
          className="tw-hidden tw-h-6 tw-w-px tw-flex-none tw-bg-white/10 sm:tw-block"
        />
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
          <option value="">{text.allSections}</option>
          {sections.map((section) => {
            const shown = section.ids.filter((id) => visible.has(id)).length;
            return (
              <option
                key={section.id}
                value={section.id}
                disabled={shown === 0}
              >
                {section.title} ({shown})
              </option>
            );
          })}
        </select>
      </div>
      <div className="tw-mt-3 tw-flex tw-min-h-9 tw-flex-wrap tw-items-center tw-gap-x-3 tw-px-1">
        <p
          aria-live="polite"
          className="tw-m-0 tw-text-sm tw-tabular-nums tw-text-iron-400"
        >
          {text.count
            .replace("{shown}", String(visible.size))
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
      </div>
    </>
  );
}

/** A model's card, hidden while the filter leaves it out. */
export function AiModelFilterItem({
  id,
  children,
}: {
  readonly id: string;
  readonly children: ReactNode;
}) {
  const { visible } = useShown();
  return (
    <li hidden={!visible.has(id)} className="tw-list-none">
      {children}
    </li>
  );
}

/** A section, hidden while the filter leaves none of its models. */
export function AiModelSectionFilter({
  ids,
  children,
}: {
  readonly ids: readonly string[];
  readonly children: ReactNode;
}) {
  const { visible } = useShown();
  return <div hidden={!ids.some((id) => visible.has(id))}>{children}</div>;
}

/** Says so when the filter leaves no model, with a way back. */
export function AiModelNoMatch({
  text,
}: {
  readonly text: Pick<AiModelFilterText, "none" | "clear">;
}) {
  const { visible, setFilter } = useShown();
  if (visible.size > 0) {
    return null;
  }
  return (
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
  );
}

/** Links to the sections that the filter leaves models in, in a row. */
export function AiModelJumpList({
  sections,
  label,
}: {
  readonly sections: readonly AiModelJumpSection[];
  readonly label: string;
}) {
  const { visible } = useShown();
  return (
    <nav aria-label={label} className="-tw-mx-4 tw-overflow-x-auto tw-px-4">
      <ul className="tw-m-0 tw-flex tw-w-max tw-list-none tw-gap-2 tw-p-0 tw-pb-1">
        {sections.map((section) => {
          const shown = section.ids.filter((id) => visible.has(id)).length;
          return (
            shown > 0 && (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="tw-inline-flex tw-min-h-11 tw-items-center tw-gap-2 tw-whitespace-nowrap tw-rounded-full tw-border tw-border-solid tw-border-white/10 tw-px-3.5 tw-text-sm tw-text-iron-300 tw-no-underline focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
                >
                  {section.title}
                  <span className="tw-tabular-nums tw-text-iron-500">
                    {shown}
                  </span>
                </a>
              </li>
            )
          );
        })}
      </ul>
    </nav>
  );
}
