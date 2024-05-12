import { IProfileAndConsolidations } from "../../../../../entities/IProfile";
import {
  PROFILE_PROXY_ACTION_HAVE_CREDIT,
  PROFILE_PROXY_ACTION_LABELS,
  ProfileProxyActionStatus,
  ProfileProxySide,
} from "../../../../../entities/IProxy";
import { ProfileProxy } from "../../../../../generated/models/ProfileProxy";
import { ProfileProxyAction } from "../../../../../generated/models/ProfileProxyAction";
import { getTimeAgo } from "../../../../../helpers/Helpers";
import { getProfileProxyActionStatus } from "../../../../../helpers/profile-proxy.helpers";
import ProxyActionAcceptanceButton from "../action/ProxyActionAcceptanceButton";
import ProfileProxyCredit from "../action/utils/credit/ProfileProxyCredit";
import ProfileProxyEndTime from "../action/utils/time/ProfileProxyEndTime";
import { PROXY_ACTION_ROW_VIEW_MODE } from "./ProxyActionRow";

const STATUS_CLASSES: Record<ProfileProxyActionStatus, string> = {
  [ProfileProxyActionStatus.ACTIVE]:
    "tw-text-green tw-bg-green/10 tw-ring-green/20",
  [ProfileProxyActionStatus.REJECTED]:
    "tw-text-red tw-bg-red/10 tw-ring-red/20",
  [ProfileProxyActionStatus.REVOKED]: "tw-text-red tw-bg-red/10 tw-ring-red/20",
  [ProfileProxyActionStatus.PENDING]:
    "tw-text-[#FEC84B] tw-bg-[#FEC84B]/10 tw-ring-[#FEC84B]/20",
};

const STATUS_LABELS: Record<ProfileProxyActionStatus, string> = {
  [ProfileProxyActionStatus.ACTIVE]: "Active",
  [ProfileProxyActionStatus.REJECTED]: "Rejected",
  [ProfileProxyActionStatus.REVOKED]: "Revoked",
  [ProfileProxyActionStatus.PENDING]: "Pending",
};

export default function ProxyActionRowDataMode({
  action,
  profileProxy,
  profile,
  isSelf,
  setViewMode,
}: {
  readonly action: ProfileProxyAction;
  readonly profileProxy: ProfileProxy;
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
    <div className="tw-relative tw-grid tw-grid-cols-[repeat(13,minmax(0,1fr))] tw-gap-y-3 tw-gap-x-4 tw-justify-between lg:tw-items-center tw-w-full tw-py-4 xl:tw-py-0 xl:tw-h-14 tw-px-4 ">
      <div className="tw-col-span-full lg:tw-col-span-2">
        <div className="tw-flex tw-items-center tw-gap-x-3">
          <p className="tw-mb-0 tw-text-md tw-font-medium tw-text-iron-50">
            {PROFILE_PROXY_ACTION_LABELS[action.action_type]}
          </p>
        </div>
      </div>
      <div className="tw-col-span-4 lg:tw-col-span-3">
        <div className="tw-flex tw-gap-x-3">
          <div className="tw-inline-flex tw-space-x-2 lg:tw-min-w-[6.6rem]">
            {profileProxy.created_by.pfp ? (
              <img
                src={profileProxy.created_by.pfp}
                alt="Profile picture"
                className="tw-flex-shrink-0 tw-h-6 tw-w-6 tw-flex-none tw-rounded-lg tw-bg-iron-800 tw-ring-1 tw-ring-white/30"
              />
            ) : (
              <div className="tw-flex-shrink-0 tw-h-6 tw-w-6 tw-flex-none tw-rounded-lg tw-bg-iron-800 tw-ring-1 tw-ring-white/30"></div>
            )}
            <div
              className={`${STATUS_CLASSES[grantorStatus]} tw-text-center tw-rounded-full tw-flex-none tw-py-1 tw-px-2.5 tw-text-xs tw-font-medium tw-ring-1 tw-ring-inset`}
            >
              {STATUS_LABELS[grantorStatus]}
            </div>
          </div>
          <div className="tw-inline-flex tw-space-x-2 lg:tw-min-w-[6.6rem]">
            {profileProxy.granted_to.pfp ? (
              <img
                src={profileProxy.granted_to.pfp}
                alt="Profile picture"
                className="tw-flex-shrink-0 tw-h-6 tw-w-6 tw-flex-none tw-rounded-lg tw-bg-iron-800 tw-ring-1 tw-ring-white/30"
              />
            ) : (
              <div className="tw-flex-shrink-0 tw-h-6 tw-w-6 tw-flex-none tw-rounded-lg tw-bg-iron-800 tw-ring-1 tw-ring-white/30"></div>
            )}
            <div
              className={`${STATUS_CLASSES[receiverStatus]} tw-text-center tw-rounded-full tw-flex-none tw-py-1 tw-px-2.5 tw-text-xs tw-font-medium tw-ring-1 tw-ring-inset`}
            >
              {STATUS_LABELS[receiverStatus]}
            </div>
          </div>
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
        <div className="tw-flex tw-gap-x-6">
          <p className="tw-flex tw-items-center tw-whitespace-nowrap tw-mb-0 tw-space-x-1 tw-text-md tw-font-normal tw-leading-6 tw-text-iron-500">
            <span>Start:</span>
            <span className="tw-text-iron-300 tw-font-normal">
              {getTimeAgo(profileProxy.created_at)}
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
