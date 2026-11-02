import { PROFILE_ACTIVITY_BODY } from "@/components/profile-activity/profileActivityTypography";
import type { ProfileActivityLogGeneralCicStatementEdit } from "@/entities/IProfile";
import ProfileActivityLogItemAction from "./utils/ProfileActivityLogItemAction";

export default function ProfileActivityLogGeneralStatement({
  log,
}: {
  readonly log: ProfileActivityLogGeneralCicStatementEdit;
}) {
  return (
    <div className="tw-flex tw-min-w-0 tw-max-w-full tw-gap-x-1">
      <ProfileActivityLogItemAction action="changed" />
      <span
        className={`tw-whitespace-nowrap tw-text-sm tw-font-medium tw-text-iron-300 lg:tw-text-base ${PROFILE_ACTIVITY_BODY}`}
      >
        About
      </span>
      <span
        className={`tw-min-w-0 tw-overflow-hidden tw-truncate tw-text-sm tw-font-medium tw-text-iron-300 lg:tw-text-base ${PROFILE_ACTIVITY_BODY}`}
      >
        {log.contents.statement.statement_value}
      </span>
    </div>
  );
}
