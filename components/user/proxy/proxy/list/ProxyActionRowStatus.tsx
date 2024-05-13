import { ProfileProxyActionStatus } from "../../../../../entities/IProxy";
import { ProfileMin } from "../../../../../generated/models/ProfileMin";
import Tippy from "@tippyjs/react";

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

export default function ProxyActionRowStatus({
  status,
  statusOwnerProfile,
}: {
  readonly status: ProfileProxyActionStatus;
  readonly statusOwnerProfile: ProfileMin;
}) {
  return (
    <Tippy content={statusOwnerProfile.handle}>
      <div className="tw-inline-flex tw-space-x-2 lg:tw-min-w-[6.6rem]">
        {statusOwnerProfile.pfp ? (
          <img
            src={statusOwnerProfile.pfp}
            alt="Profile picture"
            className="tw-flex-shrink-0 tw-h-6 tw-w-6 tw-flex-none tw-rounded-lg tw-bg-iron-800 tw-ring-1 tw-ring-white/30"
          />
        ) : (
          <div className="tw-flex-shrink-0 tw-h-6 tw-w-6 tw-flex-none tw-rounded-lg tw-bg-iron-800 tw-ring-1 tw-ring-white/30"></div>
        )}
        <div
          className={`${STATUS_CLASSES[status]} tw-text-center tw-rounded-full tw-flex-none tw-py-1 tw-px-2.5 tw-text-xs tw-font-medium tw-ring-1 tw-ring-inset`}
        >
          {STATUS_LABELS[status]}
        </div>
      </div>
    </Tippy>
  );
}
