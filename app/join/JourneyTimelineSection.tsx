import { Fragment } from "react";
import {
  ArrowRightIcon,
  CheckIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";

import WavesIcon from "@/components/common/icons/WavesIcon";
import type { SupportedLocale } from "@/i18n/locales";

import {
  getTimelineStepDomId,
  OPTIONAL_TIMELINE_START_ID,
  TIMELINE_ITEM_SPECS,
  type JoinLinks,
  type Join6529MessageKey,
  type TimelineItemSpec,
  type TimelineStepId,
} from "./page.content";
import type { JoinPageState, StepStatus, TimelineProgress } from "./page.types";
import {
  cx,
  m,
  resolveHref,
  SECTION_EYEBROW_CLASS,
  SECTION_HEADING_CLASS,
  TERTIARY_ACTION_CLASS,
  TERTIARY_ACTION_LABEL_CLASS,
} from "./page.utils";

const STATUS_LABEL_KEYS = {
  complete: "join6529.progress.done",
  current: "join6529.progress.current",
  pending: "join6529.progress.pending",
} as const;

const STATUS_BADGE_CLASS: Readonly<Record<StepStatus, string>> = {
  complete: "tw-border-[#34d399]/35 tw-bg-[#34d399]/[0.14] tw-text-[#34d399]",
  current: "tw-border-white/25 tw-bg-white/[0.08] tw-text-iron-100",
  pending: "tw-border-white/[0.12] tw-bg-white/[0.06] tw-text-iron-500",
};

const STATUS_MARKER_CLASS: Readonly<Record<StepStatus, string>> = {
  complete: "tw-border-[#34d399]/55 tw-bg-[#03140d] tw-text-[#34d399]",
  current:
    "tw-border-white/35 tw-bg-[#101012] tw-text-iron-50 tw-shadow-[0_0_0_6px_#030303,0_0_24px_rgba(255,255,255,0.1)]",
  pending: "tw-border-white/10 tw-bg-[#030303] tw-text-iron-500",
};

const NEUTRAL_MARKER_CLASS =
  "tw-border-white/10 tw-text-iron-500 tw-transition-[border-color,color,box-shadow] tw-duration-200 group-focus-within:tw-border-primary-400/50 group-focus-within:tw-text-primary-300 group-focus-within:tw-shadow-[0_0_0_6px_#030303,0_0_20px_rgba(132,173,255,0.2)] desktop-hover:group-hover:tw-border-primary-400/50 desktop-hover:group-hover:tw-text-primary-300 desktop-hover:group-hover:tw-shadow-[0_0_0_6px_#030303,0_0_20px_rgba(132,173,255,0.2)] motion-reduce:tw-transition-none";

const JOURNEY_HEADER_KEYS: Readonly<
  Record<
    JoinPageState,
    {
      readonly eyebrowKey: Join6529MessageKey;
      readonly headingKey: Join6529MessageKey;
    }
  >
> = {
  loggedOut: {
    eyebrowKey: "join6529.joining.loggedOut.eyebrow",
    headingKey: "join6529.joining.loggedOut.heading",
  },
  inProgress: {
    eyebrowKey: "join6529.joining.inProgress.eyebrow",
    headingKey: "join6529.joining.inProgress.heading",
  },
  loggedIn: {
    eyebrowKey: "join6529.joining.loggedIn.eyebrow",
    headingKey: "join6529.joining.loggedIn.heading",
  },
};

export function JourneyTimelineSection({
  links,
  locale,
  pageState,
  timelineProgress,
}: {
  readonly links: JoinLinks;
  readonly locale: SupportedLocale;
  readonly pageState: JoinPageState;
  readonly timelineProgress: TimelineProgress;
}) {
  const headerKeys = JOURNEY_HEADER_KEYS[pageState];

  return (
    <section
      className={cx(
        "tw-mx-auto tw-w-full tw-max-w-5xl tw-bg-[radial-gradient(ellipse_at_50%_38%,rgba(72,117,255,0.08)_0%,rgba(49,46,129,0.025)_42%,transparent_72%)] tw-bg-no-repeat tw-px-4 tw-pb-12 md:tw-px-6 lg:tw-px-8",
        timelineProgress.visible
          ? "tw-pt-8 md:tw-pb-16 md:tw-pt-10"
          : "tw-pt-12 md:tw-py-16"
      )}
      id="journey"
    >
      {timelineProgress.visible ? (
        <TimelineProgressStrip
          className="tw-mx-auto tw-mb-10 md:tw-mb-12"
          locale={locale}
          progress={timelineProgress}
        />
      ) : (
        <div className="tw-mb-6 tw-text-center md:tw-mb-8">
          <span className={cx("tw-mb-4 tw-block", SECTION_EYEBROW_CLASS)}>
            {m(locale, headerKeys.eyebrowKey)}
          </span>
          <h2 className={SECTION_HEADING_CLASS}>
            {m(locale, headerKeys.headingKey)}
          </h2>
        </div>
      )}
      <div className="tw-relative">
        <div
          aria-hidden="true"
          className="tw-absolute tw-bottom-0 tw-left-6 tw-top-6 tw-z-0 tw-w-px tw-bg-gradient-to-b tw-from-white/20 tw-to-white/[0.02] md:tw-left-1/2 md:-tw-translate-x-1/2"
        />
        {TIMELINE_ITEM_SPECS.map((item, index) => (
          <Fragment key={item.id}>
            {item.id === OPTIONAL_TIMELINE_START_ID && (
              <TimelineGroupLabel
                label={m(locale, "join6529.joining.afterStart")}
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
  className,
  locale,
  progress,
}: {
  readonly className?: string;
  readonly locale: SupportedLocale;
  readonly progress: TimelineProgress;
}) {
  return (
    <div
      aria-label={m(locale, "join6529.progress.ariaLabel")}
      className={cx("tw-w-full tw-max-w-[520px]", className)}
    >
      <div className="tw-flex tw-items-center tw-justify-between tw-gap-4">
        <p className={cx("tw-mb-0", SECTION_EYEBROW_CLASS)}>
          {m(locale, "join6529.progress.label")}
        </p>
        <p className={cx("tw-mb-0", SECTION_EYEBROW_CLASS)}>
          {m(locale, "join6529.progress.value", {
            completed: progress.completed,
            total: progress.total,
          })}
        </p>
      </div>
      <progress
        aria-label={m(locale, "join6529.progress.ariaLabel")}
        aria-valuetext={m(locale, "join6529.progress.ariaValue", {
          completed: progress.completed,
          total: progress.total,
        })}
        className="tw-sr-only"
        max={progress.total}
        value={progress.completed}
      />
      <div
        aria-hidden="true"
        className="tw-mt-3 tw-h-[6px] tw-overflow-hidden tw-rounded-full tw-bg-white/10"
      >
        <div
          className="tw-h-full tw-rounded-full tw-bg-gradient-to-r tw-from-[#34d399] tw-to-[#86efac]"
          style={{ width: `${progress.percent}%` }}
        />
      </div>
    </div>
  );
}

function TimelineGroupLabel({ label }: { readonly label: string }) {
  return (
    <div className="tw-relative tw-z-10 tw-mb-3 tw-flex tw-justify-start md:tw-justify-center">
      <span className="tw-ml-16 tw-rounded-full tw-border tw-border-solid tw-border-white/10 tw-bg-[#030303] tw-px-3 tw-py-1 tw-text-[11px] tw-font-medium tw-uppercase tw-tracking-[0.16em] tw-text-iron-400 md:tw-ml-0">
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
  const isRightAligned = index % 2 === 1;
  const actionHref =
    item.href === undefined ? undefined : resolveHref(item.href, links);
  const actionLabel =
    item.actionLabelKey === undefined
      ? undefined
      : m(locale, item.actionLabelKey);
  const hasTimelineIcon =
    item.id === "wallet" || item.id === "profile" || item.id === "waves";

  return (
    <article
      aria-current={status === "current" ? "step" : undefined}
      className="tw-group tw-relative tw-mb-8 tw-grid tw-gap-3 last:tw-mb-0 md:tw-mb-12 md:tw-grid-cols-2 md:tw-items-center"
      id={getTimelineStepDomId(item.id)}
    >
      <div
        className={cx(
          "tw-pl-16 tw-pt-3 md:tw-pl-0",
          isLeftAligned
            ? "md:tw-pr-10 md:tw-text-right"
            : "md:tw-order-2 md:tw-pl-10"
        )}
      >
        <div
          className={cx(
            "tw-flex tw-flex-wrap tw-items-center tw-gap-x-3 tw-gap-y-2",
            isLeftAligned ? "md:tw-justify-end" : "md:tw-justify-start"
          )}
        >
          <h3 className="tw-m-0 tw-flex tw-min-h-6 tw-items-center tw-text-lg tw-font-semibold tw-leading-6 tw-text-iron-50">
            {m(locale, item.titleKey)}
          </h3>
          {showStatusBadge && <StatusBadge locale={locale} status={status} />}
        </div>
        <p className="tw-mt-1.5 tw-text-pretty tw-text-[15px] tw-font-normal tw-leading-6 tw-text-iron-400">
          {m(locale, item.bodyKey)}
        </p>
        {actionHref && actionLabel && (
          <Link
            className={cx("tw-mt-3", TERTIARY_ACTION_CLASS)}
            href={actionHref}
          >
            <span className={TERTIARY_ACTION_LABEL_CLASS}>{actionLabel}</span>
            <ArrowRightIcon aria-hidden="true" className="tw-h-2.5 tw-w-2.5" />
          </Link>
        )}
      </div>
      <div
        aria-hidden="true"
        className={cx(
          isRightAligned && "md:tw-order-1",
          "tw-hidden md:tw-flex md:tw-h-12 md:tw-items-center md:tw-self-start",
          isLeftAligned ? "md:tw-pl-10" : "md:tw-justify-end md:tw-pr-10"
        )}
      >
        {hasTimelineIcon && (
          <div className="tw-relative tw-flex tw-size-16 tw-items-center tw-justify-center">
            <span className="tw-absolute tw-inset-0 tw-rounded-full tw-bg-[radial-gradient(circle,rgba(132,173,255,0.18)_0%,rgba(86,132,255,0.08)_40%,transparent_72%)] tw-opacity-0 tw-transition-opacity tw-duration-200 group-focus-within:tw-opacity-100 desktop-hover:group-hover:tw-opacity-100 motion-reduce:tw-transition-none" />
            <TimelineStepIcon
              className="tw-relative tw-z-10 tw-size-12 tw-text-iron-800 tw-transition-colors tw-duration-200 group-focus-within:tw-text-primary-300 desktop-hover:group-hover:tw-text-primary-300 motion-reduce:tw-transition-none"
              stepId={item.id}
            />
          </div>
        )}
      </div>
      <div
        aria-hidden="true"
        className={cx(
          "tw-absolute tw-left-0 tw-top-0 tw-z-20 tw-flex tw-h-12 tw-w-12 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-bg-[#030303] tw-text-sm tw-font-medium tw-shadow-[0_0_0_6px_#030303] tw-transition md:tw-left-1/2 md:-tw-translate-x-1/2",
          getMarkerClass(status, showStatusBadge)
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

function TimelineStepIcon({
  className,
  stepId,
}: {
  readonly className: string;
  readonly stepId: TimelineStepId;
}) {
  if (stepId === "wallet") {
    return <WalletOutlineIcon className={className} />;
  }

  if (stepId === "profile") {
    return <UserIcon aria-hidden="true" className={className} />;
  }

  if (stepId === "waves") {
    return (
      <span aria-hidden="true" className={className}>
        <WavesIcon className="tw-size-full" />
      </span>
    );
  }

  return null;
}

function WalletOutlineIcon({ className }: { readonly className: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <path
        d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
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
        "tw-inline-flex tw-h-6 tw-shrink-0 tw-items-center tw-gap-1.5 tw-self-center tw-rounded-full tw-border tw-border-solid tw-px-[10px] tw-align-middle tw-text-[11px] tw-font-semibold tw-uppercase tw-leading-6 tw-tracking-[0.04em]",
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

function getMarkerClass(status: StepStatus, showStatusBadge: boolean) {
  return !showStatusBadge || status === "pending"
    ? NEUTRAL_MARKER_CLASS
    : STATUS_MARKER_CLASS[status];
}
