import { ArrowDownIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import { useId } from "react";
import type { SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import { TDH_SERIES } from "../shared/tdhStyles";

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
    <span className="tw-inline-flex tw-items-center tw-gap-1.5 tw-pl-3 tw-text-xs tw-text-iron-400 sm:tw-pl-0">
      <span
        aria-hidden="true"
        className={`tw-hidden tw-w-6 tw-border-0 tw-border-t tw-border-iron-500 sm:tw-inline-block ${dashed ? "tw-border-dashed" : "tw-border-solid"}`}
      />
      <ArrowDownIcon
        aria-hidden="true"
        className="tw-size-3.5 tw-shrink-0 tw-text-iron-500 sm:tw-hidden"
      />
      {note && <span className="tw-italic">{note}</span>}
      <ArrowRightIcon
        aria-hidden="true"
        className="tw-hidden tw-size-3.5 tw-text-iron-500 sm:tw-block"
      />
    </span>
  );
}

function Wall({ label }: { readonly label: string }) {
  return (
    <span className="tw-inline-flex tw-items-center tw-gap-1 tw-rounded-md tw-border tw-border-solid tw-border-amber-400/40 tw-bg-amber-400/[0.07] tw-px-2 tw-py-0.5 tw-text-[11px] tw-text-amber-100">
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
          <Arrow />
          <Impl label={m("name.python")} series="python" />
        </li>
        <li className={row}>
          <Doc label={m("lineage.p26")} />
          <Arrow />
          <Wall label={m("lineage.wallPython")} />
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
          <Impl label={m("lineage.backend")} series="live" />
          <Arrow note={m("lineage.replaced")} dashed />
          <Impl label={m("name.rust")} series="rust" />
        </li>
      </ol>
    </figure>
  );
}

/** Diagram 3: the shared vectors at the centre of every check (plan §9.2). */
export function CheckWebDiagram({
  locale,
}: {
  readonly locale: SupportedLocale;
}) {
  const id = useId();
  const cx = 210;
  const cy = 176;
  const nodes = [
    { key: "rust", series: "rust" as const, angle: -90 },
    { key: "programB", series: "programB" as const, angle: 30 },
    { key: "python", series: "python" as const, angle: 150 },
  ];
  const arcs = [
    { key: "dual", start: -90, end: 30 },
    { key: "daily", start: 150, end: 270 },
    { key: "proofs", start: 30, end: 150 },
  ];
  const point = (angle: number, radius: number) => {
    const radians = (angle * Math.PI) / 180;
    return [
      cx + radius * Math.cos(radians),
      cy + radius * Math.sin(radians),
    ] as const;
  };
  const arcPath = (start: number, end: number, radius: number) => {
    const [x1, y1] = point(start + 14, radius);
    const [x2, y2] = point(end - 14, radius);
    return `M${x1.toFixed(1)},${y1.toFixed(1)} A${radius},${radius} 0 0 1 ${x2.toFixed(1)},${y2.toFixed(1)}`;
  };
  return (
    <svg
      viewBox="0 0 420 352"
      role="img"
      aria-labelledby={`${id}-title ${id}-desc`}
      className="tw-mx-auto tw-block tw-h-auto tw-w-full tw-max-w-md"
    >
      <title id={`${id}-title`}>
        {t(locale, "network.tdh.impl.web.title")}
      </title>
      <desc id={`${id}-desc`}>{t(locale, "network.tdh.impl.web.desc")}</desc>
      {arcs.map((arc) => {
        const [lx, ly] = point((arc.start + arc.end) / 2, 158);
        return (
          <g key={arc.key}>
            <path
              d={arcPath(arc.start, arc.end, 140)}
              fill="none"
              strokeWidth="1.5"
              strokeDasharray="5 5"
              className="tw-stroke-iron-600"
            />
            <text
              x={lx}
              y={ly + 4}
              textAnchor="middle"
              className="tw-fill-iron-400 tw-text-[12px]"
            >
              {t(locale, `network.tdh.impl.web.${arc.key}` as MessageKey)}
            </text>
          </g>
        );
      })}
      {nodes.map((node) => {
        const [x, y] = point(node.angle, 96);
        const [sx, sy] = point(node.angle, 44);
        const [mx, my] = point(node.angle, 70);
        return (
          <g key={node.key}>
            <line
              x1={sx}
              y1={sy}
              x2={x}
              y2={y}
              strokeWidth="1.5"
              className="tw-stroke-iron-500"
            />
            <text
              x={mx + 6}
              y={my - 4}
              className="tw-fill-success tw-text-[11px] tw-font-medium"
            >
              {t(locale, "network.tdh.impl.web.pass")}
            </text>
            <circle
              cx={x}
              cy={y}
              r="8"
              className={TDH_SERIES[node.series].fill}
            />
            <text
              x={x}
              y={y + (node.angle < 0 ? -16 : 24)}
              textAnchor="middle"
              className="tw-fill-iron-100 tw-text-[12px] tw-font-medium"
            >
              {t(locale, `network.tdh.impl.name.${node.key}` as MessageKey)}
            </text>
          </g>
        );
      })}
      <circle
        cx={cx}
        cy={cy}
        r="42"
        className="tw-fill-iron-900 tw-stroke-primary-400/70"
        strokeWidth="1.5"
      />
      <text
        x={cx}
        y={cy + 4}
        textAnchor="middle"
        className="tw-fill-iron-50 tw-text-[13px] tw-font-semibold"
      >
        {t(locale, "network.tdh.impl.web.vectors")}
      </text>
    </svg>
  );
}
