"use client";

import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { useRouter } from "next/router";
import Tippy from "@tippyjs/react";

interface BrainLeftSidebarWaveCloseProps {
  readonly waveId: string;
}

const BrainLeftSidebarWaveClose: React.FC<BrainLeftSidebarWaveCloseProps> = ({
  waveId,
}) => {
  const router = useRouter();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    // Navigate to the base my-stream URL without the wave parameter
    router.push("/my-stream", undefined, { shallow: true });
  };

  return (
    <Tippy content="Close wave">
      <button
        onClick={handleClick}
        className="tw-mt-0.5 tw-mx-1 tw-border-0 tw-flex tw-items-center tw-justify-center tw-size-7 sm:tw-size-6 tw-rounded-md tw-transition-all tw-duration-200 tw-text-iron-400 hover:tw-text-iron-200 hover:tw-bg-iron-800/80"
        aria-label="Close wave">
        <FontAwesomeIcon
          icon={faTimes}
          className="tw-size-4 sm:tw-size-3 tw-flex-shrink-0"
        />
      </button>
    </Tippy>
  );
};

export default BrainLeftSidebarWaveClose;
