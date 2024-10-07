import React, { useState } from "react";
import { Drop } from "../../../../generated/models/Drop";
import CommonAnimationOpacity from "../../../utils/animation/CommonAnimationOpacity";
import CommonAnimationWrapper from "../../../utils/animation/CommonAnimationWrapper";
import DropsListItemDeleteDropModal from "../../../drops/view/item/options/delete/DropsListItemDeleteDropModal";

interface WaveDetailedDropMobileMenuDeleteProps {
  readonly drop: Drop;
}

const WaveDetailedDropMobileMenuDelete: React.FC<
  WaveDetailedDropMobileMenuDeleteProps
> = ({ drop }) => {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const openModal = () => setIsDeleteModalOpen(true);
  const closeModal = () => setIsDeleteModalOpen(false);
  return (
    <div className="tw-w-full tw-border-t tw-border-x-0 tw-border-b-0 tw-border-iron-800 tw-border-solid">
      <button
        className="tw-mt-2 tw-border-0 tw-w-full tw-flex tw-items-center tw-gap-x-4 tw-p-4 tw-bg-iron-950 tw-rounded-xl active:tw-bg-red/10 tw-transition-colors tw-duration-200"
        onClick={openModal}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
          className="tw-size-5 tw-flex-shrink-0 tw-text-red"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.74 9L14.394 18m-4.788 0L9.26 9m9.968-3.21a48.108 48.108 0 011.022.166M18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m13.388 0a48.11 48.11 0 00-3.478-.397m-12 .562a48.11 48.11 0 013.478-.397m7.5 0V4.063c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201V5.29m7.5 0a48.667 48.667 0 00-7.5 0"
          />
        </svg>
        <span className="tw-text-red tw-font-semibold tw-text-base">
          Delete
        </span>
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
              closeModal={closeModal}
              onDropDeleted={() => {}}
            />
          </CommonAnimationOpacity>
        )}
      </CommonAnimationWrapper>
    </div>
  );
};

export default WaveDetailedDropMobileMenuDelete;
