import React, { useState } from "react";
import { ApiIdentity } from "../../../../generated/models/ApiIdentity";
import PencilIcon from "../../../utils/icons/PencilIcon";
import CommonAnimationWrapper from "../../../utils/animation/CommonAnimationWrapper";
import CommonAnimationOpacity from "../../../utils/animation/CommonAnimationOpacity";
import UserPageHeaderEditName from "./UserPageHeaderEditName";

export default function UserPageHeaderNameWrapper({
  profile,
  canEdit,
  children,
}: {
  readonly profile: ApiIdentity;
  readonly canEdit: boolean;
  readonly children: React.ReactNode;
}) {
  const [isEditNameOpen, setIsEditNameOpen] = useState<boolean>(false);

  return (
    <div>
      <button
        onClick={() => setIsEditNameOpen(true)}
        disabled={!canEdit}
        aria-label="Edit profile name"
        className={`${
          canEdit ? "hover:tw-text-neutral-400" : ""
        } tw-group tw-bg-transparent tw-border-none tw-m-0 tw-p-0 tw-relative tw-transition tw-duration-300 tw-ease-out`}
      >
        {children}
        {canEdit && (
          <div className="group-hover:tw-block tw-hidden tw-absolute tw-inset-0 tw-text-neutral-400">
            <div className="tw-absolute tw-top-1.5 -tw-left-5 sm:-tw-left-6">
              <PencilIcon />
            </div>
          </div>
        )}
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
