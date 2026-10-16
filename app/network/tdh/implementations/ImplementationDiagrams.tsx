import {
  CheckIcon,
  ClockIcon,
  EyeIcon,
  MinusIcon,
} from "@heroicons/react/24/outline";
import { formatInteger } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import { P26 } from "../shared/tdhFacts";
import {
  TDH_CAPTION,
  type TDH_SERIES,
  TDH_TABLE,
  TDH_TABLE_FRAME,
  TDH_TD,
  TDH_TH,
} from "../shared/tdhStyles";
import {
  NARROW_WIDTH,
  TdhDiagramSwitch,
  TdhSvg,
  WIDE_WIDTH,
} from "../shared/TdhSvg";
import { svgBoxWidth } from "../shared/svgText";
import { isTdhProgram, ProgramGlyph } from "../shared/TdhProgramMark";

type Series = keyof typeof TDH_SERIES;

type Box = {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
};

/** A program or document in the lineage: a name and one line about it. */
function LineageNode({
  box,
  name,
  sub,
  series,
  dashed = false,
  nameSize,
  subSize,
}: {
  readonly box: Box;
  readonly name: string;
  readonly sub: string;
  readonly series?: Series;
  readonly dashed?: boolean;
  readonly nameSize: number;
  readonly subSize: number;
}) {
  const left = box.x + (series ? 26 : 12);
  const middle = box.y + box.h / 2;
  return (
    <g>
      <rect
        x={box.x + 0.5}
        y={box.y + 0.5}
        width={box.w - 1}
        height={box.h - 1}
        rx={8}
        className={`tw-fill-iron-900 ${dashed ? "tw-stroke-iron-500" : "tw-stroke-white/20"}`}
        strokeDasharray={dashed ? "5 4" : undefined}
      />
      {series && isTdhProgram(series) && (
        <ProgramGlyph
          program={series}
          cx={box.x + 14}
          cy={sub ? middle - 7 : middle}
        />
      )}
      <text
        x={left}
        y={sub ? middle - 3 : middle + nameSize * 0.35}
        fontSize={nameSize}
        fontWeight={600}
        className="tw-fill-iron-50"
      >
        {name}
      </text>
      {sub && (
        <text
          x={left}
          y={middle + subSize + 1}
          fontSize={subSize}
          className="tw-fill-iron-300"
        >
          {sub}
        </text>
      )}
    </g>
  );
}

function ArrowMarker({ id }: { readonly id: string }) {
  return (
    <marker
      id={id}
      viewBox="0 0 10 10"
      refX="9"
      refY="5"
      markerWidth="7"
      markerHeight="7"
      orient="auto-start-reverse"
    >
      <path d="M0,0 L10,5 L0,10 z" className="tw-fill-iron-400" />
    </marker>
  );
}

const EDGE = "tw-fill-none tw-stroke-iron-500";
const P26_NAME = "lineage.p26";
const P26_SUB = "lineage.p26Sub";

const LINEAGE_PROGRAMS = [
  {
    key: "python",
    name: "name.python",
    sub: "lineage.wrote",
    series: "python",
  },
  {
    key: "rustReference",
    name: "lineage.cleanRoom",
    sub: "lineage.wallPython",
    series: "rust",
  },
  {
    key: "programB",
    name: "name.programB",
    sub: "lineage.wallB",
    series: "programB",
  },
  { key: "lean", name: "name.lean", sub: "lineage.fromSpec", series: "lean" },
] as const;

/** A lineage node's width: its name and line, after the dot, with padding. */
function lineageWidth(
  name: string,
  sub: string,
  nameSize: number,
  subSize: number,
  dot: boolean
): number {
  return (
    svgBoxWidth(
      [
        [name, nameSize, 600],
        [sub, subSize, 400],
      ],
      0
    ) +
    (dot ? 26 : 12) +
    14
  );
}

function LineageWide({
  m,
  title,
  desc,
}: {
  readonly m: (key: string) => string;
  readonly title: string;
  readonly desc: string;
}) {
  // P26 on the left, the four programs in a column, the Rust core on the
  // right, the backend below with its dashed path to the Rust core. Every
  // box is as wide as its text in the site font, with room on both sides.
  const p26Width = lineageWidth(m(P26_NAME), m(P26_SUB), 16, 13, false);
  const columnWidth = Math.max(
    ...LINEAGE_PROGRAMS.map((program) =>
      lineageWidth(m(program.name), m(program.sub), 14, 13, true)
    )
  );
  const coreWidth = lineageWidth(
    m("name.rust"),
    m("lineage.library"),
    14,
    13,
    true
  );
  const backendWidth = lineageWidth(m("lineage.backend"), "", 14, 13, true);
  const p26: Box = { x: 0, y: 112, w: p26Width, h: 56 };
  const columnX = p26.w + 48;
  const boxAt = (index: number): Box => ({
    x: columnX,
    y: 8 + index * 64,
    w: columnWidth,
    h: 48,
  });
  const core: Box = {
    x: columnX + columnWidth + 40,
    y: 72,
    w: coreWidth,
    h: 48,
  };
  const backend: Box = { x: 0, y: 270, w: backendWidth, h: 48 };
  const width = Math.max(WIDE_WIDTH, core.x + core.w);
  const reference = boxAt(1);
  const fromY = p26.y + p26.h / 2;
  return (
    <TdhSvg
      id="lineage-wide"
      width={width}
      height={326}
      title={title}
      desc={desc}
    >
      <defs>
        <ArrowMarker id="lineage-wide-arrow" />
      </defs>
      {LINEAGE_PROGRAMS.map((program, index) => {
        const toY = boxAt(index).y + 24;
        return (
          <path
            key={program.key}
            d={`M${p26.x + p26.w},${fromY} C${p26.x + p26.w + 28},${fromY} ${columnX - 28},${toY} ${columnX - 2},${toY}`}
            className={EDGE}
            markerEnd="url(#lineage-wide-arrow)"
          />
        );
      })}
      <path
        d={`M${reference.x + reference.w},${reference.y + 24} L${core.x - 2},${core.y + 24}`}
        className={EDGE}
        markerEnd="url(#lineage-wide-arrow)"
      />
      <path
        d={`M${backend.x + backend.w},${backend.y + 24} H${core.x + core.w / 2} V${core.y + core.h + 2}`}
        className={EDGE}
        strokeDasharray="5 4"
        markerEnd="url(#lineage-wide-arrow)"
      />
      <text
        x={backend.x + backend.w + 14}
        y={backend.y + 16}
        fontSize={13}
        className="tw-fill-iron-300"
      >
        {m("lineage.replaced")}
      </text>
      <LineageNode
        box={p26}
        name={m(P26_NAME)}
        sub={m(P26_SUB)}
        nameSize={16}
        subSize={13}
      />
      {LINEAGE_PROGRAMS.map((program, index) => (
        <LineageNode
          key={program.key}
          box={boxAt(index)}
          name={m(program.name)}
          sub={m(program.sub)}
          series={program.series}
          nameSize={14}
          subSize={13}
        />
      ))}
      <LineageNode
        box={core}
        name={m("name.rust")}
        sub={m("lineage.library")}
        series="rust"
        nameSize={14}
        subSize={13}
      />
      <LineageNode
        box={backend}
        name={m("lineage.backend")}
        sub=""
        series="live"
        dashed
        nameSize={14}
        subSize={13}
      />
    </TdhSvg>
  );
}

function LineageNarrow({
  m,
  title,
  desc,
}: {
  readonly m: (key: string) => string;
  readonly title: string;
  readonly desc: string;
}) {
  // A tree down the page. The trunk runs from P26 past each program; the
  // Rust core hangs under the Rust reference, and the backend under the
  // Rust core, with its dashed arrow up.
  const trunkX = 18;
  const left = 40;
  const indent = 72;
  const full = (y: number): Box => ({
    x: left,
    y,
    w: NARROW_WIDTH - left,
    h: 52,
  });
  const indented = (y: number): Box => ({
    x: indent,
    y,
    w: NARROW_WIDTH - indent,
    h: 52,
  });
  const boxes: Record<(typeof LINEAGE_PROGRAMS)[number]["key"], Box> = {
    python: full(72),
    rustReference: full(136),
    programB: full(376),
    lean: full(440),
  };
  const core = indented(200);
  const backend = indented(304);
  // The dashed arrow from the backend up to the Rust core, with its label
  // beside it in the gap, on two lines: "replaced at the cutover".
  const replacedX = core.x + core.w / 2;
  const reference = boxes.rustReference;
  return (
    <TdhSvg
      id="lineage-narrow"
      width={NARROW_WIDTH}
      height={496}
      title={title}
      desc={desc}
    >
      <defs>
        <ArrowMarker id="lineage-narrow-arrow" />
      </defs>
      <path d={`M${trunkX},52 V${boxes.lean.y + 26}`} className={EDGE} />
      {LINEAGE_PROGRAMS.map((program) => {
        const box = boxes[program.key];
        return (
          <path
            key={program.key}
            d={`M${trunkX},${box.y + 26} H${box.x - 2}`}
            className={EDGE}
            markerEnd="url(#lineage-narrow-arrow)"
          />
        );
      })}
      <path
        d={`M${reference.x + 16},${reference.y + reference.h} V${core.y + 26} H${core.x - 2}`}
        className={EDGE}
        markerEnd="url(#lineage-narrow-arrow)"
      />
      <path
        d={`M${replacedX},${backend.y - 1} V${core.y + core.h + 2}`}
        className={EDGE}
        strokeDasharray="5 4"
        markerEnd="url(#lineage-narrow-arrow)"
      />
      <text
        x={replacedX - 8}
        y={core.y + core.h + 21}
        fontSize={14}
        textAnchor="end"
        className="tw-fill-iron-300"
      >
        <tspan x={replacedX - 8}>{m("lineage.replacedLine1")}</tspan>
        <tspan x={replacedX - 8} dy={17}>
          {m("lineage.replacedLine2")}
        </tspan>
      </text>
      <LineageNode
        box={{
          x: 0,
          y: 0,
          w: Math.min(
            NARROW_WIDTH,
            lineageWidth(m(P26_NAME), m(P26_SUB), 16, 14, false)
          ),
          h: 52,
        }}
        name={m(P26_NAME)}
        sub={m(P26_SUB)}
        nameSize={16}
        subSize={14}
      />
      {LINEAGE_PROGRAMS.map((program) => (
        <LineageNode
          key={program.key}
          box={boxes[program.key]}
          name={m(program.name)}
          sub={m(program.sub)}
          series={program.series}
          nameSize={15}
          subSize={14}
        />
      ))}
      <LineageNode
        box={core}
        name={m("name.rust")}
        sub={m("lineage.library")}
        series="rust"
        nameSize={15}
        subSize={14}
      />
      <LineageNode
        box={backend}
        name={m("lineage.backend")}
        sub={m("lineage.until")}
        series="live"
        dashed
        nameSize={15}
        subSize={14}
      />
    </TdhSvg>
  );
}

/**
 * Diagram 1: where each implementation came from, as one graph (plan §9.2).
 * P26 is the root; the Rust core is a copy of the Rust reference; the old
 * backend is replaced by the Rust core at the cutover. Drawn as a tree down
 * the page on phones and left to right from `md`.
 */
export function LineageDiagram({
  locale,
}: {
  readonly locale: SupportedLocale;
}) {
  const m = (key: string) => t(locale, `network.tdh.impl.${key}` as MessageKey);
  const title = m("lineage.title");
  const desc = m("lineage.desc");
  return (
    <figure className="tw-m-0 tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.07] tw-bg-iron-950 tw-p-4 sm:tw-p-5">
      <TdhDiagramSwitch
        narrow={<LineageNarrow m={m} title={title} desc={desc} />}
        wide={<LineageWide m={m} title={title} desc={desc} />}
      />
    </figure>
  );
}

/** How a matrix cell reads: in use now, planned or from a date, under test. */
type MatrixTone = "now" | "later" | "review" | "test" | "no";

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

function MatrixCell({
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
function MatrixLegend({ locale }: { readonly locale: SupportedLocale }) {
  return (
    <ul className="tw-m-0 tw-mt-2 tw-flex tw-list-none tw-flex-wrap tw-gap-x-4 tw-gap-y-1 tw-p-0 tw-text-sm tw-text-iron-400">
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
  /** For `ofVectors`: how many of P26's vectors the program passes. */
  readonly passed?: number;
};

const MATRIX_COLUMNS: ReadonlyArray<{
  readonly key:
    | "rust"
    | "rustReference"
    | "programB"
    | "python"
    | "lean"
    | "backend";
  readonly series: Series;
}> = [
  { key: "rust", series: "rust" },
  { key: "rustReference", series: "rust" },
  { key: "programB", series: "programB" },
  { key: "python", series: "python" },
  { key: "lean", series: "lean" },
  { key: "backend", series: "live" },
];

const Y: Cell = { tone: "now", label: "yes" };
const N: Cell = { tone: "no", label: "no" };
const SINCE: Cell = { tone: "now", label: "from16" };
const UNDER_TEST: Cell = { tone: "test", label: "underTest" };
const later = (label: string): Cell => ({ tone: "later", label });
const ALL_VECTORS: Cell = { tone: "now", label: "allVectors" };
/** The Lean model's cell, filled from its proof manifest. */
const LEAN_VECTORS: Cell = { tone: "review", label: "ofVectors" };

/**
 * Where each program runs and which check covers it, in one matrix: the
 * checks, then the places a program's result is used (validator signing,
 * 6529.io, the proof programs). Vectors: P26 has 89 since f840096, and
 * the references, the Rust core and program B (the validator's development
 * branch, 30bf8f9) pass all of them (`shared/tdhFacts.ts`); the Lean
 * model's count comes from its published proof manifest. A whole real day:
 * the references and the Lean model on 2026-10-11 (P26 §13, the model's
 * README), the Rust core in the daily runs; program B has published none.
 * Random and generated inputs: the five rounds of four-way differential
 * tests ran the Rust core, program B, the Lean model and the Python
 * reference, and 6529chain's tdh-formal workflow runs 1,000 seeded random
 * inputs through Lean, Python and the Rust reference on every change.
 */
const MATRIX_ROWS: ReadonlyArray<{
  readonly key:
    | "vectors"
    | "fullDay"
    | "random"
    | "daily"
    | "dual"
    | "site"
    | "proofs";
  readonly cells: readonly [Cell, Cell, Cell, Cell, Cell, Cell];
}> = [
  {
    key: "vectors",
    cells: [
      ALL_VECTORS,
      ALL_VECTORS,
      ALL_VECTORS,
      ALL_VECTORS,
      LEAN_VECTORS,
      N,
    ],
  },
  { key: "fullDay", cells: [Y, Y, N, Y, Y, UNDER_TEST] },
  { key: "random", cells: [Y, Y, Y, Y, Y, N] },
  { key: "daily", cells: [SINCE, N, N, SINCE, N, UNDER_TEST] },
  {
    key: "dual",
    cells: [
      later("firstCheck"),
      N,
      later("secondCheck"),
      later("optionalThird"),
      N,
      N,
    ],
  },
  {
    key: "site",
    cells: [
      later("fromCutover"),
      N,
      N,
      N,
      N,
      { tone: "now", label: "untilCutover" },
    ],
  },
  {
    key: "proofs",
    cells: [later("programA"), N, later("programB"), N, N, N],
  },
];

/**
 * Diagram 3: which check covers which program, each cell an icon and a word,
 * so colour is never the only signal.
 */
export function CheckMatrix({
  locale,
  lean,
}: {
  readonly locale: SupportedLocale;
  /** The Lean model's vector run, from its proof manifest. */
  readonly lean: {
    readonly passed: number;
    readonly total: number;
    /** The P26 commit the model's build follows, short. */
    readonly spec: string;
    /** The next round's count, while it is not published. */
    readonly newer: {
      readonly passed: number;
      readonly total: number;
      /** The P26 commit the next round follows, short. */
      readonly spec: string;
    } | null;
  };
}) {
  const m = (key: string) => t(locale, `network.tdh.impl.${key}` as MessageKey);
  const leanComplete =
    lean.passed === lean.total && lean.total >= P26.vectorCount;
  const all = t(locale, "network.tdh.impl.matrix.allVectors", {
    count: formatInteger(locale, P26.vectorCount),
  });
  const resolve = (cell: Cell): { tone: MatrixTone; label: string } => {
    if (cell === ALL_VECTORS || (cell === LEAN_VECTORS && leanComplete)) {
      return { tone: "now", label: all };
    }
    // A count below P26's latest is a program one round behind, not a
    // failure: say which round it passes in full.
    if (cell === LEAN_VECTORS) {
      return {
        tone: cell.tone,
        label:
          lean.newer === null
            ? t(locale, "network.tdh.impl.matrix.leanVectors", {
                passed: formatInteger(locale, lean.passed),
                spec: lean.spec,
              })
            : t(locale, "network.tdh.impl.matrix.leanVectorsNewer", {
                passed: formatInteger(locale, lean.passed),
                spec: lean.spec,
                newerPassed: formatInteger(locale, lean.newer.passed),
                newerTotal: formatInteger(locale, lean.newer.total),
              }),
      };
    }
    return { tone: cell.tone, label: m(`matrix.${cell.label}`) };
  };
  return (
    <figure className="tw-m-0">
      <p className="tw-m-0 tw-mb-2 tw-text-sm tw-font-medium tw-text-iron-200 xl:tw-hidden">
        {m("matrix.title")}
      </p>
      <ul className="tw-m-0 tw-grid tw-list-none tw-gap-2 tw-p-0 sm:tw-grid-cols-2 xl:tw-hidden">
        {MATRIX_ROWS.map((row) => (
          <li
            key={row.key}
            className="tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.07] tw-bg-iron-900 tw-px-4 tw-py-3 tw-@container"
          >
            <p className="tw-m-0 tw-text-sm tw-font-medium tw-text-iron-100">
              {m(`matrix.${row.key}`)}
            </p>
            <ul className="tw-m-0 tw-mt-2 tw-grid tw-list-none tw-grid-cols-1 tw-gap-x-3 tw-gap-y-1 tw-p-0 tw-text-sm @[17rem]:tw-grid-cols-[auto_minmax(0,1fr)]">
              {row.cells.map((cell, index) => {
                const column = MATRIX_COLUMNS[index];
                if (!column || cell.tone === "no") {
                  return null;
                }
                return (
                  <li key={column.key} className="tw-contents">
                    <span className="tw-text-iron-200">
                      {m(`name.${column.key}`)}
                    </span>
                    <MatrixCell {...resolve(cell)} />
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ul>
      <div className={`${TDH_TABLE_FRAME} tw-hidden xl:tw-block`}>
        <table className={TDH_TABLE}>
          <caption className={TDH_CAPTION}>{m("matrix.title")}</caption>
          <thead>
            <tr>
              <th scope="col" className={TDH_TH}>
                {m("matrix.check")}
              </th>
              {MATRIX_COLUMNS.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={`${TDH_TH} tw-whitespace-nowrap`}
                >
                  {m(`name.${column.key}`)}
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
                    className={`${TDH_TD} tw-px-3`}
                  >
                    <MatrixCell {...resolve(cell)} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <MatrixLegend locale={locale} />
      <figcaption className="tw-mt-2 tw-max-w-[34rem] tw-space-y-1 tw-text-sm tw-leading-6 tw-text-iron-400">
        {lean.newer !== null && (
          <p className="tw-m-0">
            {t(locale, "network.tdh.impl.matrix.leanNote", {
              passed: formatInteger(locale, lean.passed),
              spec: lean.spec,
              newerPassed: formatInteger(locale, lean.newer.passed),
              newerTotal: formatInteger(locale, lean.newer.total),
              newerSpec: lean.newer.spec,
            })}
          </p>
        )}
        {(["note1", "note2", "note3"] as const).map((key) => (
          <p key={key} className="tw-m-0">
            {m(`matrix.${key}`)}
          </p>
        ))}
      </figcaption>
    </figure>
  );
}
