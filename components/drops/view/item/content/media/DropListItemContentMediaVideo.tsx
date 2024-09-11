import React, { useRef } from "react";
import useCapacitor from "../../../../../../hooks/useCapacitor";

export default function DropListItemContentMediaVideo({
  src,
}: {
  readonly src: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  const capacitor = useCapacitor();

  const handleVideoClick = (event: React.MouseEvent<HTMLVideoElement>) => {
    if (videoRef.current) {
      event.preventDefault();
      if (videoRef.current.muted) {
        videoRef.current.muted = false;
      } else if (!videoRef.current.muted && !videoRef.current.paused) {
        videoRef.current.pause();
      } else if (videoRef.current.paused) {
        videoRef.current.play();
      }
    }
  };

  return (
    <div className="]">
      <video
        ref={videoRef}
        controls
        autoPlay={!capacitor.isCapacitor}
        muted
        loop
        className="tw-w-full tw-rounded-xl tw-overflow-hidden tw-max-h-[516px]"
        onClick={handleVideoClick}>
        <source src={src} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </div>
  );
}
