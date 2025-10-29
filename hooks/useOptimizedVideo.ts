"use client";

import { useState, useEffect, useRef } from "react";
import {
  isVideoUrl,
  getVideoConversions,
  checkVideoAvailability,
} from "@/helpers/video.helpers";

interface UseOptimizedVideoOptions {
  /** ms between checks */
  readonly pollInterval?: number;
  readonly maxRetries?: number;
  /** if true, tries HLS first */
  readonly preferHls?: boolean;
  /** if true, each pollInterval can grow exponentially (reducing requests on slow encodes) */
  readonly exponentialBackoff?: boolean;
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
    pollInterval = 15000,
    maxRetries = 8,
    preferHls = true,
    exponentialBackoff = false,
  } = options;

  const [playableUrl, setPlayableUrl] = useState(originalUrl);
  const [isOptimized, setIsOptimized] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isHls, setIsHls] = useState(false);

  const retriesRef = useRef(0);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    // Reset state whenever the originalUrl changes
    setPlayableUrl(originalUrl);
    setIsOptimized(false);
    setIsHls(false);
    retriesRef.current = 0;

    // Only proceed if recognized video URL (and presumably in /drops/)
    if (!originalUrl || !isVideoUrl(originalUrl)) {
      return;
    }

    const conversions = getVideoConversions(originalUrl);
    if (!conversions) {
      return; // Not a recognized /drops/ path
    }

    let isMounted = true;

    const checkOptimized = async () => {
      if (!isMounted) return;

      // If we've retried too many times, settle on the original
      if (retriesRef.current >= maxRetries) {
        setPlayableUrl(originalUrl);
        setIsChecking(false);
        return;
      }

      setIsChecking(true);

      try {
        // 1) Try HLS first if preferHls is true
        if (preferHls) {
          const hlsOk = await checkVideoAvailability(conversions.HLS);
          if (hlsOk && isMounted) {
            setPlayableUrl(conversions.HLS);
            setIsOptimized(true);
            setIsHls(true);
            setIsChecking(false);
            return;
          }
        }

        // 2) Try 1080p MP4
        const ok1080 = await checkVideoAvailability(conversions.MP4_1080P);
        if (ok1080 && isMounted) {
          setPlayableUrl(conversions.MP4_1080P);
          setIsOptimized(true);
          setIsHls(false);
          setIsChecking(false);
          return;
        }

        // 3) Try 720p MP4
        const ok720 = await checkVideoAvailability(conversions.MP4_720P);
        if (ok720 && isMounted) {
          setPlayableUrl(conversions.MP4_720P);
          setIsOptimized(true);
          setIsHls(false);
          setIsChecking(false);
          return;
        }

        // If none are yet ready, increase retry count & schedule another check
        retriesRef.current += 1;

        // Optionally use exponential backoff
        const delay = exponentialBackoff
          ? pollInterval * Math.pow(2, retriesRef.current - 1)
          : pollInterval;

        timeoutRef.current = window.setTimeout(checkOptimized, delay);
      } catch {
      } finally {
        if (isMounted) {
          setIsChecking(false);
        }
      }
    };

    checkOptimized();

    return () => {
      isMounted = false;
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [originalUrl, pollInterval, maxRetries, preferHls, exponentialBackoff]);

  return {
    playableUrl,
    isOptimized,
    isChecking,
    isHls,
  };
}
