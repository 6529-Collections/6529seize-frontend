"use client";

import { buildTooltipId, TOOLTIP_STYLES } from "@/helpers/tooltip.helpers";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import {
  ArrowPathIcon,
  CameraIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
import { useId, type ReactNode } from "react";
import { Tooltip } from "react-tooltip";

export type ScreenshotStatus = "idle" | "loading" | "success" | "error";

export function ScreenshotCard({
  onScreenshot,
  isCapturing,
  statusId,
  locale,
}: {
  readonly onScreenshot: () => void;
  readonly isCapturing: boolean;
  readonly statusId?: string | undefined;
  readonly locale: SupportedLocale;
}) {
  const label = t(locale, "memeCalendar.overview.controls.screenshot");
  const tooltipId = buildTooltipId(useId(), "meme-calendar-screenshot");

  return (
    <>
      <button
        data-ignore-screenshot
        type="button"
        onClick={onScreenshot}
        disabled={isCapturing}
        className="tw-inline-flex tw-size-9 tw-flex-none tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-text-iron-300 tw-shadow-sm tw-shadow-black/20 tw-transition-colors focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 disabled:tw-cursor-wait disabled:tw-opacity-60 desktop-hover:hover:tw-border-iron-600 desktop-hover:hover:tw-bg-iron-800 desktop-hover:hover:tw-text-iron-50"
        aria-label={label}
        aria-busy={isCapturing || undefined}
        aria-describedby={statusId}
        data-tooltip-id={tooltipId}
        data-tooltip-content={label}
      >
        <CameraIcon aria-hidden="true" className="tw-size-4" />
      </button>
      <Tooltip
        id={tooltipId}
        place="top"
        positionStrategy="fixed"
        offset={8}
        delayShow={250}
        opacity={1}
        style={TOOLTIP_STYLES}
      />
    </>
  );
}

export function ScreenshotFeedback({
  locale,
  status,
}: {
  readonly locale: SupportedLocale;
  readonly status: ScreenshotStatus;
}) {
  if (status === "idle") {
    return null;
  }

  const isError = status === "error";
  let messageKey:
    | "memeCalendar.overview.controls.screenshotPreparing"
    | "memeCalendar.overview.controls.screenshotSuccess"
    | "memeCalendar.overview.controls.screenshotError";
  if (status === "loading") {
    messageKey = "memeCalendar.overview.controls.screenshotPreparing";
  } else if (status === "success") {
    messageKey = "memeCalendar.overview.controls.screenshotSuccess";
  } else {
    messageKey = "memeCalendar.overview.controls.screenshotError";
  }

  let statusIcon: ReactNode;
  if (isError) {
    statusIcon = (
      <ExclamationCircleIcon
        aria-hidden="true"
        className="tw-mt-0.5 tw-size-4 tw-flex-none"
      />
    );
  } else if (status === "loading") {
    statusIcon = (
      <ArrowPathIcon
        aria-hidden="true"
        className="tw-mt-0.5 tw-size-4 tw-flex-none tw-animate-spin motion-reduce:tw-animate-none"
      />
    );
  } else {
    statusIcon = (
      <CheckCircleIcon
        aria-hidden="true"
        className="tw-mt-0.5 tw-size-4 tw-flex-none tw-text-success"
      />
    );
  }

  return (
    <p
      id="meme-overview-screenshot-status"
      className={`tw-mb-0 tw-mt-2 tw-flex tw-items-start tw-gap-2 tw-text-sm tw-leading-5 ${
        isError ? "tw-text-error" : "tw-text-iron-300"
      }`}
      data-ignore-screenshot
      role={isError ? "alert" : "status"}
    >
      {statusIcon}
      <span>{t(locale, messageKey)}</span>
    </p>
  );
}
