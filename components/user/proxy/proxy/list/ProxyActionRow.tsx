import { ProfileProxyAction } from "../../../../../generated/models/ProfileProxyAction";
import { getProfileProxyActionStatus } from "../../../../../helpers/profile-proxy.helpers";
import {
  PROFILE_PROXY_ACTION_HAVE_CREDIT,
  PROFILE_PROXY_ACTION_LABELS,
} from "../../../../../entities/IProxy";
import { ProfileProxy } from "../../../../../generated/models/ProfileProxy";
import { IProfileAndConsolidations } from "../../../../../entities/IProfile";
import ProxyActionAcceptanceButton from "../action/ProxyActionAcceptanceButton";
import ProfileProxyEndTime from "../action/utils/time/ProfileProxyEndTime";
import ProfileProxyCredit from "../action/utils/credit/ProfileProxyCredit";

export default function ProxyActionRow({
  action,
  profileProxy,
  profile,
}: {
  readonly action: ProfileProxyAction;
  readonly profileProxy: ProfileProxy;
  readonly profile: IProfileAndConsolidations;
}) {
  const status = getProfileProxyActionStatus(action);

  return (
    <div className="tw-grid tw-grid-cols-12 tw-gap-x-4 tw-justify-between tw-items-center tw-w-full tw-p-4 tw-rounded-lg tw-ring-1 tw-ring-iron-600">
      <div className="tw-col-span-2">
        <div className="tw-flex tw-items-center tw-gap-x-3">
          <p className="tw-mb-0 tw-text-base tw-font-medium tw-text-iron-50">
            {PROFILE_PROXY_ACTION_LABELS[action.action_type]}
          </p>
        </div>
      </div>
      <div className="tw-inline-flex tw-col-span-2">
        <div className="tw-rounded-full tw-flex-none tw-py-1 tw-px-2.5 tw-text-xs tw-font-medium tw-ring-1 tw-ring-inset tw-text-[#FEC84B] tw-bg-[#FEC84B]/10 tw-ring-[#FEC84B]/20">
          {status}
        </div>
        <div className="tw-hidden tw-rounded-full tw-flex-none tw-py-1 tw-px-2.5 tw-text-xs tw-font-medium tw-ring-1 tw-ring-inset tw-text-green tw-bg-green/10 tw-ring-green/20">
          Accepted
        </div>
        <div className="tw-hidden tw-rounded-full tw-flex-none tw-py-1 tw-px-2.5 tw-text-xs tw-font-medium tw-ring-1 tw-ring-inset tw-text-red tw-bg-red/10 tw-ring-red/20">
          Rejected
        </div>
        <div className="tw-hidden tw-rounded-full tw-flex-none tw-py-1 tw-px-2.5 tw-text-xs tw-font-medium tw-ring-1 tw-ring-inset tw-text-red tw-bg-red/10 tw-ring-red/20">
          Revoked
        </div>
        <div className="tw-hidden tw-rounded-full tw-flex-none tw-py-1 tw-px-2.5 tw-text-xs tw-font-medium tw-ring-1 tw-ring-inset tw-text-iron-300 tw-bg-iron-400/10 tw-ring-iron-400/20">
          Expired
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
        <p className="tw-flex tw-items-center tw-mb-0 tw-gap-x-2 tw-text-base tw-font-normal tw-leading-6 tw-text-iron-500">
          3 days
        </p>
      </div>
      <div className="tw-col-span-2">
        <ProfileProxyEndTime
          profileProxy={profileProxy}
          profileProxyAction={action}
        />
      </div>
      <div className="tw-col-span-2">
        <ProxyActionAcceptanceButton
          action={action}
          profile={profile}
          profileProxy={profileProxy}
        />
      </div>
    </div>
  );
}
