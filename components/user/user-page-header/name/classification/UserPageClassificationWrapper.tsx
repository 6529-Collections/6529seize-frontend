"use client";

import CommonAnimationOpacity from "@/components/utils/animation/CommonAnimationOpacity";
import CommonAnimationWrapper from "@/components/utils/animation/CommonAnimationWrapper";
import PencilIcon, { PencilIconSize } from "@/components/utils/icons/PencilIcon";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { useState } from "react";
import UserPageHeaderEditClassification from "./UserPageHeaderEditClassification";

export default function UserPageClassificationWrapper({
  profile,
  canEdit,
  children,
}: {
  readonly profile: ApiIdentity;
  readonly canEdit: boolean;
  readonly children: React.ReactNode;
}) {
  const [isEditOpen, setIsEditOpen] = useState<boolean>(false);

  return (
    <div className="md:-tw-mt-0.5">
      <button
        onClick={() => setIsEditOpen(true)}
        disabled={!canEdit}
        aria-label="Edit classification"
        className={`${
          canEdit ? "hover:tw-text-iron-400" : ""
        } tw-group tw-bg-transparent tw-border-none tw-m-0 tw-p-0 tw-relative tw-transition tw-duration-300 tw-ease-out`}>
        {children}
        {canEdit && (
          <div className="group-hover:tw-block tw-hidden tw-absolute tw-text-iron-400">
            <div className="tw-absolute -tw-top-4 sm:-tw-top-5 -tw-left-4 sm:-tw-left-5">
              <PencilIcon size={PencilIconSize.SMALL} />
            </div>
          </div>
        )}
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
