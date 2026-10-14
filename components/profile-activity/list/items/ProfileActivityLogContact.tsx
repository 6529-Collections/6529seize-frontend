import { PROFILE_ACTIVITY_BODY } from "@/components/profile-activity/profileActivityTypography";
import type { ProfileActivityLogContactsEdit } from "@/entities/IProfile";
import { PROFILE_ACTIVITY_LOG_ACTION_STR } from "@/entities/IProfile";
import SocialStatementIcon from "@/components/user/utils/icons/SocialStatementIcon";
import ProfileActivityLogItemAction from "./utils/ProfileActivityLogItemAction";
import ProfileActivityLogItemValueWithCopy from "./utils/ProfileActivityLogItemValueWithCopy";

export default function ProfileActivityLogContact({
  log,
}: {
  readonly log: ProfileActivityLogContactsEdit;
}) {
  return (
    <>
      <ProfileActivityLogItemAction
        action={PROFILE_ACTIVITY_LOG_ACTION_STR[log.contents.action]}
      />
      <span
        className={`tw-whitespace-nowrap tw-text-sm tw-font-medium tw-text-iron-300 lg:tw-text-base ${PROFILE_ACTIVITY_BODY}`}
      >
        contact
      </span>
      <div className="tw-flex tw-h-5 tw-w-5 tw-flex-shrink-0 tw-items-center tw-text-iron-200">
        <SocialStatementIcon
          statementType={log.contents.statement.statement_type}
        />
      </div>
      <ProfileActivityLogItemValueWithCopy
        title={log.contents.statement.statement_value}
        value={log.contents.statement.statement_value}
      />
    </>
  );
}
