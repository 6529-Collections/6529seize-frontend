import Link from "next/link";
import { useId } from "react";
import { formatInteger, formatNumber } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import { EXAMPLE_NETWORK, rateCents } from "@/lib/tdh/tdhV1Arithmetic";
import { TDH_FOCUS_RING, TDH_SERIES } from "../shared/tdhStyles";
import { householdScenario } from "./examples";

const H = EXAMPLE_NETWORK.largestEdition;

function useSvgLabels() {
  const id = useId();
  return { titleId: `${id}-title`, descId: `${id}-desc` };
}

const PIPELINE = [
  { key: "logs", step: 1 },
  { key: "order", step: 5 },
  { key: "stacks", step: 4 },
  { key: "days", step: 2 },
  { key: "rate", step: 7 },
  { key: "base", step: 8 },
  { key: "identity", step: 10 },
  { key: "boost", step: 9 },
  { key: "final", step: 11 },
  { key: "total", step: 13 },
] as const;

/** Diagram 1: the calculation as a pipeline; each node links to its step. */
export function PipelineDiagram({
  locale,
  stepTitles,
}: {
  readonly locale: SupportedLocale;
  readonly stepTitles: Readonly<Record<number, string>>;
}) {
  return (
    <figure className="tw-m-0">
      <figcaption className="tw-sr-only">
        {t(locale, "network.tdh.how.pipeline.desc")}
      </figcaption>
      <ol className="tw-m-0 tw-flex tw-list-none tw-flex-wrap tw-items-center tw-gap-x-1 tw-gap-y-2 tw-p-0">
        {PIPELINE.map((node, index) => (
          <li key={node.key} className="tw-flex tw-items-center tw-gap-1">
            {index > 0 && (
              <span aria-hidden="true" className="tw-text-iron-600">
                →
              </span>
            )}
            <Link
              href={`#step-${node.step}`}
              aria-label={t(locale, "network.tdh.how.pipeline.goto", {
                n: formatInteger(locale, node.step),
                title: stepTitles[node.step] ?? "",
              })}
              className={`tw-inline-flex tw-min-h-11 tw-items-center tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-px-3 tw-text-sm tw-no-underline tw-transition-colors motion-reduce:tw-transition-none ${
                node.key === "total"
                  ? "tw-border-primary-400/60 tw-bg-primary-500/15 tw-font-semibold tw-text-iron-50"
                  : "tw-border-white/10 tw-bg-iron-900 tw-text-iron-200 hover:tw-border-iron-500 hover:tw-text-iron-50"
              } ${TDH_FOCUS_RING}`}
            >
              {t(locale, `network.tdh.how.pipeline.${node.key}` as MessageKey)}
            </Link>
          </li>
        ))}
      </ol>
    </figure>
  );
}

const TILE_TONES = {
  kept: "tw-fill-sky-400/20 tw-stroke-sky-400/50",
  sold: "tw-fill-transparent tw-stroke-iron-500",
  fresh: "tw-fill-amber-300/20 tw-stroke-amber-300/60",
} as const;

/** Diagram 2: Wallet A's stack before and after one sale (step 4). */
export function StackDiagram({ locale }: { readonly locale: SupportedLocale }) {
  const { titleId, descId } = useSvgLabels();
  const tile = (
    x: number,
    y: number,
    label: string,
    tone: "kept" | "sold" | "fresh"
  ) => (
    <g key={`${x}-${y}`}>
      <rect
        x={x}
        y={y}
        width="104"
        height="30"
        rx="6"
        className={TILE_TONES[tone]}
        strokeDasharray={tone === "sold" ? "4 4" : undefined}
      />
      <text
        x={x + 52}
        y={y + 20}
        textAnchor="middle"
        className="tw-fill-iron-50 tw-text-[13px] tw-font-medium tw-tabular-nums"
      >
        {label}
      </text>
    </g>
  );
  const days = (value: number) =>
    t(locale, "network.tdh.how.s4.daysLabel", {
      days: formatInteger(locale, value),
    });
  return (
    <svg
      viewBox="0 0 520 190"
      role="img"
      aria-labelledby={`${titleId} ${descId}`}
      className="tw-mt-4 tw-block tw-h-auto tw-w-full tw-max-w-xl"
    >
      <title id={titleId}>{t(locale, "network.tdh.how.s4.diagramTitle")}</title>
      <desc id={descId}>{t(locale, "network.tdh.how.s4.diagramDesc")}</desc>
      <text x="20" y="18" className="tw-fill-iron-400 tw-text-[12px]">
        {t(locale, "network.tdh.how.s4.before")}
      </text>
      {tile(20, 136, days(300), "kept")}
      {tile(20, 100, days(200), "kept")}
      {tile(20, 64, days(100), "kept")}
      <text x="190" y="18" className="tw-fill-iron-400 tw-text-[12px]">
        {t(locale, "network.tdh.how.s4.after")}
      </text>
      <text x="190" y="40" className="tw-fill-iron-300 tw-text-[12px]">
        {t(locale, "network.tdh.how.s4.walletA")}
      </text>
      {tile(190, 136, days(300), "kept")}
      {tile(190, 100, days(200), "kept")}
      {tile(190, 64, t(locale, "network.tdh.how.s4.sold"), "sold")}
      <path
        d="M298 79 C 330 79, 340 150, 372 150"
        fill="none"
        strokeWidth="1.5"
        className="tw-stroke-amber-300/70"
      />
      <text x="380" y="40" className="tw-fill-iron-300 tw-text-[12px]">
        {t(locale, "network.tdh.how.s4.buyer")}
      </text>
      {tile(380, 136, days(50), "fresh")}
    </svg>
  );
}

const CURVE_POINTS = [
  {
    key: "gradient",
    edition: EXAMPLE_NETWORK.gradients,
    minimumOne: true,
    series: "gradients",
  },
  { key: "meme300", edition: 300, minimumOne: false, series: "memes" },
  { key: "meme310", edition: 310, minimumOne: false, series: "memes" },
  {
    key: "nextgen",
    edition: EXAMPLE_NETWORK.nextgenCollectionSize,
    minimumOne: false,
    series: "nextgen",
  },
  { key: "firstgm", edition: H, minimumOne: false, series: "memes" },
] as const;

// Label offsets keep the close 300 and 310 points readable.
const LABEL_DY: Readonly<Record<string, number>> = {
  gradient: 4,
  meme300: -10,
  meme310: 16,
  nextgen: -10,
  firstgm: -10,
};

/** Diagram 4: rate against edition size on a logarithmic axis (step 7). */
export function RateCurveDiagram({
  locale,
}: {
  readonly locale: SupportedLocale;
}) {
  const { titleId, descId } = useSvgLabels();
  const width = 560;
  const height = 280;
  const left = 48;
  const right = 20;
  const top = 26;
  const bottom = 44;
  const minLog = Math.log10(100);
  const maxLog = Math.log10(4_000);
  const maxRate = 40;
  const x = (edition: number) =>
    left +
    ((Math.log10(edition) - minLog) / (maxLog - minLog)) *
      (width - left - right);
  const y = (rate: number) =>
    top + (1 - rate / maxRate) * (height - top - bottom);
  const curve = Array.from({ length: 61 }, (_, index) => {
    const edition = 10 ** (minLog + ((maxLog - minLog) * index) / 60);
    return `${index === 0 ? "M" : "L"}${x(edition).toFixed(1)},${y(H / edition).toFixed(1)}`;
  }).join(" ");
  const rate = (cents: number) =>
    formatNumber(locale, cents / 100, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-labelledby={`${titleId} ${descId}`}
      className="tw-mt-4 tw-block tw-h-auto tw-w-full tw-max-w-2xl"
    >
      <title id={titleId}>{t(locale, "network.tdh.how.s7.curveTitle")}</title>
      <desc id={descId}>{t(locale, "network.tdh.how.s7.curveDesc")}</desc>
      {[0, 10, 20, 30, 40].map((tick) => (
        <g key={tick}>
          <line
            x1={left}
            x2={width - right}
            y1={y(tick)}
            y2={y(tick)}
            className="tw-stroke-iron-800"
          />
          <text
            x={left - 8}
            y={y(tick) + 4}
            textAnchor="end"
            className="tw-fill-iron-500 tw-text-[11px] tw-tabular-nums"
          >
            {formatInteger(locale, tick)}
          </text>
        </g>
      ))}
      {[100, 300, 1_000, 4_000].map((tick) => (
        <text
          key={tick}
          x={x(tick)}
          y={height - bottom + 18}
          textAnchor="middle"
          className="tw-fill-iron-500 tw-text-[11px] tw-tabular-nums"
        >
          {formatInteger(locale, tick)}
        </text>
      ))}
      <rect
        x={x(100)}
        y={y(13.6)}
        width={x(300) - x(100)}
        height={y(11.8) - y(13.6)}
        className="tw-fill-sky-400/10"
      />
      <line
        x1={x(100)}
        x2={x(300)}
        y1={y(12.71)}
        y2={y(12.71)}
        strokeWidth="2.5"
        strokeDasharray="5 4"
        className="tw-stroke-sky-300"
      />
      <text
        x={x(104)}
        y={y(12.71) + 30}
        className="tw-fill-sky-200 tw-text-[11px]"
      >
        {t(locale, "network.tdh.how.s7.floorBand")}
      </text>
      <path
        d={curve}
        fill="none"
        strokeWidth="2"
        className="tw-stroke-iron-300"
      />
      {CURVE_POINTS.map((point) => {
        const cents = rateCents(H, point.edition, point.minimumOne) ?? 0;
        const px = x(point.edition);
        const py = y(cents / 100);
        const labelRight = point.key !== "firstgm";
        return (
          <g key={point.key}>
            <circle
              cx={px}
              cy={py}
              r="5"
              className={TDH_SERIES[point.series].fill}
            />
            <text
              x={labelRight ? px + 10 : px - 10}
              y={py + (LABEL_DY[point.key] ?? -10)}
              textAnchor={labelRight ? "start" : "end"}
              className="tw-fill-iron-100 tw-text-[11px] tw-tabular-nums"
            >
              {rate(cents)}
            </text>
          </g>
        );
      })}
      <text
        x={(left + width - right) / 2}
        y={height - 6}
        textAnchor="middle"
        className="tw-fill-iron-400 tw-text-[11px]"
      >
        {t(locale, "network.tdh.how.s7.curveX")}
      </text>
      <text
        x={left + 6}
        y={top - 8}
        className="tw-fill-iron-400 tw-text-[11px]"
      >
        {t(locale, "network.tdh.how.s7.curveY")}
      </text>
    </svg>
  );
}

const GRAPHS = [
  {
    wallets: { A: [40, 30], B: [130, 30], C: [85, 100] },
    links: ["AB", "BC", "AC"],
    identities: [["A", "B", "C"]],
  },
  {
    wallets: { A: [26, 30], B: [134, 30], C: [108, 100] },
    links: ["AB", "BC"],
    identities: [["B", "C"], ["A"]],
  },
  {
    wallets: { A: [40, 30], B: [130, 30], C: [40, 100], D: [130, 100] },
    links: ["AB", "BC", "AC", "CD"],
    identities: [
      ["C", "D"],
      ["A", "B"],
    ],
  },
] as const;

/** Diagram 6: three link patterns and the identities they form (step 10). */
export function IdentityGraphDiagram({
  locale,
}: {
  readonly locale: SupportedLocale;
}) {
  const { titleId, descId } = useSvgLabels();
  return (
    <svg
      viewBox="0 0 600 150"
      role="img"
      aria-labelledby={`${titleId} ${descId}`}
      className="tw-mt-4 tw-block tw-h-auto tw-w-full tw-max-w-2xl"
    >
      <title id={titleId}>{t(locale, "network.tdh.how.s10.graphTitle")}</title>
      <desc id={descId}>{t(locale, "network.tdh.how.s10.graphDesc")}</desc>
      {GRAPHS.map((graph, graphIndex) => {
        const offset = graphIndex * 200 + 10;
        const position = (name: string): readonly [number, number] => {
          const point = (
            graph.wallets as Record<string, readonly [number, number]>
          )[name] ?? [0, 0];
          return [point[0] + offset, point[1] + 10];
        };
        return (
          <g key={graphIndex}>
            {graph.identities.map((members, index) => {
              const points = members.map(position);
              const xs = points.map((point) => point[0]);
              const ys = points.map((point) => point[1]);
              const minX = Math.min(...xs) - 26;
              const minY = Math.min(...ys) - 22;
              const tone =
                index === 0
                  ? "tw-fill-primary-500/10 tw-stroke-primary-400/70"
                  : "tw-fill-iron-800/40 tw-stroke-iron-500";
              const [single] = points;
              if (points.length === 1 && single) {
                return (
                  <circle
                    key={members.join("")}
                    cx={single[0]}
                    cy={single[1]}
                    r="21"
                    className={tone}
                    strokeWidth="1.5"
                  />
                );
              }
              return (
                <rect
                  key={members.join("")}
                  x={minX}
                  y={minY}
                  width={Math.max(...xs) - minX + 26}
                  height={Math.max(...ys) - minY + 22}
                  rx="22"
                  className={tone}
                  strokeWidth="1.5"
                />
              );
            })}
            {graph.links.map((link) => {
              const [from, to] = [
                position(link[0] ?? ""),
                position(link[1] ?? ""),
              ];
              return (
                <line
                  key={link}
                  x1={from[0]}
                  y1={from[1]}
                  x2={to[0]}
                  y2={to[1]}
                  strokeWidth="2"
                  className="tw-stroke-iron-300"
                />
              );
            })}
            {Object.keys(graph.wallets).map((name) => {
              const [cx, cy] = position(name);
              return (
                <g key={name}>
                  <circle
                    cx={cx}
                    cy={cy}
                    r="14"
                    className="tw-fill-iron-900 tw-stroke-iron-300"
                    strokeWidth="1.5"
                  />
                  <text
                    x={cx}
                    y={cy + 4.5}
                    textAnchor="middle"
                    className="tw-fill-iron-50 tw-text-[12px] tw-font-semibold"
                  >
                    {name}
                  </text>
                </g>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}

/** Diagram 7: two wallets feeding one identity, with per-card bases (step 12). */
export function HouseholdDiagram({
  locale,
}: {
  readonly locale: SupportedLocale;
}) {
  const { titleId, descId } = useSvgLabels();
  const wallets = householdScenario("wallets").records;
  const identity = householdScenario("identity").records[0];
  const card = (key: string) =>
    t(locale, `network.tdh.how.s12.card.${key}` as MessageKey);
  const rowHeight = 26;
  return (
    <svg
      viewBox="0 0 640 230"
      role="img"
      aria-labelledby={`${titleId} ${descId}`}
      className="tw-mt-4 tw-block tw-h-auto tw-w-full"
    >
      <title id={titleId}>
        {t(locale, "network.tdh.how.s12.diagramTitle")}
      </title>
      <desc id={descId}>{t(locale, "network.tdh.how.s12.diagramDesc")}</desc>
      {wallets.map((record, column) => {
        const x = 10;
        const y = 10 + column * 112;
        return (
          <g key={record.label}>
            <rect
              x={x}
              y={y}
              width="230"
              height="100"
              rx="10"
              className="tw-fill-iron-900 tw-stroke-iron-700"
            />
            <text
              x={x + 12}
              y={y + 20}
              className="tw-fill-iron-400 tw-text-[12px] tw-font-medium"
            >
              {t(
                locale,
                record.label === "A"
                  ? "network.tdh.how.s12.walletA"
                  : "network.tdh.how.s12.walletB"
              )}
            </text>
            {record.rows.map((row, index) => (
              <g key={row.card}>
                <text
                  x={x + 12}
                  y={y + 42 + index * 20}
                  className="tw-fill-iron-200 tw-text-[12px]"
                >
                  {card(row.card)}
                </text>
                <text
                  x={x + 218}
                  y={y + 42 + index * 20}
                  textAnchor="end"
                  className="tw-fill-iron-50 tw-text-[12px] tw-tabular-nums"
                >
                  {formatInteger(locale, row.base)}
                </text>
              </g>
            ))}
            <path
              d={`M${x + 232} ${y + 50} C 290 ${y + 50}, 300 115, 352 115`}
              fill="none"
              strokeWidth="1.5"
              className="tw-stroke-iron-500"
            />
          </g>
        );
      })}
      <rect
        x="354"
        y="20"
        width="276"
        height="190"
        rx="12"
        className="tw-fill-primary-500/10 tw-stroke-primary-400/60"
      />
      <text
        x="368"
        y="42"
        className="tw-fill-primary-300 tw-text-[12px] tw-font-medium"
      >
        {t(locale, "network.tdh.how.s12.identity")} ×{" "}
        {formatNumber(locale, (identity?.betaCents ?? 100) / 100, {
          minimumFractionDigits: 2,
        })}
      </text>
      {identity?.rows.map((row, index) => (
        <g key={row.card}>
          <text
            x="368"
            y={66 + index * rowHeight}
            className="tw-fill-iron-200 tw-text-[12px]"
          >
            {card(row.card)}
          </text>
          <text
            x="560"
            y={66 + index * rowHeight}
            textAnchor="end"
            className="tw-fill-iron-400 tw-text-[12px] tw-tabular-nums"
          >
            {formatInteger(locale, row.base)}
          </text>
          <text
            x="618"
            y={66 + index * rowHeight}
            textAnchor="end"
            className="tw-fill-iron-50 tw-text-[12px] tw-font-semibold tw-tabular-nums"
          >
            {formatInteger(locale, row.final)}
          </text>
        </g>
      ))}
      <line
        x1="368"
        x2="618"
        y1="190"
        y2="190"
        className="tw-stroke-primary-400/40"
      />
      <text
        x="368"
        y="204"
        className="tw-fill-iron-50 tw-text-[12px] tw-font-semibold"
      >
        {t(locale, "network.tdh.how.s12.total")}
      </text>
      <text
        x="618"
        y="204"
        textAnchor="end"
        className="tw-fill-iron-50 tw-text-[13px] tw-font-semibold tw-tabular-nums"
      >
        {formatInteger(locale, identity?.final ?? 0)}
      </text>
    </svg>
  );
}
