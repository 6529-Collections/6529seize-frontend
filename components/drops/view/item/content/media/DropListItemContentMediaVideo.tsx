// DropListItemContentMediaVideo.tsx

import React, { useRef, useEffect, useCallback } from "react";
import useDeviceInfo from "../../../../../../hooks/useDeviceInfo";
import { useInView } from "../../../../../../hooks/useInView";
import { useOptimizedVideo } from "../../../../../../hooks/useOptimizedVideo";

interface Props {
  readonly src: string;
}

function DropListItemContentMediaVideo({ src }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<any>(null);

  // Intersection-observer hook for play/pause on scroll
  const [wrapperRef, inView] = useInView<HTMLDivElement>({ threshold: 0.1 });

  // Detect app environment
  const { isApp } = useDeviceInfo();

  // Optimized URL (HLS preferred)
  const { playableUrl, isHls } = useOptimizedVideo(src, {
    pollInterval: 10000,
    maxRetries: 8,
    preferHls: true,
    exponentialBackoff: false,
  });

  // Setup HLS.js if needed
  const setupHls = useCallback(
    async (video: HTMLVideoElement) => {
      try {
        const mod = await import("hls.js");
        const HlsConstructor = (mod.default ?? mod) as any;
        if (!HlsConstructor.isSupported()) {
          video.src = playableUrl;
          video.load();
          return;
        }

        const hls = new HlsConstructor();
        hlsRef.current = hls;
        hls.loadSource(playableUrl);
        hls.attachMedia(video);
        hls.on(HlsConstructor.Events.MANIFEST_PARSED, () => {
          video.load();
          if (inView) video.play().catch(() => {});
        });
        hls.on(HlsConstructor.Events.ERROR, (_: any, data: any) => {
          if (data.fatal) {
            hls.destroy();
            video.src = src;
            video.load();
          }
        });
      } catch {
        // On import failure, fallback
        video.src = src;
        video.load();
      }
    },
    [playableUrl, src, inView]
  );

  // Attach correct source and auto-play/pause on view
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // cleanup previous
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    video.pause();
    video.src = "";

    if (isHls) {
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = playableUrl;
        video.load();
      } else {
        setupHls(video);
      }
    } else {
      video.src = playableUrl;
      video.load();
    }

    if (inView && !isApp) {
      video.play().catch(() => {});
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      video.pause();
    };
  }, [playableUrl, isHls, inView, isApp, src, setupHls]);

  // Pause & mute outside view; play when back in view
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (!inView) {
      video.pause();
      video.muted = true;
    } else if (!isApp) {
      video.play().catch(() => {});
    }
  }, [inView, isApp]);

  // Ensure vendor inline attributes for legacy Safari
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.setAttribute("webkit-playsinline", "true");
    video.setAttribute("x5-playsinline", "true");
  }, []);

  return (
    <div
      ref={wrapperRef}
      className="tw-w-full tw-h-full tw-flex tw-items-center tw-justify-center"
    >
      {inView && (
        <video
          ref={videoRef}
          playsInline
          controls
          autoPlay={!isApp}
          muted
          loop
          className="tw-w-full tw-h-full tw-rounded-xl tw-object-contain"
        >
          Your browser does not support the video tag.
        </video>
      )}
    </div>
  );
}

export default React.memo(DropListItemContentMediaVideo);
