import { IProfileAndConsolidations } from "../../../../../entities/IProfile";
import {
  PROFILE_PROXY_ACTION_HAVE_CREDIT,
  PROFILE_PROXY_ACTION_LABELS,
  ProfileProxySide,
} from "../../../../../entities/IProxy";
import { ApiProfileProxy } from "../../../../../generated/models/ApiProfileProxy";
import { ApiProfileProxyAction } from "../../../../../generated/models/ApiProfileProxyAction";
import { getTimeAgo } from "../../../../../helpers/Helpers";
import { getProfileProxyActionStatus } from "../../../../../helpers/profile-proxy.helpers";
import ProxyActionAcceptanceButton from "../action/ProxyActionAcceptanceButton";
import ProfileProxyCredit from "../action/utils/credit/ProfileProxyCredit";
import ProfileProxyEndTime from "../action/utils/time/ProfileProxyEndTime";
import { PROXY_ACTION_ROW_VIEW_MODE } from "./ProxyActionRow";
import ProxyActionRowStatus from "./ProxyActionRowStatus";

export default function ProxyActionRowDataMode({
  action,
  profileProxy,
  profile,
  isSelf,
  setViewMode,
}: {
  readonly action: ApiProfileProxyAction;
  readonly profileProxy: ApiProfileProxy;
  readonly profile: IProfileAndConsolidations;
  readonly isSelf: boolean;
  readonly setViewMode: (mode: PROXY_ACTION_ROW_VIEW_MODE) => void;
}) {
  const grantorStatus = getProfileProxyActionStatus({
    action,
    side: ProfileProxySide.GRANTED,
  });
  const receiverStatus = getProfileProxyActionStatus({
    action,
    side: ProfileProxySide.RECEIVED,
  });

  return (
    <div className="xl:tw-h-14 tw-relative tw-grid tw-grid-cols-[repeat(13,minmax(0,1fr))] tw-gap-y-3 tw-gap-x-4 tw-justify-between lg:tw-items-center tw-w-full tw-py-4 xl:tw-py-0 tw-px-4">
      <div className="tw-col-span-full md:tw-col-span-2">
        <div className="tw-flex tw-items-center tw-gap-x-3">
          <p className="tw-mb-0 tw-text-md tw-font-medium tw-text-iron-50">
            {PROFILE_PROXY_ACTION_LABELS[action.action_type]}
          </p>
        </div>
      </div>
      <div className="tw-col-span-full md:tw-col-span-3">
        <div className="tw-flex md:tw-flex-col lg:tw-flex-row tw-gap-3">
          <ProxyActionRowStatus
            status={grantorStatus}
            statusOwnerProfile={profileProxy.created_by}
            side={ProfileProxySide.GRANTED}
          />
          <ProxyActionRowStatus
            status={receiverStatus}
            statusOwnerProfile={profileProxy.granted_to}
            side={ProfileProxySide.RECEIVED}
          />
        </div>
      </div>
      <div className="tw-col-span-full md:tw-col-span-2">
        {PROFILE_PROXY_ACTION_HAVE_CREDIT[action.action_type] && (
          <ProfileProxyCredit
            profileProxy={profileProxy}
            profileProxyAction={action}
            onCreditEdit={() =>
              setViewMode(PROXY_ACTION_ROW_VIEW_MODE.CREDIT_EDIT)
            }
          />
        )}
      </div>
      <div className="tw-col-span-full md:tw-col-span-4">
        <div className="tw-flex md:tw-flex-col lg:tw-flex-row tw-gap-y-3 tw-gap-x-6">
          <p className="tw-flex tw-items-center tw-whitespace-nowrap tw-mb-0 tw-space-x-1 tw-text-md tw-font-normal tw-leading-6 tw-text-iron-500">
            <span>Start:</span>
            <span className="tw-text-iron-300 tw-font-normal">
              {getTimeAgo(action.created_at)}
            </span>
          </p>
          <div className="tw-flex tw-items-center tw-space-x-1">
            <span className="tw-text-md tw-font-normal tw-text-iron-500">
              End:
            </span>
            <ProfileProxyEndTime
              profileProxy={profileProxy}
              profileProxyAction={action}
              onEndTimeEdit={() =>
                setViewMode(PROXY_ACTION_ROW_VIEW_MODE.END_TIME_EDIT)
              }
            />
          </div>
        </div>
      </div>
      <div className="tw-col-span-full md:tw-col-span-2">
        {isSelf && (
          <ProxyActionAcceptanceButton
            action={action}
            profile={profile}
            profileProxy={profileProxy}
          />
        )}
      </div>
    </div>
  );
}
