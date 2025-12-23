"use client"

import { useContext } from "react";
import { PencilIcon } from "@heroicons/react/24/outline";
import { Tooltip } from "react-tooltip";
import { AuthContext } from "@/components/auth/Auth";
import { ExtendedDrop } from "@/helpers/waves/drop.helpers";

interface WaveDropActionsEditProps {
  readonly drop: ExtendedDrop;
  readonly onEdit: () => void;
}

export default function WaveDropActionsEdit({
  drop,
  onEdit,
}: WaveDropActionsEditProps) {
  const { connectedProfile } = useContext(AuthContext);

  // Only show edit for drop authors
  if (connectedProfile?.handle !== drop.author.handle) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        className="tw-text-iron-500 icon tw-px-2 tw-h-full tw-group tw-bg-transparent tw-rounded-full tw-border-0 tw-flex tw-items-center tw-gap-x-2 tw-text-[0.8125rem] tw-leading-5 tw-font-medium tw-transition tw-ease-out tw-duration-300"
        onClick={onEdit}
        aria-label="Edit"
        data-tooltip-id={`edit-drop-${drop.id}`}
      >
        <PencilIcon className="tw-flex-shrink-0 tw-w-5 tw-h-5 tw-transition tw-ease-out tw-duration-300" />
      </button>
      <Tooltip
        id={`edit-drop-${drop.id}`}
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
        }}
      >
        <span className="tw-text-xs">Edit Message</span>
      </Tooltip>
    </>
  );
}
