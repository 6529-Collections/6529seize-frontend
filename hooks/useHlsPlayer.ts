"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type HlsType from "hls.js";
import type { ErrorData } from "hls.js";

interface UseHlsPlayerParams {
  /** If false, keep the video element inert and do not attach a source yet. */
  enabled?: boolean | undefined;
  /** The final video URL to load (m3u8 if isHls=true, or MP4, etc.) */
  src: string;
  /** True if the above src is an .m3u8 that needs Hls.js. */
  isHls: boolean;
  /** If true, auto-play when HLS (or fallback) is ready. */
  autoPlay?: boolean | undefined;
  /** Called on non-fatal or fatal HLS errors if you want. */
  onError?: ((data: ErrorData) => void) | undefined;
  /** Called once the manifest is parsed (like MANIFEST_PARSED). */
  onManifestParsed?: (() => void) | undefined;
  /** If HLS completely fails, we can fallback to this original src. */
  fallbackSrc?: string | undefined;
}

const HLS_MANIFEST_MAX_RETRIES = 2;
const HLS_NETWORK_MAX_RECOVERIES = 2;
const HLS_MANIFEST_RETRY_DELAY_MS = 2000;

/**
 * A custom hook for Hls.js setup/cleanup.
 *
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
  enabled = true,
  src,
  isHls,
  autoPlay,
  onError,
  onManifestParsed,
  fallbackSrc,
}: UseHlsPlayerParams) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<HlsType | null>(null);

  const cleanupTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hlsRetryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const manifestRetryCountRef = useRef(0);
  const networkRecoveryCountRef = useRef(0);
  const isCleaningUpRef = useRef(false);
  const isFirstMountRef = useRef(true);
  const previousSrcRef = useRef<string>("");

  const [isLoading, setIsLoading] = useState(true);

  /**
   * Cleanup function to destroy an Hls instance safely.
   */
  const cleanupHls = useCallback((immediate = false) => {
    if (cleanupTimeoutRef.current !== null) {
      clearTimeout(cleanupTimeoutRef.current);
    }
    if (hlsRetryTimeoutRef.current !== null) {
      clearTimeout(hlsRetryTimeoutRef.current);
      hlsRetryTimeoutRef.current = null;
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
  }, []);

  /**
   * Fallback to a raw MP4 (or original src) if HLS is unsupported or fails.
   */
  function fallbackToSrc(videoEl: HTMLVideoElement, fallback: string) {
    videoEl.src = fallback;
    videoEl.load();
    setIsLoading(false);
    if (autoPlay) {
      void videoEl
        .play()
        .catch((err) => console.warn("Fallback autoplay failed:", err));
    }
  }

  function stopHlsAndFallback(videoEl: HTMLVideoElement) {
    cleanupHls(true);
    setIsLoading(false);
    if (fallbackSrc !== undefined) {
      fallbackToSrc(videoEl, fallbackSrc);
    }
  }

  /**
   * Sets up HLS error handlers (network/media errors).
   */
  function setupHlsErrorHandlers(
    hls: HlsType,
    HlsConstructor: typeof HlsType,
    videoEl: HTMLVideoElement,
    hlsSrc: string
  ) {
    hls.on(HlsConstructor.Events.ERROR, (_event: unknown, data: ErrorData) => {
      onError?.(data);

      if (data.fatal !== true) {
        return;
      }

      switch (data.type) {
        case HlsConstructor.ErrorTypes.NETWORK_ERROR:
          // e.g. manifest load error, or segment load error
          if (
            data.details === HlsConstructor.ErrorDetails.MANIFEST_LOAD_ERROR ||
            data.details === HlsConstructor.ErrorDetails.MANIFEST_LOAD_TIMEOUT
          ) {
            if (manifestRetryCountRef.current >= HLS_MANIFEST_MAX_RETRIES) {
              stopHlsAndFallback(videoEl);
              return;
            }
            manifestRetryCountRef.current += 1;
            hlsRetryTimeoutRef.current = setTimeout(() => {
              if (hlsRef.current === hls) {
                hls.loadSource(hlsSrc);
              }
            }, HLS_MANIFEST_RETRY_DELAY_MS);
          } else {
            if (networkRecoveryCountRef.current >= HLS_NETWORK_MAX_RECOVERIES) {
              stopHlsAndFallback(videoEl);
              return;
            }
            networkRecoveryCountRef.current += 1;
            hls.startLoad();
          }
          break;

        case HlsConstructor.ErrorTypes.MEDIA_ERROR:
          // e.g. decoding issues
          hls.recoverMediaError();
          break;

        case HlsConstructor.ErrorTypes.KEY_SYSTEM_ERROR:
        case HlsConstructor.ErrorTypes.MUX_ERROR:
        case HlsConstructor.ErrorTypes.OTHER_ERROR:
          // e.g. mux/demux error
          cleanupHls(true);
          if (fallbackSrc !== undefined) {
            fallbackToSrc(videoEl, fallbackSrc);
          }
          break;
      }
    });
  }

  /**
   * Sets up the Hls instance, attaches to the <video>, and starts loading.
   */
  async function initHls(videoEl: HTMLVideoElement, changedSource: boolean) {
    try {
      const mod = await import("hls.js");
      const HlsConstructor = mod.default; // typed import (no "as any")

      // If Hls is unsupported in this browser, fallback to direct src
      if (!HlsConstructor.isSupported()) {
        fallbackToSrc(videoEl, fallbackSrc ?? src);
        return;
      }

      if (changedSource) {
        cleanupHls(true);
      }
      manifestRetryCountRef.current = 0;
      networkRecoveryCountRef.current = 0;

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

      // Configure error handlers
      setupHlsErrorHandlers(hls, HlsConstructor, videoEl, src);

      // Once the manifest is parsed, we can attempt autoplay
      hls.on(HlsConstructor.Events.MANIFEST_PARSED, () => {
        manifestRetryCountRef.current = 0;
        networkRecoveryCountRef.current = 0;
        setIsLoading(false);
        onManifestParsed?.();
        if (!isCleaningUpRef.current && autoPlay) {
          void videoEl.play().catch(() => {});
        }
      });

      hls.loadSource(src);
      hls.attachMedia(videoEl);
    } catch (error) {
      // If dynamic import fails, fallback if possible
      console.error("HLS import/setup error:", error);
      setIsLoading(false);
      if (fallbackSrc !== undefined) {
        fallbackToSrc(videoEl, fallbackSrc);
      } else {
        // If no fallback is provided, we log the error and let the user handle it
        throw error; // or console.warn("No fallback source provided.");
      }
    }
  }

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    if (!enabled) {
      setIsLoading(false);
      if (document.fullscreenElement?.contains(videoEl) ?? false) {
        return;
      }
      cleanupHls(true);
      manifestRetryCountRef.current = 0;
      networkRecoveryCountRef.current = 0;
      isFirstMountRef.current = true;
      previousSrcRef.current = "";
      videoEl.pause();
      videoEl.removeAttribute("src");
      videoEl.load();
      return;
    }

    // Check if this is a new source vs. initial mount
    const isInitialMount = isFirstMountRef.current;
    const changedSource =
      previousSrcRef.current !== src && previousSrcRef.current !== "";

    // Update for next render
    isFirstMountRef.current = false;
    previousSrcRef.current = src;

    // If the source changed after mount, do a quick reset
    if (changedSource) {
      setIsLoading(true);
      cleanupHls(true);
      videoEl.pause();
      videoEl.removeAttribute("src");
      videoEl.load();
    } else if (isInitialMount) {
      setIsLoading(true);
    }

    // Setup HLS or fallback to direct MP4
    if (isHls) {
      if (videoEl.canPlayType("application/vnd.apple.mpegurl")) {
        videoEl.src = src;
        videoEl.load();
        setIsLoading(false);
        if (autoPlay) {
          void videoEl.play().catch(() => {});
        }
      } else {
        void initHls(videoEl, changedSource);
      }
    } else {
      // Not HLS => just assign the src
      videoEl.src = src;
      videoEl.load();
      setIsLoading(false);
      if (autoPlay) {
        void videoEl.play().catch(() => {});
      }
    }

    // Cleanup on unmount
    return () => {
      if (cleanupTimeoutRef.current !== null) {
        clearTimeout(cleanupTimeoutRef.current);
      }
      cleanupHls(true);

      videoEl.pause();
      videoEl.removeAttribute("src");
      videoEl.load();
    };
  }, [
    src,
    isHls,
    enabled,
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
