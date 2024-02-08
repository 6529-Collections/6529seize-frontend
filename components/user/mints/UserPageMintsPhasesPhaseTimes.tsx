import UserPageMintsPhasesPhaseTimesCountdown from "./UserPageMintsPhasesPhaseTimesCountdown";
import Tippy from "@tippyjs/react";

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
        <div className="tw-space-x-2">
          <span className="tw-text-iron-400 tw-text-sm tw-font-medium">
            Start Time
          </span>
          <Tippy
            content={"Displayed times are in your local timezone."}
            theme="dark"
            placement="top"
          >
            <svg
              className="tw-flex-shrink-0 tw-w-5 tw-h-5 tw-text-iron-400"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 16V12M12 8H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Tippy>
        </div>
        <span className="tw-mt-1 tw-text-iron-300 tw-font-medium tw-text-base">
          {getFormattedTs(startTime)}
        </span>
      </div>
      <div className="tw-flex tw-flex-col">
        <div className="tw-space-x-2">
          <span className="tw-text-iron-400 tw-text-sm tw-font-medium">
            End Time
          </span>
          <Tippy
            content={"Displayed times are in your local timezone."}
            theme="dark"
            placement="top"
          >
            <svg
              className="tw-flex-shrink-0 tw-w-5 tw-h-5 tw-text-iron-400"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 16V12M12 8H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Tippy>
        </div>
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
