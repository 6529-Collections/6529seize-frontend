"use client";

import CommonAnimationOpacity from "@/components/utils/animation/CommonAnimationOpacity";
import CommonAnimationWrapper from "@/components/utils/animation/CommonAnimationWrapper";
import PencilIcon, { PencilIconSize } from "@/components/utils/icons/PencilIcon";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { useState } from "react";
import UserPageHeaderEditClassification from "./UserPageHeaderEditClassification";
import { getUserProfileHeaderMessage } from "../../user-page-header.messages";

export default function UserPageClassificationWrapper({
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
  const [isEditOpen, setIsEditOpen] = useState<boolean>(false);

  if (!canEdit) {
    return <div className="tw-inline-flex tw-items-center">{children}</div>;
  }

  return (
    <div className="tw-inline-flex">
      <button
        type="button"
        onClick={() => setIsEditOpen(true)}
        aria-label={getUserProfileHeaderMessage(
          "user.profileHeader.classification.edit",
          { name: profileLabel }
        )}
        className="tw-group tw-relative tw-m-0 tw-inline-flex tw-min-h-6 tw-items-center tw-border-none tw-bg-transparent tw-p-0 tw-transition tw-duration-300 tw-ease-out hover:tw-text-iron-400 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 motion-reduce:tw-transition-none"
      >
        {children}
        <div
          aria-hidden="true"
          className="tw-absolute tw-hidden tw-text-iron-400 group-focus-visible:tw-block group-hover:tw-block"
        >
          <div className="tw-absolute -tw-left-4 -tw-top-4 sm:-tw-left-5 sm:-tw-top-5">
            <PencilIcon size={PencilIconSize.SMALL} />
          </div>
        </div>
      </button>
      <CommonAnimationWrapper mode="sync" initial={true}>
        {isEditOpen && (
          <CommonAnimationOpacity
            key="modal"
            elementClasses="tw-absolute tw-z-10"
            elementRole="dialog"
            onClicked={(e) => e.stopPropagation()}>
            <UserPageHeaderEditClassification
              profile={profile}
              onClose={() => setIsEditOpen(false)}
            />
          </CommonAnimationOpacity>
        )}
      </CommonAnimationWrapper>
    </div>
  );
}
