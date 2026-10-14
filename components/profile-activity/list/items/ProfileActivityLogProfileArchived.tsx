import { PROFILE_ACTIVITY_BODY } from "@/components/profile-activity/profileActivityTypography";
import type { ProfileActivityLogArchived } from "@/entities/IProfile";

export default function ProfileActivityLogProfileArchived({
  log,
}: {
  readonly log: ProfileActivityLogArchived;
}) {
  return (
    <>
      <span
        className={`tw-whitespace-nowrap tw-text-sm tw-font-medium tw-text-iron-300 lg:tw-text-base ${PROFILE_ACTIVITY_BODY}`}
      >
        profile
      </span>
      <span
        className={`tw-whitespace-nowrap tw-text-sm tw-font-medium tw-text-iron-300 lg:tw-text-base ${PROFILE_ACTIVITY_BODY}`}
      >
        {log.contents.handle}
      </span>
      <span
        className={`tw-whitespace-nowrap tw-text-sm tw-font-medium tw-text-iron-300 lg:tw-text-base ${PROFILE_ACTIVITY_BODY}`}
      >
        archived
      </span>
    </>
  );
}
