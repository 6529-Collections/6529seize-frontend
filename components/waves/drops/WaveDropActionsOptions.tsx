"use client";

import React, { useState } from "react";
import { ApiDrop } from "@/generated/models/ApiDrop";
import CommonAnimationWrapper from "@/components/utils/animation/CommonAnimationWrapper";
import CommonAnimationOpacity from "@/components/utils/animation/CommonAnimationOpacity";
import DropsListItemDeleteDropModal from "@/components/drops/view/item/options/delete/DropsListItemDeleteDropModal";
import { Tooltip } from "react-tooltip";
import { TrashIcon } from "@heroicons/react/24/outline";

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
        offset={8}
        opacity={1}
        style={{
          padding: "4px 8px",
          background: "#37373E",
          color: "white",
          fontSize: "13px",
          fontWeight: 500,
          borderRadius: "6px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          zIndex: 99999,
          pointerEvents: "none",
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
