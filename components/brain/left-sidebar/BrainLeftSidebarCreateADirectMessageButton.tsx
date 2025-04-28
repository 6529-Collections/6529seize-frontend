import { faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import React, { useMemo } from "react";
import { useAuth } from "../../auth/Auth";

interface BrainLeftSidebarCreateADirectMessageButtonProps {}

const BrainLeftSidebarCreateADirectMessageButton: React.FC<
  BrainLeftSidebarCreateADirectMessageButtonProps
> = () => {
  const { connectedProfile, activeProfileProxy } = useAuth();

  const isConnectedIdentity = useMemo(() => {
    return !!connectedProfile?.handle && !activeProfileProxy;
  }, [connectedProfile?.handle, activeProfileProxy]);


  const label = useMemo(() => {
    if (isConnectedIdentity) {
      return "DM";
    }
    return "Direct Message";
  }, [isConnectedIdentity]);

  return (
    <Link
      href="/waves?new-dm=true"
      className="tw-no-underline tw-ring-1 tw-ring-inset tw-ring-iron-700 desktop-hover:hover:tw-ring-iron-700 tw-text-iron-300 tw-flex tw-items-center tw-justify-center tw-gap-x-2 tw-rounded-lg tw-py-2 tw-px-4 tw-text-xs tw-bg-iron-800 desktop-hover:hover:tw-text-primary-400 tw-font-semibold tw-transition-all tw-duration-300">
      <FontAwesomeIcon
        icon={faPaperPlane}
        className="tw-size-3 -tw-ml-1.5 tw-flex-shrink-0"
      />
      <span>{label}</span>
    </Link>
  );
};

export default BrainLeftSidebarCreateADirectMessageButton;
