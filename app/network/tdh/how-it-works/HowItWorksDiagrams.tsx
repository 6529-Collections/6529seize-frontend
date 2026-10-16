import { ArrowDownIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import type { ReactNode } from "react";
import { formatInteger, formatNumber } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import { EXAMPLE_NETWORK, rateCents } from "@/lib/tdh/tdhV1Arithmetic";
import { TDH_SERIES } from "../shared/tdhStyles";
import {
  NARROW_WIDTH,
  TdhDiagramSwitch,
  TdhSvg,
  WIDE_WIDTH,
} from "../shared/TdhSvg";
import { householdScenario } from "./examples";

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
      <p className="tw-m-0 tw-mt-1.5 tw-text-center tw-text-xs tw-text-iron-300">
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
      <p className="tw-m-0 tw-text-xs tw-font-medium tw-text-iron-100">
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
      <p className="tw-m-0 tw-mt-2 tw-text-xs tw-text-iron-400">
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
const LABEL_OFFSET: Readonly<Record<string, readonly [number, number]>> = {
  gradient: [12, -6],
  nextgen: [8, -12],
  firstgm: [-10, -12],
};
const PAIRED = new Set(["meme300", "meme310"]);

/** One label for the 300- and 310-copy Memes, up and to the right of them. */
function PairLabel({
  x,
  y,
  font,
  text,
  note,
}: {
  readonly x: number;
  readonly y: number;
  readonly font: number;
  readonly text: string;
  readonly note: string;
}) {
  const lx = x + 22;
  const ly = y - 34;
  return (
    <g>
      <line
        x1={x + 3}
        y1={y - 3}
        x2={lx - 2}
        y2={ly + 4}
        strokeWidth="1"
        className="tw-stroke-iron-500"
      />
      <text
        x={lx}
        y={ly}
        className="tw-fill-iron-50 tw-stroke-iron-950 tw-font-medium tw-tabular-nums"
        strokeWidth={4}
        paintOrder="stroke"
        fontSize={font}
      >
        {text}
      </text>
      <text
        x={lx}
        y={ly - font - 2}
        className="tw-fill-iron-400 tw-stroke-iron-950"
        strokeWidth={4}
        paintOrder="stroke"
        fontSize={font - 1}
      >
        {note}
      </text>
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
      maxWidth={width === NARROW_WIDTH ? 400 : 720}
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
        const cents = rateCents(H, point.edition, point.minimumOne) ?? 0;
        const px = x(point.edition);
        const py = y(cents / 100);
        const [dx, dy] = LABEL_OFFSET[point.key] ?? [10, -10];
        const anchor = dx < 0 ? "end" : "start";
        if (PAIRED.has(point.key)) {
          return (
            <circle
              key={point.key}
              cx={px}
              cy={py}
              r="4.5"
              className={`${TDH_SERIES[point.series].fill} tw-stroke-iron-950`}
              strokeWidth="1.5"
            />
          );
        }
        return (
          <g key={point.key}>
            <circle
              cx={px}
              cy={py}
              r="5"
              className={TDH_SERIES[point.series].fill}
            />
            <text
              x={px + dx}
              y={py + dy + (dy > 0 ? font * 0.6 : 0)}
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
      <PairLabel
        x={x(305)}
        y={y((rateCents(H, 300, false) ?? 0) / 100)}
        font={font}
        text={`${rate(rateCents(H, 300, false) ?? 0)} · ${rate(rateCents(H, 310, false) ?? 0)}`}
        note={t(locale, "network.tdh.how.s7.pairLabel")}
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
      <figcaption className="tw-mt-2 tw-flex tw-flex-wrap tw-items-center tw-gap-x-4 tw-gap-y-1 tw-text-xs tw-text-iron-300">
        <span className="tw-inline-flex tw-items-center tw-gap-2">
          <span
            aria-hidden="true"
            className="tw-w-5 tw-border-0 tw-border-t-2 tw-border-dashed tw-border-sky-300"
          />
          {t(locale, "network.tdh.how.s7.floorBand")}
        </span>
        {(["memes", "gradients", "nextgen"] as const).map((series) => (
          <span
            key={series}
            className="tw-inline-flex tw-items-center tw-gap-1.5"
          >
            <span
              aria-hidden="true"
              className={`tw-size-2 tw-rounded-full ${TDH_SERIES[series].bg}`}
            />
            {t(locale, `network.tdh.how.s7.legend.${series}` as MessageKey)}
          </span>
        ))}
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
    wallets: { A: [40, 30], B: [130, 30], C: [40, 100], D: [130, 100] },
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
      className="tw-mx-auto tw-block tw-h-auto tw-w-full tw-max-w-[15rem]"
    >
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
        const [from, to] = [position(link[0] ?? ""), position(link[1] ?? "")];
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
              <p className="tw-m-0 tw-font-mono tw-text-[13px] tw-leading-5 tw-text-iron-300">
                {t(
                  locale,
                  `network.tdh.how.s10.${graph.key}.links` as MessageKey
                )}
              </p>
              <p className="tw-m-0 tw-font-mono tw-text-[13px] tw-leading-5 tw-text-primary-300">
                {t(
                  locale,
                  `network.tdh.how.s10.${graph.key}.result` as MessageKey
                )}
              </p>
            </div>
          </li>
        ))}
      </ol>
      <figcaption className="tw-mt-2 tw-flex tw-flex-wrap tw-gap-x-5 tw-gap-y-1 tw-text-xs tw-text-iron-300">
        <span className="tw-inline-flex tw-items-center tw-gap-2">
          <span
            aria-hidden="true"
            className="tw-w-5 tw-border-0 tw-border-t-2 tw-border-solid tw-border-iron-300"
          />
          {t(locale, "network.tdh.how.s10.legendLink")}
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

/**
 * Diagram 7: two wallets feeding one identity, with per-card bases (step
 * 12). Built in HTML, so it reflows: side by side on wide screens, stacked
 * on phones.
 */
export function HouseholdDiagram({
  locale,
}: {
  readonly locale: SupportedLocale;
}) {
  const wallets = householdScenario("wallets").records;
  const identity = householdScenario("identity").records[0];
  const card = (key: string) =>
    t(locale, `network.tdh.how.s12.card.${key}` as MessageKey);
  return (
    <figure className="tw-m-0 tw-mt-4">
      <figcaption className="tw-sr-only">
        {t(locale, "network.tdh.how.s12.diagramDesc")}
      </figcaption>
      <div
        aria-hidden="true"
        className="tw-grid tw-items-center tw-gap-3 md:tw-grid-cols-[minmax(0,1fr)_1.5rem_minmax(0,1.1fr)]"
      >
        <div className="tw-grid tw-gap-2">
          {wallets.map((record) => (
            <div
              key={record.label}
              className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-4 tw-py-3"
            >
              <p className="tw-m-0 tw-text-xs tw-font-medium tw-text-iron-300">
                {t(
                  locale,
                  record.label === "A"
                    ? "network.tdh.how.s12.walletA"
                    : "network.tdh.how.s12.walletB"
                )}
              </p>
              <ul className="tw-m-0 tw-mt-1.5 tw-list-none tw-space-y-1 tw-p-0 tw-text-[13px]">
                {record.rows.map((row) => (
                  <li
                    key={row.card}
                    className="tw-flex tw-justify-between tw-gap-3 tw-text-iron-200"
                  >
                    <span>{card(row.card)}</span>
                    <span className="tw-tabular-nums tw-text-iron-50">
                      {formatInteger(locale, row.base)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <span className="tw-flex tw-justify-center tw-text-iron-400">
          <ArrowDownIcon className="tw-size-5 md:tw-hidden" />
          <ArrowRightIcon className="tw-hidden tw-size-5 md:tw-block" />
        </span>
        <div className="tw-rounded-xl tw-border tw-border-solid tw-border-primary-400/60 tw-bg-primary-500/10 tw-px-4 tw-py-3">
          <p className="tw-m-0 tw-flex tw-justify-between tw-gap-3 tw-text-xs tw-font-medium tw-text-primary-300">
            <span>
              {t(locale, "network.tdh.how.s12.identity")} ×{" "}
              {formatNumber(locale, (identity?.betaCents ?? 100) / 100, {
                minimumFractionDigits: 2,
              })}
            </span>
            <span>
              {t(locale, "network.tdh.how.s12.base")} →{" "}
              {t(locale, "network.tdh.how.s12.final")}
            </span>
          </p>
          <ul className="tw-m-0 tw-mt-1.5 tw-list-none tw-space-y-1 tw-p-0 tw-text-[13px]">
            {identity?.rows.map((row) => (
              <li
                key={row.card}
                className="tw-flex tw-justify-between tw-gap-3 tw-text-iron-200"
              >
                <span>{card(row.card)}</span>
                <span className="tw-tabular-nums">
                  <span className="tw-text-iron-400">
                    {formatInteger(locale, row.base)}
                  </span>{" "}
                  →{" "}
                  <span className="tw-font-semibold tw-text-iron-50">
                    {formatInteger(locale, row.final)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
          <p className="tw-m-0 tw-mt-2 tw-flex tw-justify-between tw-gap-3 tw-border-0 tw-border-t tw-border-solid tw-border-primary-400/30 tw-pt-2 tw-text-sm tw-font-semibold tw-text-iron-50">
            <span>{t(locale, "network.tdh.how.s12.total")}</span>
            <span className="tw-tabular-nums">
              {formatInteger(locale, identity?.final ?? 0)}
            </span>
          </p>
        </div>
      </div>
    </figure>
  );
}
