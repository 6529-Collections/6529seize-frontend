import { faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import React from "react";

interface BrainLeftSidebarCreateADirectMessageButtonProps {}

const BrainLeftSidebarCreateADirectMessageButton: React.FC<
  BrainLeftSidebarCreateADirectMessageButtonProps
> = () => {
  return (
    <Link
      href="/waves?new-dm=true"
      className="tw-no-underline tw-text-iron-300 tw-w-full tw-flex tw-items-center tw-justify-center tw-gap-x-1.5 tw-rounded-lg tw-py-2 tw-px-2.5 tw-text-sm tw-bg-iron-900 desktop-hover:hover:tw-text-primary-400 tw-font-semibold tw-transition-colors tw-duration-300">
      <FontAwesomeIcon
        icon={faPaperPlane}
        className="tw-size-3 tw-mr-1.5 -tw-ml-1.5 tw-flex-shrink-0"
      />
      <span>Direct Message</span>
    </Link>
  );
};

export default BrainLeftSidebarCreateADirectMessageButton;
