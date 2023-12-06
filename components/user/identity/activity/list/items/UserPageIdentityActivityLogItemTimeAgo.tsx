import { ProfileActivityLog } from "../../../../../../entities/IProfile";
import { getTimeAgo } from "../../../../../../helpers/Helpers";

export default function UserPageIdentityActivityLogItemTimeAgo({
  log,
}: {
  log: ProfileActivityLog;
}) {
  const timeAgo = getTimeAgo(new Date(log.created_at).getTime());
  return (
    <span className="tw-flex-none tw-text-[0.8125rem] tw-leading-5 tw-text-neutral-500">
      {timeAgo}
    </span>
  );
}
