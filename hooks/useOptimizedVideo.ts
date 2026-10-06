"use client";

import { useNativeAppActivity } from "./useNativeAppActivity";
import { useState, useEffect, useRef } from "react";
import {
  isVideoUrl,
  getVideoConversions,
  checkVideoAvailability,
} from "@/helpers/video.helpers";

interface UseOptimizedVideoOptions {
  /** if false, do not probe optimized renditions yet */
  readonly enabled?: boolean | undefined;
  /** ms between checks */
  readonly pollInterval?: number | undefined;
  readonly maxRetries?: number | undefined;
  /** if true, tries HLS first */
  readonly preferHls?: boolean | undefined;
  /** if true, each pollInterval can grow exponentially (reducing requests on slow encodes) */
  readonly exponentialBackoff?: boolean | undefined;
}

interface UseOptimizedVideoResult {
  /** The best URL found (HLS or MP4). Falls back to original if none found. */
  readonly playableUrl: string;
  /** True if the returned URL is a known optimized one (HLS or MP4_720/1080). */
  readonly isOptimized: boolean;
  /** True while we are still checking for better renditions. */
  readonly isChecking: boolean;
  /** True if the playableUrl is an HLS .m3u8. */
  readonly isHls: boolean;
}

/**
 * Poll for HLS or MP4 renditions until found or maxRetries is reached.
 * If nothing is ready, fall back to the original URL.
 */
export function useOptimizedVideo(
  originalUrl: string,
  options: UseOptimizedVideoOptions = {}
): UseOptimizedVideoResult {
  const {
    enabled = true,
    pollInterval = 15000,
    maxRetries = 8,
    preferHls = true,
    exponentialBackoff = false,
  } = options;

  const isAppActive = useNativeAppActivity();
  const sourceRef = useRef<string | null>(null);
  const optimizedSourceRef = useRef<string | null>(null);
  const [rendition, setRendition] = useState({
    source: originalUrl,
    playableUrl: originalUrl,
    isOptimized: false,
    isChecking: false,
    isHls: false,
  });
  const retriesRef = useRef(0);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (sourceRef.current !== originalUrl) {
      sourceRef.current = originalUrl;
      optimizedSourceRef.current = null;
      setRendition({
        source: originalUrl,
        playableUrl: originalUrl,
        isOptimized: false,
        isHls: false,
        isChecking: false,
      });
      retriesRef.current = 0;
    }
    if (
      !enabled ||
      !isAppActive ||
      optimizedSourceRef.current === originalUrl
    ) {
      return;
    }

    // Only proceed if recognized video URL (and presumably in /drops/)
    if (!originalUrl || !isVideoUrl(originalUrl)) {
      return;
    }

    const conversions = getVideoConversions(originalUrl);
    if (!conversions) {
      return; // Not a recognized /drops/ path
    }

    let isMounted = true;
    const isCurrentProbe = () => isMounted;

    const checkOptimized = async () => {
      if (!isCurrentProbe()) return;

      // If we've retried too many times, settle on the original
      if (retriesRef.current >= maxRetries) {
        setRendition({
          source: originalUrl,
          playableUrl: originalUrl,
          isOptimized: false,
          isHls: false,
          isChecking: false,
        });
        return;
      }

      setRendition((previous) => ({ ...previous, isChecking: true }));

      try {
        // 1) Try HLS first if preferHls is true
        if (preferHls) {
          const hlsOk = await checkVideoAvailability(conversions.HLS);
          if (!isCurrentProbe()) return;
          if (hlsOk) {
            optimizedSourceRef.current = originalUrl;
            setRendition({
              source: originalUrl,
              playableUrl: conversions.HLS,
              isOptimized: true,
              isHls: true,
              isChecking: false,
            });
            return;
          }
        }

        // 2) Try 1080p MP4
        const ok1080 = await checkVideoAvailability(conversions.MP4_1080P);
        if (!isCurrentProbe()) return;
        if (ok1080) {
          optimizedSourceRef.current = originalUrl;
          setRendition({
            source: originalUrl,
            playableUrl: conversions.MP4_1080P,
            isOptimized: true,
            isHls: false,
            isChecking: false,
          });
          return;
        }

        // 3) Try 720p MP4
        const ok720 = await checkVideoAvailability(conversions.MP4_720P);
        if (!isCurrentProbe()) return;
        if (ok720) {
          optimizedSourceRef.current = originalUrl;
          setRendition({
            source: originalUrl,
            playableUrl: conversions.MP4_720P,
            isOptimized: true,
            isHls: false,
            isChecking: false,
          });
          return;
        }

        // If none are yet ready, increase retry count & schedule another check
        retriesRef.current += 1;

        // Optionally use exponential backoff
        const delay = exponentialBackoff
          ? pollInterval * Math.pow(2, retriesRef.current - 1)
          : pollInterval;

        timeoutRef.current = window.setTimeout(() => {
          void checkOptimized();
        }, delay);
      } catch {
      } finally {
        if (isCurrentProbe()) {
          setRendition((previous) => ({ ...previous, isChecking: false }));
        }
      }
    };

    void checkOptimized();

    return () => {
      isMounted = false;
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [
    originalUrl,
    enabled,
    isAppActive,
    pollInterval,
    maxRetries,
    preferHls,
    exponentialBackoff,
  ]);

  return {
    playableUrl:
      rendition.source === originalUrl ? rendition.playableUrl : originalUrl,
    isOptimized: rendition.source === originalUrl && rendition.isOptimized,
    isChecking:
      enabled &&
      isAppActive &&
      rendition.source === originalUrl &&
      rendition.isChecking,
    isHls: rendition.source === originalUrl && rendition.isHls,
  };
}
