"use client";

import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { useRouter, usePathname } from "next/navigation";
import { Tooltip } from "react-tooltip";

interface WebBrainLeftSidebarWaveCloseProps {
  readonly waveId: string;
}

const WebBrainLeftSidebarWaveClose: React.FC<WebBrainLeftSidebarWaveCloseProps> = ({
  waveId,
}) => {
  const router = useRouter();
  const pathname = usePathname();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    // Determine base route based on current pathname - WEB SPECIFIC LOGIC
    let baseRoute = "/my-stream";
    if (pathname?.startsWith("/messages")) {
      baseRoute = "/messages";
    } else if (pathname?.startsWith("/waves")) {
      baseRoute = "/waves";
    }

    // Navigate to the base route without the wave parameter
    router.push(baseRoute);
  };

  const tooltipId = `web-wave-close-${waveId}`;

  return (
    <>
      <button
        onClick={handleClick}
        className="tw-mt-0.5 tw-mx-1 tw-border-0 tw-flex tw-items-center tw-justify-center tw-size-7 sm:tw-size-6 tw-rounded-md tw-transition-all tw-duration-200 tw-text-iron-400 hover:tw-text-iron-200 hover:tw-bg-iron-800/80"
        aria-label="Close wave"
        data-tooltip-id={tooltipId}>
        <FontAwesomeIcon
          icon={faTimes}
          className="tw-size-4 sm:tw-size-3 tw-flex-shrink-0"
        />
      </button>
      <Tooltip
        id={tooltipId}
        style={{
          backgroundColor: "#1F2937",
          color: "white",
          padding: "4px 8px",
        }}>
        Close wave
      </Tooltip>
    </>
  );
};

export default WebBrainLeftSidebarWaveClose;