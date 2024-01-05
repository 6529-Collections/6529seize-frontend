import { useEffect, useState } from "react";
import { ProfileActivityLog } from "../../../../../entities/IProfile";
import { getTimeAgo } from "../../../../../helpers/Helpers";

export default function ProfileActivityLogItemTimeAgo({
  log,
}: {
  readonly log: ProfileActivityLog;
}) {
  const [timeAgo, setTimeAgo] = useState<string>("");
  useEffect(() => {
    setTimeAgo(getTimeAgo(new Date(log.created_at).getTime()));
  }, []);
  return (
    <span className="tw-whitespace-nowrap tw-font-light tw-text-sm tw-text-iron-500">
      {timeAgo}
    </span>
  );
}
