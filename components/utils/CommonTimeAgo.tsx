import { useEffect, useState } from "react";
import { getTimeAgo } from "../../helpers/Helpers";

export default function CommonTimeAgo({
  timestamp,
}: {
  readonly timestamp: number;
}) {
  const [timeAgo, setTimeAgo] = useState<string>("");
  useEffect(() => {
    setTimeAgo(getTimeAgo(timestamp));
  }, []);
  return (
    <span className="tw-whitespace-nowrap tw-font-light tw-text-sm tw-text-iron-500">
      {timeAgo}
    </span>
  );
}
