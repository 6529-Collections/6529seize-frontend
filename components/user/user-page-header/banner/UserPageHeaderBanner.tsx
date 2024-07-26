import { useState } from "react";
import { IProfileAndConsolidations } from "../../../../entities/IProfile";
import PencilIcon from "../../../utils/icons/PencilIcon";
import CommonAnimationWrapper from "../../../utils/animation/CommonAnimationWrapper";
import CommonAnimationOpacity from "../../../utils/animation/CommonAnimationOpacity";
import UserPageHeaderEditBanner from "./UserPageHeaderEditBanner";

export default function UserPageHeaderBanner({
  profile,
  defaultBanner1,
  defaultBanner2,
  canEdit,
}: {
  readonly profile: IProfileAndConsolidations;
  readonly defaultBanner1: string;
  readonly defaultBanner2: string;
  readonly canEdit: boolean;
}) {
  const [isEditOpen, setIsEditOpen] = useState<boolean>(false);

  return (
    <div
      className="tw-h-24 sm:tw-h-36 tw-group tw-relative tw-overflow-hidden"
      style={{
        background: `linear-gradient(45deg, ${
          profile.profile?.banner_1 ?? defaultBanner1
        } 0%, ${profile.profile?.banner_2 ?? defaultBanner2} 100%)`,
      }}
    >
      {canEdit && (
        <div className="">
          <button
            onClick={() => setIsEditOpen(true)}
            className="tw-w-full tw-h-full tw-bg-transparent tw-border-none tw-p-0"
          >
            <div className="edit-profile tw-absolute tw-inset-0 tw-bg-black/30">
              <div className="tw-absolute tw-bottom-4 tw-right-4">
                <PencilIcon />
              </div>
            </div>
          </button>
        </div>
      )}
      <CommonAnimationWrapper mode="sync" initial={true}>
        {isEditOpen && (
          <CommonAnimationOpacity
            key="modal"
            elementClasses="tw-absolute tw-z-10"
            elementRole="dialog"
            onClicked={(e) => e.stopPropagation()}
          >
            <UserPageHeaderEditBanner
              profile={profile}
              defaultBanner1={defaultBanner1}
              defaultBanner2={defaultBanner2}
              onClose={() => setIsEditOpen(false)}
            />
          </CommonAnimationOpacity>
        )}
      </CommonAnimationWrapper>
    </div>
  );
}
