"use client";

import { useState } from "react";
import {
  formatDate,
  formatInteger,
  formatTime,
  selectPluralCategory,
} from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { REGISTRY_V14, wholeDays } from "@/components/explained/engine/tdh";
import {
  TDH_CHIP_BUTTON,
  TDH_CHIP_OFF,
  TDH_CHIP_ON,
} from "../../shared/tdhStyles";
import { EXAMPLE_SNAPSHOT_TIME } from "../exampleNetwork";
import ExplorableFrame from "./ExplorableFrame";
import IntegerField from "./IntegerField";

/** Whole days use the registry's `day_s` (P26 §4.3). */
const DAY_SECONDS = REGISTRY_V14.day_s;

const PRESETS = [
  { key: "preset1", seconds: 100 * DAY_SECONDS + 23 * 3_600 },
  { key: "preset2", seconds: 23 * 3_600 },
  { key: "preset3", seconds: DAY_SECONDS },
] as const;

const DEFAULT_OFFSET = PRESETS[0].seconds;
/** About four years back: enough for any example. */
const MAX_DAYS = 1_500;

type OffsetKey = "offsetDays" | "offsetHours" | "offsetMinutes";

/**
 * Step 2: whole days between an acquisition time and the snapshot. The time
 * is set as days, hours and minutes before the snapshot, with steppers, and
 * shown back in words, so no date format can be misread.
 */
export default function DayCounter({
  locale,
}: {
  readonly locale: SupportedLocale;
}) {
  const [offset, setOffset] = useState<number>(DEFAULT_OFFSET);
  const days = Math.floor(offset / DAY_SECONDS);
  const hours = Math.floor((offset % DAY_SECONDS) / 3_600);
  const minutes = Math.floor((offset % 3_600) / 60);
  const acquired = EXAMPLE_SNAPSHOT_TIME - offset;
  const setParts = (next: Partial<Record<OffsetKey, number>>) =>
    setOffset(
      (next.offsetDays ?? days) * DAY_SECONDS +
        (next.offsetHours ?? hours) * 3_600 +
        (next.offsetMinutes ?? minutes) * 60
    );

  const whole = wholeDays(EXAMPLE_SNAPSHOT_TIME, acquired, DAY_SECONDS);
  const remainder = offset % DAY_SECONDS;
  const result = t(
    locale,
    selectPluralCategory(locale, whole) === "one"
      ? "network.tdh.how.days.result.one"
      : "network.tdh.how.days.result",
    { days: formatInteger(locale, whole) }
  );
  const detail = t(locale, "network.tdh.how.days.remainder", {
    hours: formatInteger(locale, Math.floor(remainder / 3_600)),
    minutes: formatInteger(locale, Math.floor((remainder % 3_600) / 60)),
  });
  const fields: ReadonlyArray<readonly [OffsetKey, number, number]> = [
    ["offsetDays", days, MAX_DAYS],
    ["offsetHours", hours, 23],
    ["offsetMinutes", minutes, 59],
  ];

  return (
    <ExplorableFrame
      locale={locale}
      title={t(locale, "network.tdh.how.days.title")}
      onReset={() => setOffset(DEFAULT_OFFSET)}
    >
      <p className="tw-m-0 tw-text-sm tw-text-iron-400">
        {t(locale, "network.tdh.how.days.snapshot", {
          time: formatTime(locale, EXAMPLE_SNAPSHOT_TIME * 1000, {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hourCycle: "h23",
            timeZone: "UTC",
          }),
        })}
      </p>
      <div className="tw-mt-3 tw-grid tw-gap-3 sm:tw-grid-cols-3">
        {fields.map(([key, value, max]) => {
          const label = t(locale, `network.tdh.how.days.${key}`);
          return (
            <IntegerField
              key={key}
              label={label}
              value={value}
              min={0}
              max={max}
              onChange={(next) => setParts({ [key]: next })}
              increaseLabel={t(locale, "network.tdh.shared.increase", {
                name: label,
              })}
              decreaseLabel={t(locale, "network.tdh.shared.decrease", {
                name: label,
              })}
            />
          );
        })}
      </div>
      <p className="tw-m-0 tw-mt-3 tw-text-sm tw-tabular-nums tw-text-iron-200">
        {t(locale, "network.tdh.how.days.echo", {
          time: formatDate(locale, acquired * 1000, {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hourCycle: "h23",
            timeZone: "UTC",
          }),
        })}
      </p>
      <div className="tw-mt-3 tw-flex tw-flex-wrap tw-items-center tw-gap-2">
        <span className="tw-text-sm tw-text-iron-400">
          {t(locale, "network.tdh.how.days.presets")}
        </span>
        {PRESETS.map((preset) => (
          <button
            key={preset.key}
            type="button"
            aria-pressed={offset === preset.seconds}
            onClick={() => setOffset(preset.seconds)}
            className={`${TDH_CHIP_BUTTON} ${offset === preset.seconds ? TDH_CHIP_ON : TDH_CHIP_OFF}`}
          >
            {t(locale, `network.tdh.how.days.${preset.key}`)}
          </button>
        ))}
      </div>
      <output
        aria-live="polite"
        className="tw-mt-4 tw-flex tw-min-h-[3.5rem] tw-flex-col tw-justify-center tw-rounded-lg tw-bg-iron-900 tw-px-4 tw-py-2"
      >
        <span className="tw-text-xl tw-font-semibold tw-tabular-nums tw-text-iron-50">
          {result}
        </span>
        <span className="tw-text-sm tw-tabular-nums tw-text-iron-400">
          {detail}
        </span>
      </output>
    </ExplorableFrame>
  );
}
