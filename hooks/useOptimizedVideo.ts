import { useState, useEffect, useRef } from 'react';
import { getVideoConversions, checkVideoAvailability, isVideoUrl } from '../helpers/video.helpers';

export interface UseOptimizedVideoOptions {
  readonly pollInterval?: number;
  readonly maxRetries?: number;
  readonly preferHls?: boolean;
}

export interface UseOptimizedVideoResult {
  readonly playableUrl: string;
  readonly isOptimized: boolean;
  readonly isChecking: boolean;
  readonly isHls: boolean;
}

/**
 * Repeatedly polls for an "optimized" version of the video (HLS/MP4)
 * until found or until retries are exhausted. Defaults to HLS first,
 * then 720p, then 360p, else fallback to original.
 */
export function useOptimizedVideo(
  originalUrl: string,
  options: UseOptimizedVideoOptions = {}
): UseOptimizedVideoResult {
  const {
    pollInterval = 15000,
    maxRetries = 20,
    preferHls = true
  } = options;

  const [playableUrl, setPlayableUrl] = useState(originalUrl);
  const [isOptimized, setIsOptimized] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isHls, setIsHls] = useState(false);

  const retriesRef = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    // reset local states
    setPlayableUrl(originalUrl);
    setIsOptimized(false);
    setIsHls(false);
    retriesRef.current = 0;

    // do nothing if it's obviously not a video or doesn't match /drops/ pattern
    if (!originalUrl || !isVideoUrl(originalUrl)) {
      return;
    }

    const conversions = getVideoConversions(originalUrl);
    if (!conversions) {
      console.debug('Not a convertible /drops/ URL, or missing extension:', originalUrl);
      return;
    }

    let isMounted = true;

    const checkOptimized = async () => {
      if (!isMounted) return;

      // if we tried too many times, fallback and stop
      if (retriesRef.current >= maxRetries) {
        console.debug(`Max retries (${maxRetries}) reached for:`, originalUrl);
        setPlayableUrl(originalUrl);
        setIsChecking(false);
        return;
      }

      setIsChecking(true);

      try {
        // 1. HLS if preferred
        if (preferHls) {
          const hlsOk = await checkVideoAvailability(conversions.HLS);
          if (hlsOk && isMounted) {
            setPlayableUrl(conversions.HLS);
            setIsOptimized(true);
            setIsHls(true);
            setIsChecking(false);
            return; // done
          }
        }

        // 2. 720p fallback
        const mp4720Ok = await checkVideoAvailability(conversions.MP4_720P);
        if (mp4720Ok && isMounted) {
          setPlayableUrl(conversions.MP4_720P);
          setIsOptimized(true);
          setIsHls(false);
          setIsChecking(false);
          return; // done
        }

        // 3. 360p fallback
        const mp4360Ok = await checkVideoAvailability(conversions.MP4_360P);
        if (mp4360Ok && isMounted) {
          setPlayableUrl(conversions.MP4_360P);
          setIsOptimized(true);
          setIsHls(false);
          setIsChecking(false);
          return; // done
        }

        // none found, try again later
        retriesRef.current += 1;
        console.debug(`No optimized version yet, retry #${retriesRef.current}`, originalUrl);

        timeoutRef.current = setTimeout(checkOptimized, pollInterval);
      } catch (err) {
        console.error('Error checking for video conversions:', err);
        // fallback to original
      } finally {
        if (isMounted) {
          setIsChecking(false);
        }
      }
    };

    checkOptimized();

    return () => {
      isMounted = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [originalUrl, pollInterval, maxRetries, preferHls]);

  return {
    playableUrl,
    isOptimized,
    isChecking,
    isHls
  };
} 