"use client";

import { useContext } from "react";
import { PencilIcon } from "@heroicons/react/24/outline";
import DropActionTooltip from "./DropActionTooltip";
import { AuthContext } from "@/components/auth/Auth";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";

interface WaveDropActionsEditProps {
  readonly drop: ExtendedDrop;
  readonly onEdit: () => void;
  readonly isDropdownItem?: boolean | undefined;
}

export default function WaveDropActionsEdit({
  drop,
  onEdit,
  isDropdownItem = false,
}: WaveDropActionsEditProps) {
  const { connectedProfile } = useContext(AuthContext);

  // Only show edit for drop authors
  if (connectedProfile?.handle !== drop.author.handle) {
    return null;
  }

  if (isDropdownItem) {
    return (
      <button
        type="button"
        onClick={onEdit}
        className="tw-flex tw-w-full tw-cursor-pointer tw-items-center tw-gap-x-3 tw-rounded-lg tw-border-0 tw-bg-transparent tw-px-3 tw-py-2 tw-text-iron-300 tw-transition-colors tw-duration-200 desktop-hover:hover:tw-bg-iron-800"
      >
        <PencilIcon className="tw-h-4 tw-w-4 tw-flex-shrink-0" />
        <span className="tw-text-sm tw-font-medium">Edit</span>
      </button>
    );
  }

  return (
    <DropActionTooltip
      content={<span className="tw-text-xs">Edit Message</span>}
    >
      <button
        type="button"
        className="tw-flex tw-h-7 tw-w-7 tw-cursor-pointer tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-transparent tw-text-iron-400 tw-transition-colors tw-duration-200 tw-ease-out desktop-hover:hover:tw-bg-iron-800 desktop-hover:hover:tw-text-iron-200"
        onClick={onEdit}
        aria-label="Edit"
      >
        <PencilIcon className="tw-h-5 tw-w-5 tw-flex-shrink-0 tw-p-[1px] tw-transition tw-duration-300 tw-ease-out" />
      </button>
    </DropActionTooltip>
  );
}
