import {
  ArrowDownIcon,
  ArrowRightIcon,
  ArrowUpIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useId } from "react";
import type { SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import { TDH_FOCUS_RING } from "../shared/tdhStyles";

const NODE = `tw-flex tw-h-full tw-min-h-11 tw-items-center tw-gap-2 xl:tw-h-14 tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-iron-900 tw-px-3 tw-py-2 tw-text-[13px] tw-leading-5 tw-text-iron-100 tw-no-underline tw-transition-colors hover:tw-border-primary-400/60 motion-reduce:tw-transition-none ${TDH_FOCUS_RING}`;

function MapNode({
  locale,
  section,
  dashed = false,
}: {
  readonly locale: SupportedLocale;
  readonly section: number;
  readonly dashed?: boolean;
}) {
  return (
    <Link
      href={`#s${section}`}
      className={`${NODE} ${dashed ? "tw-border-dashed tw-border-iron-500 tw-text-iron-200" : ""}`}
    >
      <span className="tw-font-mono tw-text-xs tw-text-iron-400">
        §{section}
      </span>
      <span>{t(locale, `network.tdh.spec.map.s${section}` as MessageKey)}</span>
    </Link>
  );
}

function Across() {
  return (
    <span
      aria-hidden="true"
      className="tw-flex tw-items-center tw-justify-center tw-text-iron-400"
    >
      <ArrowDownIcon className="tw-size-4 xl:tw-hidden" />
      <ArrowRightIcon className="tw-hidden tw-size-4 xl:tw-block" />
    </span>
  );
}

/** An arrow from the parameters up into a section, from `xl`. */
function Up() {
  return (
    <span
      aria-hidden="true"
      className="tw-hidden tw-justify-center tw-text-iron-500 xl:tw-flex"
    >
      <ArrowUpIcon className="tw-size-4" />
    </span>
  );
}

/**
 * Diagram 1: how the sections of P26 feed each other, as a flow. Inputs to
 * the snapshot, which comes from the finalized chain (§4.2), then the
 * canonical events, the logs in blocks up to it (§3.1); eligibility and
 * identities side by side; then holdings, scores and the output. From `xl`,
 * the parameters (§10) sit on a bus line under §2 to §8, with an arrow up
 * into each of them, as the label says; every node is the same height. Each
 * box links to its section.
 */
export function SectionMap({ locale }: { readonly locale: SupportedLocale }) {
  return (
    <figure className="tw-m-0">
      <figcaption className="tw-mb-3 tw-text-xs tw-font-medium tw-uppercase tw-tracking-wide tw-text-iron-400">
        {t(locale, "network.tdh.spec.mapTitle")}
      </figcaption>
      <p className="tw-sr-only">{t(locale, "network.tdh.spec.mapDesc")}</p>
      <div className="tw-grid tw-max-w-md tw-gap-2 xl:tw-max-w-none xl:tw-grid-cols-[minmax(0,1fr)_1rem_minmax(0,1fr)_1rem_minmax(0,1fr)_1rem_minmax(0,1.3fr)_1rem_minmax(0,1fr)_1rem_minmax(0,1fr)_1rem_minmax(0,1fr)] xl:tw-items-center xl:tw-gap-x-1.5 xl:tw-gap-y-1.5">
        <MapNode locale={locale} section={2} />
        <Across />
        <MapNode locale={locale} section={4} />
        <Across />
        <MapNode locale={locale} section={3} />
        <Across />
        <div className="tw-grid tw-grid-cols-1 tw-gap-2 min-[400px]:tw-grid-cols-2 xl:tw-grid-cols-1">
          <MapNode locale={locale} section={5} />
          <MapNode locale={locale} section={6} />
        </div>
        <Across />
        <MapNode locale={locale} section={7} />
        <Across />
        <MapNode locale={locale} section={8} />
        <Across />
        <MapNode locale={locale} section={9} />
        <span className="tw-hidden xl:tw-col-start-1 xl:tw-row-start-2 xl:tw-block">
          <Up />
        </span>
        <span className="tw-hidden xl:tw-col-start-3 xl:tw-row-start-2 xl:tw-block">
          <Up />
        </span>
        <span className="tw-hidden xl:tw-col-start-5 xl:tw-row-start-2 xl:tw-block">
          <Up />
        </span>
        <span className="tw-hidden xl:tw-col-start-7 xl:tw-row-start-2 xl:tw-block">
          <Up />
        </span>
        <span className="tw-hidden xl:tw-col-start-9 xl:tw-row-start-2 xl:tw-block">
          <Up />
        </span>
        <span className="tw-hidden xl:tw-col-start-11 xl:tw-row-start-2 xl:tw-block">
          <Up />
        </span>
        {/* The bus: one line under §2 to §8, which §10 feeds. */}
        <div className="tw-mt-2 tw-flex tw-flex-wrap tw-items-center tw-gap-2 xl:tw-col-start-1 xl:tw-col-end-12 xl:tw-row-start-3 xl:tw-mt-0 xl:tw-flex-nowrap xl:tw-justify-center xl:tw-border-0 xl:tw-border-t xl:tw-border-solid xl:tw-border-iron-500 xl:tw-pt-2">
          <MapNode locale={locale} section={10} dashed />
          <span className="tw-text-sm tw-text-iron-400">
            {t(locale, "network.tdh.spec.mapFeeds")}
          </span>
        </div>
      </div>
    </figure>
  );
}

const TRANSITIONS = ["t1", "t2", "t3", "t4", "t5", "t6"] as const;

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
    <figure className="tw-m-0">
      <ol className="tw-m-0 tw-list-none tw-space-y-2 tw-p-0 md:tw-hidden">
        {TRANSITIONS.map((key) => (
          <li
            key={key}
            className="tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.07] tw-bg-iron-900 tw-px-3 tw-py-2 tw-text-sm tw-leading-6 tw-text-iron-200"
          >
            {t(locale, `network.tdh.spec.s6-2.${key}` as MessageKey)}
          </li>
        ))}
      </ol>
      <svg
        viewBox="0 0 600 152"
        role="img"
        aria-labelledby={`${id}-title ${id}-desc`}
        className="tw-hidden tw-h-auto tw-w-full tw-max-w-2xl md:tw-block"
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
          className="tw-fill-iron-300 tw-font-mono tw-text-[13px]"
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
          className="tw-fill-iron-300 tw-font-mono tw-text-[13px]"
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
          className="tw-fill-iron-300 tw-font-mono tw-text-[13px]"
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
          className="tw-fill-iron-300 tw-font-mono tw-text-[13px]"
        >
          REVOKE
        </text>
        <text
          x="407"
          y="144"
          textAnchor="middle"
          className="tw-fill-iron-400 tw-text-[13px]"
        >
          {t(locale, "network.tdh.spec.s6-2.revokeTo")}
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
          className="tw-fill-iron-400 tw-font-mono tw-text-[13px]"
        >
          REGISTER · new time
        </text>
      </svg>
    </figure>
  );
}
