"use client";

import { faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useMemo } from "react";
import { useAuth } from "@/components/auth/Auth";
import Button from "@/components/utils/button/Button";
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
    <Button
      onClick={openDirectMessage}
      variant="primary"
      size="xs"
      fullWidth
    >
      <FontAwesomeIcon
        icon={faPaperPlane}
        className="tw-size-3 tw-flex-shrink-0"
      />
      {label}
    </Button>
  );
};

export default BrainLeftSidebarCreateADirectMessageButton;
