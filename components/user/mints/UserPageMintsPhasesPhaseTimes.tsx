import UserPageMintsPhasesPhaseTimesCountdown from "./UserPageMintsPhasesPhaseTimesCountdown";

export default function UserPageMintsPhasesPhaseTimes({
  startTime,
  endTime,
}: {
  readonly startTime: number;
  readonly endTime: number;
}) {
  const getFormattedTs = (ts: number) => {
    const date = new Date(ts);
    const daysOfWeek = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const dayOfWeek = daysOfWeek[date.getDay()];
    const month = months[date.getMonth()];
    const day = date.getDate();
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const timeZone = new Intl.DateTimeFormat("en-US", { timeZoneName: "short" })
      .format(date)
      .split(" ")
      .pop();
    return `${dayOfWeek}, ${month} ${day}, ${hours}:${minutes} ${timeZone}`;
  };

  return (
    <div className="tw-mt-2 tw-flex tw-flex-col md:tw-flex-row tw-gap-y-4 tw-gap-x-8">
      <div className="tw-flex tw-flex-col">
        <span className="tw-text-iron-400 tw-text-sm tw-font-medium">
          Start Time
        </span>
        <span className="tw-mt-1 tw-text-iron-300 tw-font-medium tw-text-base">
          {getFormattedTs(startTime)}
        </span>
      </div>
      <div className="tw-flex tw-flex-col">
        <span className="tw-text-iron-400 tw-text-sm tw-font-medium">
          End Time
        </span>
        <span className="tw-mt-1 tw-text-iron-300 tw-font-medium tw-text-base">
          {getFormattedTs(endTime)}
        </span>
      </div>
      <UserPageMintsPhasesPhaseTimesCountdown
        startTime={startTime}
        endTime={endTime}
      />
    </div>
  );
}
