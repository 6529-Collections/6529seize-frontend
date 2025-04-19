import {
  PROFILE_ACTIVITY_LOG_ACTION_STR,
  ProfileActivityLogNftAccountsEdit,
} from "../../../../entities/IProfile";
import SocialStatementIcon from "../../../user/utils/icons/SocialStatementIcon";
import ProfileActivityLogItemAction from "./utils/ProfileActivityLogItemAction";
import ProfileActivityLogItemValueWithCopy from "./utils/ProfileActivityLogItemValueWithCopy";

export default function ProfileActivityLogNFTAccount({
  log,
}: {
  readonly log: ProfileActivityLogNftAccountsEdit;
}) {
  return (
    <>
      <ProfileActivityLogItemAction
        action={PROFILE_ACTIVITY_LOG_ACTION_STR[log.contents.action]}
      />
      <span className="tw-whitespace-nowrap tw-text-base tw-text-iron-300 tw-font-medium">
        NFT Account
      </span>
      <div className="tw-flex tw-items-center tw-shrink-0 tw-h-5 tw-w-5 tw-text-iron-100">
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
