"use client";

import { useContext } from "react";
import { ApiProfileProxy } from "@/generated/models/ApiProfileProxy";
import { ApiProfileProxyAction } from "@/generated/models/ApiProfileProxyAction";
import { AuthContext } from "@/components/auth/Auth";
import { getTimeUntil } from "@/helpers/Helpers";
import PencilIcon, {
  PencilIconSize,
} from "@/components/utils/icons/PencilIcon";

export default function ProfileProxyEndTime({
  profileProxy,
  profileProxyAction,
  onEndTimeEdit,
}: {
  readonly profileProxy: ApiProfileProxy;
  readonly profileProxyAction: ApiProfileProxyAction;
  readonly onEndTimeEdit: () => void;
}) {
  const { connectedProfile } = useContext(AuthContext);
  const isOwner =
    !!connectedProfile &&
    connectedProfile.id === profileProxy.created_by.id;

  return (
    <div className="tw-flex tw-items-center">
      <span className="tw-whitespace-nowrap tw-text-iron-300 tw-text-md tw-font-normal">
        {profileProxyAction.end_time
          ? getTimeUntil(profileProxyAction.end_time)
          : "Not set"}
      </span>
      {isOwner && (
        <button
          type="button"
          aria-label="Edit end time"
          className="tw-group tw-bg-transparent tw-border-0 tw-h-8 tw-w-8 tw-flex tw-items-center tw-justify-center tw-rounded-full tw-text-iron-300 hover:tw-text-iron-400 tw-transition tw-duration-300 tw-ease-out"
          onClick={onEndTimeEdit}>
          <PencilIcon size={PencilIconSize.SMALL} />
        </button>
      )}
    </div>
  );
}
