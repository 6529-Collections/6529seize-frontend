"use client";

import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";

import { useSecondNow } from "./liveClock";
import { formatOffsetLabel } from "./timeZoneLabels";
import {
  formatZoneFullDate,
  formatZoneTime,
  formatZoneTimeWithSeconds,
  getGenericZoneName,
  getOffsetMinutes,
} from "./timeZoneClock";

type WorldTimeZoneClocksProps = {
  readonly locale: SupportedLocale;
  readonly now: Date | null;
  readonly viewerTimeZone: string | null;
};

const CARD_CLASS_NAME =
  "tw-min-w-0 tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-900/60 tw-p-4";
const CARD_LABEL_CLASS_NAME =
  "tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-400";
const CLOCK_CLASS_NAME =
  "tw-m-0 tw-mt-2 tw-block tw-text-3xl tw-font-semibold tw-tabular-nums tw-leading-9 tw-text-iron-50";
const SKELETON_CLASS_NAME =
  "tw-mt-2 tw-h-9 tw-w-40 tw-animate-pulse tw-rounded-md tw-bg-iron-800 motion-reduce:tw-animate-none";

function ClockSkeleton({ locale }: { readonly locale: SupportedLocale }) {
  return (
    <>
      <span className="tw-sr-only">
        {t(locale, "tools.timeZones.clocks.loading")}
      </span>
      <div className={SKELETON_CLASS_NAME} aria-hidden="true" />
      <div
        className="tw-mt-2 tw-h-4 tw-w-48 tw-animate-pulse tw-rounded-md tw-bg-iron-800 motion-reduce:tw-animate-none"
        aria-hidden="true"
      />
    </>
  );
}

// The only per-second readout on the page: a single small element.
function UtcClock({ locale }: { readonly locale: SupportedLocale }) {
  const nowMs = useSecondNow();
  if (nowMs === null) {
    return <ClockSkeleton locale={locale} />;
  }
  const now = new Date(nowMs);
  return (
    <>
      <time dateTime={now.toISOString()} className={CLOCK_CLASS_NAME}>
        {formatZoneTimeWithSeconds(locale, "UTC", now)}
      </time>
      <p className="tw-m-0 tw-mt-1 tw-text-sm tw-text-iron-300">
        {formatZoneFullDate(locale, "UTC", now)}
      </p>
    </>
  );
}

function ViewerClock({
  locale,
  now,
  viewerTimeZone,
}: WorldTimeZoneClocksProps) {
  if (now === null) {
    return <ClockSkeleton locale={locale} />;
  }
  const offset =
    viewerTimeZone === null ? null : getOffsetMinutes(viewerTimeZone, now);
  if (viewerTimeZone === null || offset === null) {
    return (
      <p className="tw-m-0 tw-mt-2 tw-text-sm tw-text-iron-300">
        {t(locale, "tools.timeZones.clocks.yourZoneUnknown")}
      </p>
    );
  }
  return (
    <>
      <time dateTime={now.toISOString()} className={CLOCK_CLASS_NAME}>
        {formatZoneTime(locale, viewerTimeZone, now)}
      </time>
      <p className="tw-m-0 tw-mt-1 tw-text-sm tw-text-iron-300">
        {getGenericZoneName(locale, viewerTimeZone, now) ?? viewerTimeZone}
        {" · "}
        {formatOffsetLabel(locale, offset)}
      </p>
      <p className="tw-m-0 tw-mt-1 tw-break-all tw-font-mono tw-text-xs tw-text-iron-400">
        {viewerTimeZone}
      </p>
    </>
  );
}

export default function WorldTimeZoneClocks(props: WorldTimeZoneClocksProps) {
  const { locale } = props;
  return (
    <section
      aria-labelledby="world-time-zones-clocks-heading"
      className="tw-mt-6"
    >
      <h2 id="world-time-zones-clocks-heading" className="tw-sr-only">
        {t(locale, "tools.timeZones.clocks.heading")}
      </h2>
      <div className="tw-grid tw-gap-4 sm:tw-grid-cols-2">
        <div className={CARD_CLASS_NAME}>
          <h3 className={CARD_LABEL_CLASS_NAME}>
            {t(locale, "tools.timeZones.clocks.utcLabel")}
          </h3>
          <UtcClock locale={locale} />
        </div>
        <div className={CARD_CLASS_NAME}>
          <h3 className={CARD_LABEL_CLASS_NAME}>
            {t(locale, "tools.timeZones.clocks.yourZoneLabel")}
          </h3>
          <ViewerClock {...props} />
        </div>
      </div>
    </section>
  );
}
