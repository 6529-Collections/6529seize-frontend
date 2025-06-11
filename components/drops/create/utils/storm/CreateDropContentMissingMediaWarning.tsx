import Tippy from "@tippyjs/react";
import { ApiWaveParticipationRequirement } from "../../../../../generated/models/ApiWaveParticipationRequirement";

export default function CreateDropContentMissingMediaWarning({
  missingMedia,
}: {
  readonly missingMedia: ApiWaveParticipationRequirement[];
}) {
  const LABELS: Record<ApiWaveParticipationRequirement, string> = {
    AUDIO: "Audio is required",
    VIDEO: "Video is required",
    IMAGE: "Image is required",
  };

  const TOOLTIP: Record<ApiWaveParticipationRequirement, string> = {
    AUDIO: "Please upload an audio file",
    VIDEO: "Please upload a video file",
    IMAGE: "Please upload an image file",
  };
  return (
    <Tippy content={TOOLTIP[missingMedia[0]]}>
      <div className="tw-inline-flex tw-items-center tw-gap-x-2">
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

        <span className="tw-text-xs tw-text-[#FEDF89]">
          {LABELS[missingMedia[0]]}
        </span>
      </div>
    </Tippy>
  );
}
