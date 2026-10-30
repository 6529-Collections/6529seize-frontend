"use client";

import React, { useContext } from "react";
import { PencilIcon } from "@heroicons/react/24/outline";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { AuthContext } from "@/components/auth/Auth";

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
  if (
    drop.author.is_anonymous ||
    connectedProfile?.handle !== drop.author.handle
  ) {
    return null;
  }

  const handleEdit = () => {
    onEdit();
    onEditTriggered();
  };

  return (
    <button
      className="tw-flex tw-items-center tw-gap-x-4 tw-rounded-xl tw-border-0 tw-bg-iron-950 tw-p-4 tw-transition-colors tw-duration-200 active:tw-bg-iron-800"
      onClick={handleEdit}
    >
      <PencilIcon className="tw-h-5 tw-w-5 tw-flex-shrink-0 tw-text-iron-300" />
      <span className="tw-text-base tw-font-semibold tw-text-iron-300">
        Edit Message
      </span>
    </button>
  );
};

export default WaveDropMobileMenuEdit;
