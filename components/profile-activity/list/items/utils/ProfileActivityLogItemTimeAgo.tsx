import { ProfileActivityLog } from "../../../../../entities/IProfile";
import { getTimeAgo } from "../../../../../helpers/Helpers";

export default function ProfileActivityLogItemTimeAgo({
  log,
}: {
  readonly log: ProfileActivityLog;
}) {
  const timeAgo = getTimeAgo(new Date(log.created_at).getTime());
  return (
    <span className="tw-whitespace-nowrap tw-text-[0.8125rem] tw-leading-5 tw-text-iron-500">
      {timeAgo}
    </span>
  );
}
