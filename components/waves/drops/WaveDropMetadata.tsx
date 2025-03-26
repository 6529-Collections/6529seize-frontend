import React from "react";
import Tippy from "@tippyjs/react";
import { DropMetadata } from "../../../entities/IDrop";
import useIsMobileDevice from "../../../hooks/isMobileDevice";

interface WaveDropMetadataProps {
  readonly metadata: DropMetadata[];
}

// Component to display individual metadata items in cards
const MetadataItem: React.FC<{ label: string; value: string }> = ({ label, value }) => {
  const isMobile = useIsMobileDevice();
  
  return (
    <div className="tw-px-2 tw-py-1 tw-rounded-md tw-bg-iron-800 tw-flex tw-flex-col tw-gap-y-1">
      <span className="tw-text-iron-400 tw-text-xs tw-mr-1.5">{label}:</span>
      <Tippy
        disabled={isMobile}
        content={value}
        placement="top"
        theme="dark"
      >
        <span className="tw-text-iron-200 tw-text-xs tw-font-medium tw-truncate">
          {value}
        </span>
      </Tippy>
    </div>
  );
};

export default function WaveDropMetadata({ metadata }: WaveDropMetadataProps) {
  // Ensure metadata exists and is not empty
  if (!metadata || metadata.length === 0) {
    return null;
  }
  
  return (
    <div className="tw-flex tw-flex-col tw-gap-2">
      <div className="tw-grid tw-grid-cols-2 sm:tw-grid-cols-4 tw-gap-2">
        {/* Show all metadata items without show more/less buttons */}
        {metadata.map((item) => (
          <MetadataItem 
            key={item.data_key} 
            label={item.data_key} 
            value={item.data_value || ""}
          />
        ))}
      </div>
    </div>
  );
}