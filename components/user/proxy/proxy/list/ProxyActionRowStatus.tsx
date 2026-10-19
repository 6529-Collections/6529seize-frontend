import { ProfileProxyActionStatus, ProfileProxySide } from "@/entities/IProxy";
import type { ApiProfileMin } from "@/generated/models/ApiProfileMin";
import { Tooltip } from "react-tooltip";
import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";

const STATUS_CLASSES: Record<ProfileProxyActionStatus, string> = {
  [ProfileProxyActionStatus.ACTIVE]:
    "tw-text-green tw-bg-green/10 tw-ring-green/20",
  [ProfileProxyActionStatus.REJECTED]:
    "tw-text-red tw-bg-red/10 tw-ring-red/20",
  [ProfileProxyActionStatus.REVOKED]: "tw-text-red tw-bg-red/10 tw-ring-red/20",
  [ProfileProxyActionStatus.PENDING]:
    "tw-text-[#FEC84B] tw-bg-[#FEC84B]/10 tw-ring-[#FEC84B]/20",
};

const STATUS_LABELS: Record<
  ProfileProxySide,
  Record<ProfileProxyActionStatus, string>
> = {
  [ProfileProxySide.GRANTED]: {
    [ProfileProxyActionStatus.ACTIVE]: "Granted",
    [ProfileProxyActionStatus.REJECTED]: "Rejected",
    [ProfileProxyActionStatus.REVOKED]: "Revoked",
    [ProfileProxyActionStatus.PENDING]: "Pending",
  },
  [ProfileProxySide.RECEIVED]: {
    [ProfileProxyActionStatus.ACTIVE]: "Accepted",
    [ProfileProxyActionStatus.REJECTED]: "Rejected",
    [ProfileProxyActionStatus.REVOKED]: "Revoked",
    [ProfileProxyActionStatus.PENDING]: "Pending",
  },
};

export default function ProxyActionRowStatus({
  status,
  statusOwnerProfile,
  side,
}: {
  readonly status: ProfileProxyActionStatus;
  readonly statusOwnerProfile: ApiProfileMin;
  readonly side: ProfileProxySide;
}) {
  return (
    <>
      <div
        className={`tw-inline-flex tw-items-center tw-gap-1.5 ${side === ProfileProxySide.GRANTED ? "tw-min-w-24" : ""}`}
        data-tooltip-id={`proxy-status-${statusOwnerProfile.id}`}
      >
        {statusOwnerProfile.pfp ? (
          <img
            src={getScaledImageUri(
              statusOwnerProfile.pfp,
              ImageScale.W_AUTO_H_50
            )}
            alt="Profile picture"
            className="tw-h-[22px] tw-w-[22px] tw-flex-none tw-rounded-md tw-bg-iron-800 tw-ring-1 tw-ring-inset tw-ring-white/[0.08]"
          />
        ) : (
          <div className="tw-h-[22px] tw-w-[22px] tw-flex-none tw-rounded-md tw-bg-iron-800 tw-ring-1 tw-ring-inset tw-ring-white/[0.08]"></div>
        )}
        <div
          className={`${STATUS_CLASSES[status]} tw-flex-none tw-rounded-full tw-px-2 tw-py-0.5 tw-text-center tw-text-[11px] tw-font-medium tw-leading-4 tw-ring-1 tw-ring-inset`}
        >
          {STATUS_LABELS[side][status]}
        </div>
      </div>
      <Tooltip
        id={`proxy-status-${statusOwnerProfile.id}`}
        style={{
          backgroundColor: "#1F2937",
          color: "white",
          padding: "4px 8px",
        }}
      >
        {statusOwnerProfile.handle}
      </Tooltip>
    </>
  );
}
