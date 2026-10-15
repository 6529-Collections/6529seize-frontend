import {
  ArrowDownIcon,
  ArrowRightIcon,
  CheckIcon,
  ClockIcon,
  EyeIcon,
  MinusIcon,
} from "@heroicons/react/24/outline";
import type { SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import {
  TDH_CAPTION,
  TDH_SERIES,
  TDH_TABLE,
  TDH_TABLE_WRAP,
  TDH_TD,
  TDH_TH,
} from "../shared/tdhStyles";

type Series = keyof typeof TDH_SERIES;

const NODE =
  "tw-inline-flex tw-min-h-10 tw-items-center tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-px-3 tw-py-1.5 tw-text-sm tw-font-medium";

function Doc({ label }: { readonly label: string }) {
  return (
    <span
      className={`${NODE} tw-border-white/10 tw-bg-iron-950 tw-text-iron-300`}
    >
      {label}
    </span>
  );
}

function Impl({
  label,
  series,
}: {
  readonly label: string;
  readonly series: Series;
}) {
  return (
    <span
      className={`${NODE} tw-border-white/10 tw-bg-iron-900 tw-text-iron-50`}
    >
      <span
        aria-hidden="true"
        className={`tw-size-2 tw-rounded-full ${TDH_SERIES[series].bg}`}
      />
      {label}
    </span>
  );
}

function Arrow({
  note,
  dashed = false,
}: {
  readonly note?: string;
  readonly dashed?: boolean;
}) {
  return (
    <span className="tw-inline-flex tw-items-center tw-gap-1.5 tw-pl-3 tw-text-xs tw-text-iron-300 sm:tw-pl-0">
      <span
        aria-hidden="true"
        className={`tw-hidden tw-w-6 tw-border-0 tw-border-t tw-border-iron-500 sm:tw-inline-block ${dashed ? "tw-border-dashed" : "tw-border-solid"}`}
      />
      <ArrowDownIcon
        aria-hidden="true"
        className="tw-size-3.5 tw-shrink-0 tw-text-iron-400 sm:tw-hidden"
      />
      {note && <span className="tw-italic">{note}</span>}
      <ArrowRightIcon
        aria-hidden="true"
        className="tw-hidden tw-size-3.5 tw-text-iron-400 sm:tw-block"
      />
    </span>
  );
}

function Wall({ label }: { readonly label: string }) {
  return (
    <span className="tw-inline-flex tw-items-center tw-gap-1 tw-rounded-md tw-border tw-border-solid tw-border-amber-400/40 tw-bg-amber-400/[0.07] tw-px-2 tw-py-0.5 tw-text-xs tw-text-amber-100">
      <span aria-hidden="true">▮</span>
      {label}
    </span>
  );
}

/** Diagram 1: where each implementation came from (plan §9.2). */
export function LineageDiagram({
  locale,
}: {
  readonly locale: SupportedLocale;
}) {
  const m = (key: string) => t(locale, `network.tdh.impl.${key}` as MessageKey);
  const row =
    "tw-flex tw-flex-col tw-items-start tw-gap-1.5 tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.06] tw-py-3 first:tw-border-t-0 first:tw-pt-0 last:tw-pb-0 sm:tw-flex-row sm:tw-flex-wrap sm:tw-items-center sm:tw-gap-2";
  return (
    <figure className="tw-m-0">
      <figcaption className="tw-sr-only">{m("lineage.desc")}</figcaption>
      <ol className="tw-m-0 tw-list-none tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.07] tw-bg-iron-900/40 tw-p-4">
        <li className={row}>
          <Doc label={m("lineage.p26")} />
          <Arrow note={m("lineage.wrote")} />
          <Impl label={m("name.python")} series="python" />
        </li>
        <li className={row}>
          <Doc label={m("lineage.p26cited")} />
          <Arrow />
          <Wall label={m("lineage.wallPython")} />
          <Impl label={m("lineage.cleanRoom")} series="rust" />
        </li>
        <li className={`${row} sm:tw-pl-10`}>
          <Impl label={m("lineage.cleanRoom")} series="rust" />
          <Arrow note={m("lineage.library")} />
          <Impl label={m("name.rust")} series="rust" />
        </li>
        <li className={row}>
          <Doc label={m("lineage.specs")} />
          <Arrow />
          <Wall label={m("lineage.wallB")} />
          <Impl label={m("name.programB")} series="programB" />
        </li>
        <li className={row}>
          <Doc label={m("lineage.p26")} />
          <Arrow />
          <Impl label={m("name.lean")} series="lean" />
        </li>
        <li className={row}>
          <Impl label={m("lineage.backend")} series="live" />
          <Arrow note={m("lineage.replaced")} dashed />
          <Impl label={m("name.rust")} series="rust" />
        </li>
      </ol>
    </figure>
  );
}

/** How a matrix cell reads: in use now, planned or from a date, under test. */
export type MatrixTone = "now" | "later" | "review" | "test" | "no";

const TONE_ICON = {
  now: CheckIcon,
  later: ClockIcon,
  review: ClockIcon,
  test: EyeIcon,
  no: MinusIcon,
} as const;

const TONE_COLOR: Record<MatrixTone, string> = {
  now: "tw-text-success",
  later: "tw-text-primary-300",
  review: "tw-text-primary-300",
  test: "tw-text-amber-300",
  no: "tw-text-iron-600",
};

export function MatrixCell({
  tone,
  label,
}: {
  readonly tone: MatrixTone;
  readonly label: string;
}) {
  const Icon = TONE_ICON[tone];
  return (
    <span
      className={`tw-inline-flex tw-items-start tw-gap-1.5 ${tone === "no" ? "tw-text-iron-500" : "tw-text-iron-100"}`}
    >
      <Icon
        aria-hidden="true"
        className={`tw-mt-0.5 tw-size-4 tw-shrink-0 ${TONE_COLOR[tone]}`}
      />
      {tone === "no" ? <span className="tw-sr-only">{label}</span> : label}
    </span>
  );
}

/** The key to the matrices' icons. */
export function MatrixLegend({ locale }: { readonly locale: SupportedLocale }) {
  return (
    <ul className="tw-m-0 tw-mt-2 tw-flex tw-list-none tw-flex-wrap tw-gap-x-4 tw-gap-y-1 tw-p-0 tw-text-xs tw-text-iron-400">
      {(["now", "later", "test", "no"] as const).map((tone) => {
        const Icon = TONE_ICON[tone];
        return (
          <li key={tone} className="tw-inline-flex tw-items-center tw-gap-1.5">
            <Icon
              aria-hidden="true"
              className={`tw-size-3.5 ${TONE_COLOR[tone]}`}
            />
            {t(locale, `network.tdh.impl.legend.${tone}`)}
          </li>
        );
      })}
    </ul>
  );
}

type Cell = {
  readonly tone: MatrixTone;
  readonly label: string;
};

const MATRIX_COLUMNS: ReadonlyArray<{
  readonly key: "rust" | "programB" | "python" | "lean" | "backend";
  readonly series: Series;
}> = [
  { key: "rust", series: "rust" },
  { key: "programB", series: "programB" },
  { key: "python", series: "python" },
  { key: "lean", series: "lean" },
  { key: "backend", series: "live" },
];

const Y: Cell = { tone: "now", label: "yes" };
const N: Cell = { tone: "no", label: "no" };

const MATRIX_ROWS: ReadonlyArray<{
  readonly key: "vectors" | "fullDay" | "random" | "dual" | "daily" | "proofs";
  readonly cells: readonly [Cell, Cell, Cell, Cell, Cell];
}> = [
  {
    key: "vectors",
    cells: [
      { tone: "review", label: "inReview" },
      { tone: "review", label: "inReview" },
      Y,
      Y,
      N,
    ],
  },
  {
    key: "fullDay",
    cells: [
      Y,
      { tone: "now", label: "totals" },
      Y,
      Y,
      { tone: "test", label: "underTest" },
    ],
  },
  { key: "random", cells: [Y, Y, Y, Y, N] },
  {
    key: "dual",
    cells: [
      { tone: "later", label: "planned" },
      { tone: "later", label: "planned" },
      N,
      N,
      N,
    ],
  },
  {
    key: "daily",
    cells: [
      { tone: "now", label: "from16" },
      N,
      { tone: "now", label: "from16" },
      N,
      { tone: "test", label: "underTest" },
    ],
  },
  {
    key: "proofs",
    cells: [
      { tone: "later", label: "planned" },
      { tone: "later", label: "planned" },
      N,
      N,
      N,
    ],
  },
];

/**
 * Diagram 3: which check covers which program, each cell an icon and a word,
 * so colour is never the only signal.
 */
export function CheckMatrix({ locale }: { readonly locale: SupportedLocale }) {
  const m = (key: string) => t(locale, `network.tdh.impl.${key}` as MessageKey);
  return (
    <figure className="tw-m-0">
      <p className="tw-m-0 tw-mb-2 tw-text-sm tw-font-medium tw-text-iron-200 md:tw-hidden">
        {m("matrix.title")}
      </p>
      <ul className="tw-m-0 tw-grid tw-list-none tw-gap-2 tw-p-0 md:tw-hidden">
        {MATRIX_ROWS.map((row) => (
          <li
            key={row.key}
            className="tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.07] tw-bg-iron-900 tw-px-4 tw-py-3"
          >
            <p className="tw-m-0 tw-text-sm tw-font-medium tw-text-iron-100">
              {m(`matrix.${row.key}`)}
            </p>
            <ul className="tw-m-0 tw-mt-2 tw-grid tw-list-none tw-grid-cols-[auto_minmax(0,1fr)] tw-gap-x-3 tw-gap-y-1 tw-p-0 tw-text-xs">
              {row.cells.map((cell, index) => {
                const column = MATRIX_COLUMNS[index];
                if (!column || cell.tone === "no") {
                  return null;
                }
                return (
                  <li key={column.key} className="tw-contents">
                    <span className="tw-inline-flex tw-items-center tw-gap-1.5 tw-text-iron-200">
                      <span
                        aria-hidden="true"
                        className={`tw-size-2 tw-rounded-full ${TDH_SERIES[column.series].bg}`}
                      />
                      {m(`name.${column.key}`)}
                    </span>
                    <MatrixCell
                      tone={cell.tone}
                      label={m(`matrix.${cell.label}`)}
                    />
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ul>
      <div
        className={`${TDH_TABLE_WRAP} tw-hidden md:tw-block`}
        tabIndex={0}
        role="region"
        aria-label={m("matrix.caption")}
      >
        <table className={`${TDH_TABLE} tw-min-w-[40rem]`}>
          <caption className={TDH_CAPTION}>{m("matrix.title")}</caption>
          <thead>
            <tr>
              <th scope="col" className={TDH_TH}>
                {m("matrix.check")}
              </th>
              {MATRIX_COLUMNS.map((column) => (
                <th key={column.key} scope="col" className={TDH_TH}>
                  <span className="tw-inline-flex tw-items-center tw-gap-2">
                    <span
                      aria-hidden="true"
                      className={`tw-size-2 tw-shrink-0 tw-rounded-full ${TDH_SERIES[column.series].bg}`}
                    />
                    {m(`name.${column.key}`)}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MATRIX_ROWS.map((row) => (
              <tr key={row.key}>
                <th
                  scope="row"
                  className={`${TDH_TD} tw-font-medium tw-text-iron-200`}
                >
                  {m(`matrix.${row.key}`)}
                </th>
                {row.cells.map((cell, index) => (
                  <td
                    key={MATRIX_COLUMNS[index]?.key ?? index}
                    className={`${TDH_TD} tw-text-[13px]`}
                  >
                    <MatrixCell
                      tone={cell.tone}
                      label={m(`matrix.${cell.label}`)}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <MatrixLegend locale={locale} />
      <figcaption className="tw-mt-2 tw-text-xs tw-leading-5 tw-text-iron-400">
        {m("matrix.note")}
      </figcaption>
    </figure>
  );
}
