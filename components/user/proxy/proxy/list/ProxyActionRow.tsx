import { ProfileProxyAction } from "../../../../../generated/models/ProfileProxyAction";
import { getProfileProxyActionStatus } from "../../../../../helpers/profile-proxy.helpers";
import {
  PROFILE_PROXY_ACTION_HAVE_CREDIT,
  PROFILE_PROXY_ACTION_LABELS,
  ProfileProxyActionStatus,
  ProfileProxySide,
} from "../../../../../entities/IProxy";
import { ProfileProxy } from "../../../../../generated/models/ProfileProxy";
import { IProfileAndConsolidations } from "../../../../../entities/IProfile";
import ProxyActionAcceptanceButton from "../action/ProxyActionAcceptanceButton";
import ProfileProxyEndTime from "../action/utils/time/ProfileProxyEndTime";
import ProfileProxyCredit from "../action/utils/credit/ProfileProxyCredit";

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

export default function ProxyActionRow({
  action,
  profileProxy,
  profile,
  isSelf,
}: {
  readonly action: ProfileProxyAction;
  readonly profileProxy: ProfileProxy;
  readonly profile: IProfileAndConsolidations;
  readonly isSelf: boolean;
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
    <div className="tw-grid tw-grid-cols-12 tw-gap-x-4 tw-justify-between tw-items-center tw-w-full tw-py-3 tw-px-4 tw-rounded-lg tw-ring-1 tw-ring-iron-600">
      <div className="tw-col-span-2">
        <div className="tw-flex tw-items-center tw-gap-x-3">
          <p className="tw-mb-0 tw-text-base tw-font-medium tw-text-iron-50">
            {PROFILE_PROXY_ACTION_LABELS[action.action_type]}
          </p>
        </div>
      </div>
      <div className="tw-inline-flex tw-col-span-3 tw-space-x-4">
        <div className="tw-inline-flex tw-space-x-2">
          <img
            src={profileProxy.created_by.pfp ?? ""}
            alt=""
            className="tw-flex-shrink-0 tw-h-6 tw-w-6 tw-flex-none tw-rounded-lg tw-bg-iron-800 tw-ring-1 tw-ring-white/30"
          />
          <div
            className={`${STATUS_CLASSES[grantorStatus]} tw-w-20 tw-text-center tw-rounded-full tw-flex-none tw-py-1 tw-px-2.5 tw-text-xs tw-font-medium tw-ring-1 tw-ring-inset`}
          >
            {STATUS_LABELS[grantorStatus]}
          </div>
        </div>
        <div className="tw-inline-flex tw-space-x-2">
          <img
            src={profileProxy.granted_to.pfp ?? ""}
            alt=""
            className="tw-flex-shrink-0 tw-h-6 tw-w-6 tw-flex-none tw-rounded-lg tw-bg-iron-800 tw-ring-1 tw-ring-white/30"
          />
          <div
            className={`${STATUS_CLASSES[receiverStatus]} tw-w-20 tw-text-center tw-rounded-full tw-flex-none tw-py-1 tw-px-2.5 tw-text-xs tw-font-medium tw-ring-1 tw-ring-inset`}
          >
            {STATUS_LABELS[receiverStatus]}
          </div>
        </div>
      </div>
      <div className="tw-col-span-2">
        {PROFILE_PROXY_ACTION_HAVE_CREDIT[action.action_type] && (
          <ProfileProxyCredit
            profileProxy={profileProxy}
            profileProxyAction={action}
          />
        )}
      </div>
      <div className="tw-col-span-2">
        <p className="tw-flex tw-items-center tw-mb-0 tw-gap-x-1.5 tw-text-base tw-font-normal tw-leading-6 tw-text-iron-500">
          <span>Start time:</span>
          <span>3 days</span>
        </p>
      </div>
      <div className="tw-col-span-2">
        <div className="tw-flex tw-items-center tw-gap-x-1.5">
          <span className="tw-text-base tw-font-normal tw-text-iron-500">
            End time:
          </span>
          <ProfileProxyEndTime
            profileProxy={profileProxy}
            profileProxyAction={action}
          />
        </div>
      </div>
      <div className="tw-col-span-1">
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
