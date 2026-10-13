"use client";

import { formatNumber } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";

import {
  getOceanOffsetColor,
  getOffsetColor,
  OFFSET_LEGEND_HOURS,
} from "./mapGeometry";

const LABELLED_HOURS = new Set([-12, -6, 0, 6, 14]);
// Open ocean uses the same scale, muted: the chip shows that muted range.
const OCEAN_SWATCH_GRADIENT = `linear-gradient(90deg, ${[-12, -6, 0, 6, 14]
  .map((hour) => getOceanOffsetColor(hour * 60))
  .join(", ")})`;

export default function WorldTimeZoneLegend({
  locale,
}: {
  readonly locale: SupportedLocale;
}) {
  return (
    <div className="tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-900/60 tw-p-4">
      <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-400">
        {t(locale, "tools.timeZones.map.legend.label")}
      </p>
      <div
        className="tw-mt-3 tw-flex tw-h-3 tw-overflow-hidden tw-rounded-full"
        aria-hidden="true"
      >
        {OFFSET_LEGEND_HOURS.map((hour) => (
          <span
            key={hour}
            className="tw-h-full tw-flex-1"
            style={{ backgroundColor: getOffsetColor(hour * 60) }}
          />
        ))}
      </div>
      <div
        className="tw-relative tw-mt-1 tw-h-4 tw-text-[11px] tw-tabular-nums tw-text-iron-400"
        aria-hidden="true"
      >
        {OFFSET_LEGEND_HOURS.map((hour, index) =>
          LABELLED_HOURS.has(hour) ? (
            <span
              key={hour}
              className="tw-absolute tw-top-0 -tw-translate-x-1/2"
              style={{
                left: `${((index + 0.5) / OFFSET_LEGEND_HOURS.length) * 100}%`,
              }}
            >
              {formatNumber(locale, hour, { signDisplay: "exceptZero" })}
            </span>
          ) : null
        )}
      </div>
      <div className="tw-mt-2 tw-flex tw-justify-between tw-gap-3 tw-text-xs tw-text-iron-300">
        <span>{t(locale, "tools.timeZones.map.legend.behind")}</span>
        <span className="tw-text-right">
          {t(locale, "tools.timeZones.map.legend.ahead")}
        </span>
      </div>
      <ul className="tw-m-0 tw-mt-3 tw-flex tw-list-none tw-flex-wrap tw-gap-x-4 tw-gap-y-2 tw-p-0 tw-text-xs tw-text-iron-300">
        <li className="tw-flex tw-items-center tw-gap-2">
          <span
            aria-hidden="true"
            className="tw-inline-block tw-h-3 tw-w-5 tw-rounded-sm tw-ring-1 tw-ring-white/10"
            style={{ backgroundImage: OCEAN_SWATCH_GRADIENT }}
          />
          {t(locale, "tools.timeZones.map.legend.ocean")}
        </li>
        <li className="tw-flex tw-items-center tw-gap-2">
          <span
            aria-hidden="true"
            className="tw-inline-block tw-h-3 tw-w-5 tw-rounded-sm tw-border tw-border-dashed tw-border-white"
          />
          {t(locale, "tools.timeZones.map.legend.yourZone")}
        </li>
        <li className="tw-flex tw-items-center tw-gap-2">
          <span
            aria-hidden="true"
            className="tw-inline-block tw-h-3 tw-w-5 tw-rounded-sm tw-bg-black/60 tw-ring-1 tw-ring-white/20"
          />
          {t(locale, "tools.timeZones.map.legend.night")}
        </li>
      </ul>
    </div>
  );
}
