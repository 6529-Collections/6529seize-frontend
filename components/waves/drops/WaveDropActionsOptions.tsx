"use client";

import DropsListItemDeleteDropModal from "@/components/drops/view/item/options/delete/DropsListItemDeleteDropModal";
import CommonAnimationOpacity from "@/components/utils/animation/CommonAnimationOpacity";
import CommonAnimationWrapper from "@/components/utils/animation/CommonAnimationWrapper";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { TrashIcon } from "@heroicons/react/24/outline";
import React, { useState } from "react";
import { Tooltip } from "react-tooltip";

interface WaveDropActionsOptionsProps {
  readonly drop: ApiDrop;
}

const WaveDropActionsOptions: React.FC<WaveDropActionsOptionsProps> = ({
  drop,
}) => {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsDeleteModalOpen(true);
        }}
        className="tw-text-iron-400 desktop-hover:hover:tw-text-rose-400 tw-cursor-pointer tw-transition-colors tw-bg-transparent tw-border-0 tw-px-2"
        aria-label="Delete drop"
        data-tooltip-id={`delete-${drop.id}`}>
        <TrashIcon className="tw-flex-shrink-0 tw-w-5 tw-h-5" />
      </button>
      <Tooltip
        id={`delete-${drop.id}`}
        place="top"
        style={{
          backgroundColor: "#1F2937",
          color: "white",
          padding: "4px 8px",
        }}>
        <span className="tw-text-xs">Delete</span>
      </Tooltip>
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
            />
          </CommonAnimationOpacity>
        )}
      </CommonAnimationWrapper>
    </>
  );
};

export default WaveDropActionsOptions;
