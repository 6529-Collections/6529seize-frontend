"use client";

import CommonAnimationOpacity from "@/components/utils/animation/CommonAnimationOpacity";
import CommonAnimationWrapper from "@/components/utils/animation/CommonAnimationWrapper";
import PencilIcon from "@/components/utils/icons/PencilIcon";
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
    <div>
      <button
        type="button"
        onClick={() => setIsEditNameOpen(true)}
        aria-label={getUserProfileHeaderMessage(
          "user.profileHeader.name.edit",
          { name: profileLabel }
        )}
        className="tw-group tw-relative tw-m-0 tw-border-none tw-bg-transparent tw-p-0 tw-transition tw-duration-300 tw-ease-out hover:tw-text-iron-400"
      >
        {children}
        <div
          aria-hidden="true"
          className="tw-absolute tw-inset-0 tw-hidden tw-text-iron-400 group-hover:tw-block"
        >
          <div className="tw-absolute -tw-left-5 tw-top-1.5 tw-z-10">
            <PencilIcon />
          </div>
        </div>
      </button>
      <CommonAnimationWrapper mode="sync" initial={true}>
        {isEditNameOpen && (
          <CommonAnimationOpacity
            key="modal"
            elementClasses="tw-absolute tw-z-10"
            elementRole="dialog"
            onClicked={(e) => e.stopPropagation()}
          >
            <UserPageHeaderEditName
              profile={profile}
              onClose={() => setIsEditNameOpen(false)}
            />
          </CommonAnimationOpacity>
        )}
      </CommonAnimationWrapper>
    </div>
  );
}
