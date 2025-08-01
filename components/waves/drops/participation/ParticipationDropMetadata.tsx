"use client";

import { ApiDropMetadata } from "../../../../generated/models/ApiDropMetadata";
import { Tooltip } from "react-tooltip";
import useIsMobileDevice from "../../../../hooks/isMobileDevice";
import { useState } from "react";

interface ParticipationDropMetadataProps {
  readonly metadata: ApiDropMetadata[];
}

// Component to display individual metadata items in cards
const MetadataItem: React.FC<{ meta: ApiDropMetadata }> = ({ meta }) => {
  const isMobile = useIsMobileDevice();

  return (
    <div className="tw-px-2 tw-py-1 tw-rounded-md tw-bg-iron-800/50 tw-flex tw-flex-col tw-gap-y-1">
      <span className="tw-text-iron-400 tw-text-xs tw-mr-1.5">
        {meta.data_key}:
      </span>
      <>
        <span 
          className="tw-text-iron-200 tw-text-xs tw-font-medium tw-line-clamp-2"
          data-tooltip-id={`metadata-${meta.data_key}`}
        >
          {meta.data_value}
        </span>
        {!isMobile && (
          <Tooltip
            id={`metadata-${meta.data_key}`}
            place="top"
            style={{
              backgroundColor: "#1F2937",
              color: "white",
              padding: "4px 8px",
            }}
          >
            {meta.data_value}
          </Tooltip>
        )}
      </>
    </div>
  );
};

export default function ParticipationDropMetadata({
  metadata,
}: ParticipationDropMetadataProps) {
  const [showAllMetadata, setShowAllMetadata] = useState(false);

  if (!metadata || metadata.length === 0) return null;

  const handleShowMore = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowAllMetadata(true);
  };

  const handleShowLess = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowAllMetadata(false);
  };

  return (
    <div className="tw-px-4 sm:tw-ml-[3.25rem] tw-pt-4 tw-hidden lg:tw-block tw-border-t tw-border-iron-800/30">
      <div className="tw-grid tw-grid-cols-2 sm:tw-grid-cols-4 tw-gap-2">
        {/* Always show first 2 items */}
        {metadata.slice(0, 2).map((meta) => (
          <MetadataItem key={meta.data_key} meta={meta} />
        ))}

        {/* Show more button or additional items */}
        {metadata.length > 2 &&
          (showAllMetadata ? (
            <>
              {metadata.slice(2).map((meta) => (
                <MetadataItem key={meta.data_key} meta={meta} />
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
