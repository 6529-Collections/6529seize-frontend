"use client";

import type { ApiDropMetadataResponse } from "@/generated/models/ApiDropMetadataResponse";
import { buildTooltipId } from "@/helpers/tooltip.helpers";
import useIsMobileDevice from "@/hooks/isMobileDevice";
import { useState } from "react";
import { Tooltip } from "react-tooltip";

interface ParticipationDropMetadataProps {
  readonly metadata: ApiDropMetadataResponse[];
  readonly contextId?: string | number | undefined;
}

// Component to display individual metadata items in cards
const MetadataItem: React.FC<{
  readonly meta: ApiDropMetadataResponse;
  readonly contextId?: string | number | undefined;
}> = ({ meta, contextId }) => {
  const isMobile = useIsMobileDevice();

  const tooltipId = buildTooltipId("metadata", contextId, meta.data_key);

  return (
    <div className="tw-flex tw-flex-col tw-gap-y-1 tw-rounded-md tw-bg-iron-800/50 tw-px-2 tw-py-1">
      <span className="tw-mr-1.5 tw-text-xs tw-text-iron-400">
        {meta.data_key}:
      </span>
      <>
        <span
          className="tw-line-clamp-2 tw-text-xs tw-font-medium tw-text-iron-200"
          data-tooltip-id={tooltipId}
        >
          {meta.data_value}
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
            {meta.data_value}
          </Tooltip>
        )}
      </>
    </div>
  );
};

export default function ParticipationDropMetadata({
  metadata,
  contextId,
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
    <div className="tw-hidden tw-border-t tw-border-iron-800/30 tw-px-4 tw-pt-4 sm:tw-ml-[3.25rem] lg:tw-block">
      <div className="tw-grid tw-grid-cols-2 tw-gap-2 sm:tw-grid-cols-4">
        {metadata.slice(0, 2).map((meta) => (
          <MetadataItem key={meta.data_key} meta={meta} contextId={contextId} />
        ))}

        {/* Show more button or additional items */}
        {metadata.length > 2 &&
          (showAllMetadata ? (
            <>
              {metadata.slice(2).map((meta) => (
                <MetadataItem
                  key={meta.data_key}
                  meta={meta}
                  contextId={contextId}
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
              onClick={handleShowMore}
              className="tw-border-0 tw-bg-transparent tw-text-left tw-text-xs tw-font-semibold tw-text-primary-400 tw-transition tw-duration-300 tw-ease-out desktop-hover:hover:tw-text-primary-300"
            >
              Show all
            </button>
          ))}
      </div>
    </div>
  );
}
