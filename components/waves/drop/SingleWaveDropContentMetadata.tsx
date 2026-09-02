"use client";

import React, { useState } from "react";
import type { ApiDropMetadataResponse } from "@/generated/models/ApiDropMetadataResponse";
import { Tooltip } from "react-tooltip";
import useIsMobileLayoutViewport from "@/hooks/useIsMobileLayoutViewport";
import { buildTooltipId } from "@/helpers/tooltip.helpers";
import MobileWrapperDialog from "@/components/mobile-wrapper-dialog/MobileWrapperDialog";
import Button from "@/components/utils/button/Button";

interface SingleWaveDropContentMetadataProps {
  readonly metadata: readonly ApiDropMetadataResponse[];
}

interface SelectedMetadata {
  readonly label: string;
  readonly value: string;
}

// Component to display individual metadata items in cards
const MetadataItem: React.FC<{
  readonly label: string;
  readonly value: string;
  readonly isCompactLayout: boolean;
  readonly onCompactSelect: (metadata: SelectedMetadata) => void;
}> = ({ label, value, isCompactLayout, onCompactSelect }) => {
  const tooltipId = buildTooltipId("metadata", label, value);
  const content = (
    <>
      <span className="tw-mr-1.5 tw-min-w-0 tw-max-w-full tw-break-words tw-text-xs tw-font-normal tw-uppercase tw-text-iron-400">
        {label}:
      </span>
      <span
        className={`tw-min-w-0 tw-text-xs tw-font-medium tw-text-iron-50 ${
          isCompactLayout
            ? "tw-line-clamp-2 tw-whitespace-normal tw-break-words"
            : "tw-truncate"
        }`}
        data-tooltip-id={tooltipId}
      >
        {value}
      </span>
      {!isCompactLayout && (
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
  );

  const className =
    "tw-flex tw-min-h-11 tw-min-w-0 tw-flex-col tw-gap-y-1.5 tw-overflow-hidden tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-900 tw-px-3 tw-py-2 tw-text-left";

  if (isCompactLayout) {
    return (
      <button
        type="button"
        aria-label={`View full ${label} metadata: ${value}`}
        className={`${className} tw-cursor-pointer tw-appearance-none`}
        onClick={(event) => {
          event.stopPropagation();
          onCompactSelect({ label, value });
        }}
      >
        {content}
      </button>
    );
  }

  return <div className={className}>{content}</div>;
};

const SingleWaveDropContentMetadataContent: React.FC<
  SingleWaveDropContentMetadataProps & {
    readonly isCompactLayout: boolean;
  }
> = ({ metadata, isCompactLayout }) => {
  const [showAllMetadata, setShowAllMetadata] = useState(false);
  const [selectedMetadata, setSelectedMetadata] =
    useState<SelectedMetadata | null>(null);

  const handleToggleMetadata = (event: React.MouseEvent) => {
    event.stopPropagation();
    setShowAllMetadata((current) => !current);
  };

  // Render metadata content if available
  const hasMetadata = metadata.length > 0;
  const visibleMetadata = showAllMetadata ? metadata : metadata.slice(0, 2);

  return (
    <div className="tw-flex tw-w-full tw-flex-col tw-gap-2">
      {hasMetadata && (
        <div className="tw-grid tw-grid-cols-2 tw-gap-2 sm:tw-grid-cols-4">
          {visibleMetadata.map((item) => (
            <MetadataItem
              key={item.data_key}
              label={item.data_key}
              value={item.data_value || ""}
              isCompactLayout={isCompactLayout}
              onCompactSelect={setSelectedMetadata}
            />
          ))}
        </div>
      )}
      {metadata.length > 2 && (
        <Button
          type="button"
          onClick={handleToggleMetadata}
          variant="tertiary"
          size="xs"
          className={`tw-min-w-[100px] ${isCompactLayout ? "tw-min-h-11" : ""}`}
          aria-expanded={showAllMetadata}
        >
          {showAllMetadata ? "Show less" : "Show all"}
        </Button>
      )}
      {selectedMetadata && isCompactLayout && (
        <MobileWrapperDialog
          title={selectedMetadata.label}
          isOpen={true}
          onClose={() => setSelectedMetadata(null)}
        >
          <div className="tw-px-4 sm:tw-px-6">
            <p className="tw-m-0 tw-whitespace-pre-wrap tw-break-words tw-text-sm tw-leading-relaxed tw-text-iron-100">
              {selectedMetadata.value}
            </p>
          </div>
        </MobileWrapperDialog>
      )}
    </div>
  );
};

export const SingleWaveDropContentMetadata: React.FC<
  SingleWaveDropContentMetadataProps
> = ({ metadata }) => {
  const isCompactLayout = useIsMobileLayoutViewport();

  return (
    <SingleWaveDropContentMetadataContent
      key={isCompactLayout ? "compact" : "regular"}
      metadata={metadata}
      isCompactLayout={isCompactLayout}
    />
  );
};
