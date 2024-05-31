import { CalendarDay } from "../../../helpers/calendar/calendar.helpers";

export default function CommonCalendarDay({
  day,
  selectedTimestamp,
  setSelectedTimestamp,
}: {
  readonly day: CalendarDay;
  readonly selectedTimestamp: number | null;
  readonly setSelectedTimestamp: (timestamp: number) => void;
}) {
  const isSelected = day.startTimestamp === selectedTimestamp;

  const getButtonClasses = () => {
    if (!day.isActiveMonth) {
      return "";
    }
    if (isSelected) {
      return "tw-bg-primary-500 tw-text-iron-50 tw-font-semibold hover:tw-border-primary-500";
    }
    return "tw-font-medium tw-bg-iron-800 tw-text-iron-300 hover:tw-border-primary-500";
  };

  const buttonClasses = getButtonClasses();

  return (
    <button
      type="button"
      onClick={() => setSelectedTimestamp(day.startTimestamp)}
      disabled={!day.isActiveMonth}
      className={`${buttonClasses} tw-relative tw-border tw-border-transparent tw-border-solid tw-h-8 tw-w-8 tw-rounded-lg tw-transition tw-duration-300 tw-ease-out focus:tw-z-10 `}
    >
      <span className="tw-text-sm tw-mx-auto tw-flex tw-items-center tw-justify-center tw-rounded-full">
        {day.date}
      </span>
    </button>
  );
}
