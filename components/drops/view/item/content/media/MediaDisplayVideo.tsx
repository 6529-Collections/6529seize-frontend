// MediaDisplayVideo.tsx

import React, { useRef, useCallback, useEffect } from "react";
import useDeviceInfo from "../../../../../../hooks/useDeviceInfo";
import { useInView } from "../../../../../../hooks/useInView";
import { useOptimizedVideo } from "../../../../../../hooks/useOptimizedVideo";

interface Props {
  src: string;
  showControls?: boolean;
  disableClickHandler?: boolean;
}

const MediaDisplayVideo: React.FC<Props> = ({
  src,
  showControls = false,
  disableClickHandler = false,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<any>(null);

  // Intersection‐observer for in‐view detection
  const [wrapperRef, inView] = useInView<HTMLDivElement>({ threshold: 0.1 });
  const { isApp } = useDeviceInfo();

  // Poll for HLS → MP4 → original
  const { playableUrl, isHls } = useOptimizedVideo(src, {
    pollInterval: 15_000,
    maxRetries: 8,
    preferHls: true,
  });

  // Silent play() attempt helper
  const attemptPlay = useCallback(async () => {
    const vid = videoRef.current;
    if (!vid) return;
    try {
      await vid.play();
    } catch {
      /* ignore */
    }
  }, []);

  // Load HLS or MP4 and auto‐play / pause on scroll-in/out
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;

    // Teardown existing HLS.js
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    // Reset
    vid.pause();
    vid.src = "";

    // Attach source
    if (isHls && !vid.canPlayType("application/vnd.apple.mpegurl")) {
      (async () => {
        try {
          const mod = await import("hls.js");
          const Hls = (mod.default ?? mod) as any;
          if (!Hls.isSupported()) {
            vid.src = playableUrl;
            vid.load();
          } else {
            const hls = new Hls();
            hlsRef.current = hls;
            hls.loadSource(playableUrl);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
              vid.load();
              if (inView) attemptPlay();
            });
            hls.on(Hls.Events.ERROR, (_evt: any, data: any) => {
              if (data.fatal) {
                hls.destroy();
                vid.src = src;
              }
            });
          }
        } catch {
          vid.src = src;
        }
      })();
    } else {
      vid.src = playableUrl;
    }

    // Auto-play/pause purely based on inView
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
  }, [playableUrl, isHls, inView, attemptPlay, src]);

  // Custom tap‐to‐toggle if native controls are off
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
        webkit-playsinline="true"
        x5-playsinline="true"
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
