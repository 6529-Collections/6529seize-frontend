import React from "react";

/**
 * Audio display component without interactive modal functionality.
 * Based on DropListItemContentMediaAudio but with optional controls.
 */
function MediaDisplayAudio({
  src,
  showControls = false,
}: {
  readonly src: string;
  readonly showControls?: boolean | undefined;
}) {
  return (
    <div className="tw-w-full tw-h-full">
      {showControls ? (
        <audio controls className="tw-w-full tw-max-h-10">
          <source src={src} type="audio/mpeg" />
          Your browser does not support the audio element.
        </audio>
      ) : (
        <div className="tw-bg-iron-850 tw-rounded-lg tw-p-2 tw-flex tw-items-center tw-justify-center">
          <span className="tw-text-iron-400 tw-text-xs">Audio</span>
        </div>
      )}
    </div>
  );
}

export default React.memo(MediaDisplayAudio);