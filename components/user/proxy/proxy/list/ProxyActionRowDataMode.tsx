import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import {
  PROFILE_PROXY_ACTION_HAVE_CREDIT,
  PROFILE_PROXY_ACTION_LABELS,
  ProfileProxySide,
} from "@/entities/IProxy";
import type { ApiProfileProxy } from "@/generated/models/ApiProfileProxy";
import type { ApiProfileProxyAction } from "@/generated/models/ApiProfileProxyAction";
import { getTimeAgo } from "@/helpers/Helpers";
import { getProfileProxyActionStatus } from "@/helpers/profile-proxy.helpers";
import ProxyActionAcceptanceButton from "../action/ProxyActionAcceptanceButton";
import ProfileProxyCredit from "../action/utils/credit/ProfileProxyCredit";
import ProfileProxyCreditSpent from "../action/utils/credit/ProfileProxyCreditSpent";
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
  readonly profile: ApiIdentity;
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
    <div className="tw-relative tw-grid tw-w-full tw-grid-cols-[repeat(15,minmax(0,1fr))] tw-justify-between tw-gap-x-4 tw-gap-y-3 tw-px-4 tw-py-4 lg:tw-items-center xl:tw-h-14 xl:tw-py-0">
      <div className="tw-col-span-full md:tw-col-span-2">
        <div className="tw-flex tw-items-center tw-gap-x-3">
          <p className="tw-mb-0 tw-text-md tw-font-medium tw-text-iron-50">
            {PROFILE_PROXY_ACTION_LABELS[action.action_type]}
          </p>
        </div>
      </div>
      <div className="tw-col-span-full md:tw-col-span-3">
        <div className="tw-flex tw-gap-3 md:tw-flex-col lg:tw-flex-row">
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
      <div className="tw-col-span-full md:tw-col-span-2">
        {PROFILE_PROXY_ACTION_HAVE_CREDIT[action.action_type] && (
          <ProfileProxyCreditSpent profileProxyAction={action} />
        )}
      </div>
      <div className="tw-col-span-full md:tw-col-span-4">
        <div className="tw-flex tw-gap-x-6 tw-gap-y-3 md:tw-flex-col lg:tw-flex-row">
          <p className="tw-mb-0 tw-flex tw-items-center tw-space-x-1 tw-whitespace-nowrap tw-text-md tw-font-normal tw-leading-6 tw-text-iron-500">
            <span>Start:</span>
            <span className="tw-font-normal tw-text-iron-300">
              {getTimeAgo(action.start_time)}
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
