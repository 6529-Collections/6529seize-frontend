"use client";

import React, { useState } from "react";
import { Tooltip } from "react-tooltip";
import { DropMetadata } from "@/entities/IDrop";
import useIsMobileDevice from "@/hooks/isMobileDevice";
import { buildTooltipId } from "@/helpers/tooltip.helpers";

interface WaveDropMetadataProps {
  readonly metadata: DropMetadata[];
}

// Component to display individual metadata items in cards
const MetadataItem: React.FC<{ label: string; value: string }> = ({
  label,
  value,
}) => {
  const isMobile = useIsMobileDevice();

  const tooltipId = buildTooltipId("metadata", label, value);

  return (
    <div className="tw-px-2 tw-py-1 tw-rounded-md tw-bg-iron-800 tw-flex tw-flex-col tw-gap-y-1.5">
      <span className="tw-text-iron-400 tw-text-xs tw-mr-1.5 tw-uppercase tw-font-normal">
        {label}:
      </span>
      <>
        <span
          className="tw-text-iron-50 tw-text-xs tw-font-medium tw-truncate"
          data-tooltip-id={tooltipId}
        >
          {value}
        </span>
        {!isMobile && (
          <Tooltip
            id={tooltipId}
            place="top"
            style={{
              backgroundColor: "#1F2937",
              color: "white",
              padding: "4px 8px",
            }}
          >
            {value}
          </Tooltip>
        )}
      </>
    </div>
  );
};

export default function WaveDropMetadata({ metadata }: WaveDropMetadataProps) {
  const [showAllMetadata, setShowAllMetadata] = useState(false);

  // Ensure metadata exists and is not empty
  if (!metadata || metadata.length === 0) {
    return null;
  }

  const handleShowMore = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowAllMetadata(true);
  };

  const handleShowLess = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowAllMetadata(false);
  };

  return (
    <div className="tw-flex-col tw-gap-2 tw-hidden lg:tw-flex">
      <div className="tw-grid tw-grid-cols-2 sm:tw-grid-cols-4 tw-gap-2">
        {/* Always show first 2 items */}
        {metadata.slice(0, 2).map((item) => (
          <MetadataItem
            key={item.data_key}
            label={item.data_key}
            value={item.data_value || ""}
          />
        ))}

        {/* Show more button or additional items */}
        {metadata.length > 2 &&
          (showAllMetadata ? (
            <>
              {metadata.slice(2).map((item) => (
                <MetadataItem
                  key={item.data_key}
                  label={item.data_key}
                  value={item.data_value || ""}
                />
              ))}
              <button
                onClick={handleShowLess}
                className="tw-text-xs tw-text-primary-400 desktop-hover:hover:tw-text-primary-300 tw-transition tw-duration-300 tw-ease-out tw-font-semibold tw-bg-transparent tw-border-0 tw-text-left">
                Show less
              </button>
            </>
          ) : (
            <button
              onClick={handleShowMore}
              className="tw-text-xs tw-text-primary-400 desktop-hover:hover:tw-text-primary-300 tw-transition tw-duration-300 tw-ease-out tw-font-semibold tw-bg-transparent tw-border-0 tw-text-left">
              Show all
            </button>
          ))}
      </div>
    </div>
  );
}
