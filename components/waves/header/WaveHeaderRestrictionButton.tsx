"use client";

import clsx from "clsx";
import { Suspense, useId, useState, type ReactNode } from "react";
import HoverCard from "@/components/utils/tooltip/HoverCard";
import type { ApiWave } from "@/generated/models/ApiWave";
import { getWaveSubmissionClosure } from "@/helpers/waves/submission-closure";
import { Time } from "@/helpers/time";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { useVisibleInterval } from "@/hooks/usePageVisibility";
import { formatDate } from "@/i18n/format";
import { t } from "@/i18n/messages";
import WaveSubmissionAccessDetails from "../WaveSubmissionAccessDetails";
import { COMPACT_ACTION_TOUCH_TARGET_CLASS } from "@/components/utils/button/compactActionButtonStyles";

export const WAVE_HEADER_RESTRICTION_SURFACE_CLASS =
  "tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-950 tw-p-0 tw-text-iron-200 tw-shadow-sm tw-shadow-black/20 desktop-hover:hover:tw-border-iron-600 desktop-hover:hover:tw-bg-iron-900 desktop-hover:hover:tw-text-white active:tw-bg-black motion-reduce:tw-transition-none";

export const WAVE_HEADER_RESTRICTION_BUTTON_CLASS = `${COMPACT_ACTION_TOUCH_TARGET_CLASS} ${WAVE_HEADER_RESTRICTION_SURFACE_CLASS} tw-h-8 tw-w-8 tw-min-w-8`;

interface WaveHeaderRestrictionButtonProps {
  readonly label: string;
  readonly reason: string;
  readonly accessWave?: ApiWave | undefined;
  readonly onViewRules?: (() => void) | undefined;
  readonly children: ReactNode;
  readonly className?: string | undefined;
  readonly "data-testid"?: string | undefined;
  readonly "data-full-width"?: string | undefined;
}

/** Explain a locked action on demand, with optional safe submission details. */
export default function WaveHeaderRestrictionButton({
  label,
  reason,
  accessWave,
  onViewRules,
  children,
  className,
  "data-testid": testId,
  "data-full-width": fullWidth,
}: WaveHeaderRestrictionButtonProps) {
  const reasonId = useId();
  const locale = useBrowserLocale();
  const [now, setNow] = useState(() => Time.currentMillis());
  const closure = accessWave ? getWaveSubmissionClosure(accessWave, now) : null;
  useVisibleInterval(
    () => setNow(Time.currentMillis()),
    accessWave && !closure ? 1000 : null
  );
  const displayedReason = closure
    ? t(locale, "waves.dropEligibility.ended")
    : reason;

  return (
    <HoverCard
      ariaLabel={label}
      content={
        <div className="tw-w-[min(82vw,18rem)] tw-whitespace-normal tw-break-words tw-p-1">
          <p className="tw-m-0 tw-text-xs tw-font-medium tw-leading-4 tw-text-iron-400">
            {label}
          </p>
          <p className="tw-mb-0 tw-mt-2 tw-text-base tw-font-semibold tw-leading-6 tw-text-iron-100">
            {displayedReason}
          </p>
          {typeof closure?.closedAt === "number" && (
            <p className="tw-mb-0 tw-mt-1 tw-text-sm tw-leading-5 tw-text-iron-400">
              {t(locale, "waves.access.closedOn", {
                date: formatDate(locale, closure.closedAt, {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                }),
              })}
            </p>
          )}
          {accessWave && (
            <div className="tw-mt-3">
              <Suspense fallback={null}>
                <WaveSubmissionAccessDetails
                  wave={accessWave}
                  onViewRules={onViewRules}
                  isClosed={closure !== null}
                />
              </Suspense>
            </div>
          )}
        </div>
      }
      placement="auto"
      delayShow={150}
      delayHide={0}
      offset={10}
      openOnClick={true}
      focusOnKeyboardActivation
      triggerDisplay="inline-flex"
    >
      <button
        type="button"
        aria-label={label}
        aria-describedby={reasonId}
        aria-haspopup="dialog"
        data-testid={testId}
        data-full-width={fullWidth}
        className={clsx(
          "tw-flex tw-cursor-pointer tw-items-center tw-justify-center tw-gap-x-1.5 tw-transition tw-duration-150 tw-ease-out focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400",
          className
        )}
      >
        {children}
        <span id={reasonId} className="tw-sr-only">
          {displayedReason}
        </span>
      </button>
    </HoverCard>
  );
}
