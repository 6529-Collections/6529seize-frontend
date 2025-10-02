"use client";

import React, { useState } from "react";
import { ApiDrop } from "@/generated/models/ApiDrop";
import CommonAnimationWrapper from "../animation/CommonAnimationWrapper";
import CommonAnimationOpacity from "../animation/CommonAnimationOpacity";
import DropsListItemDeleteDropModal from "@/components/drops/view/item/options/delete/DropsListItemDeleteDropModal";

interface WaveDropDeleteButtonProps {
  readonly drop: ApiDrop;
  readonly className?: string;
}

const WaveDropDeleteButton: React.FC<WaveDropDeleteButtonProps> = ({
  drop,
  className = "",
}) => {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const onDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleteModalOpen(true);
  };

  const defaultButtonClasses =
    "tw-w-full tw-border tw-border-solid tw-border-iron-800 hover:tw-border-red/60 tw-rounded-lg tw-bg-iron-950 hover:tw-bg-iron-900 tw-px-3.5 tw-py-2.5 tw-text-sm tw-font-semibold tw-text-red tw-shadow-sm focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-iron-800 tw-transition tw-duration-300 tw-ease-out tw-flex tw-items-center tw-justify-center tw-gap-2";

  return (
    <>
      <button
        className={className || defaultButtonClasses}
        onClick={onDeleteClick}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          aria-hidden="true"
          stroke="currentColor"
          className="tw-flex-shrink-0 tw-w-5 tw-h-5 tw-transition tw-ease-out tw-duration-300 tw-text-red">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
          />
        </svg>
        <span>Delete Drop</span>
      </button>

      <CommonAnimationWrapper mode="sync" initial={true}>
        {isDeleteModalOpen && (
          <CommonAnimationOpacity
            key="modal"
            elementClasses="tw-absolute tw-z-50"
            elementRole="dialog"
            onClicked={(e) => e.stopPropagation()}>
            <DropsListItemDeleteDropModal
              drop={drop}
              closeModal={() => setIsDeleteModalOpen(false)}
              onDropDeleted={() => {
                setTimeout(() => {
                  window.history.back();
                }, 300);
              }}
            />
          </CommonAnimationOpacity>
        )}
      </CommonAnimationWrapper>
    </>
  );
};

export default WaveDropDeleteButton;
