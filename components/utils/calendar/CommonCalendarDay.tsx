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
    return "tw-bg-iron-800 tw-text-iron-300 hover:tw-border-primary-500";
  };

  const buttonClasses = getButtonClasses();

  return (
    <button
      type="button"
      onClick={() => setSelectedTimestamp(day.startTimestamp)}
      disabled={!day.isActiveMonth}
      className={`${buttonClasses} tw-relative  tw-border tw-border-transparent tw-border-solid tw-h-9 tw-w-9   tw-rounded-lg tw-transition tw-duration-300 tw-ease-out focus:tw-z-10 `}
    >
      <div className="tw-mx-auto tw-flex tw-h-6 tw-w-6 tw-items-center tw-justify-center tw-rounded-full">
        {day.date}
      </div>
    </button>
  );
}
