"use client";

import IconButton from "@/components/utils/button/IconButton";

import { useContext, useEffect, useState } from "react";
import type { ApiProfileProxy } from "@/generated/models/ApiProfileProxy";
import type { ApiProfileProxyAction } from "@/generated/models/ApiProfileProxyAction";
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
  const getIsOwner = (): boolean => {
    if (!connectedProfile) {
      return false;
    }
    return connectedProfile?.id === profileProxy.created_by.id;
  };

  const [isOwner, setIsOwner] = useState(getIsOwner());
  useEffect(() => setIsOwner(getIsOwner()), [connectedProfile, profileProxy]);

  return (
    <div className="tw-flex tw-items-center">
      <span className="tw-whitespace-nowrap tw-text-meta tw-font-normal tw-tabular-nums tw-leading-5 tw-text-iron-300">
        {profileProxyAction.end_time
          ? getTimeUntil(profileProxyAction.end_time)
          : "Not set"}
      </span>
      {isOwner && (
        <IconButton
          type="button"
          aria-label="Edit end time"
          size={32}
          variant="ghost"
          shape="circle"
          onClick={onEndTimeEdit}
        >
          <PencilIcon size={PencilIconSize.SMALL} />
        </IconButton>
      )}
    </div>
  );
}
