import type { SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import TdhHeading from "../../shared/TdhHeading";
import TdhSource from "../../shared/TdhSource";
import type { TDH_SERIES } from "../../shared/tdhStyles";
import {
  NARROW_WIDTH,
  TdhDiagramSwitch,
  TdhSvg,
  WIDE_WIDTH,
} from "../../shared/TdhSvg";
import { svgBoxWidth } from "../../shared/svgText";

type FlowSeries = keyof typeof TDH_SERIES | "neutral";
type FlowBox = {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
};

const FLOW_DOT: Record<FlowSeries, string> = {
  rust: "tw-fill-primary-400",
  programB: "tw-fill-violet-400",
  lean: "tw-fill-emerald-400",
  python: "tw-fill-amber-300",
  live: "tw-fill-iron-400",
  memes: "tw-fill-sky-400",
  gradients: "tw-fill-fuchsia-400",
  nextgen: "tw-fill-teal-400",
  neutral: "tw-fill-iron-500",
};

const FLOW_EDGE = "tw-fill-none tw-stroke-iron-400";
/** Where a node's label starts: after its series dot. */
const NODE_TEXT_X = 26;

function FlowNode({
  box,
  label,
  series,
  size,
}: {
  readonly box: FlowBox;
  readonly label: string;
  readonly series: FlowSeries;
  readonly size: number;
}) {
  return (
    <g>
      <rect
        x={box.x + 0.5}
        y={box.y + 0.5}
        width={box.w - 1}
        height={box.h - 1}
        rx={8}
        className="tw-fill-iron-900 tw-stroke-white/20"
      />
      <circle
        cx={box.x + 14}
        cy={box.y + box.h / 2}
        r={4}
        className={FLOW_DOT[series]}
      />
      <text
        x={box.x + NODE_TEXT_X}
        y={box.y + box.h / 2 + size * 0.36}
        fontSize={size}
        fontWeight={500}
        className="tw-fill-iron-50"
      >
        {label}
      </text>
    </g>
  );
}

function FlowArrow({ id }: { readonly id: string }) {
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

function GroupLabel({
  x,
  y,
  text,
  size,
}: {
  readonly x: number;
  readonly y: number;
  readonly text: string;
  readonly size: number;
}) {
  return (
    <text
      x={x}
      y={y}
      fontSize={size}
      fontWeight={500}
      letterSpacing="0.04em"
      className="tw-fill-iron-400"
    >
      {text.toUpperCase()}
    </text>
  );
}

/** A node's width: its label at 14 units, after the dot, with padding. */
function nodeWidth(labels: readonly string[]): number {
  return (
    svgBoxWidth(
      labels.map((text) => [text, 14, 500] as const),
      0
    ) +
    NODE_TEXT_X +
    16
  );
}

/**
 * Wide: our computation and the object under test, converging on Compare.
 * Each column is as wide as its longest label in the site font, with room
 * on both sides, so no label touches its box or an arrow.
 */
function FlowWide({ label }: { readonly label: (key: string) => string }) {
  const arrow = "tdh-flow-wide-arrow";
  const w1 = nodeWidth([label("ethereum"), label("backend")]);
  const w2 = nodeWidth([label("rust"), label("python"), label("arweave")]);
  const w3 = nodeWidth([label("compare"), label("published"), label("page")]);
  const x2 = w1 + 36;
  const bus = x2 + w2 + 24;
  const x3 = bus + 28;
  const width = Math.max(WIDE_WIDTH, x3 + w3);
  const ethereum: FlowBox = { x: 0, y: 26, w: w1, h: 40 };
  const rust: FlowBox = { x: x2, y: 26, w: w2, h: 40 };
  const python: FlowBox = { x: x2, y: 110, w: w2, h: 40 };
  const backend: FlowBox = { x: 0, y: 206, w: w1, h: 40 };
  const arweave: FlowBox = { x: x2, y: 206, w: w2, h: 40 };
  const compare: FlowBox = { x: x3, y: 110, w: w3, h: 40 };
  const published: FlowBox = { x: x3, y: 186, w: w3, h: 40 };
  const page: FlowBox = { x: x3, y: 262, w: w3, h: 40 };
  const into = compare.x - 2;
  const down = compare.x + compare.w / 2;
  return (
    <TdhSvg
      id="tdh-flow-wide"
      width={width}
      height={304}
      title={label("title")}
      desc={label("text")}
      maxWidth={640}
    >
      <defs>
        <FlowArrow id={arrow} />
      </defs>
      <GroupLabel x={0} y={14} text={label("ours")} size={13} />
      <GroupLabel x={0} y={194} text={label("theirs")} size={13} />
      <path
        d={`M${ethereum.x + ethereum.w},46 H${rust.x - 2}`}
        className={FLOW_EDGE}
        markerEnd={`url(#${arrow})`}
      />
      <path
        d={`M${rust.x + 24},${rust.y + rust.h} V${python.y - 2}`}
        className={FLOW_EDGE}
        markerEnd={`url(#${arrow})`}
      />
      <text
        x={rust.x + 14}
        y={86}
        fontSize={13}
        textAnchor="end"
        className="tw-fill-iron-300"
      >
        {label("handoffLine1")}
      </text>
      <text
        x={rust.x + 14}
        y={102}
        fontSize={13}
        textAnchor="end"
        className="tw-fill-iron-300"
      >
        {label("handoffLine2")}
      </text>
      <path
        d={`M${backend.x + backend.w},226 H${arweave.x - 2}`}
        className={FLOW_EDGE}
        markerEnd={`url(#${arrow})`}
      />
      <path
        d={`M${rust.x + rust.w},46 H${bus} V120 H${into}`}
        className={FLOW_EDGE}
        markerEnd={`url(#${arrow})`}
      />
      <path
        d={`M${python.x + python.w},130 H${into}`}
        className={FLOW_EDGE}
        markerEnd={`url(#${arrow})`}
      />
      <path
        d={`M${arweave.x + arweave.w},226 H${bus} V140 H${into}`}
        className={FLOW_EDGE}
        markerEnd={`url(#${arrow})`}
      />
      <path
        d={`M${down},${compare.y + compare.h} V${published.y - 2}`}
        className={FLOW_EDGE}
        markerEnd={`url(#${arrow})`}
      />
      <path
        d={`M${down},${published.y + published.h} V${page.y - 2}`}
        className={FLOW_EDGE}
        markerEnd={`url(#${arrow})`}
      />
      <FlowNode
        box={ethereum}
        label={label("ethereum")}
        series="neutral"
        size={14}
      />
      <FlowNode box={rust} label={label("rust")} series="rust" size={14} />
      <FlowNode
        box={python}
        label={label("python")}
        series="python"
        size={14}
      />
      <FlowNode
        box={backend}
        label={label("backend")}
        series="live"
        size={14}
      />
      <FlowNode
        box={arweave}
        label={label("arweave")}
        series="live"
        size={14}
      />
      <FlowNode
        box={compare}
        label={label("compare")}
        series="neutral"
        size={14}
      />
      <FlowNode
        box={published}
        label={label("published")}
        series="neutral"
        size={14}
      />
      <FlowNode box={page} label={label("page")} series="neutral" size={14} />
    </TdhSvg>
  );
}

/** Narrow: one column, with a bus on the right that carries all three into Compare. */
function FlowNarrow({ label }: { readonly label: (key: string) => string }) {
  const arrow = "tdh-flow-narrow-arrow";
  const box = (y: number): FlowBox => ({ x: 0, y, w: 224, h: 40 });
  const ethereum = box(26);
  const rust = box(86);
  const python = box(166);
  const backend = box(246);
  const arweave = box(306);
  const compare = box(386);
  const published = box(446);
  const page = box(506);
  const bus = 254;
  const right = 224;
  return (
    <TdhSvg
      id="tdh-flow-narrow"
      width={NARROW_WIDTH}
      height={548}
      title={label("title")}
      desc={label("text")}
      maxWidth={400}
    >
      <defs>
        <FlowArrow id={arrow} />
      </defs>
      <GroupLabel x={0} y={14} text={label("ours")} size={14} />
      <GroupLabel x={0} y={236} text={label("theirs")} size={14} />
      {(
        [
          [ethereum, rust],
          [backend, arweave],
          [compare, published],
          [published, page],
        ] as const
      ).map(([from, to]) => (
        <path
          key={`${from.y}-${to.y}`}
          d={`M112,${from.y + 40} V${to.y - 2}`}
          className={FLOW_EDGE}
          markerEnd={`url(#${arrow})`}
        />
      ))}
      <path
        d={`M40,${rust.y + 40} V${python.y - 2}`}
        className={FLOW_EDGE}
        markerEnd={`url(#${arrow})`}
      />
      <text x={52} y={144} fontSize={14} className="tw-fill-iron-300">
        {label("handoffLine1")}
      </text>
      <text x={52} y={160} fontSize={14} className="tw-fill-iron-300">
        {label("handoffLine2")}
      </text>
      <path
        d={`M${right},${rust.y + 20} H${bus} V${arweave.y + 20}`}
        className={FLOW_EDGE}
      />
      <path d={`M${right},${python.y + 20} H${bus}`} className={FLOW_EDGE} />
      <path
        d={`M${right},${arweave.y + 20} H${bus} V${compare.y + 20} H${right + 2}`}
        className={FLOW_EDGE}
        markerEnd={`url(#${arrow})`}
      />
      <FlowNode
        box={ethereum}
        label={label("ethereum")}
        series="neutral"
        size={14}
      />
      <FlowNode box={rust} label={label("rust")} series="rust" size={14} />
      <FlowNode
        box={python}
        label={label("python")}
        series="python"
        size={14}
      />
      <FlowNode
        box={backend}
        label={label("backend")}
        series="live"
        size={14}
      />
      <FlowNode
        box={arweave}
        label={label("arweave")}
        series="live"
        size={14}
      />
      <FlowNode
        box={compare}
        label={label("compare")}
        series="neutral"
        size={14}
      />
      <FlowNode
        box={published}
        label={label("published")}
        series="neutral"
        size={14}
      />
      <FlowNode box={page} label={label("page")} series="neutral" size={14} />
    </TdhSvg>
  );
}

/**
 * The daily comparison as one graph: our own computation (Ethereum to the
 * Rust core, the Python reference on the same input) and the object under
 * test (6529.io's backend and its upload) converge on the comparison, which
 * publishes the files this page reads. A column on phones, two lanes from
 * `md`.
 */
function DailyFlow({ locale }: { readonly locale: SupportedLocale }) {
  const label = (key: string) =>
    t(locale, `network.tdh.verify.flow.${key}` as MessageKey);
  return (
    <figure className="tw-m-0">
      <figcaption className="tw-mb-3 tw-text-sm tw-font-medium tw-text-iron-200">
        {label("title")}
      </figcaption>
      <div className="tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.07] tw-bg-iron-950 tw-p-4">
        <TdhDiagramSwitch
          narrow={<FlowNarrow label={label} />}
          wide={<FlowWide label={label} />}
        />
      </div>
      <p className="tw-m-0 tw-mt-3 tw-inline-flex tw-items-center tw-gap-2 tw-rounded-full tw-border tw-border-dashed tw-border-primary-400/50 tw-px-3 tw-py-1 tw-text-xs tw-text-primary-300">
        {label("sameCode")}
      </p>
    </figure>
  );
}

const STEPS = [
  { key: "snapshot", refs: ["P26 §4.2"] },
  { key: "inputs", refs: ["P53 §12", "D132"] },
  { key: "exact", refs: ["P53 §12"] },
  { key: "classes", refs: ["P38 §3.3"] },
  { key: "after", refs: ["P53 §4.5", "D132"] },
] as const;

export default function VerificationMethod({
  locale,
}: {
  readonly locale: SupportedLocale;
}) {
  return (
    <section
      id="method"
      aria-labelledby="method-heading"
      className="tw-mt-12 tw-scroll-mt-24"
    >
      <TdhHeading
        id="method"
        title={t(locale, "network.tdh.verify.method.heading")}
        locale={locale}
        className="tw-hyphens-auto tw-text-xl tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-iron-50 min-[360px]:tw-text-2xl"
      />
      <div className="tw-mt-4 tw-space-y-8">
        <div className="tw-max-w-3xl">
          <DailyFlow locale={locale} />
        </div>
        <ol className="tw-m-0 tw-max-w-3xl tw-list-none tw-space-y-4 tw-p-0">
          {STEPS.map((step, index) => (
            <li
              key={step.key}
              className="tw-grid tw-grid-cols-[1.75rem_minmax(0,1fr)] tw-gap-3"
            >
              <span className="tw-flex tw-size-7 tw-items-center tw-justify-center tw-rounded-full tw-bg-iron-800 tw-text-xs tw-font-medium tw-tabular-nums tw-text-iron-200">
                {index + 1}
              </span>
              <p className="tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-300">
                <strong className="tw-font-semibold tw-text-iron-100">
                  {t(
                    locale,
                    `network.tdh.verify.method.${step.key}.title` as MessageKey
                  )}
                </strong>{" "}
                {t(
                  locale,
                  `network.tdh.verify.method.${step.key}.body` as MessageKey
                )}
                <TdhSource refs={step.refs} locale={locale} />
              </p>
            </li>
          ))}
          <li className="tw-border-0 tw-border-l-2 tw-border-solid tw-border-iron-700 tw-pl-4 tw-text-sm tw-leading-6 tw-text-iron-400">
            {t(locale, "network.tdh.verify.method.validators")}
            <TdhSource refs={["P53 §12"]} locale={locale} />
          </li>
        </ol>
      </div>
    </section>
  );
}
