import {
  useDisplayTimeZone,
  useTimeAgoShort,
} from "@/hooks/useDisplayTimeZone";
import { withDisplayTimeZone } from "@/lib/display-time-zone/displayTimeZone";
import { useEffect, useReducer } from "react";

import { getTimeAgo } from "@/helpers/Helpers";

export default function CommonTimeAgo({
  timestamp,
  short = false,
  className = "tw-text-sm sm:tw-text-base",
}: {
  readonly timestamp: number;
  readonly short?: boolean | undefined;
  readonly className?: string | undefined;
}) {
  const timeAgoShort = useTimeAgoShort();
  const zone = useDisplayTimeZone();
  const [, forceUpdate] = useReducer((value: number) => value + 1, 0);

  useEffect(() => {
    const interval = setInterval(() => {
      forceUpdate();
    }, 60_000);

    return () => {
      clearInterval(interval);
    };
  }, [timestamp, short]);

  const text = short ? timeAgoShort(timestamp) : getTimeAgo(timestamp);
  const date = new Date(timestamp);
  const isoTimestamp = date.toISOString();
  // The hover title follows the display zone too, so a screenshot of it
  // shows UTC (with its name) when UTC is on.
  const readableTimestamp = date.toLocaleString(
    undefined,
    withDisplayTimeZone(zone, {})
  );

  return (
    <time
      className={`tw-whitespace-nowrap tw-font-normal tw-text-iron-500 ${className}`}
      dateTime={isoTimestamp}
      title={readableTimestamp}
    >
      {text}
    </time>
  );
}
