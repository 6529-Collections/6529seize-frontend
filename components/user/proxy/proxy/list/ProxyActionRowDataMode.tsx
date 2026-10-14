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
    <div
      data-proxy-action-row
      className={`tw-relative tw-grid tw-w-full tw-grid-cols-2 tw-gap-x-4 tw-gap-y-3 tw-px-4 tw-py-3.5 @[38rem]/proxy-row:tw-items-center @[64rem]/proxy-row:tw-min-h-14 @[64rem]/proxy-row:tw-grid-cols-[minmax(9.5rem,1.1fr)_13.5rem_minmax(7.5rem,0.8fr)_minmax(7rem,0.8fr)_minmax(15rem,1.7fr)] @[64rem]/proxy-row:tw-gap-x-5 @[64rem]/proxy-row:tw-py-2.5 ${
        isSelf
          ? "@[72rem]/proxy-row:tw-grid-cols-[minmax(9.5rem,1.1fr)_13.5rem_minmax(7.5rem,0.8fr)_minmax(7rem,0.8fr)_minmax(15rem,1.7fr)_auto]"
          : ""
      }`}
    >
      <div className="tw-col-span-full tw-min-w-0 @[38rem]/proxy-row:tw-col-span-1 @[64rem]/proxy-row:tw-col-auto">
        <div className="tw-flex tw-items-center tw-gap-x-3">
          <p className="tw-m-0 tw-text-sm tw-font-medium tw-leading-5 tw-text-iron-50">
            {PROFILE_PROXY_ACTION_LABELS[action.action_type]}
          </p>
        </div>
      </div>
      <div className="tw-col-span-full tw-min-w-0 @[38rem]/proxy-row:tw-col-span-1 @[64rem]/proxy-row:tw-col-auto">
        <div className="tw-flex tw-flex-row tw-flex-wrap tw-items-center tw-gap-3">
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
      <div className="tw-col-span-full tw-min-w-0 @[38rem]/proxy-row:tw-col-span-1 @[64rem]/proxy-row:tw-col-auto">
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
      <div className="tw-col-span-full tw-min-w-0 @[38rem]/proxy-row:tw-col-span-1 @[64rem]/proxy-row:tw-col-auto">
        {PROFILE_PROXY_ACTION_HAVE_CREDIT[action.action_type] && (
          <ProfileProxyCreditSpent profileProxyAction={action} />
        )}
      </div>
      <div className="tw-col-span-full tw-min-w-0 @[64rem]/proxy-row:tw-col-auto">
        <div className="tw-flex tw-flex-row tw-flex-wrap tw-items-center tw-gap-x-6 tw-gap-y-2">
          <p className="tw-m-0 tw-flex tw-items-center tw-space-x-1 tw-whitespace-nowrap tw-text-meta tw-font-normal tw-tabular-nums tw-leading-5 tw-text-iron-500">
            <span>Start:</span>
            <span className="tw-font-normal tw-text-iron-300">
              {getTimeAgo(action.start_time)}
            </span>
          </p>
          <div className="tw-flex tw-items-center tw-space-x-1">
            <span className="tw-text-meta tw-font-normal tw-leading-5 tw-text-iron-500">
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
      {isSelf && (
        <div className="tw-col-span-full tw-min-w-0 @[72rem]/proxy-row:tw-col-auto">
          <ProxyActionAcceptanceButton
            action={action}
            profile={profile}
            profileProxy={profileProxy}
          />
        </div>
      )}
    </div>
  );
}
