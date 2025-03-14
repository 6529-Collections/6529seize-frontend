import React from "react";
import CircleLoader, {
  CircleLoaderSize,
} from "../../distribution-plan-tool/common/CircleLoader";

interface WaveDropsScrollingOverlayProps {
  readonly isVisible: boolean;
}

export default function WaveDropsScrollingOverlay({
  isVisible,
}: WaveDropsScrollingOverlayProps) {
  if (!isVisible) return null;
  
  return (
    <>
      <div className="tw-absolute tw-inset-0 tw-bg-iron-900 tw-bg-opacity-50 tw-z-10" />
      <div className="tw-absolute tw-inset-0 tw-flex tw-flex-col tw-items-center tw-justify-center tw-z-20">
        <div className="tw-rounded-full tw-p-4">
          <CircleLoader size={CircleLoaderSize.XXLARGE} />
        </div>
      </div>
    </>
  );
}
