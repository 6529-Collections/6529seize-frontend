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
    // Always start with the original URL
    setPlayableUrl(originalUrl);
    setIsOptimized(false);
    setIsHls(false);
    
    if (!originalUrl || !isVideoUrl(originalUrl)) {
      return;
    }

    const conversions = getVideoConversions(originalUrl);
    if (!conversions) {
      // Can't generate conversions (not a drops URL or missing extension)
      // Stay with original URL
      console.log('Video optimization not available for:', originalUrl);
      return;
    }

    let mounted = true;

    const checkOptimizedVersions = async () => {
      if (!mounted) {
        return;
      }

      // Check if we've exhausted retries
      if (retriesRef.current >= maxRetries) {
        console.log(`Max retries (${maxRetries}) reached for video optimization`);
        setPlayableUrl(originalUrl); // Explicit fallback
        setIsChecking(false);
        return;
      }

      setIsChecking(true);

      try {
        // Try HLS first if preferred
        if (preferHls) {
          const hlsAvailable = await checkVideoAvailability(conversions.HLS);
          if (hlsAvailable && mounted) {
            console.log('Using HLS version:', conversions.HLS);
            setPlayableUrl(conversions.HLS);
            setIsOptimized(true);
            setIsHls(true);
            setIsChecking(false);
            return;
          }
        }

        // Try 720p MP4
        const mp4720Available = await checkVideoAvailability(conversions.MP4_720P);
        if (mp4720Available && mounted) {
          console.log('Using 720p MP4 version:', conversions.MP4_720P);
          setPlayableUrl(conversions.MP4_720P);
          setIsOptimized(true);
          setIsHls(false);
          setIsChecking(false);
          return;
        }

        // Try 360p MP4
        const mp4360Available = await checkVideoAvailability(conversions.MP4_360P);
        if (mp4360Available && mounted) {
          console.log('Using 360p MP4 version:', conversions.MP4_360P);
          setPlayableUrl(conversions.MP4_360P);
          setIsOptimized(true);
          setIsHls(false);
          setIsChecking(false);
          return;
        }

        // No optimized versions found yet
        retriesRef.current += 1;
        
        if (mounted && retriesRef.current < maxRetries) {
          console.log(`No optimized versions found yet. Retry ${retriesRef.current}/${maxRetries} in ${pollInterval}ms`);
          timeoutRef.current = setTimeout(checkOptimizedVersions, pollInterval);
        }
      } catch (error) {
        console.error('Error checking video conversions:', error);
        // On error, stay with current URL (likely original)
        setIsChecking(false);
      } finally {
        if (mounted) {
          setIsChecking(false);
        }
      }
    };

    // Start checking for optimized versions
    checkOptimizedVersions();

    return () => {
      mounted = false;
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