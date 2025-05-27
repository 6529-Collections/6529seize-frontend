// DropListItemContentMediaVideo.tsx

import React, { useRef, useEffect } from "react";
import useDeviceInfo from "../../../../../../hooks/useDeviceInfo";
import { useInView } from "../../../../../../hooks/useInView";
import { useOptimizedVideo } from "../../../../../../hooks/useOptimizedVideo";

interface Props {
  src: string;
}

function DropListItemContentMediaVideo({ src }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<any>(null);

  // Intersection-observer hook for play/pause on scroll
  const [wrapperRef, inView] = useInView<HTMLDivElement>({ threshold: 0.1 });

  // Detect native vs. Capacitor environment
  const { isApp } = useDeviceInfo();

  const { playableUrl, isHls } = useOptimizedVideo(src, {
    pollInterval: 10000,
    maxRetries: 8,
    preferHls: true,
    exponentialBackoff: false,
  });

  // Whenever the chosen URL or HLS flag changes, attach to <video>
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Clean up any existing Hls.js instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (isHls) {
      // If the browser supports HLS natively (Safari/iOS)
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = playableUrl;
      } else {
        // Otherwise dynamically load hls.js
        (async () => {
          try {
            const mod = await import("hls.js");
            const HlsConstructor = mod.default ?? mod;
            if (!HlsConstructor.isSupported()) {
              // Fallback to direct .m3u8 if hls.js isn't supported
              video.src = playableUrl;
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

            hls.on(HlsConstructor.Events.ERROR, (_evt: any, data: any) => {
              if (data.fatal) {
                hls.destroy();
                // Minimal fallback: go back to original if HLS fails at runtime
                video.src = src;
              }
            });
          } catch {
            // If dynamic import fails, fallback to original
            video.src = src;
          }
        })();
      }
    } else {
      // Not HLS: use MP4 or original URL
      video.src = playableUrl;
      video.load();
    }

    // Auto-play if in view and not in App
    if (inView && !isApp) {
      video.play().catch(() => {});
    }

    // Cleanup on unmount or source change
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [playableUrl, isHls, inView, isApp, src]);

  // Pause & mute when out of view; play when back in view
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

  return (
    <div
      ref={wrapperRef}
      className="tw-w-full tw-h-full tw-flex tw-items-center tw-justify-center"
    >
      {inView && (
        <video
          ref={videoRef}
          playsInline
          webkit-playsinline="true"
          x5-playsinline="true"
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
