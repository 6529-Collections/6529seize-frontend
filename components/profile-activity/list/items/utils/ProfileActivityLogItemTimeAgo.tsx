import { PROFILE_ACTIVITY_META } from "@/components/profile-activity/profileActivityTypography";
import type { ProfileActivityLog } from "@/entities/IProfile";
import { getTimeAgo } from "@/helpers/Helpers";

export default function ProfileActivityLogItemTimeAgo({
  log,
}: {
  readonly log: ProfileActivityLog;
}) {
  const timeAgo = getTimeAgo(new Date(log.created_at).getTime());
  return (
    <span
      className={`tw-whitespace-nowrap tw-text-xs tw-font-normal tw-text-iron-500 lg:tw-text-sm ${PROFILE_ACTIVITY_META}`}
    >
      {timeAgo}
    </span>
  );
}
