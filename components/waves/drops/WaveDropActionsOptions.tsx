"use client";

import { TrashIcon } from "@heroicons/react/24/outline";
import React, { useState } from "react";
import { Tooltip } from "react-tooltip";

import DropsListItemDeleteDropModal from "@/components/drops/view/item/options/delete/DropsListItemDeleteDropModal";
import CommonAnimationOpacity from "@/components/utils/animation/CommonAnimationOpacity";
import CommonAnimationWrapper from "@/components/utils/animation/CommonAnimationWrapper";
import type { ApiDrop } from "@/generated/models/ApiDrop";

interface WaveDropActionsOptionsProps {
  readonly drop: ApiDrop;
  readonly isDropdownItem?: boolean | undefined;
  readonly onDelete?: (() => void) | undefined;
}

const WaveDropActionsOptions: React.FC<WaveDropActionsOptionsProps> = ({
  drop,
  isDropdownItem = false,
  onDelete,
}) => {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  if (isDropdownItem) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDelete?.();
        }}
        className="tw-flex tw-w-full tw-cursor-pointer tw-items-center tw-gap-x-3 tw-rounded-lg tw-border-0 tw-bg-transparent tw-px-3 tw-py-2 tw-text-iron-300 tw-transition-colors tw-duration-200 desktop-hover:hover:tw-bg-iron-800 desktop-hover:hover:tw-text-rose-400"
      >
        <TrashIcon className="tw-h-4 tw-w-4 tw-flex-shrink-0" />
        <span className="tw-text-sm tw-font-medium">Delete</span>
      </button>
    );
  }

  const handleOpenModal = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleteModalOpen(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpenModal}
        className="tw-cursor-pointer tw-border-0 tw-bg-transparent tw-px-2 tw-text-iron-400 tw-transition-colors desktop-hover:hover:tw-text-rose-400"
        aria-label="Delete drop"
        data-tooltip-id={`delete-${drop.id}`}
      >
        <TrashIcon className="tw-h-5 tw-w-5 tw-flex-shrink-0" />
      </button>
      <Tooltip
        id={`delete-${drop.id}`}
        place="top"
        style={{
          backgroundColor: "#1F2937",
          color: "white",
          padding: "4px 8px",
        }}
      >
        <span className="tw-text-xs">Delete</span>
      </Tooltip>
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
            />
          </CommonAnimationOpacity>
        )}
      </CommonAnimationWrapper>
    </>
  );
};

export default WaveDropActionsOptions;
