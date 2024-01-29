import { useEffect, useState } from "react";

enum CountdownState {
  NOT_STARTED = "NOT_STARTED",
  IN_PROGRESS = "IN_PROGRESS",
  ENDED = "ENDED",
}

export default function UserPageMintsPhasesPhaseTimes({
  startTime,
  endTime,
}: {
  readonly startTime: number;
  readonly endTime: number;
}) {
  const formatTime = (time: number): string => {
    if (time <= 0) {
      return "0 Days 0 Hours 0 Minutes 0 Seconds";
    }
    const seconds = Math.floor((time / 1000) % 60);
    const minutes = Math.floor((time / 1000 / 60) % 60);
    const hours = Math.floor((time / (1000 * 60 * 60)) % 24);
    const days = Math.floor(time / (1000 * 60 * 60 * 24));

    return `${days} ${days === 1 ? "Day" : "Days"} ${hours} ${
      hours === 1 ? "Hour" : "Hours"
    } ${minutes} ${minutes === 1 ? "Minute" : "Minutes"} ${seconds} ${
      seconds === 1 ? "Second" : "Seconds"
    }
    `;
  };

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

    const dayOfWeek = daysOfWeek[date.getUTCDay()];
    const month = months[date.getUTCMonth()];
    const day = date.getUTCDate();
    const hours = date.getUTCHours().toString().padStart(2, "0");
    const minutes = date.getUTCMinutes().toString().padStart(2, "0");

    return `${dayOfWeek}, ${month} ${day}, ${hours}:${minutes} UTC`;
  };

  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const currentTime = new Date().getTime();
      const difference = startTime - currentTime;

      if (difference <= 0) {
        clearInterval(interval);
        setTimeRemaining(0);
      } else {
        setTimeRemaining(difference);
      }
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [startTime]);
  return (
    <div className="tw-mt-2 tw-flex tw-gap-x-8">
      <div className="tw-flex tw-flex-col">
        <span className="tw-text-iron-400 tw-text-sm tw-font-medium">
          Start Time
        </span>
        <span className="tw-mt-1 tw-text-iron-300 tw-font-medium tw-text-base">
          {getFormattedTs(startTime * 1000)}
        </span>
      </div>
      <div className="tw-flex tw-flex-col">
        <span className="tw-text-iron-400 tw-text-sm tw-font-medium">
          End Time
        </span>
        <span className="tw-mt-1 tw-text-iron-300 tw-font-medium tw-text-base">
          {getFormattedTs(endTime * 1000)}
        </span>
      </div>
      <div className="tw-flex tw-flex-col">
        <span className="tw-text-iron-400 tw-text-sm tw-font-medium">
          Countdown
        </span>
        <span className="tw-inline-flex tw-items-center tw-mt-1 tw-text-iron-300 tw-font-medium tw-text-base">
          <svg
            className="tw-h-5 tw-w-5 tw-mr-2 tw-text-primary-300"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 6V12L16 14M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>{formatTime(timeRemaining)}</span>
        </span>
      </div>
    </div>
  );
}
