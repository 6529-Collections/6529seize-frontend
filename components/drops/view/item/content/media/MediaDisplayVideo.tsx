"use client";

import React, { useEffect } from "react";
import { useInView } from "@/hooks/useInView";
import { useOptimizedVideo } from "@/hooks/useOptimizedVideo";
import { useHlsPlayer } from "@/hooks/useHlsPlayer";

interface Props {
  readonly src: string;
  readonly showControls?: boolean | undefined;
}

const MediaDisplayVideo: React.FC<Props> = ({ src, showControls = false }) => {
  // Intersection observer for scroll-based triggers
  const [wrapperRef, inView] = useInView<HTMLDivElement>({ threshold: 0.1 });

  // Poll for HLS → MP4 → fallback original
  const { playableUrl, isHls } = useOptimizedVideo(src, {
    pollInterval: 15000,
    maxRetries: 8,
    preferHls: true,
    exponentialBackoff: false,
  });

  // Use HLS hook to handle the video ref, loading states, etc.
  const { videoRef, isLoading } = useHlsPlayer({
    src: playableUrl,
    isHls,
    fallbackSrc: src, // if HLS fails, revert to original
    autoPlay: inView, // only autoplay if in view
  });

  // Inline attributes for iOS / legacy WebKit
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.setAttribute("webkit-playsinline", "true");
    vid.setAttribute("x5-playsinline", "true");
  }, [videoRef]);

  // Additional effect: if out of view, we can pause
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid || isLoading) return;

    if (!inView) {
      vid.pause();
    } else {
      // Attempt to play if we're in view
      vid.play().catch(() => {});
    }
  }, [inView, isLoading, videoRef]);

  return (
    <div ref={wrapperRef} className="tw-relative tw-h-full tw-w-full">
      <video
        ref={videoRef}
        className="tw-h-full tw-w-full tw-rounded-xl tw-object-contain"
        muted
        loop
        controls={showControls}
        playsInline
        preload="auto"
      />
    </div>
  );
};

export default React.memo(MediaDisplayVideo);
