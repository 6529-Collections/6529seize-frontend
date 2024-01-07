import React, { useContext, useEffect, useState } from "react";
import { IProfileAndConsolidations } from "../../../../entities/IProfile";
import { AuthContext } from "../../../auth/Auth";
import { useAccount } from "wagmi";
import { amIUser } from "../../../../helpers/Helpers";
import PencilIcon from "../../../utils/icons/PencilIcon";
import CommonAnimationWrapper from "../../../utils/animation/CommonAnimationWrapper";
import CommonAnimationOpacity from "../../../utils/animation/CommonAnimationOpacity";
import UserPageHeaderEditPfp from "./UserPageHeaderEditPfp";

export default function UserPageHeaderPfpWrapper({
  profile,
  canEdit,
  children,
}: {
  readonly profile: IProfileAndConsolidations;
  readonly canEdit: boolean;
  readonly children: React.ReactNode;
}) {
  const [isEditPfpOpen, setIsEditPfpOpen] = useState<boolean>(false);

  return (
    <div>
      <button
        onClick={() => setIsEditPfpOpen(true)}
        disabled={!canEdit}
        className="tw-group tw-bg-transparent tw-border-none tw-relative"
      >
        {children}

        {canEdit && (
          <div className="group-hover:tw-block tw-hidden tw-absolute tw-inset-0 tw-bg-black tw-bg-opacity-50 tw-transition tw-duration-300 tw-ease-out tw-rounded-lg">
            <div className="tw-absolute tw-bottom-2 tw-right-2">
              <PencilIcon />
            </div>
          </div>
        )}
      </button>
      <CommonAnimationWrapper mode="sync" initial={true}>
        {isEditPfpOpen && (
          <CommonAnimationOpacity
            key="modal"
            elementClasses="tw-absolute tw-z-10"
            elementRole="dialog"
            onClicked={(e) => e.stopPropagation()}
          >
            <UserPageHeaderEditPfp
              profile={profile}
              onClose={() => setIsEditPfpOpen(false)}
            />
          </CommonAnimationOpacity>
        )}
      </CommonAnimationWrapper>
    </div>
  );
}

