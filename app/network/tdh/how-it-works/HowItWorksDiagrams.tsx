import { ArrowDownIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import type { ReactNode } from "react";
import { formatInteger, formatNumber } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import { REGISTRY_V14, rateCents } from "@/components/explained/engine/tdh";
import { TDH_SERIES } from "../shared/tdhStyles";
import { EXAMPLE_NETWORK } from "./exampleNetwork";
import {
  NARROW_WIDTH,
  TdhDiagramSwitch,
  TdhSvg,
  WIDE_WIDTH,
} from "../shared/TdhSvg";

const H = EXAMPLE_NETWORK.largestEdition;

const TILE = {
  kept: "tw-bg-sky-400/20 tw-border-sky-400/50 tw-text-sky-50",
  sold: "tw-border-dashed tw-border-iron-500 tw-bg-transparent tw-text-iron-300 tw-line-through",
  fresh: "tw-bg-amber-300/20 tw-border-amber-300/60 tw-text-amber-50",
} as const;

function StackColumn({
  label,
  tiles,
}: {
  readonly label: string;
  readonly tiles: ReadonlyArray<{
    readonly label: string;
    readonly tone: keyof typeof TILE;
  }>;
}) {
  return (
    <div className="tw-flex tw-min-w-0 tw-flex-1 tw-flex-col tw-justify-end">
      <ol className="tw-m-0 tw-flex tw-list-none tw-flex-col-reverse tw-gap-1 tw-p-0">
        {tiles.map((tile, index) => (
          <li
            key={`${tile.label}-${index}`}
            className={`tw-flex tw-h-8 tw-items-center tw-justify-center tw-rounded-md tw-border tw-border-solid tw-text-[13px] tw-font-medium tw-tabular-nums ${TILE[tile.tone]}`}
          >
            {tile.label}
          </li>
        ))}
      </ol>
      <p className="tw-m-0 tw-mt-1.5 tw-text-center tw-text-sm tw-text-iron-300">
        {label}
      </p>
    </div>
  );
}

function StackCard({
  title,
  note,
  children,
}: {
  readonly title: string;
  readonly note?: string;
  readonly children: ReactNode;
}) {
  return (
    <div className="tw-flex tw-min-w-0 tw-flex-col tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.07] tw-bg-iron-950 tw-p-3">
      <p className="tw-m-0 tw-text-sm tw-font-medium tw-text-iron-100">
        {title}
        {note && (
          <span className="tw-font-normal tw-text-iron-400"> · {note}</span>
        )}
      </p>
      <div className="tw-mt-2 tw-flex tw-flex-1 tw-items-end tw-gap-3">
        {children}
      </div>
    </div>
  );
}

/**
 * Diagram 2: Wallet A's stack at the sale and at the snapshot (step 4). At
 * the sale, 50 days before the snapshot, the copies bought 300, 200 and 100
 * days before the snapshot are 250, 150 and 50 days old; the newest leaves.
 */
export function StackDiagram({ locale }: { readonly locale: SupportedLocale }) {
  const days = (value: number) =>
    t(locale, "network.tdh.how.s4.daysLabel", {
      days: formatInteger(locale, value),
    });
  return (
    <figure className="tw-m-0 tw-mt-4">
      <figcaption className="tw-sr-only">
        {t(locale, "network.tdh.how.s4.diagramDesc")}
      </figcaption>
      <div
        aria-hidden="true"
        className="tw-grid tw-gap-2 sm:tw-grid-cols-[minmax(0,1fr)_1.25rem_minmax(0,1.2fr)] sm:tw-items-stretch"
      >
        <StackCard
          title={t(locale, "network.tdh.how.s4.before")}
          note={t(locale, "network.tdh.how.s4.beforeNote")}
        >
          <StackColumn
            label={t(locale, "network.tdh.how.s4.walletA")}
            tiles={[
              { label: days(250), tone: "kept" },
              { label: days(150), tone: "kept" },
              { label: days(50), tone: "sold" },
            ]}
          />
        </StackCard>
        <span className="tw-flex tw-items-center tw-justify-center tw-text-iron-400">
          <ArrowDownIcon className="tw-size-4 sm:tw-hidden" />
          <ArrowRightIcon className="tw-hidden tw-size-4 sm:tw-block" />
        </span>
        <StackCard title={t(locale, "network.tdh.how.s4.after")}>
          <StackColumn
            label={t(locale, "network.tdh.how.s4.walletA")}
            tiles={[
              { label: days(300), tone: "kept" },
              { label: days(200), tone: "kept" },
            ]}
          />
          <StackColumn
            label={t(locale, "network.tdh.how.s4.buyer")}
            tiles={[{ label: days(50), tone: "fresh" }]}
          />
        </StackCard>
      </div>
      <p className="tw-m-0 tw-mt-2 tw-text-sm tw-text-iron-400">
        {t(locale, "network.tdh.how.s4.legend")}
      </p>
    </figure>
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

/**
 * Where each label sits, in pixels from its point, always on the side away
 * from the falling curve. The two Meme points, 300 and 310 copies, are almost
 * on top of each other, so they share one label with one leader line.
 */
type LabelPlace = readonly [number, number, "start" | "middle" | "end"];

/**
 * Where each label sits, in pixels from its point, with its anchor, for
 * each drawing: always clear of the falling curve, of the axes and of the
 * other labels, and joined to its point by a short leader. On the phone
 * drawing NextGen's 3.94 sits above and left of its dot, over the curve's
 * bend, and FirstGM's 1.00 straight above its dot, so the two never stack.
 */
const LABEL_PLACE: Readonly<
  Record<"narrow" | "wide", Readonly<Record<string, LabelPlace>>>
> = {
  narrow: {
    gradient: [14, -4, "start"],
    nextgen: [-6, -24, "end"],
    firstgm: [0, -20, "middle"],
  },
  wide: {
    gradient: [14, -4, "start"],
    nextgen: [10, -16, "start"],
    firstgm: [-12, -22, "end"],
  },
};
const PAIRED = new Set(["meme300", "meme310"]);

/**
 * How far a label's baseline sits below its offset: a label below its dot
 * drops by most of its height, one level with it (dy 0) by a third, one
 * above it not at all.
 */
function labelShift(dy: number, font: number): number {
  if (dy > 0) {
    return font * 0.6;
  }
  return dy === 0 ? font * 0.35 : 0;
}

/**
 * The 300- and 310-copy Memes sit almost on one spot of the log axis, so
 * they are drawn apart: 300 as a ring, 310 as a dot inside its edge, each
 * with its own leader and label, 300 above and to the left (its rate is the
 * higher), 310 below and to the right.
 */
function PairPoints({
  locale,
  x300,
  y300,
  x310,
  y310,
  font,
}: {
  readonly locale: SupportedLocale;
  readonly x300: number;
  readonly y300: number;
  readonly x310: number;
  readonly y310: number;
  readonly font: number;
}) {
  const label = (copies: number) => {
    const cents = rateCents(H, copies) ?? 0;
    return t(locale, "network.tdh.how.s7.pointLabel", {
      copies: formatInteger(locale, copies),
      rate: formatNumber(locale, cents / 100, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    });
  };
  const textProps = {
    className:
      "tw-fill-iron-50 tw-stroke-iron-950 tw-font-medium tw-tabular-nums",
    strokeWidth: 4,
    paintOrder: "stroke" as const,
    fontSize: font,
  };
  // 300 above and to the right, where the falling curve leaves room; 310
  // below and to the left, under the floor's dashed line.
  return (
    <g>
      <line
        x1={x300 + 4}
        y1={y300 - 5}
        x2={x300 + 14}
        y2={y300 - 30}
        strokeWidth="1"
        className="tw-stroke-iron-500"
      />
      <text x={x300 + 12} y={y300 - 34} textAnchor="start" {...textProps}>
        {label(300)}
      </text>
      <line
        x1={x310 - 4}
        y1={y310 + 5}
        x2={x310 - 12}
        y2={y310 + 20}
        strokeWidth="1"
        className="tw-stroke-iron-500"
      />
      <text x={x310 - 12} y={y310 + 20 + font} textAnchor="end" {...textProps}>
        {label(310)}
      </text>
      <circle
        cx={x300}
        cy={y300}
        r="6"
        fill="none"
        strokeWidth="1.75"
        className={TDH_SERIES.memes.stroke}
      />
      <circle
        cx={x310}
        cy={y310}
        r="3.25"
        className={`${TDH_SERIES.memes.fill} tw-stroke-iron-950`}
        strokeWidth="1"
      />
    </g>
  );
}

function RateCurve({
  locale,
  id,
  width,
  height,
  font,
}: {
  readonly locale: SupportedLocale;
  readonly id: string;
  readonly width: number;
  readonly height: number;
  readonly font: number;
}) {
  const left = 40;
  const right = 28;
  const top = 34;
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
    <TdhSvg
      id={id}
      width={width}
      height={height}
      title={t(locale, "network.tdh.how.s7.curveTitle")}
      desc={t(locale, "network.tdh.how.s7.curveDesc")}
    >
      <text x={8} y={16} className="tw-fill-iron-300" fontSize={font}>
        {t(locale, "network.tdh.how.s7.curveY")}
      </text>
      {[0, 10, 20, 30, 40].map((tick) => (
        <g key={tick}>
          <line
            x1={left}
            x2={width - right}
            y1={y(tick)}
            y2={y(tick)}
            className="tw-stroke-iron-800"
            data-tdh-grid=""
          />
          <text
            x={left - 8}
            y={y(tick) + 4}
            textAnchor="end"
            className="tw-fill-iron-400 tw-tabular-nums"
            fontSize={font}
          >
            {formatInteger(locale, tick)}
          </text>
        </g>
      ))}
      {/* Every tick at both widths: FirstGM's point at 3,941 keeps its
          anchor on the phone drawing too. */}
      {[100, 300, 1_000, 4_000].map((tick) => (
        <text
          key={tick}
          x={x(tick)}
          y={height - bottom + 18}
          textAnchor={tick === 4_000 ? "end" : "middle"}
          className="tw-fill-iron-400 tw-tabular-nums"
          fontSize={font}
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
      <path
        d={curve}
        fill="none"
        strokeWidth="2"
        className="tw-stroke-iron-300"
      />
      {CURVE_POINTS.map((point) => {
        const cents =
          rateCents(
            H,
            point.edition,
            point.minimumOne ? REGISTRY_V14.gradient_rate_minimum : undefined
          ) ?? 0;
        const px = x(point.edition);
        const py = y(cents / 100);
        const [dx, dy, anchor] = LABEL_PLACE[
          width === NARROW_WIDTH ? "narrow" : "wide"
        ][point.key] ?? [10, -10, "start"];
        if (PAIRED.has(point.key)) {
          return null;
        }
        // A leader from the dot's edge toward the label's corner.
        const length = Math.hypot(dx, dy);
        const leader = length > 16;
        return (
          <g key={point.key}>
            {leader && (
              <line
                x1={px + (dx / length) * 7}
                y1={py + (dy / length) * 7}
                x2={px + dx * 0.72}
                y2={py + dy * 0.72}
                strokeWidth="1"
                className="tw-stroke-iron-500"
              />
            )}
            <circle
              cx={px}
              cy={py}
              r="5"
              className={TDH_SERIES[point.series].fill}
            />
            <text
              x={px + dx}
              y={py + dy + labelShift(dy, font)}
              textAnchor={anchor}
              className="tw-fill-iron-50 tw-stroke-iron-950 tw-font-medium tw-tabular-nums"
              strokeWidth={4}
              paintOrder="stroke"
              fontSize={font}
            >
              {rate(cents)}
            </text>
          </g>
        );
      })}
      <PairPoints
        locale={locale}
        x300={x(300)}
        y300={y((rateCents(H, 300) ?? 0) / 100)}
        x310={x(310)}
        y310={y((rateCents(H, 310) ?? 0) / 100)}
        font={font}
      />
      <text
        x={(left + width - right) / 2}
        y={height - 6}
        textAnchor="middle"
        className="tw-fill-iron-300"
        fontSize={font}
      >
        {t(locale, "network.tdh.how.s7.curveX")}
      </text>
    </TdhSvg>
  );
}

/**
 * Diagram 4: rate against edition size on a logarithmic axis (step 7),
 * drawn at a phone width and a desktop width, with the floor band named in
 * a legend instead of inside the plot.
 */
export function RateCurveDiagram({
  locale,
}: {
  readonly locale: SupportedLocale;
}) {
  return (
    <figure className="tw-m-0 tw-mt-4">
      <TdhDiagramSwitch
        narrow={
          <RateCurve
            locale={locale}
            id="rate-curve-narrow"
            width={NARROW_WIDTH}
            height={300}
            font={14}
          />
        }
        wide={
          <RateCurve
            locale={locale}
            id="rate-curve-wide"
            width={WIDE_WIDTH}
            height={300}
            font={13}
          />
        }
      />
      {/* The key, one item a row, in the order the eye meets them. */}
      <figcaption>
        <ul className="tw-m-0 tw-mt-3 tw-grid tw-list-none tw-gap-1.5 tw-p-0 tw-text-[13px] tw-leading-5 tw-text-iron-300">
          {(["memes", "gradients", "nextgen"] as const).map((series) => (
            <li key={series} className="tw-flex tw-items-center tw-gap-2">
              <span
                aria-hidden="true"
                className={`tw-ml-1.5 tw-mr-1.5 tw-size-2 tw-shrink-0 tw-rounded-full ${TDH_SERIES[series].bg}`}
              />
              {t(locale, `network.tdh.how.s7.legend.${series}` as MessageKey)}
            </li>
          ))}
          <li className="tw-flex tw-items-center tw-gap-2">
            <span
              aria-hidden="true"
              className="tw-w-5 tw-shrink-0 tw-border-0 tw-border-t-2 tw-border-dashed tw-border-sky-300"
            />
            {t(locale, "network.tdh.how.s7.floorBand")}
          </li>
        </ul>
      </figcaption>
    </figure>
  );
}

const GRAPHS = [
  {
    key: "row1",
    wallets: { A: [40, 30], B: [130, 30], C: [85, 100] },
    links: ["AB", "BC", "AC"],
    identities: [["A", "B", "C"]],
  },
  {
    key: "row2",
    wallets: { A: [26, 30], B: [134, 30], C: [108, 100] },
    links: ["AB", "BC"],
    identities: [["B", "C"], ["A"]],
  },
  {
    key: "row3",
    wallets: { A: [30, 30], B: [110, 30], C: [70, 100], D: [150, 100] },
    links: ["AB", "BC", "AC", "CD"],
    identities: [
      ["C", "D"],
      ["A", "B"],
    ],
  },
] as const;

function IdentityGraph({ graph }: { readonly graph: (typeof GRAPHS)[number] }) {
  const position = (name: string): readonly [number, number] => {
    const point = (graph.wallets as Record<string, readonly [number, number]>)[
      name
    ] ?? [0, 0];
    return [point[0] + 10, point[1] + 10];
  };
  return (
    <svg
      viewBox="0 0 190 140"
      aria-hidden="true"
      className="tw-mx-auto tw-block tw-h-auto tw-w-full tw-max-w-[13.625rem]"
    >
      {graph.identities.map((members, index) => {
        const points = members.map(position);
        const xs = points.map((point) => point[0]);
        const ys = points.map((point) => point[1]);
        const minX = Math.min(...xs) - 26;
        const minY = Math.min(...ys) - 22;
        // The first identity in the identity blue, a second one in a second
        // tint, as the legend shows: a wallet alone is an identity too.
        const tone =
          index === 0
            ? "tw-fill-primary-500/10 tw-stroke-primary-400/70"
            : "tw-fill-teal-400/10 tw-stroke-teal-300/70";
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
        const [from, to] = [position(link[0] ?? ""), position(link[1] ?? "")];
        const inside = graph.identities.some(
          (members) =>
            (members as readonly string[]).includes(link[0] ?? "") &&
            (members as readonly string[]).includes(link[1] ?? "")
        );
        return (
          <line
            key={link}
            x1={from[0]}
            y1={from[1]}
            x2={to[0]}
            y2={to[1]}
            strokeWidth={inside ? 3 : 1.5}
            strokeDasharray={inside ? undefined : "4 3"}
            className={inside ? "tw-stroke-iron-200" : "tw-stroke-iron-400"}
          />
        );
      })}
      {graph.links.map((link, index) => {
        const [from, to] = [position(link[0] ?? ""), position(link[1] ?? "")];
        const mx = (from[0] + to[0]) / 2;
        const my = (from[1] + to[1]) / 2;
        return (
          <g key={`order-${link}`}>
            <circle
              cx={mx}
              cy={my}
              r="10"
              strokeWidth="1"
              className="tw-fill-iron-950 tw-stroke-primary-400/70"
            />
            <text
              x={mx}
              y={my + 4.5}
              textAnchor="middle"
              fontSize="12"
              className="tw-fill-primary-300 tw-font-semibold tw-tabular-nums"
            >
              {index + 1}
            </text>
          </g>
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
              y={cy + 5}
              textAnchor="middle"
              className="tw-fill-iron-50 tw-font-semibold"
              fontSize="14"
            >
              {name}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/**
 * A pattern's links in their order on chain, each with the same numbered
 * badge the drawing uses, so the caption and the figure read alike.
 */
function LinkOrder({
  locale,
  graph,
}: {
  readonly locale: SupportedLocale;
  readonly graph: (typeof GRAPHS)[number];
}) {
  return (
    <p className="tw-m-0 tw-flex tw-flex-wrap tw-items-center tw-justify-center tw-gap-x-2.5 tw-gap-y-1 tw-text-[13px] tw-leading-5 tw-text-iron-300 sm:tw-justify-start xl:tw-justify-center">
      <span className="tw-sr-only">
        {t(locale, "network.tdh.how.s10.links")}:
      </span>
      {graph.links.map((link, index) => (
        <span
          key={link}
          className="tw-inline-flex tw-items-center tw-gap-1 tw-whitespace-nowrap"
        >
          <span
            aria-hidden="true"
            className="tw-flex tw-size-5 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-border-primary-400/70 tw-text-xs tw-font-semibold tw-tabular-nums tw-text-primary-300"
          >
            {formatInteger(locale, index + 1)}
          </span>
          <span className="tw-sr-only">
            {t(locale, "network.tdh.how.s10.linkOrder", {
              n: formatInteger(locale, index + 1),
            })}
          </span>
          <span className="tw-font-medium">{`${link.slice(0, 1)}–${link.slice(1)}`}</span>
        </span>
      ))}
      {graph.key === "row2" && (
        <span className="tw-text-iron-400">
          {t(locale, "network.tdh.how.s10.row2.note")}
        </span>
      )}
    </p>
  );
}

/**
 * Diagram 6: three link patterns and the identities they form (step 10).
 * Each pattern is its own small figure with an HTML caption, so it stays
 * legible on a phone.
 */
export function IdentityGraphDiagram({
  locale,
}: {
  readonly locale: SupportedLocale;
}) {
  return (
    <figure className="tw-m-0 tw-mt-4">
      <p className="tw-sr-only">{t(locale, "network.tdh.how.s10.graphDesc")}</p>
      <ol className="tw-m-0 tw-grid tw-list-none tw-gap-3 tw-p-0 xl:tw-grid-cols-3">
        {GRAPHS.map((graph) => (
          <li
            key={graph.key}
            className="tw-grid tw-items-center tw-gap-x-4 tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.07] tw-bg-iron-950 tw-p-3 sm:tw-grid-cols-[15rem_minmax(0,1fr)] xl:tw-grid-cols-1"
          >
            <IdentityGraph graph={graph} />
            <div className="tw-mt-2 tw-text-center sm:tw-mt-0 sm:tw-text-left xl:tw-mt-2 xl:tw-text-center">
              <LinkOrder locale={locale} graph={graph} />
              <p className="tw-m-0 tw-text-[13px] tw-font-medium tw-leading-5 tw-text-iron-100">
                {t(
                  locale,
                  `network.tdh.how.s10.${graph.key}.result` as MessageKey
                )}
              </p>
            </div>
          </li>
        ))}
      </ol>
      <figcaption className="tw-mt-2 tw-flex tw-flex-wrap tw-gap-x-5 tw-gap-y-1 tw-text-sm tw-text-iron-300">
        <span className="tw-inline-flex tw-items-center tw-gap-2">
          <span
            aria-hidden="true"
            className="tw-w-5 tw-border-0 tw-border-t-[3px] tw-border-solid tw-border-iron-200"
          />
          {t(locale, "network.tdh.how.s10.legendLink")}
        </span>
        <span className="tw-inline-flex tw-items-center tw-gap-2">
          <span
            aria-hidden="true"
            className="tw-w-5 tw-border-0 tw-border-t-2 tw-border-dashed tw-border-iron-400"
          />
          {t(locale, "network.tdh.how.s10.legendLinkBetween")}
        </span>
        <span className="tw-inline-flex tw-items-center tw-gap-2">
          <span
            aria-hidden="true"
            className="tw-h-3 tw-w-5 tw-rounded-full tw-border tw-border-solid tw-border-primary-400/70 tw-bg-primary-500/10"
          />
          {t(locale, "network.tdh.how.s10.legendIdentity")}
        </span>
        <span className="tw-inline-flex tw-items-center tw-gap-2">
          <span
            aria-hidden="true"
            className="tw-h-3 tw-w-5 tw-rounded-full tw-border tw-border-solid tw-border-teal-300/70 tw-bg-teal-400/10"
          />
          {t(locale, "network.tdh.how.s10.legendIdentity2")}
        </span>
        <span className="tw-inline-flex tw-items-center tw-gap-2">
          <span
            aria-hidden="true"
            className="tw-flex tw-size-5 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-border-primary-400/70 tw-text-xs tw-font-semibold tw-text-primary-300"
          >
            1
          </span>
          {t(locale, "network.tdh.how.s10.linksNote")}
        </span>
      </figcaption>
    </figure>
  );
}
