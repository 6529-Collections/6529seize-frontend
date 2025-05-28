// MediaDisplayVideo.tsx

import React, { useRef, useCallback, useEffect } from "react";
import { useInView } from "../../../../../../hooks/useInView";
import { useOptimizedVideo } from "../../../../../../hooks/useOptimizedVideo";

interface Props {
  readonly src: string;
  readonly showControls?: boolean;
  readonly disableClickHandler?: boolean;
}

const MediaDisplayVideo: React.FC<Props> = ({
  src,
  showControls = false,
  disableClickHandler = false,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<any>(null);

  const [wrapperRef, inView] = useInView<HTMLDivElement>({ threshold: 0.1 });

  // Poll for HLS → MP4 → original
  const { playableUrl, isHls } = useOptimizedVideo(src, {
    pollInterval: 15_000,
    maxRetries: 8,
    preferHls: false,
  });

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.setAttribute("webkit-playsinline", "true");
    vid.setAttribute("x5-playsinline", "true");
  }, []);

  // Helper to attempt play without throwing
  const attemptPlay = useCallback(async () => {
    const vid = videoRef.current;
    if (!vid) return;
    try {
      await vid.play();
    } catch {
      // ignore autoplay errors
    }
  }, []);

  // Setup HLS via hls.js when needed
  const setupHls = useCallback(
    async (vid: HTMLVideoElement) => {
      try {
        const mod = await import("hls.js");
        const HlsConstructor = mod.default ?? mod;
        if (!HlsConstructor.isSupported()) {
          vid.src = playableUrl;
          vid.load();
          return;
        }
        const hls = new HlsConstructor();
        hlsRef.current = hls;
        hls.loadSource(playableUrl);
        hls.attachMedia(vid);
        hls.on(HlsConstructor.Events.MANIFEST_PARSED, () => {
          vid.load();
          if (inView) attemptPlay();
        });
        hls.on(HlsConstructor.Events.ERROR, (_evt: any, data: any) => {
          if (data.fatal) {
            hls.destroy();
            vid.src = src;
            vid.load();
          }
        });
      } catch {
        vid.src = src;
        vid.load();
      }
    },
    [playableUrl, src, inView, attemptPlay]
  );

  // Main effect: attach source and handle play/pause on scroll
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;

    // Cleanup previous HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    // Reset video element
    vid.pause();
    vid.src = "";

    if (isHls && !vid.canPlayType("application/vnd.apple.mpegurl")) {
      setupHls(vid);
    } else {
      vid.src = playableUrl;
      vid.load();
    }

    if (inView) {
      attemptPlay();
    } else {
      vid.pause();
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      vid.pause();
    };
  }, [playableUrl, isHls, inView, setupHls, attemptPlay]);

  // Custom tap-to-toggle when native controls are off
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLVideoElement>) => {
      if (disableClickHandler) return;
      const vid = videoRef.current;
      if (!vid) return;
      e.preventDefault();
      e.stopPropagation();
      if (vid.paused) vid.play().catch(() => {});
      else vid.pause();
    },
    [disableClickHandler]
  );

  return (
    <div ref={wrapperRef} className="tw-w-full tw-h-full tw-relative">
      <video
        ref={videoRef}
        playsInline
        muted
        loop
        autoPlay={inView}
        controls={showControls}
        preload="auto"
        className="tw-w-full tw-h-full tw-rounded-xl tw-object-contain"
        onClick={showControls ? undefined : handleClick}
      />
    </div>
  );
};

export default React.memo(MediaDisplayVideo);
