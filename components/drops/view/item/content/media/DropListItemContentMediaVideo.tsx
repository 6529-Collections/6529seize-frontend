"use client";

import React, { useEffect } from "react";
import { useInView } from "@/hooks/useInView";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { useOptimizedVideo } from "@/hooks/useOptimizedVideo";
import { useHlsPlayer } from "@/hooks/useHlsPlayer";

interface Props {
  readonly src: string;
}

function DropListItemContentMediaVideo({ src }: Props) {
  const [wrapperRef, inView] = useInView<HTMLDivElement>({ threshold: 0.1 });
  const { isApp } = useDeviceInfo();

  // 1) Pick up the best URL (HLS or MP4)
  const { playableUrl, isHls } = useOptimizedVideo(src, {
    pollInterval: 10000,
    maxRetries: 8,
    preferHls: true,
    exponentialBackoff: false,
  });

  // 2) Setup HLS (or native) once and get back the videoRef + loading state
  const { videoRef, isLoading } = useHlsPlayer({
    src: playableUrl,
    isHls,
    fallbackSrc: src,
    autoPlay: inView && !isApp,
  });

  // 3) Play/pause & mute based on scroll visibility
  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl || isLoading) return;

    if (inView) {
      // ensure muted autoplay works
      videoEl.muted = true;
      if (!isApp) videoEl.play().catch(() => {});
    } else {
      videoEl.pause();
      videoEl.muted = true;
    }
  }, [inView, isApp, isLoading, videoRef]);

  // 4) Inline attributes for iOS / legacy WebKit
  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;
    videoEl.setAttribute("webkit-playsinline", "true");
    videoEl.setAttribute("x5-playsinline", "true");
  }, [videoRef]);

  return (
    <div
      ref={wrapperRef}
      className="tw-w-full tw-h-full tw-flex tw-items-center tw-justify-center tw-relative tw-group">
      <video
        ref={videoRef}
        playsInline
        controls
        autoPlay={false} /* we control play via the hook+effect */
        muted
        loop
        className={`
          tw-w-full tw-h-full tw-rounded-xl tw-object-contain
        `}>
        Your browser does not support the video tag.
      </video>
    </div>
  );
}

export default React.memo(DropListItemContentMediaVideo);
