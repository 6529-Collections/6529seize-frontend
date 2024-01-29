import { useEffect, useState } from "react";

enum CountdownState {
  NOT_STARTED = "NOT_STARTED",
  IN_PROGRESS = "IN_PROGRESS",
  ENDED = "ENDED",
}

export default function UserPageMintsPhasesPhaseTimesCountdown({
  startTime,
  endTime,
}: {
  readonly startTime: number;
  readonly endTime: number;
}) {
  const STATE_TO_LABEL: Record<CountdownState, string> = {
    [CountdownState.NOT_STARTED]: "Countdown",
    [CountdownState.IN_PROGRESS]: "Ends In",
    [CountdownState.ENDED]: "Ended",
  };

  const formatTime = (time: number): string => {
    if (time <= 0) {
      return "0 Days 0 Hours 0 Minutes 0 Seconds";
    }
    const seconds = Math.floor((time / 1000) % 60);
    const minutes = Math.floor((time / 1000 / 60) % 60);
    const hours = Math.floor((time / (1000 * 60 * 60)) % 24);
    const days = Math.floor(time / (1000 * 60 * 60 * 24));
    let response = "";
    if (days > 0) {
      response += `${days} ${days === 1 ? "Day" : "Days"} `;
    }
    if (hours > 0 || days > 0) {
      response += `${hours} ${hours === 1 ? "Hour" : "Hours"} `;
    }
    if (minutes > 0 || hours > 0 || days > 0) {
      response += `${minutes} ${minutes === 1 ? "Minute" : "Minutes"} `;
    }
    response += `${seconds} ${seconds === 1 ? "Second" : "Seconds"}`;

    return response;
  };
  const [temp, setTemp] = useState<number>(0);

  const getProgress = (startTime: number, endTime: number, temp: number) => {
    const currentTime = new Date().getTime(); //1706646356000 + temp ?? new Date().getTime();
    if (currentTime < startTime) {
      return CountdownState.NOT_STARTED;
    } else if (currentTime > endTime) {
      return CountdownState.ENDED;
    } else {
      return CountdownState.IN_PROGRESS;
    }
  };

  const getDifference = (startTime: number, endTime: number, temp: number) => {
    const currentTime = new Date().getTime(); //1706646356000 + temp ?? new Date().getTime();
    if (currentTime < startTime) {
      return startTime - currentTime;
    } else if (currentTime < endTime) {
      return endTime - currentTime;
    } else {
      return currentTime - endTime;
    }
  };

  const [progress, setProgress] = useState<CountdownState>(
    getProgress(startTime, endTime, temp)
  );

  const [time, setTime] = useState<number>(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(getDifference(startTime, endTime, temp));
      setProgress(getProgress(startTime, endTime, temp));
      // setTemp((t) => t + 1000);
    }, 1000);
    return () => {
      clearInterval(interval);
    };
  }, [startTime, endTime]); // temp
  return (
    <div className="tw-flex tw-flex-col">
      <span className="tw-text-iron-400 tw-text-sm tw-font-medium">
        {STATE_TO_LABEL[progress]}
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
        <span>
          {formatTime(time)} {progress === CountdownState.ENDED ? " ago" : ""}
        </span>
      </span>
    </div>
  );
}
