import React, { useRef, useCallback, useEffect, useState } from "react";
import { useInView } from "../../../../../../hooks/useInView";

interface Props {
  readonly src: string;
  readonly showControls?: boolean;
  readonly disableClickHandler?: boolean;
}
function MediaDisplayVideo({
  src,
  showControls = false,
  disableClickHandler = false,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [wrapperRef, inView] = useInView<HTMLDivElement>({ threshold: 0.1 });
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasInteraction, setHasInteraction] = useState(false);

  const attemptPlay = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;
    
    try {
      await video.play();
      setIsPlaying(true);
    } catch (error) {
      console.error("Playback failed:", error);
      setIsPlaying(false);
    }
  }, []);
  
  const handleVideoClick = useCallback(
    (event: React.MouseEvent<HTMLVideoElement>) => {
      if (!videoRef.current) return;
      
      event.stopPropagation();
      event.preventDefault();
      setHasInteraction(true);
      
      const video = videoRef.current;
      
      if (video.paused) {
        if (video.muted) {
          if (hasInteraction) {
            video.muted = false;
          }
        }
        attemptPlay();
      } else {
        video.pause();
        setIsPlaying(false);
      }
    },
    [hasInteraction, attemptPlay]
  );

  useEffect(() => {
    if (inView) {
      if (videoRef.current && !isPlaying) {
        attemptPlay();
      }
    } else if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, [inView, attemptPlay, isPlaying]);
  
  useEffect(() => {
    const video = videoRef.current;
    return () => {
      if (video) {
        video.pause();
        video.src = "";
        video.load();
      }
    };
  }, []);

  const handleError = useCallback(() => {
    console.error("Video playback error for source:", src);
    setIsPlaying(false);
  }, [src]);

  return (
    <div ref={wrapperRef} className="tw-w-full tw-h-full">
      <video
        ref={videoRef}
        playsInline
        webkit-playsinline="true"
        x5-playsinline="true"
        controls={showControls}
        autoPlay={inView}
        muted
        loop
        preload="auto"
        className="tw-w-full tw-rounded-xl tw-overflow-hidden tw-max-h-full tw-object-contain"
        onClick={disableClickHandler ? undefined : handleVideoClick}
        onError={handleError}
      >
        <source src={src} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </div>
  );
}

export default React.memo(MediaDisplayVideo);
