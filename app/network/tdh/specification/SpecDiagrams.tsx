import Link from "next/link";
import { useId } from "react";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { TDH_FOCUS_RING } from "../shared/tdhStyles";

const MAP_NODES = [
  { id: "s2", n: "2" },
  { id: "s3", n: "3" },
  { id: "s4", n: "4" },
  { id: "s5", n: "5" },
  { id: "s6", n: "6" },
  { id: "s7", n: "7" },
  { id: "s8", n: "8" },
  { id: "s9", n: "9" },
] as const;

const NODE = `tw-flex tw-min-h-11 tw-items-center tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-iron-900 tw-px-3 tw-py-2 tw-text-sm tw-text-iron-100 tw-no-underline tw-transition-colors hover:tw-border-primary-400/60 motion-reduce:tw-transition-none ${TDH_FOCUS_RING}`;

/** Diagram 1: how the sections of P26 feed each other; each box links to its section. */
export function SectionMap({
  locale,
  titles,
}: {
  readonly locale: SupportedLocale;
  readonly titles: Readonly<Record<string, string>>;
}) {
  const node = (id: string) => (
    <Link href={`#${id}`} className={NODE}>
      {titles[id]}
    </Link>
  );
  return (
    <figure className="tw-m-0">
      <figcaption className="tw-mb-3 tw-text-xs tw-font-medium tw-uppercase tw-tracking-wide tw-text-iron-500">
        {t(locale, "network.tdh.spec.mapTitle")}
      </figcaption>
      <p className="tw-sr-only">{t(locale, "network.tdh.spec.mapDesc")}</p>
      <div className="tw-grid tw-gap-2 md:tw-grid-cols-[repeat(4,minmax(0,1fr))]">
        <div className="tw-flex tw-flex-col tw-gap-2">
          {node("s2")}
          {node("s3")}
          {node("s4")}
        </div>
        <div className="tw-flex tw-flex-col tw-gap-2">
          {node("s5")}
          {node("s6")}
        </div>
        <div className="tw-flex tw-flex-col tw-gap-2">
          {node("s7")}
          {node("s8")}
        </div>
        <div className="tw-flex tw-flex-col tw-gap-2">
          {node("s9")}
          <Link
            href="#s10"
            className={`${NODE} tw-border-dashed tw-text-iron-300`}
          >
            {titles["s10"]}
          </Link>
        </div>
      </div>
      <ol
        aria-hidden="true"
        className="tw-m-0 tw-mt-2 tw-hidden tw-list-none tw-gap-2 tw-p-0 tw-text-[11px] tw-text-iron-500 md:tw-flex"
      >
        {MAP_NODES.map((item, index) => (
          <li key={item.id}>
            {index > 0 && "→ "}§{item.n}
          </li>
        ))}
        <li className="tw-ml-auto">§10 → §5–§8</li>
      </ol>
    </figure>
  );
}

/** Diagram 2: the pair state machine of P26 §6.2. */
export function PairStateMachine({
  locale,
}: {
  readonly locale: SupportedLocale;
}) {
  const id = useId();
  const box = (x: number, label: string, tone: string) => (
    <g>
      <rect
        x={x}
        y="60"
        width="150"
        height="48"
        rx="24"
        className={tone}
        strokeWidth="1.5"
      />
      <text
        x={x + 75}
        y="89"
        textAnchor="middle"
        className="tw-fill-iron-50 tw-text-[13px] tw-font-medium"
      >
        {label}
      </text>
    </g>
  );
  const arrowId = `${id}-arrow`;
  return (
    <svg
      viewBox="0 0 600 140"
      role="img"
      aria-labelledby={`${id}-title ${id}-desc`}
      className="tw-block tw-h-auto tw-w-full tw-max-w-2xl"
    >
      <title id={`${id}-title`}>
        {t(locale, "network.tdh.spec.s6-2.machineTitle")}
      </title>
      <desc id={`${id}-desc`}>
        {t(locale, "network.tdh.spec.s6-2.machineDesc")}
      </desc>
      <defs>
        <marker
          id={arrowId}
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M0,0 L10,5 L0,10 z" className="tw-fill-iron-300" />
        </marker>
      </defs>
      {box(
        10,
        t(locale, "network.tdh.spec.s6-2.none"),
        "tw-fill-iron-900 tw-stroke-iron-600"
      )}
      {box(
        225,
        t(locale, "network.tdh.spec.s6-2.pending"),
        "tw-fill-amber-400/10 tw-stroke-amber-300/60"
      )}
      {box(
        440,
        t(locale, "network.tdh.spec.s6-2.confirmed"),
        "tw-fill-success/10 tw-stroke-success/70"
      )}
      <path
        d="M160 74 L 223 74"
        className="tw-stroke-iron-300"
        strokeWidth="1.5"
        markerEnd={`url(#${arrowId})`}
        fill="none"
      />
      <text
        x="192"
        y="52"
        textAnchor="middle"
        className="tw-fill-iron-300 tw-font-mono tw-text-[11px]"
      >
        REGISTER(a,b)
      </text>
      <path
        d="M223 96 L 162 96"
        className="tw-stroke-iron-500"
        strokeWidth="1.5"
        markerEnd={`url(#${arrowId})`}
        fill="none"
      />
      <text
        x="192"
        y="126"
        textAnchor="middle"
        className="tw-fill-iron-400 tw-font-mono tw-text-[11px]"
      >
        REVOKE(a,b)
      </text>
      <path
        d="M375 74 L 438 74"
        className="tw-stroke-iron-300"
        strokeWidth="1.5"
        markerEnd={`url(#${arrowId})`}
        fill="none"
      />
      <text
        x="407"
        y="52"
        textAnchor="middle"
        className="tw-fill-iron-300 tw-font-mono tw-text-[11px]"
      >
        REGISTER(b,a)
      </text>
      <path
        d="M438 96 L 377 96"
        className="tw-stroke-iron-500"
        strokeWidth="1.5"
        markerEnd={`url(#${arrowId})`}
        fill="none"
      />
      <text
        x="407"
        y="126"
        textAnchor="middle"
        className="tw-fill-iron-400 tw-font-mono tw-text-[11px]"
      >
        REVOKE
      </text>
      <path
        d="M490 60 C 490 18, 560 18, 560 58"
        className="tw-stroke-iron-600"
        strokeDasharray="4 4"
        strokeWidth="1.2"
        fill="none"
        markerEnd={`url(#${arrowId})`}
      />
      <text
        x="525"
        y="14"
        textAnchor="middle"
        className="tw-fill-iron-500 tw-font-mono tw-text-[11px]"
      >
        REGISTER · refresh
      </text>
    </svg>
  );
}
