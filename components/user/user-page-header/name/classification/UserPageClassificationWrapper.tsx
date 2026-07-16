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
    <div className="tw-inline-flex tw-items-center">
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
        <span
          aria-hidden="true"
          className="tw-absolute -tw-left-5 tw-top-1/2 tw-hidden tw-size-4 -tw-translate-y-1/2 tw-items-center tw-justify-center tw-text-iron-400 group-focus-visible:tw-flex group-hover:tw-flex"
        >
          <PencilIcon size={PencilIconSize.SMALL} />
        </span>
      </button>
      <CommonAnimationWrapper mode="sync" initial={true}>
        {isEditOpen && (
          <CommonAnimationOpacity
            key="modal"
            elementClasses="tw-absolute tw-z-10"
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
