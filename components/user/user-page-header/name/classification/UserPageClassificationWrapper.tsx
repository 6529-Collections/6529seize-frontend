"use client";

import CommonAnimationOpacity from "@/components/utils/animation/CommonAnimationOpacity";
import CommonAnimationWrapper from "@/components/utils/animation/CommonAnimationWrapper";
import PencilIcon, {
  PencilIconSize,
} from "@/components/utils/icons/PencilIcon";
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
        className="tw-group tw-relative tw-m-0 tw-inline-flex tw-min-h-11 tw-items-center tw-gap-1.5 tw-rounded-md tw-border-none tw-bg-transparent tw-px-0 tw-py-1 tw-text-iron-400 tw-transition-colors tw-duration-200 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-text-white motion-reduce:tw-transition-none"
      >
        {children}
        <span aria-hidden="true" className="tw-text-iron-500">
          <PencilIcon size={PencilIconSize.SMALL} />
        </span>
      </button>
      <CommonAnimationWrapper mode="sync" initial={true}>
        {isEditOpen && (
          <CommonAnimationOpacity
            key="modal"
            elementClasses="tw-absolute tw-z-10"
            elementRole="dialog"
            onClicked={(e) => e.stopPropagation()}
          >
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
