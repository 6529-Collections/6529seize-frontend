import React, { useState } from "react";
import { ApiDrop } from "../../../../generated/models/ApiDrop";
import CommonAnimationOpacity from "../../../utils/animation/CommonAnimationOpacity";
import CommonAnimationWrapper from "../../../utils/animation/CommonAnimationWrapper";
import DropsListItemDeleteDropModal from "../../../drops/view/item/options/delete/DropsListItemDeleteDropModal";

interface WaveDetailedDropMobileMenuDeleteProps {
  readonly drop: ApiDrop;
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
          className="tw-size-5 tw-flex-shrink-0 tw-text-red"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
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
