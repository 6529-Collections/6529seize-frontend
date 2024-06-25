import { CalendarDay } from "../../../helpers/calendar/calendar.helpers";

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
}: {
  readonly day: CalendarDay;
  readonly selectedTimestamp: number | null;
  readonly minTimestamp: number | null;
  readonly maxTimestamp: number | null;
  readonly setSelectedTimestamp: (timestamp: number) => void;
}) {
  const BUTTON_CLASSES: Record<CalendarDaySate, string> = {
    [CalendarDaySate.NOT_ACTIVE_MONTH]: "tw-bg-transparent tw-text-iron-400",
    [CalendarDaySate.MANUALLY_DISABLED]: "tw-bg-iron-600 tw-text-iron-300",
    [CalendarDaySate.AVAILABLE]:
      "tw-font-normal tw-bg-iron-800 tw-text-white hover:tw-border-primary-500",
    [CalendarDaySate.ACTIVE]:
      "tw-bg-primary-500 tw-text-white tw-font-semibold hover:tw-border-primary-500",
  };

  const getDayState = (): CalendarDaySate => {
    if (!day.isActiveMonth) {
      return CalendarDaySate.NOT_ACTIVE_MONTH;
    }
    if (minTimestamp && day.startTimestamp < minTimestamp) {
      return CalendarDaySate.MANUALLY_DISABLED;
    }
    if (maxTimestamp && day.startTimestamp > maxTimestamp) {
      return CalendarDaySate.MANUALLY_DISABLED;
    }
    if (day.startTimestamp === selectedTimestamp) {
      return CalendarDaySate.ACTIVE;
    }
    return CalendarDaySate.AVAILABLE;
  };

  const dayState = getDayState();

  const canSelect = dayState === CalendarDaySate.AVAILABLE;

  return (
    <button
      type="button"
      onClick={() => setSelectedTimestamp(day.startTimestamp)}
      disabled={!canSelect}
      className={`${BUTTON_CLASSES[dayState]} tw-mx-auto tw-relative tw-border tw-border-transparent tw-border-solid tw-h-10 tw-w-10 sm:tw-h-9 sm:tw-w-9 tw-rounded-lg tw-transition tw-duration-300 tw-ease-out focus:tw-z-10 `}
    >
      <span className="tw-text-sm tw-mx-auto tw-flex tw-items-center tw-justify-center tw-rounded-full">
        {day.date}
      </span>
    </button>
  );
}
