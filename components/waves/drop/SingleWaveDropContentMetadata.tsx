"use client";

import React, { useState } from "react";
import { ApiDrop } from "../../../generated/models/ApiDrop";
import Tippy from "@tippyjs/react";
import useIsMobileDevice from "../../../hooks/isMobileDevice";

interface SingleWaveDropContentMetadataProps {
  readonly drop: ApiDrop;
}

// Component to display individual metadata items in cards
const MetadataItem: React.FC<{ label: string; value: string }> = ({
  label,
  value,
}) => {
  const isMobile = useIsMobileDevice();

  return (
    <div className="tw-px-2 tw-py-1 tw-rounded-md tw-bg-iron-800 tw-flex tw-flex-col tw-gap-y-1.5">
      <span className="tw-text-iron-400 tw-text-xs tw-mr-1.5 tw-uppercase tw-font-normal">
        {label}:
      </span>
      <Tippy disabled={isMobile} content={value} placement="top" theme="dark">
        <span className="tw-text-iron-50 tw-text-xs tw-font-medium tw-truncate">
          {value}
        </span>
      </Tippy>
    </div>
  );
};

export const SingleWaveDropContentMetadata: React.FC<
  SingleWaveDropContentMetadataProps
> = ({ drop }) => {
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
  const hasMetadata = drop.metadata && drop.metadata.length > 0;

  return (
    <div className="tw-flex tw-flex-col tw-gap-2 tw-w-full">
      {hasMetadata && (
        <div className="tw-grid tw-grid-cols-2 sm:tw-grid-cols-4 tw-gap-2">
          {/* Always show the first 2 metadata items */}
          {drop.metadata.slice(0, 2).map((item) => (
            <MetadataItem
              key={item.data_key}
              label={item.data_key}
              value={item.data_value || ""}
            />
          ))}

          {/* Show more button or additional items */}
          {drop.metadata.length > 2 &&
            (showAllMetadata ? (
              <>
                {drop.metadata.slice(2).map((item) => (
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
                onClick={handleShowAll}
                className="tw-text-xs tw-text-primary-400 desktop-hover:hover:tw-text-primary-300 tw-transition tw-duration-300 tw-ease-out tw-font-semibold tw-bg-transparent tw-border-0 tw-text-left">
                Show all
              </button>
            ))}
        </div>
      )}
    </div>
  );
};
