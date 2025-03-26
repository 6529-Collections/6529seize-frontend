import { ApiDropMetadata } from "../../../../generated/models/ApiDropMetadata";
import Tippy from "@tippyjs/react";
import useIsMobileDevice from "../../../../hooks/isMobileDevice";

interface ParticipationDropMetadataProps {
  readonly metadata: ApiDropMetadata[];
}

export default function ParticipationDropMetadata({
  metadata,
}: ParticipationDropMetadataProps) {
  if (!metadata || metadata.length === 0) return null;

  const isMobile = useIsMobileDevice();

  return (
    <div className="tw-px-4 tw-ml-[3.25rem] tw-pt-4 tw-border-t tw-border-iron-800/30">
      <div className="tw-grid tw-grid-cols-2 sm:tw-grid-cols-4 tw-gap-2">
        {metadata.map((meta) => (
          <div
            key={meta.data_key}
            className="tw-px-2 tw-py-1 tw-rounded-md tw-bg-iron-800/50 tw-flex tw-flex-col tw-gap-y-1"
          >
            <span className="tw-text-iron-400 tw-text-xs tw-mr-1.5">
              {meta.data_key}:
            </span>
            <Tippy
              disabled={isMobile}
              content={meta.data_value}
              placement="top"
              theme="dark"
            >
              <span className="tw-text-iron-200 tw-text-xs tw-font-medium tw-line-clamp-2">
                {meta.data_value}
              </span>
            </Tippy>
          </div>
        ))}
      </div>
    </div>
  );
}
