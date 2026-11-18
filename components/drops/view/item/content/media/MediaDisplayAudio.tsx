import React from "react";
import { getMediaPlaybackUrl } from "./mediaPlaybackUrl";

/**
 * Audio display component without interactive modal functionality.
 * Based on DropListItemContentMediaAudio but with optional controls.
 */
function MediaDisplayAudio({
  src: storedSrc,
  showControls = false,
}: {
  readonly src: string;
  readonly showControls?: boolean | undefined;
}) {
  // A stored first-party gateway link plays from the configured endpoint.
  const src = getMediaPlaybackUrl(storedSrc);
  return (
    <div className="tw-h-full tw-w-full">
      {showControls ? (
        <audio controls preload="metadata" className="tw-w-full">
          <source src={src} type="audio/mpeg" />
          Your browser does not support the audio element.
        </audio>
      ) : (
        <div className="tw-bg-iron-850 tw-flex tw-items-center tw-justify-center tw-rounded-lg tw-p-2">
          <span className="tw-text-xs tw-text-iron-400">Audio</span>
        </div>
      )}
    </div>
  );
}

export default React.memo(MediaDisplayAudio);
