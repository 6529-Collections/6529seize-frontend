"use client";

import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";

export type ZoneDetailsView = {
  readonly tzid: string;
  readonly city: string;
  readonly supported: boolean;
  readonly name: string;
  readonly offsetLabel: string;
  readonly time: string;
  readonly date: string;
  readonly dstLabel: string;
  readonly isViewerZone: boolean;
};

type WorldTimeZoneDetailsProps = {
  readonly locale: SupportedLocale;
  readonly zone: ZoneDetailsView | null;
};

const LABEL_CLASS_NAME =
  "tw-m-0 tw-text-xs tw-font-medium tw-uppercase tw-tracking-wide tw-text-iron-400";
const VALUE_CLASS_NAME =
  "tw-m-0 tw-text-sm tw-font-medium tw-tabular-nums tw-text-iron-100";

function DetailRow({
  label,
  value,
  detail,
}: {
  readonly label: string;
  readonly value: string;
  readonly detail?: string | undefined;
}) {
  return (
    <div className="tw-flex tw-items-baseline tw-justify-between tw-gap-3">
      <dt className={LABEL_CLASS_NAME}>{label}</dt>
      <dd className={`${VALUE_CLASS_NAME} tw-text-right`}>
        {value}
        {detail ? (
          <span className="tw-block tw-text-xs tw-font-normal tw-text-iron-400">
            {detail}
          </span>
        ) : null}
      </dd>
    </div>
  );
}

function DetailsSkeleton() {
  return (
    <div className="tw-space-y-3" aria-hidden="true">
      <div className="tw-h-6 tw-w-2/3 tw-animate-pulse tw-rounded-md tw-bg-iron-800 motion-reduce:tw-animate-none" />
      <div className="tw-h-4 tw-w-1/2 tw-animate-pulse tw-rounded-md tw-bg-iron-800 motion-reduce:tw-animate-none" />
      <div className="tw-h-16 tw-animate-pulse tw-rounded-md tw-bg-iron-800 motion-reduce:tw-animate-none" />
    </div>
  );
}

export default function WorldTimeZoneDetails({
  locale,
  zone,
}: WorldTimeZoneDetailsProps) {
  return (
    <section
      aria-labelledby="world-time-zone-details-heading"
      className="tw-min-h-[12.5rem] tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-900/60 tw-p-4"
    >
      <h3
        id="world-time-zone-details-heading"
        className="tw-m-0 tw-mb-3 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-400"
      >
        {t(locale, "tools.timeZones.details.heading")}
      </h3>
      {zone === null ? (
        <DetailsSkeleton />
      ) : (
        <div className="tw-space-y-3">
          <div>
            <p className="tw-m-0 tw-text-lg tw-font-semibold tw-leading-6 tw-text-iron-50">
              {zone.city}
            </p>
            <p className="tw-m-0 tw-mt-0.5 tw-text-sm tw-text-iron-200">
              {zone.name}
            </p>
            <p className="tw-m-0 tw-mt-1 tw-break-all tw-font-mono tw-text-xs tw-text-iron-400">
              <span className="tw-sr-only">
                {t(locale, "tools.timeZones.details.ianaId")}:{" "}
              </span>
              {zone.tzid}
            </p>
            {zone.isViewerZone ? (
              <p className="tw-m-0 tw-mt-2 tw-inline-flex tw-rounded-full tw-border tw-border-solid tw-border-white/20 tw-px-2 tw-py-0.5 tw-text-xs tw-font-medium tw-text-iron-100">
                {t(locale, "tools.timeZones.details.yourZone")}
              </p>
            ) : null}
          </div>
          {zone.supported ? (
            <dl className="tw-m-0 tw-space-y-2">
              <DetailRow
                label={t(locale, "tools.timeZones.details.localTime")}
                value={zone.time}
                detail={zone.date}
              />
              <DetailRow
                label={t(locale, "tools.timeZones.details.offset")}
                value={zone.offsetLabel}
              />
              <DetailRow
                label={t(locale, "tools.timeZones.details.daylightSaving")}
                value={zone.dstLabel}
              />
            </dl>
          ) : (
            <p className="tw-m-0 tw-text-sm tw-text-iron-300">
              {t(locale, "tools.timeZones.details.unknownZone")}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
