"use client";

import React, { useState } from "react";
import type { ApiDropMetadataResponse } from "@/generated/models/ApiDropMetadataResponse";
import { Tooltip } from "react-tooltip";
import useIsMobileDevice from "@/hooks/isMobileDevice";
import { buildTooltipId } from "@/helpers/tooltip.helpers";

interface SingleWaveDropContentMetadataProps {
  readonly metadata: readonly ApiDropMetadataResponse[];
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

export const SingleWaveDropContentMetadata: React.FC<
  SingleWaveDropContentMetadataProps
> = ({ metadata }) => {
  const [showAllMetadata, setShowAllMetadata] = useState(false);

  const handleShowLess = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowAllMetadata(false);
  };

  const handleShowAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowAllMetadata(true);
  };

  // Render metadata content if available
  const hasMetadata = metadata.length > 0;

  return (
    <div className="tw-flex tw-w-full tw-flex-col tw-gap-2">
      {hasMetadata && (
        <div className="tw-grid tw-grid-cols-2 tw-gap-2 sm:tw-grid-cols-4">
          {/* Always show the first 2 metadata items */}
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
                  className="tw-border-0 tw-bg-transparent tw-text-left tw-text-xs tw-font-semibold tw-text-primary-400 tw-transition tw-duration-300 tw-ease-out desktop-hover:hover:tw-text-primary-300"
                >
                  Show less
                </button>
              </>
            ) : (
              <button
                onClick={handleShowAll}
                className="tw-border-0 tw-bg-transparent tw-text-left tw-text-xs tw-font-semibold tw-text-primary-400 tw-transition tw-duration-300 tw-ease-out desktop-hover:hover:tw-text-primary-300"
              >
                Show all
              </button>
            ))}
        </div>
      )}
    </div>
  );
};
