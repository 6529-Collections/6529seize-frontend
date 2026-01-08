import type { CalendarDay } from "@/helpers/calendar/calendar.helpers";
import { Time } from "@/helpers/time";

enum CalendarDaySate {
  NOT_ACTIVE_MONTH = "NOT_ACTIVE_MONTH",
  MANUALLY_DISABLED = "MANUALLY_DISABLED",
  AVAILABLE = "AVAILABLE",
  ACTIVE = "ACTIVE"
}

export default function CommonCalendarDay({
  day,
  selectedTimestamp,
  minTimestamp,
  maxTimestamp,
  setSelectedTimestamp,
}: {
  readonly day: CalendarDay;
  readonly selectedTimestamp: number | null;
  readonly minTimestamp: number | null;
  readonly maxTimestamp: number | null;
  readonly setSelectedTimestamp: (timestamp: number) => void;
}) {
  const BUTTON_CLASSES: Record<CalendarDaySate, string> = {
    [CalendarDaySate.NOT_ACTIVE_MONTH]: "tw-bg-transparent tw-text-iron-400",
    [CalendarDaySate.MANUALLY_DISABLED]: "tw-bg-iron-600 tw-text-iron-400",
    [CalendarDaySate.AVAILABLE]:
      "tw-font-normal tw-bg-iron-700 tw-text-white hover:tw-bg-iron-700 hover:tw-border-primary-400 hover:tw-shadow-md",
    [CalendarDaySate.ACTIVE]:
      "tw-bg-primary-500 tw-text-white tw-font-semibold tw-shadow-lg tw-shadow-primary-500/20 tw-ring-2 tw-ring-primary-400/50"
  };

  const getDayState = (): CalendarDaySate => {
    if (!day.isActiveMonth) {
      return CalendarDaySate.NOT_ACTIVE_MONTH;
    }
    if (minTimestamp && day.startTimestamp < minTimestamp && 
        !(day.startTimestamp <= minTimestamp && day.startTimestamp + Time.days(1).toMillis() > minTimestamp)) {
      return CalendarDaySate.MANUALLY_DISABLED;
    }
    if (maxTimestamp && day.startTimestamp > maxTimestamp) {
      return CalendarDaySate.MANUALLY_DISABLED;
    }
    if (
      selectedTimestamp &&
      day.startTimestamp <= selectedTimestamp &&
      day.startTimestamp + Time.days(1).toMillis() > selectedTimestamp
    ) {
      return CalendarDaySate.ACTIVE;
    }
    return CalendarDaySate.AVAILABLE;
  };

  const dayState = getDayState();

  const canSelect = dayState === CalendarDaySate.AVAILABLE;

  const handleClick = () => {
    if (minTimestamp && day.startTimestamp <= minTimestamp && day.startTimestamp + Time.days(1).toMillis() > minTimestamp) {
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
      className={`${BUTTON_CLASSES[dayState]} tw-mx-auto tw-relative tw-border tw-border-transparent tw-border-solid tw-h-9 tw-w-9 sm:tw-h-8 sm:tw-w-8 tw-rounded-lg tw-transition tw-duration-300 tw-ease-out focus:tw-z-10`}
    >
      <span className="tw-text-sm tw-mx-auto tw-flex tw-items-center tw-justify-center tw-rounded-full">
        {day.date}
      </span>
    </button>
  );
}
