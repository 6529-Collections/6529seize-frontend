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
    <div className="tw-group tw-relative">
      {children}
      <button
        type="button"
        onClick={() => setIsEditNameOpen(true)}
        aria-label={getUserProfileHeaderMessage(
          "user.profileHeader.name.edit",
          { name: profileLabel }
        )}
        className="tw-absolute tw-inset-0 tw-m-0 tw-rounded-md tw-border-none tw-bg-transparent tw-p-0 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
      >
        <div
          aria-hidden="true"
          className="tw-absolute tw-inset-0 tw-hidden tw-text-iron-400 group-focus-within:tw-block group-hover:tw-block"
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
