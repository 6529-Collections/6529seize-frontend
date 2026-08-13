"use client";

import React, { useState } from "react";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import PencilIcon, {
  PencilIconSize,
} from "@/components/utils/icons/PencilIcon";
import UserPageHeaderEditPfp from "./UserPageHeaderEditPfp";
import { getUserProfileHeaderMessage } from "../user-page-header.messages";

export default function UserPageHeaderPfpWrapper({
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
  const [isEditPfpOpen, setIsEditPfpOpen] = useState<boolean>(false);

  if (!canEdit) {
    return <div className="tw-inline-flex tw-w-fit">{children}</div>;
  }

  return (
    <div className="tw-relative tw-inline-flex tw-w-fit">
      {children}
      <button
        type="button"
        onClick={() => setIsEditPfpOpen(true)}
        className="tw-group tw-absolute tw-inset-0 tw-hidden tw-rounded-xl tw-border-none tw-bg-transparent tw-p-0 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 sm:tw-block"
        aria-label={getUserProfileHeaderMessage("user.profileHeader.pfp.edit", {
          name: profileLabel,
        })}
      >
        <div
          aria-hidden="true"
          className="tw-absolute tw-inset-0 tw-z-20 tw-rounded-xl tw-bg-black/50 tw-opacity-0 tw-transition-opacity tw-duration-300 tw-ease-out group-focus-visible:tw-opacity-100 desktop-hover:group-hover:tw-opacity-100 touch-only:tw-bg-transparent touch-only:tw-opacity-100 motion-reduce:tw-transition-none"
        >
          <div className="tw-absolute tw-bottom-2 tw-right-2 touch-only:-tw-bottom-1 touch-only:-tw-right-1 touch-only:tw-flex touch-only:tw-size-6 touch-only:tw-items-center touch-only:tw-justify-center touch-only:tw-rounded-full touch-only:tw-border touch-only:tw-border-solid touch-only:tw-border-iron-800/60 touch-only:tw-bg-iron-950 touch-only:tw-shadow-md">
            <PencilIcon size={PencilIconSize.SMALL} />
          </div>
        </div>
      </button>
      {isEditPfpOpen && (
        <UserPageHeaderEditPfp
          profile={profile}
          onClose={() => setIsEditPfpOpen(false)}
        />
      )}
    </div>
  );
}
