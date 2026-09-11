import React from "react";
import type { TimeLeft } from "@/helpers/waves/time.utils";
import { formatInteger } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import { TimeUnitDisplay } from "./TimeUnitDisplay";

interface CompactTimeCountdownProps {
  readonly timeLeft?: TimeLeft | null | undefined;
  readonly locale: SupportedLocale;
  readonly descriptionId?: string | undefined;
}

type CountdownUnit = "day" | "hour" | "minute" | "second";

const UNIT_MESSAGE_KEYS: Record<
  CountdownUnit,
  Readonly<{ one: MessageKey; other: MessageKey }>
> = {
  day: {
    one: "waves.leaderboard.timeline.unit.day.one",
    other: "waves.leaderboard.timeline.unit.day.other",
  },
  hour: {
    one: "waves.leaderboard.timeline.unit.hour.one",
    other: "waves.leaderboard.timeline.unit.hour.other",
  },
  minute: {
    one: "waves.leaderboard.timeline.unit.minute.one",
    other: "waves.leaderboard.timeline.unit.minute.other",
  },
  second: {
    one: "waves.leaderboard.timeline.unit.second.one",
    other: "waves.leaderboard.timeline.unit.second.other",
  },
};

const formatAccessibleUnit = (
  locale: SupportedLocale,
  pluralRules: Intl.PluralRules,
  value: number,
  unit: CountdownUnit
): string => {
  const plurality = pluralRules.select(value) === "one" ? "one" : "other";
  return t(locale, UNIT_MESSAGE_KEYS[unit][plurality], {
    count: formatInteger(locale, value),
  });
};

/**
 * Displays a compact inline countdown for upcoming decisions.
 */
export const CompactTimeCountdown: React.FC<CompactTimeCountdownProps> = ({
  timeLeft,
  locale,
  descriptionId,
}) => {
  const days = timeLeft?.days ?? 0;
  const hours = timeLeft?.hours ?? 0;
  const minutes = timeLeft?.minutes ?? 0;
  const seconds = timeLeft?.seconds ?? 0;
  const pluralRules = new Intl.PluralRules(locale);
  const accessibleCountdown = [
    days > 0
      ? formatAccessibleUnit(locale, pluralRules, days, "day")
      : null,
    formatAccessibleUnit(locale, pluralRules, hours, "hour"),
    formatAccessibleUnit(locale, pluralRules, minutes, "minute"),
    formatAccessibleUnit(locale, pluralRules, seconds, "second"),
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <span className="tw-inline-flex tw-flex-shrink-0 tw-items-baseline tw-gap-1 tw-text-xs tw-leading-none">
      <span id={descriptionId} className="tw-sr-only">
        {t(locale, "waves.leaderboard.timeline.nextWinnerIn", {
          countdown: accessibleCountdown,
        })}
      </span>
      <span
        className="tw-hidden tw-whitespace-nowrap tw-font-medium tw-text-iron-500 @[20rem]/timeline:tw-inline"
        aria-hidden="true"
      >
        {t(locale, "waves.leaderboard.timeline.nextWinner")}
      </span>
      <span
        className="tw-flex tw-items-baseline tw-gap-x-0.5 tw-font-medium tw-text-iron-300"
        aria-hidden="true"
      >
        {days > 0 && <TimeUnitDisplay value={days} label="d" />}
        <TimeUnitDisplay value={hours} label="h" />
        <TimeUnitDisplay value={minutes} label="m" />
        <TimeUnitDisplay value={seconds} label="s" />
      </span>
    </span>
  );
};
