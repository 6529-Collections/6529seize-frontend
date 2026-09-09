import type { CalendarDay } from "@/helpers/calendar/calendar.helpers";
import { Time } from "@/helpers/time";
import { formatDate } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";

export type CommonCalendarVariant = "default" | "flat";

enum CalendarDaySate {
  NOT_ACTIVE_MONTH = "NOT_ACTIVE_MONTH",
  MANUALLY_DISABLED = "MANUALLY_DISABLED",
  AVAILABLE = "AVAILABLE",
  ACTIVE = "ACTIVE",
}

export default function CommonCalendarDay({
  day,
  selectedTimestamp,
  minTimestamp,
  maxTimestamp,
  setSelectedTimestamp,
  locale,
  variant = "default",
}: {
  readonly day: CalendarDay;
  readonly selectedTimestamp: number | null;
  readonly minTimestamp: number | null;
  readonly maxTimestamp: number | null;
  readonly setSelectedTimestamp: (timestamp: number) => void;
  readonly locale: SupportedLocale;
  readonly variant?: CommonCalendarVariant;
}) {
  const activeClasses =
    variant === "flat"
      ? "tw-bg-primary-500 tw-text-white tw-font-semibold"
      : "tw-bg-primary-500 tw-text-white tw-font-semibold tw-shadow-lg tw-shadow-primary-500/20 tw-ring-2 tw-ring-primary-400/50";
  const disabledClasses =
    variant === "flat"
      ? "tw-bg-iron-900/80 tw-text-iron-600"
      : "tw-bg-iron-600 tw-text-iron-400";
  const BUTTON_CLASSES: Record<CalendarDaySate, string> = {
    [CalendarDaySate.NOT_ACTIVE_MONTH]: "tw-bg-transparent tw-text-iron-400",
    [CalendarDaySate.MANUALLY_DISABLED]: disabledClasses,
    [CalendarDaySate.AVAILABLE]:
      "tw-font-normal tw-bg-iron-700 tw-text-white hover:tw-bg-iron-700 hover:tw-border-primary-400 hover:tw-shadow-md",
    [CalendarDaySate.ACTIVE]: activeClasses,
  };

  const getDayState = (): CalendarDaySate => {
    if (!day.isActiveMonth) {
      return CalendarDaySate.NOT_ACTIVE_MONTH;
    }
    if (
      minTimestamp !== null &&
      day.startTimestamp < minTimestamp &&
      !(
        day.startTimestamp <= minTimestamp &&
        day.startTimestamp + Time.days(1).toMillis() > minTimestamp
      )
    ) {
      return CalendarDaySate.MANUALLY_DISABLED;
    }
    if (maxTimestamp !== null && day.startTimestamp > maxTimestamp) {
      return CalendarDaySate.MANUALLY_DISABLED;
    }
    if (
      selectedTimestamp !== null &&
      day.startTimestamp <= selectedTimestamp &&
      day.startTimestamp + Time.days(1).toMillis() > selectedTimestamp
    ) {
      return CalendarDaySate.ACTIVE;
    }
    return CalendarDaySate.AVAILABLE;
  };

  const dayState = getDayState();

  const isSelected = dayState === CalendarDaySate.ACTIVE;
  const canSelect =
    dayState === CalendarDaySate.AVAILABLE ||
    dayState === CalendarDaySate.ACTIVE;
  const accessibleDate = formatDate(locale, day.startTimestamp, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const handleClick = () => {
    if (isSelected) {
      return;
    }
    if (
      minTimestamp !== null &&
      day.startTimestamp <= minTimestamp &&
      day.startTimestamp + Time.days(1).toMillis() > minTimestamp
    ) {
      setSelectedTimestamp(minTimestamp);
    } else {
      setSelectedTimestamp(day.startTimestamp);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!canSelect}
      aria-label={accessibleDate}
      aria-pressed={isSelected}
      className={`${BUTTON_CLASSES[dayState]} tw-relative tw-mx-auto tw-h-9 tw-w-9 tw-rounded-lg tw-border tw-border-solid tw-border-transparent tw-transition tw-duration-300 tw-ease-out focus:tw-z-10 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-iron-800 sm:tw-h-8 sm:tw-w-8`}
    >
      <span className="tw-mx-auto tw-flex tw-items-center tw-justify-center tw-rounded-full tw-text-sm">
        {day.date}
      </span>
    </button>
  );
}
