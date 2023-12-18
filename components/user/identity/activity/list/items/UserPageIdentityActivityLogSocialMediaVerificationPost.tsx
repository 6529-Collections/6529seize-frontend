import {
  IProfileAndConsolidations,
  PROFILE_ACTIVITY_LOG_ACTION_STR,
  ProfileActivityLogSocialVerificationPostEdit,
} from "../../../../../../entities/IProfile";
import SocialStatementIcon from "../../../../utils/icons/SocialStatementIcon";
import UserPageIdentityActivityLogItemTimeAgo from "./UserPageIdentityActivityLogItemTimeAgo";
import UserPageIdentityActivityLogItemHandle from "./utils/UserPageIdentityActivityLogItemHandle";
import UserPageIdentityActivityLogItemAction from "./utils/UserPageIdentityActivityLogItemAction";
import UserPageIdentityActivityLogItemValueWithCopy from "./utils/UserPageIdentityActivityLogItemValueWithCopy";

interface Props {
  readonly log: ProfileActivityLogSocialVerificationPostEdit;
  readonly profile: IProfileAndConsolidations;
}

export default function UserPageIdentityActivityLogSocialMediaVerificationPost(
  props: Props
) {
  return (
    <tr>
      <td className="tw-py-4 tw-flex tw-items-center">
        <div className="tw-mt-1 tw-inline-flex tw-space-x-1.5">
          <UserPageIdentityActivityLogItemHandle profile={props.profile} />
          <UserPageIdentityActivityLogItemAction
            action={PROFILE_ACTIVITY_LOG_ACTION_STR[props.log.contents.action]}
          />
          <span className="tw-whitespace-nowrap tw-text-sm tw-text-iron-300 tw-font-medium">
            social media verification post
          </span>
          <div className="tw-flex tw-items-center tw-flex-shrink-0 tw-h-5 tw-w-5 tw-text-iron-100">
            <SocialStatementIcon
              statementType={props.log.contents.statement.statement_type}
            />
          </div>
          <UserPageIdentityActivityLogItemValueWithCopy
            title={props.log.contents.statement.statement_value}
            value={props.log.contents.statement.statement_value}
          />
        </div>
      </td>
      <td className="tw-py-4 tw-pl-3 tw-text-right">
        <UserPageIdentityActivityLogItemTimeAgo log={props.log} />
      </td>
    </tr>
  );
}
