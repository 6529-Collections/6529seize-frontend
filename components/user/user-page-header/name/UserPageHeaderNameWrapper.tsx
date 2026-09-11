"use client";

import PencilIcon, {
  PencilIconSize,
} from "@/components/utils/icons/PencilIcon";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import React, { useState } from "react";
import UserPageHeaderEditName from "./UserPageHeaderEditName";
import { getUserProfileHeaderMessage } from "../user-page-header.messages";

export default function UserPageHeaderNameWrapper({
  profile,
  canEdit,
  profileLabel,
  children,
}: {
  readonly profile: ApiIdentity;
  readonly canEdit: boolean;
  readonly profileLabel: string;
  readonly children: React.ReactNode;
}) {
  const [isEditNameOpen, setIsEditNameOpen] = useState<boolean>(false);

  if (!canEdit) {
    return <div>{children}</div>;
  }

  return (
    <div className="tw-group tw-relative">
      {children}
      <button
        type="button"
        onClick={() => setIsEditNameOpen(true)}
        aria-label={getUserProfileHeaderMessage(
          "user.profileHeader.name.edit",
          { name: profileLabel }
        )}
        className="tw-absolute tw-inset-0 tw-m-0 tw-hidden tw-rounded-md tw-border-none tw-bg-transparent tw-p-0 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 sm:tw-block"
      >
        <div
          aria-hidden="true"
          className="tw-absolute tw-inset-0 tw-hidden tw-text-iron-400 group-focus-within:tw-block desktop-hover:group-hover:tw-block touch-only:tw-block"
        >
          <div className="tw-absolute -tw-left-5 tw-top-1/2 tw-z-10 tw-flex tw-size-5 -tw-translate-y-1/2 tw-items-center tw-justify-center">
            <PencilIcon size={PencilIconSize.SMALL} />
          </div>
        </div>
      </button>
      {isEditNameOpen && (
        <UserPageHeaderEditName
          profile={profile}
          onClose={() => setIsEditNameOpen(false)}
        />
      )}
    </div>
  );
}
