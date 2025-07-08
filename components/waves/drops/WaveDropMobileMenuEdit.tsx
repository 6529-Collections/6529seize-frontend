"use client"

import React, { useContext } from "react";
import { PencilIcon } from "@heroicons/react/24/outline";
import { ApiDrop } from "../../../generated/models/ApiDrop";
import { AuthContext } from "../../auth/Auth";

interface WaveDropMobileMenuEditProps {
  readonly drop: ApiDrop;
  readonly onEdit: () => void;
  readonly onEditTriggered: () => void;
}

const WaveDropMobileMenuEdit: React.FC<WaveDropMobileMenuEditProps> = ({
  drop,
  onEdit,
  onEditTriggered,
}) => {
  const { connectedProfile } = useContext(AuthContext);

  // Only show edit for drop authors
  if (connectedProfile?.handle !== drop.author.handle) {
    return null;
  }

  const handleEdit = () => {
    onEdit();
    onEditTriggered();
  };

  return (
    <button
      className="tw-border-0 tw-flex tw-items-center tw-gap-x-4 tw-p-4 tw-bg-iron-950 tw-rounded-xl active:tw-bg-iron-800 tw-transition-colors tw-duration-200"
      onClick={handleEdit}
    >
      <PencilIcon className="tw-flex-shrink-0 tw-w-5 tw-h-5 tw-text-iron-300" />
      <span className="tw-text-iron-300 tw-font-semibold tw-text-base">
        Edit Message
      </span>
    </button>
  );
};

export default WaveDropMobileMenuEdit;