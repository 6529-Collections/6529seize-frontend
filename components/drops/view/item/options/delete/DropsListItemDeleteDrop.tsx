import { useState } from "react";
import { Drop } from "../../../../../../generated/models/Drop";
import CommonAnimationWrapper from "../../../../../utils/animation/CommonAnimationWrapper";
import CommonAnimationOpacity from "../../../../../utils/animation/CommonAnimationOpacity";
import DropsListItemDeleteDropModal from "./DropsListItemDeleteDropModal";

export default function DropsListItemDeleteDrop({
  drop,
  onDropDeleted,
}: {
  readonly drop: Drop;
  readonly onDropDeleted?: () => void;
}) {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  return (
    <div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsDeleteModalOpen(true);
        }}
        className="tw-flex tw-items-center tw-bg-transparent tw-w-full tw-border-none tw-px-3 tw-py-1 tw-text-sm tw-leading-6 tw-text-red hover:tw-bg-iron-800 tw-text-left tw-transition tw-duration-300 tw-ease-out"
        role="menuitem"
        tabIndex={-1}
        id="options-menu-0-item-0"
      >
        Delete
      </button>
      <CommonAnimationWrapper mode="sync" initial={true}>
        {isDeleteModalOpen && (
          <CommonAnimationOpacity
            key="modal"
            elementClasses="tw-absolute tw-z-50"
            elementRole="dialog"
            onClicked={(e) => e.stopPropagation()}
          >
            <DropsListItemDeleteDropModal
              drop={drop}
              closeModal={() => setIsDeleteModalOpen(false)}
              onDropDeleted={onDropDeleted}
            />
          </CommonAnimationOpacity>
        )}
      </CommonAnimationWrapper>
    </div>
  );
}
