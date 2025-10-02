import { useEffect, useState } from "react";

import { getTimeAgo, getTimeAgoShort } from "@/helpers/Helpers";

export default function CommonTimeAgo({
  timestamp,
  short = false,
  className = "tw-text-sm sm:tw-text-base",
}: {
  readonly timestamp: number;
  readonly short?: boolean;
  readonly className?: string;
}) {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      forceUpdate((value) => value + 1);
    }, 60_000);

    return () => {
      clearInterval(interval);
    };
  }, [timestamp, short]);

  const text = short ? getTimeAgoShort(timestamp) : getTimeAgo(timestamp);
  const date = new Date(timestamp);
  const isoTimestamp = date.toISOString();
  const readableTimestamp = date.toLocaleString();

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
