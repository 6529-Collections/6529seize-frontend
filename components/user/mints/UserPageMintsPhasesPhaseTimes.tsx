import { useEffect, useState } from "react";
import UserPageMintsPhasesPhaseTimesNotStarted from "./UserPageMintsPhasesPhaseTimesNotStarted";
import UserPageMintsPhasesPhaseTimesCountdown from "./UserPageMintsPhasesPhaseTimesCountdown";

export default function UserPageMintsPhasesPhaseTimes({}: //startTime,
// endTime,
{
  readonly startTime: number;
  readonly endTime: number;
}) {
  const startTime = 1706631956000;
  const endTime = 1706646356000;
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

  return (
    <div className="tw-mt-2 tw-flex tw-gap-x-8">
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
