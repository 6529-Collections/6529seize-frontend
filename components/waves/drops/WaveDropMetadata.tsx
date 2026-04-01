"use client";

import React, { useState } from "react";
import { Tooltip } from "react-tooltip";
import type { DropMetadata } from "@/entities/IDrop";
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
    <div className="tw-flex tw-flex-col tw-gap-y-1.5 tw-rounded-md tw-bg-iron-800 tw-px-2 tw-py-1">
      <span className="tw-mr-1.5 tw-text-xs tw-font-normal tw-uppercase tw-text-iron-400">
        {label}:
      </span>
      <>
        <span
          className="tw-truncate tw-text-xs tw-font-medium tw-text-iron-50"
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

  if (metadata.length === 0) {
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
    <div className="tw-mt-4 tw-hidden tw-flex-col tw-gap-2 lg:tw-flex">
      <div className="tw-grid tw-grid-cols-2 tw-gap-2 sm:tw-grid-cols-4">
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
                className="tw-cursor-pointer tw-self-end tw-whitespace-nowrap tw-border-0 tw-bg-transparent tw-pb-1 tw-text-left tw-text-xs tw-font-medium tw-text-iron-400 tw-transition-colors desktop-hover:hover:tw-text-iron-300"
              >
                Show less
              </button>
            </>
          ) : (
            <button
              onClick={handleShowMore}
              className="tw-cursor-pointer tw-self-end tw-whitespace-nowrap tw-border-0 tw-bg-transparent tw-pb-1 tw-text-left tw-text-xs tw-font-medium tw-text-iron-400 tw-transition-colors desktop-hover:hover:tw-text-iron-300"
            >
              Show all
            </button>
          ))}
      </div>
    </div>
  );
}
