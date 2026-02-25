"use client";

import { useEffect, useState } from "react";
import { Tooltip } from "react-tooltip";
import { useCopyToClipboard } from "react-use";

import CopyIcon from "@/components/utils/icons/CopyIcon";
import { TOOLTIP_STYLES } from "@/helpers/tooltip.helpers";

export default function ProfileActivityLogItemValueWithCopy({
  title,
  value,
}: {
  readonly title: string;
  readonly value: string;
}) {
  const [isTouchScreen, setIsTouchScreen] = useState(false);
  useEffect(() => {
    setIsTouchScreen(window.matchMedia("(pointer: coarse)").matches);
  }, []);

  const [_, copyToClipboard] = useCopyToClipboard();

  const [titleToShow, setTitleToShow] = useState(title);

  const handleCopy = () => {
    copyToClipboard(value);
    setTitleToShow("Copied!");
    setTimeout(() => {
      setTitleToShow(title);
    }, 1000);
  };
  return (
    <span className="tw-group tw-inline-flex tw-h-6 tw-whitespace-nowrap tw-text-sm tw-font-medium tw-text-iron-300 lg:tw-text-base">
      <span className={titleToShow === "Copied!" ? "tw-text-primary-400" : ""}>
        {titleToShow}
      </span>
      <>
        <button
          onClick={handleCopy}
          className={`${
            isTouchScreen
              ? "tw-block"
              : "tw-opacity-0 group-hover:tw-opacity-100"
          } tw-mx-1 tw-cursor-pointer tw-border-0 tw-bg-transparent tw-text-sm tw-font-semibold tw-text-iron-500 tw-transition tw-duration-300 tw-ease-out hover:tw-text-iron-200 focus:tw-outline-none`}
          data-tooltip-id={`copy-activity-${value}`}
        >
          <div className="tw-flex tw-h-5 tw-w-5 tw-flex-shrink-0 tw-items-center tw-justify-center lg:tw-h-4 lg:tw-w-4 [&>svg]:tw-h-full [&>svg]:tw-w-full">
            <CopyIcon />
          </div>
        </button>
        {!isTouchScreen && (
          <Tooltip
            id={`copy-activity-${value}`}
            place="top"
            positionStrategy="fixed"
            offset={8}
            opacity={1}
            style={TOOLTIP_STYLES}
          >
            <span className="tw-text-xs">Copy</span>
          </Tooltip>
        )}
      </>
    </span>
  );
}
