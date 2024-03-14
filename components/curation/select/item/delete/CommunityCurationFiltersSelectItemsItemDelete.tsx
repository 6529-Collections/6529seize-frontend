import { useState } from "react";
import CommonAnimationWrapper from "../../../../utils/animation/CommonAnimationWrapper";
import CommonAnimationOpacity from "../../../../utils/animation/CommonAnimationOpacity";
import CommunityCurationFiltersSelectItemsItemDeleteModal from "./CommunityCurationFiltersSelectItemsItemDeleteModal";

export default function CommunityCurationFiltersSelectItemsItemDelete({
  filterId,
}: {
  readonly filterId: string;
}) {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);

  return (
    <>
      <div
        onClick={(e) => {
          e.stopPropagation();
          setIsDeleteModalOpen(true);
        }}
        className="tw-cursor-pointer tw-block tw-px-3 tw-py-1 tw-text-sm tw-leading-6 tw-text-iron-50 hover:tw-bg-iron-800 tw-transition tw-duration-300 tw-ease-out"
        role="menuitem"
        tabIndex={-1}
        id="options-menu-0-item-1"
      >
        Delete
      </div>
      <CommonAnimationWrapper mode="sync" initial={true}>
        {isDeleteModalOpen && (
          <CommonAnimationOpacity
            key="modal"
            elementClasses="tw-absolute tw-z-50"
            elementRole="dialog"
            onClicked={(e) => e.stopPropagation()}
          >
            <CommunityCurationFiltersSelectItemsItemDeleteModal
              filterId={filterId}
              onClose={() => setIsDeleteModalOpen(false)}
            />
          </CommonAnimationOpacity>
        )}
      </CommonAnimationWrapper>
    </>
  );
}
