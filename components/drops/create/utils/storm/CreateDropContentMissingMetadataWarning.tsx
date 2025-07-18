import { Tooltip } from "react-tooltip";
import { ApiWaveRequiredMetadata } from "../../../../../generated/models/ApiWaveRequiredMetadata";

export default function CreateDropContentMissingMetadataWarning({
  missingMetadata,
}: {
  readonly missingMetadata: ApiWaveRequiredMetadata[];
}) {
  const TYPE_LABELS: Record<ApiWaveRequiredMetadata["type"], string> = {
    STRING: "text",
    NUMBER: "number",
  };
  return (
    <>
      <div 
        className="tw-inline-flex tw-items-center tw-gap-x-2"
        data-tooltip-id="missing-metadata-warning"
      >
        <svg
          className="tw-size-4 tw-flex-shrink-0 tw-text-[#FEDF89]"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 16V12M12 8H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        <span className="tw-text-xs tw-text-[#FEDF89]">Metadata is required</span>
      </div>
      <Tooltip 
        id="missing-metadata-warning"
        style={{
          backgroundColor: "#1F2937",
          color: "white", 
          padding: "4px 8px",
        }}
      >
        <ul>
          {missingMetadata.map((metadata, i) => (
            <li key={`missing-metadata-tooltip-${i}`}>
              &quot;{metadata.name}&quot; is required (type:{" "}
              {TYPE_LABELS[metadata.type]})
            </li>
          ))}
        </ul>
      </Tooltip>
    </>
  );
}
