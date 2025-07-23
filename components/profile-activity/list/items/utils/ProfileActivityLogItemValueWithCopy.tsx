"use client";

import { Tooltip } from "react-tooltip";
import { useEffect, useState } from "react";
import { useCopyToClipboard } from "react-use";
import CopyIcon from "@/components/utils/icons/CopyIcon";

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
    <span className="tw-h-6 tw-whitespace-nowrap tw-group tw-inline-flex tw-text-base tw-font-medium tw-text-iron-100">
      {titleToShow}
      <>
        <button
          onClick={handleCopy}
          className={`${
            isTouchScreen ? "tw-block" : "tw-hidden group-hover:tw-block"
          } tw-mx-1 tw-bg-transparent tw-cursor-pointer tw-text-sm tw-font-semibold tw-text-iron-200 tw-border-0 focus:tw-outline-none tw-transition tw-duration-300 tw-ease-out`}
          data-tooltip-id={`copy-activity-${value}`}>
          <CopyIcon />
        </button>
        {!isTouchScreen && (
          <Tooltip
            id={`copy-activity-${value}`}
            place="top"
            style={{
              backgroundColor: "#1F2937",
              color: "white",
              padding: "4px 8px",
            }}>
            Copy
          </Tooltip>
        )}
      </>
    </span>
  );
}
