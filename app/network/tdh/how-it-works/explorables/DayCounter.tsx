"use client";

import { useId, useState } from "react";
import {
  formatInteger,
  formatTime,
  selectPluralCategory,
  formatDate,
} from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import {
  DAY_SECONDS,
  EXAMPLE_SNAPSHOT_TIME,
  wholeDays,
} from "@/lib/tdh/tdhV1Arithmetic";
import {
  TDH_CHIP_BUTTON,
  TDH_CHIP_OFF,
  TDH_FOCUS_RING,
} from "../../shared/tdhStyles";
import ExplorableFrame from "./ExplorableFrame";

const PRESETS = [
  { key: "preset1", seconds: 100 * DAY_SECONDS + 23 * 3_600 },
  { key: "preset2", seconds: 23 * 3_600 },
  { key: "preset3", seconds: DAY_SECONDS },
] as const;

const DEFAULT_OFFSET = PRESETS[0].seconds;

function toInputs(unixSeconds: number): { date: string; time: string } {
  const iso = new Date(unixSeconds * 1000).toISOString();
  return { date: iso.slice(0, 10), time: iso.slice(11, 16) };
}

function fromInputs(date: string, time: string): number | null {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const timeMatch = /^(\d{2}):(\d{2})$/.exec(time);
  if (!dateMatch || !timeMatch) {
    return null;
  }
  const ms = Date.UTC(
    Number(dateMatch[1]),
    Number(dateMatch[2]) - 1,
    Number(dateMatch[3]),
    Number(timeMatch[1]),
    Number(timeMatch[2])
  );
  return Number.isFinite(ms) ? Math.floor(ms / 1000) : null;
}

const FIELD = `tw-mt-1.5 tw-block tw-min-h-11 tw-w-full tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-3 tw-text-base tw-text-iron-50 [color-scheme:dark] ${TDH_FOCUS_RING}`;

/** Step 2: whole days between an acquisition time and the snapshot. */
export default function DayCounter({
  locale,
}: {
  readonly locale: SupportedLocale;
}) {
  const id = useId();
  const initial = toInputs(EXAMPLE_SNAPSHOT_TIME - DEFAULT_OFFSET);
  const [date, setDate] = useState(initial.date);
  const [time, setTime] = useState(initial.time);
  const acquired = fromInputs(date, time);

  const applyOffset = (seconds: number) => {
    const next = toInputs(EXAMPLE_SNAPSHOT_TIME - seconds);
    setDate(next.date);
    setTime(next.time);
  };

  let result: string;
  let detail = "";
  if (acquired === null) {
    result = t(locale, "network.tdh.how.days.invalid");
  } else if (acquired > EXAMPLE_SNAPSHOT_TIME) {
    result = t(locale, "network.tdh.how.days.after");
  } else {
    const days = wholeDays(EXAMPLE_SNAPSHOT_TIME, acquired);
    const remainder = (EXAMPLE_SNAPSHOT_TIME - acquired) % DAY_SECONDS;
    result = t(
      locale,
      selectPluralCategory(locale, days) === "one"
        ? "network.tdh.how.days.result.one"
        : "network.tdh.how.days.result",
      { days: formatInteger(locale, days) }
    );
    detail = t(locale, "network.tdh.how.days.remainder", {
      hours: formatInteger(locale, Math.floor(remainder / 3_600)),
      minutes: formatInteger(locale, Math.floor((remainder % 3_600) / 60)),
    });
  }

  return (
    <ExplorableFrame
      locale={locale}
      title={t(locale, "network.tdh.how.days.title")}
      onReset={() => applyOffset(DEFAULT_OFFSET)}
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
      <div className="tw-mt-3 tw-grid tw-gap-3 sm:tw-grid-cols-2">
        <div>
          <label
            htmlFor={`${id}-date`}
            className="tw-text-sm tw-font-medium tw-text-iron-200"
          >
            {t(locale, "network.tdh.how.days.date")}
          </label>
          <input
            id={`${id}-date`}
            type="date"
            value={date}
            max="2026-10-14"
            onChange={(event) => setDate(event.target.value)}
            className={FIELD}
          />
        </div>
        <div>
          <label
            htmlFor={`${id}-time`}
            className="tw-text-sm tw-font-medium tw-text-iron-200"
          >
            {t(locale, "network.tdh.how.days.time")}
          </label>
          <input
            id={`${id}-time`}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            pattern="[0-2][0-9]:[0-5][0-9]"
            placeholder="HH:MM"
            maxLength={5}
            value={time}
            onChange={(event) => setTime(event.target.value)}
            className={`${FIELD} tw-tabular-nums`}
          />
        </div>
      </div>
      {acquired !== null && (
        <p className="tw-m-0 tw-mt-2 tw-text-sm tw-tabular-nums tw-text-iron-300">
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
      )}
      <div className="tw-mt-3 tw-flex tw-flex-wrap tw-items-center tw-gap-2">
        <span className="tw-text-sm tw-text-iron-400">
          {t(locale, "network.tdh.how.days.presets")}
        </span>
        {PRESETS.map((preset) => (
          <button
            key={preset.key}
            type="button"
            onClick={() => applyOffset(preset.seconds)}
            className={`${TDH_CHIP_BUTTON} ${TDH_CHIP_OFF}`}
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
        {detail && (
          <span className="tw-text-sm tw-tabular-nums tw-text-iron-400">
            {detail}
          </span>
        )}
      </output>
    </ExplorableFrame>
  );
}
