"use client";

import type { ApiProfileProxy } from "@/generated/models/ApiProfileProxy";
import type { ApiProfileProxyAction } from "@/generated/models/ApiProfileProxyAction";
import { useAuth } from "@/components/auth/Auth";
import PencilIcon, {
  PencilIconSize,
} from "@/components/utils/icons/PencilIcon";
import { formatNumberWithCommas } from "@/helpers/Helpers";

export default function ProfileProxyCredit({
  profileProxy,
  profileProxyAction,
  onCreditEdit,
}: {
  readonly profileProxy: ApiProfileProxy;
  readonly profileProxyAction: ApiProfileProxyAction;
  readonly onCreditEdit: () => void;
}) {
  const { connectedProfile } = useAuth();
  const isOwner = connectedProfile?.id === profileProxy.created_by.id;

  return (
    <div className="tw-flex tw-min-w-0 tw-items-center tw-justify-start">
      <p className="tw-m-0 tw-flex tw-min-w-0 tw-flex-wrap tw-items-center tw-gap-x-1.5 tw-text-meta tw-leading-5 tw-font-normal tw-text-iron-500">
        <span className="tw-font-normal tw-text-iron-500">Credit:</span>
        <span className="tw-break-all tw-font-medium tw-tabular-nums tw-text-iron-200">
          {formatNumberWithCommas(profileProxyAction.credit_amount ?? 0)}
        </span>
      </p>
      {isOwner && (
        <button
          type="button"
          aria-label="Edit credit"
          className="tw-group tw-flex tw-h-7 tw-w-7 tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-transparent tw-text-iron-300 tw-transition tw-duration-300 tw-ease-out hover:tw-text-iron-400"
          onClick={onCreditEdit}
        >
          <PencilIcon size={PencilIconSize.SMALL} />
        </button>
      )}
    </div>
  );
}
