"use client";

import { useState } from "react";
import { ApiGroupFull } from "../../../../../../../generated/models/ApiGroupFull";
import CommonAnimationWrapper from "../../../../../../utils/animation/CommonAnimationWrapper";
import CommonAnimationOpacity from "../../../../../../utils/animation/CommonAnimationOpacity";
import GroupCardDeleteModal from "./GroupCardDeleteModal";

export default function GroupCardDelete({
  group,
}: {
  readonly group: ApiGroupFull;
}) {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  return (
    <div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsDeleteModalOpen(true);
        }}
        className="tw-bg-transparent tw-w-full tw-border-none tw-block tw-px-3 tw-py-1 tw-text-sm tw-leading-6 tw-text-iron-300 hover:tw-text-iron-50 hover:tw-bg-iron-800 tw-text-left tw-transition tw-duration-300 tw-ease-out"
        role="menuitem"
        tabIndex={-1}
        id="options-menu-0-item-1">
        Delete
      </button>
      <CommonAnimationWrapper mode="sync" initial={true}>
        {isDeleteModalOpen && (
          <CommonAnimationOpacity
            key="modal"
            elementClasses="tw-absolute tw-z-50"
            elementRole="dialog"
            onClicked={(e) => e.stopPropagation()}>
            <GroupCardDeleteModal
              group={group}
              onClose={() => setIsDeleteModalOpen(false)}
            />
          </CommonAnimationOpacity>
        )}
      </CommonAnimationWrapper>
    </div>
  );
}
