import { Fragment } from "react";
import { ArrowRightIcon, CheckIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

import type { SupportedLocale } from "@/i18n/locales";

import {
  TIMELINE_ITEM_SPECS,
  type JoinLinks,
  type TimelineItemSpec,
  type TimelineStepId,
} from "./page.content";
import type { StepStatus, TimelineProgress } from "./page.types";
import {
  cx,
  m,
  resolveHref,
  SECTION_EYEBROW_CLASS,
  SECTION_HEADING_CLASS,
} from "./page.utils";

const STATUS_LABEL_KEYS = {
  complete: "join6529.progress.done",
  current: "join6529.progress.current",
  pending: "join6529.progress.pending",
} as const;

const STATUS_BADGE_CLASS: Readonly<Record<StepStatus, string>> = {
  complete: "tw-border-[#34d399]/35 tw-bg-[#34d399]/[0.14] tw-text-[#34d399]",
  current: "tw-border-[#60a5fa]/40 tw-bg-[#60a5fa]/[0.16] tw-text-[#60a5fa]",
  pending: "tw-border-white/[0.12] tw-bg-white/[0.06] tw-text-white/[0.45]",
};

const STATUS_MARKER_CLASS: Readonly<Record<StepStatus, string>> = {
  ...STATUS_BADGE_CLASS,
  current: `${STATUS_BADGE_CLASS.current} tw-shadow-[0_0_20px_rgba(96,165,250,0.16)]`,
};

const NEUTRAL_MARKER_CLASS =
  "tw-border-white/10 tw-text-white/50 group-hover:tw-border-white/30 group-hover:tw-text-white";

const DEFAULT_MARKER_CLASS: Readonly<Record<TimelineStepId, string>> = {
  wallet: NEUTRAL_MARKER_CLASS,
  profile: NEUTRAL_MARKER_CLASS,
  waves:
    "tw-border-white/10 tw-text-[#7000ff] group-hover:tw-border-[#7000ff]/50",
  message: NEUTRAL_MARKER_CLASS,
  collect: NEUTRAL_MARKER_CLASS,
  subscribe:
    "tw-border-[#00f0ff]/30 tw-bg-[#00f0ff]/10 tw-text-[#00f0ff] tw-shadow-[0_0_20px_rgba(0,240,255,0.15)]",
};

export function JourneyTimelineSection({
  links,
  locale,
  timelineProgress,
}: {
  readonly links: JoinLinks;
  readonly locale: SupportedLocale;
  readonly timelineProgress: TimelineProgress;
}) {
  return (
    <section
      className="tw-mx-auto tw-w-full tw-max-w-4xl tw-py-8 md:tw-py-10"
      id="journey"
    >
      <div
        className={cx(
          "tw-text-center",
          timelineProgress.visible ? "tw-mb-0" : "tw-mb-6 md:tw-mb-8"
        )}
      >
        <span className={cx("tw-mb-4 tw-block", SECTION_EYEBROW_CLASS)}>
          {m(locale, "join6529.joining.eyebrow")}
        </span>
        <h2 className={SECTION_HEADING_CLASS}>
          {m(locale, "join6529.joining.heading")}
        </h2>
      </div>
      {timelineProgress.visible && (
        <TimelineProgressStrip locale={locale} progress={timelineProgress} />
      )}
      <div className="tw-relative">
        <div
          aria-hidden="true"
          className="tw-absolute tw-bottom-0 tw-left-6 tw-top-6 tw-w-px tw-bg-gradient-to-b tw-from-white/20 tw-to-white/[0.02] md:tw-left-1/2 md:-tw-translate-x-1/2"
        />
        {TIMELINE_ITEM_SPECS.map((item, index) => (
          <Fragment key={item.id}>
            {index === 3 && (
              <TimelineGroupLabel
                label={m(locale, "join6529.joining.optional")}
              />
            )}
            <TimelineRow
              index={index}
              item={item}
              links={links}
              locale={locale}
              showStatusBadge={timelineProgress.visible}
              status={timelineProgress.statuses[item.id]}
            />
          </Fragment>
        ))}
      </div>
    </section>
  );
}

function TimelineProgressStrip({
  locale,
  progress,
}: {
  readonly locale: SupportedLocale;
  readonly progress: TimelineProgress;
}) {
  return (
    <div
      aria-label={m(locale, "join6529.progress.ariaLabel")}
      className="tw-mx-auto tw-mb-6 tw-mt-4 tw-w-full tw-max-w-[520px]"
    >
      <div className="tw-flex tw-items-center tw-justify-between tw-gap-4">
        <p className="tw-mb-0 tw-text-xs tw-font-medium tw-text-white/[0.55]">
          {m(locale, "join6529.progress.label")}
        </p>
        <p className="tw-mb-0 tw-text-xs tw-font-medium tw-text-white/[0.55]">
          {m(locale, "join6529.progress.value", {
            completed: progress.completed,
            total: progress.total,
          })}
        </p>
      </div>
      <div
        aria-valuemax={progress.total}
        aria-valuemin={0}
        aria-valuenow={progress.completed}
        aria-valuetext={m(locale, "join6529.progress.ariaValue", {
          completed: progress.completed,
          total: progress.total,
        })}
        className="tw-mt-3 tw-h-[6px] tw-overflow-hidden tw-rounded-full tw-bg-white/10"
        role="progressbar"
      >
        <div
          className="tw-h-full tw-rounded-full tw-bg-gradient-to-r tw-from-[#34d399] tw-to-[#60a5fa]"
          style={{ width: `${progress.percent}%` }}
        />
      </div>
    </div>
  );
}

function TimelineGroupLabel({ label }: { readonly label: string }) {
  return (
    <div className="tw-relative tw-z-10 tw-mb-3 tw-flex tw-justify-start md:tw-justify-center">
      <span className="tw-ml-16 tw-rounded-full tw-border tw-border-solid tw-border-white/10 tw-bg-[#030303] tw-px-3 tw-py-1 tw-text-[11px] tw-font-medium tw-uppercase tw-tracking-[0.16em] tw-text-white/[0.42] md:tw-ml-0">
        {label}
      </span>
    </div>
  );
}

function TimelineRow({
  index,
  item,
  links,
  locale,
  showStatusBadge,
  status,
}: {
  readonly index: number;
  readonly item: TimelineItemSpec;
  readonly links: JoinLinks;
  readonly locale: SupportedLocale;
  readonly showStatusBadge: boolean;
  readonly status: StepStatus;
}) {
  const isLeftAligned = index % 2 === 0;
  const actionHref =
    item.href !== undefined ? resolveHref(item.href, links) : undefined;
  const actionLabel =
    item.actionLabelKey !== undefined
      ? m(locale, item.actionLabelKey)
      : undefined;

  return (
    <article
      aria-current={status === "current" ? "step" : undefined}
      className="tw-group tw-relative tw-mb-6 tw-grid tw-gap-3 last:tw-mb-0 md:tw-mb-8 md:tw-grid-cols-2 md:tw-items-center"
    >
      <div
        className={cx(
          "tw-pl-16 md:tw-pl-0",
          isLeftAligned
            ? "md:tw-pr-10 md:tw-text-right"
            : "md:tw-order-2 md:tw-pl-10"
        )}
      >
        <div
          className={cx(
            "-tw-mt-1 tw-flex tw-flex-wrap tw-items-center tw-gap-x-3 tw-gap-y-2",
            isLeftAligned ? "md:tw-justify-end" : "md:tw-justify-start"
          )}
        >
          <h3 className="tw-mb-0 tw-text-lg tw-font-semibold tw-leading-tight tw-text-white/90">
            {m(locale, item.titleKey)}
          </h3>
          {showStatusBadge && <StatusBadge locale={locale} status={status} />}
        </div>
        <p className="tw-mt-1.5 tw-text-[15px] tw-font-light tw-leading-6 tw-text-white/40">
          {m(locale, item.bodyKey)}
        </p>
        {actionHref && actionLabel && (
          <Link
            className={cx(
              "tw-mt-3 tw-inline-flex tw-cursor-pointer tw-items-center tw-gap-2 tw-text-xs tw-font-medium tw-no-underline tw-transition-colors hover:tw-no-underline focus:tw-no-underline focus:tw-outline-none focus:tw-ring-2",
              item.id === "subscribe"
                ? "tw-rounded-lg tw-bg-white tw-px-5 tw-py-2.5 tw-font-medium tw-text-black hover:tw-bg-gray-200 hover:tw-text-black focus:tw-ring-white/70"
                : "tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-white/20 tw-pb-1 tw-text-white/70 hover:tw-border-white/40 hover:tw-text-white focus:tw-ring-white/20"
            )}
            href={actionHref}
          >
            <span>{actionLabel}</span>
            <ArrowRightIcon aria-hidden="true" className="tw-h-2.5 tw-w-2.5" />
          </Link>
        )}
      </div>
      <div
        aria-hidden="true"
        className={cx(
          !isLeftAligned && "md:tw-order-1",
          "tw-hidden md:tw-block"
        )}
      />
      <div
        className={cx(
          "tw-absolute tw-left-0 tw-top-0 tw-z-10 tw-flex tw-h-12 tw-w-12 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-bg-[#030303] tw-text-sm tw-font-medium tw-transition md:tw-left-1/2 md:-tw-translate-x-1/2",
          getMarkerClass(item.id, status, showStatusBadge)
        )}
      >
        {showStatusBadge && status === "complete" ? (
          <CheckIcon aria-hidden="true" className="tw-h-5 tw-w-5" />
        ) : (
          String(index + 1).padStart(2, "0")
        )}
      </div>
    </article>
  );
}

function StatusBadge({
  locale,
  status,
}: {
  readonly locale: SupportedLocale;
  readonly status: StepStatus;
}) {
  return (
    <span
      className={cx(
        "tw-inline-flex tw-h-6 tw-shrink-0 tw-items-center tw-gap-1.5 tw-self-center tw-rounded-full tw-border tw-border-solid tw-px-[10px] tw-align-middle tw-text-[11px] tw-font-semibold tw-uppercase tw-leading-none tw-tracking-[0.04em]",
        STATUS_BADGE_CLASS[status]
      )}
    >
      {status === "complete" && (
        <CheckIcon aria-hidden="true" className="tw-h-3 tw-w-3" />
      )}
      {m(locale, STATUS_LABEL_KEYS[status])}
    </span>
  );
}

function getMarkerClass(
  id: TimelineStepId,
  status: StepStatus,
  showStatusBadge: boolean
) {
  if (showStatusBadge) {
    return STATUS_MARKER_CLASS[status];
  }

  return DEFAULT_MARKER_CLASS[id];
}
