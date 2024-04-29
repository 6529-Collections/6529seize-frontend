import { useState } from "react";
import { IProfileAndConsolidations } from "../../../../../entities/IProfile";
import PencilIcon, { PencilIconSize } from "../../../../utils/icons/PencilIcon";
import CommonAnimationWrapper from "../../../../utils/animation/CommonAnimationWrapper";
import CommonAnimationOpacity from "../../../../utils/animation/CommonAnimationOpacity";
import UserPageHeaderEditClassification from "./UserPageHeaderEditClassification";

export default function UserPageClassificationWrapper({
  profile,
  canEdit,
  children,
}: {
  readonly profile: IProfileAndConsolidations;
  readonly canEdit: boolean;
  readonly children: React.ReactNode;
}) {
  const [isEditOpen, setIsEditOpen] = useState<boolean>(false);

  return (
    <div className="md:-tw-mt-0.5">
      <button
        onClick={() => setIsEditOpen(true)}
        disabled={!canEdit}
        className={`${
          canEdit ? "hover:tw-text-neutral-400" : ""
        } tw-group tw-bg-transparent tw-border-none tw-m-0 tw-p-0 tw-relative tw-transition tw-duration-300 tw-ease-out`}>
        {children}
        {canEdit && (
          <div className="group-hover:tw-block tw-hidden tw-absolute tw-text-neutral-400">
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
