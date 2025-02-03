import React from "react";
import { ApiDrop } from "../../../generated/models/ApiDrop";

interface SingleWaveDropContentMetadataProps {
  readonly drop: ApiDrop;
}

export const SingleWaveDropContentMetadata: React.FC<
  SingleWaveDropContentMetadataProps
> = ({ drop }) => {
  return (
    <div className="tw-ml-auto">
      <div className="tw-flex tw-flex-wrap tw-gap-y-1 tw-py-2 tw-px-2 tw-gap-x-2 tw-text-xs tw-text-iron-300">
        {drop.metadata.map((metadata) => (
          <div key={metadata.data_key} className="tw-flex tw-items-center tw-gap-x-1.5">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              aria-hidden="true"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="tw-size-4 tw-flex-shrink-0"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5"
              />
            </svg>
            <div className="tw-truncate">
              <span className="tw-font-semibold">{metadata.data_key}:</span>{" "}
              {metadata.data_value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}; 