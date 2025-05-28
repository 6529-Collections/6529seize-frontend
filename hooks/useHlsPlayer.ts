import { useCallback, useEffect, useRef, useState } from "react";

/** Optional parameters for HLS logic. */
export interface UseHlsPlayerParams {
  /** The final video URL to load (m3u8 if isHls=true, or MP4, etc.) */
  src: string;
  /** True if the above src is an .m3u8 that needs Hls.js. */
  isHls: boolean;
  /** If true, auto-play when HLS (or fallback) is ready. */
  autoPlay?: boolean;
  /** Called on non-fatal or fatal HLS errors if you want. */
  onError?: (data: any) => void;
  /** Called once the manifest is parsed (like MANIFEST_PARSED). */
  onManifestParsed?: () => void;
  /** If HLS completely fails, we can fallback to this original src. */
  fallbackSrc?: string;
}

/**
 * A custom hook for Hls.js setup/cleanup.
 * Usage:
 *   const { videoRef, isLoading } = useHlsPlayer({
 *     src: playableUrl,
 *     isHls,
 *     fallbackSrc: originalSrc,
 *     autoPlay: inView && !isApp,
 *     onError: (err) => {...},
 *     onManifestParsed: () => {...},
 *   });
 */
export function useHlsPlayer({
  src,
  isHls,
  autoPlay,
  onError,
  onManifestParsed,
  fallbackSrc,
}: UseHlsPlayerParams) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<any>(null);
  const cleanupTimeoutRef = useRef<any>(null);
  const isCleaningUpRef = useRef(false);
  const isFirstMountRef = useRef(true);
  const previousSrcRef = useRef<string>("");

  const [isLoading, setIsLoading] = useState(true);

  // Cleanup function to destroy Hls instance safely
  const cleanupHls = useCallback(
    (immediate = false) => {
      if (cleanupTimeoutRef.current) {
        clearTimeout(cleanupTimeoutRef.current);
      }

      const doCleanup = () => {
        if (hlsRef.current && !isCleaningUpRef.current) {
          isCleaningUpRef.current = true;
          try {
            hlsRef.current.stopLoad();
            hlsRef.current.detachMedia();
            hlsRef.current.destroy();
          } catch (error) {
            console.warn("HLS cleanup error:", error);
          }
          hlsRef.current = null;
          isCleaningUpRef.current = false;
        }
      };

      if (immediate) {
        doCleanup();
      } else {
        // small delay to avoid race conditions
        cleanupTimeoutRef.current = setTimeout(doCleanup, 100);
      }
    },
    []
  );

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    // Check if this is a new source vs. initial mount
    const isInitialMount = isFirstMountRef.current;
    const sourceChanged =
      previousSrcRef.current !== src && previousSrcRef.current !== "";

    // Update refs for next render
    isFirstMountRef.current = false;
    previousSrcRef.current = src;

    // Only do cleanup if source actually changed (not on initial mount)
    if (sourceChanged) {
      setIsLoading(true);
      cleanupHls(true);
      videoEl.pause();
      videoEl.removeAttribute("src");
      videoEl.load();
    } else if (isInitialMount) {
      // On initial mount, just set loading
      setIsLoading(true);
    }

    // If isHls=true, we attempt Hls.js
    if (isHls) {
      (async () => {
        try {
          const mod = await import("hls.js");
          const HlsConstructor = (mod.default ?? mod) as any;

          // If browser can't use Hls.js, fallback
          if (!HlsConstructor.isSupported()) {
            videoEl.src = src;
            videoEl.load();
            setIsLoading(false);
            if (autoPlay) {
              videoEl.play().catch((e) => {
                console.warn("Autoplay failed:", e);
              });
            }
            return;
          }

          // Cleanup if we're changing sources
          if (sourceChanged) {
            cleanupHls(true);
          }

          // Setup new Hls instance
          const hls = new HlsConstructor({
            debug: false,
            enableWorker: true,
            lowLatencyMode: false,
            backBufferLength: 90,
            maxBufferLength: 30,
            maxMaxBufferLength: 600,
            maxBufferSize: 60 * 1000 * 1000,
            maxBufferHole: 0.5,
            highBufferWatchdogPeriod: 2,
            nudgeOffset: 0.1,
            nudgeMaxRetry: 3,
            maxFragLookUpTolerance: 0.25,
            enableSoftwareAES: true,
            startLevel: -1,
            fragLoadingTimeOut: 20000,
            fragLoadingMaxRetry: 6,
            fragLoadingRetryDelay: 1000,
            fragLoadingMaxRetryTimeout: 64000,
          });

          hlsRef.current = hls;

          // Listen for errors
          hls.on(HlsConstructor.Events.ERROR, (_: any, data: any) => {
            if (onError) onError(data);

            if (data.fatal) {
              switch (data.type) {
                case HlsConstructor.ErrorTypes.NETWORK_ERROR:
                  if (
                    data.details === HlsConstructor.ErrorDetails.MANIFEST_LOAD_ERROR ||
                    data.details === HlsConstructor.ErrorDetails.MANIFEST_LOAD_TIMEOUT
                  ) {
                    setTimeout(() => {
                      if (hlsRef.current === hls) {
                        hls.loadSource(src);
                      }
                    }, 2000);
                  } else {
                    hls.startLoad();
                  }
                  break;

                case HlsConstructor.ErrorTypes.MEDIA_ERROR:
                  hls.recoverMediaError();
                  break;

                default:
                  cleanupHls(true);
                  if (fallbackSrc) {
                    videoEl.src = fallbackSrc;
                    videoEl.load();
                  }
                  break;
              }
            }
          });

          // On manifest parse, we can start playing if autoPlay
          hls.on(HlsConstructor.Events.MANIFEST_PARSED, () => {
            setIsLoading(false);
            if (onManifestParsed) onManifestParsed();
            if (!isCleaningUpRef.current && autoPlay) {
              videoEl.play().catch(() => {});
            }
          });

          hls.loadSource(src);
          hls.attachMedia(videoEl);
        } catch (error) {
          setIsLoading(false);
          if (fallbackSrc) {
            videoEl.src = fallbackSrc;
            videoEl.load();
            if (autoPlay) {
              videoEl.play().catch(() => {});
            }
          }
        }
      })();
    } else {
      // Not HLS => just assign the src
      videoEl.src = src;
      videoEl.load();
      setIsLoading(false);
      if (autoPlay) {
        videoEl.play().catch(() => {});
      }
    }

    // Cleanup on unmount
    return () => {
      if (cleanupTimeoutRef.current) {
        clearTimeout(cleanupTimeoutRef.current);
      }
      cleanupHls(true);
      if (videoEl) {
        videoEl.pause();
        videoEl.removeAttribute("src");
        videoEl.load();
      }
    };
  }, [
    src,
    isHls,
    autoPlay,
    fallbackSrc,
    onError,
    onManifestParsed,
    cleanupHls,
  ]);

  return {
    /** A ref to the <video> element, which the caller can render. */
    videoRef,
    /** True if still loading or parsing the manifest, etc. */
    isLoading,
  };
}
