"use client";

import { faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useMemo } from "react";
import { useAuth } from "@/components/auth/Auth";
import useCreateModalState from "@/hooks/useCreateModalState";

const BrainLeftSidebarCreateADirectMessageButton: React.FC = () => {
  const { connectedProfile, activeProfileProxy } = useAuth();
  const { openDirectMessage } = useCreateModalState();

  const isConnectedIdentity = useMemo(() => {
    return !!connectedProfile?.handle && !activeProfileProxy;
  }, [connectedProfile?.handle, activeProfileProxy]);

  const label = useMemo(() => {
    if (isConnectedIdentity) {
      return "Create DM";
    }
    return "Direct Message";
  }, [isConnectedIdentity]);

  return (
    <button
      type="button"
      onClick={openDirectMessage}
      className="tw-flex tw-w-full tw-items-center tw-justify-center tw-gap-x-2 tw-rounded-lg tw-border-0 tw-bg-iron-800 tw-px-4 tw-py-2 tw-text-xs tw-font-semibold tw-text-iron-300 tw-ring-1 tw-ring-inset tw-ring-iron-700 tw-transition-all tw-duration-300 desktop-hover:hover:tw-text-primary-400 desktop-hover:hover:tw-ring-iron-700"
    >
      <FontAwesomeIcon
        icon={faPaperPlane}
        className="-tw-ml-1.5 tw-size-3 tw-flex-shrink-0"
      />
      <span>{label}</span>
    </button>
  );
};

export default BrainLeftSidebarCreateADirectMessageButton;
