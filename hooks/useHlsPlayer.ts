"use client";

import {
  useCallback,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from "react";
import {
  restoreVideoSource,
  suspendVideoSource,
  type SuspendedVideoSource,
} from "@/services/media/video-loading";
import type HlsType from "hls.js";
import type { ErrorData } from "hls.js";
import {
  useMobileAppActivity,
  useMobileBatterySavings,
} from "./useMobileAppActivity";
import { getMobileAppActivity } from "@/services/app-activity/mobile-app-activity";

interface UseHlsPlayerParams {
  /** If false, keep the video element inert and do not attach a source yet. */
  enabled?: boolean | undefined;
  /** Mobile buffering may pause independently of eager source initialization. */
  bufferingEnabled?: boolean | undefined;
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
const VIDEO_SOURCE_PROTOCOLS = new Set(["blob:", "http:", "https:"]);

function getSafeVideoSource(source: string): string | null {
  try {
    const baseUrl =
      typeof document === "undefined" ? undefined : document.baseURI;
    const parsed = new URL(source, baseUrl);
    return VIDEO_SOURCE_PROTOCOLS.has(parsed.protocol) ? parsed.href : null;
  } catch {
    return null;
  }
}

async function playFallbackVideo(videoEl: HTMLVideoElement): Promise<void> {
  try {
    await videoEl.play();
  } catch (error) {
    // Pausing, changing sources, or unloading can cancel a pending play().
    if (
      typeof error === "object" &&
      error !== null &&
      "name" in error &&
      error.name === "AbortError"
    ) {
      return;
    }
    console.warn("Fallback autoplay failed:", error);
  }
}

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
  bufferingEnabled = enabled,
  src,
  isHls,
  autoPlay,
  onError,
  onManifestParsed,
  fallbackSrc,
}: UseHlsPlayerParams) {
  const isAppActive = useMobileAppActivity();
  const isMobileEnvironment = useMobileBatterySavings();
  const [loadedSource, setLoadedSource] = useState<string | null>(null);
  const [fullscreenState, setFullscreenState] = useState({
    src,
    fallbackSrc,
    value: false,
  });
  const isFullscreen =
    fullscreenState.src === src &&
    fullscreenState.fallbackSrc === fallbackSrc &&
    fullscreenState.value;
  const initialize = isMobileEnvironment
    ? (enabled && isAppActive) || loadedSource === src
    : enabled;
  const canLoad =
    isAppActive && (!isMobileEnvironment || bufferingEnabled || isFullscreen);
  const canLoadRef = useRef(canLoad);
  const callbacksRef = useRef({ autoPlay, onError, onManifestParsed });
  useEffect(() => {
    canLoadRef.current = canLoad;
    callbacksRef.current = { autoPlay, onError, onManifestParsed };
  }, [canLoad, autoPlay, onError, onManifestParsed]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<HlsType | null>(null);
  const suspendedHlsRef = useRef<HlsType | null>(null);

  const cleanupTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hlsRetryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const needsManifestReloadRef = useRef(false);
  const manifestRetryCountRef = useRef(0);
  const networkRecoveryCountRef = useRef(0);
  const setupVersionRef = useRef(0);
  const appliedRetryVersionRef = useRef(0);
  const isCleaningUpRef = useRef(false);
  const isFirstMountRef = useRef(true);
  const previousSrcRef = useRef<string>("");

  const [isLoading, setIsLoading] = useState(true);
  const [retryVersion, setRetryVersion] = useState(0);

  const suspendedVideoRef = useRef<SuspendedVideoSource | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let nativeFullscreen = false;
    const updateFullscreen = () =>
      setFullscreenState({
        src,
        fallbackSrc,
        value:
          nativeFullscreen ||
          (document.fullscreenElement?.contains(video) ?? false),
      });
    const begin = () => {
      nativeFullscreen = true;
      updateFullscreen();
    };
    const end = () => {
      nativeFullscreen = false;
      updateFullscreen();
    };
    video.addEventListener("webkitbeginfullscreen", begin);
    video.addEventListener("webkitendfullscreen", end);
    document.addEventListener("fullscreenchange", updateFullscreen);
    return () => {
      video.removeEventListener("webkitbeginfullscreen", begin);
      video.removeEventListener("webkitendfullscreen", end);
      document.removeEventListener("fullscreenchange", updateFullscreen);
    };
  }, [src, fallbackSrc]);

  const retry = useCallback(() => {
    setIsLoading(true);
    setRetryVersion((current) => current + 1);
  }, []);

  function isCurrentSetup(
    setupVersion: number,
    videoEl: HTMLVideoElement
  ): boolean {
    return (
      setupVersionRef.current === setupVersion && videoRef.current === videoEl
    );
  }

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
  const fallbackToSrc = useEffectEvent(
    (videoEl: HTMLVideoElement, fallback: string) => {
      const safeFallback = getSafeVideoSource(fallback);
      if (safeFallback === null) {
        videoEl.removeAttribute("src");
        videoEl.load();
        setIsLoading(false);
        return;
      }

      videoEl.src = safeFallback;
      videoEl.load();
      setIsLoading(false);
      if (isMobileEnvironment && !canLoadRef.current) {
        suspendedVideoRef.current = suspendVideoSource(videoEl);
        return;
      }
      if (
        callbacksRef.current.autoPlay &&
        canLoadRef.current &&
        getMobileAppActivity()
      ) {
        void playFallbackVideo(videoEl);
      }
    }
  );

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
      if (
        hlsRef.current !== hls ||
        !canLoadRef.current ||
        !getMobileAppActivity()
      )
        return;
      callbacksRef.current.onError?.(data);

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
            needsManifestReloadRef.current = true;
            hlsRetryTimeoutRef.current = setTimeout(() => {
              if (
                hlsRef.current === hls &&
                canLoadRef.current &&
                getMobileAppActivity()
              ) {
                needsManifestReloadRef.current = false;
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
  const initHls = useEffectEvent(
    async (
      videoEl: HTMLVideoElement,
      changedSource: boolean,
      setupVersion: number,
      nativeErrorHandler: () => void
    ) => {
      try {
        const mod = await import("hls.js");
        const HlsConstructor = mod.default; // typed import, no unsafe cast
        if (!isCurrentSetup(setupVersion, videoEl)) {
          return;
        }

        const safeHlsSrc = getSafeVideoSource(src);
        if (safeHlsSrc === null) {
          fallbackToSrc(videoEl, fallbackSrc ?? src);
          return;
        }

        // Prefer Hls.js wherever Media Source Extensions are available. Some
        // Chromium builds report "maybe" for native HLS even though playback can
        // stall without producing an error. Native HLS remains the Safari path.
        if (!HlsConstructor.isSupported()) {
          if (videoEl.canPlayType("application/vnd.apple.mpegurl")) {
            videoEl.addEventListener("error", nativeErrorHandler);
            fallbackToSrc(videoEl, safeHlsSrc);
            return;
          }

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
          autoStartLoad: canLoadRef.current && getMobileAppActivity(),
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
        setupHlsErrorHandlers(hls, HlsConstructor, videoEl, safeHlsSrc);

        // Once the manifest is parsed, we can attempt autoplay
        hls.on(HlsConstructor.Events.MANIFEST_PARSED, () => {
          if (hlsRef.current !== hls || !isCurrentSetup(setupVersion, videoEl))
            return;
          manifestRetryCountRef.current = 0;
          networkRecoveryCountRef.current = 0;
          setIsLoading(false);
          callbacksRef.current.onManifestParsed?.();
          if (
            !isCleaningUpRef.current &&
            callbacksRef.current.autoPlay &&
            canLoadRef.current &&
            getMobileAppActivity()
          ) {
            void videoEl.play().catch(() => {});
          }
        });

        hls.loadSource(safeHlsSrc);
        hls.attachMedia(videoEl);
        if (!canLoadRef.current || !getMobileAppActivity()) {
          suspendedHlsRef.current = hls;
          hls.stopLoad();
        }
      } catch (error) {
        if (!isCurrentSetup(setupVersion, videoEl)) return;
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
  );

  useEffect(() => {
    setupVersionRef.current += 1;
    const setupVersion = setupVersionRef.current;
    const videoEl = videoRef.current;
    if (!videoEl) return;
    const nativeErrorHandler = () => {
      if (
        !isCurrentSetup(setupVersion, videoEl) ||
        (isMobileEnvironment && !canLoadRef.current)
      ) {
        return;
      }
      // Inactive errors must leave recovery armed for the reloaded source.
      videoEl.removeEventListener("error", nativeErrorHandler);
      fallbackToSrc(videoEl, fallbackSrc ?? src);
    };

    // Hydration starts with the server's active snapshot. Check live visibility
    // before imperative source attachment so a hidden mobile tab cannot download.
    if (!initialize || !getMobileAppActivity()) {
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

    if (isMobileEnvironment) setLoadedSource(src);
    suspendedVideoRef.current = null;
    needsManifestReloadRef.current = false;

    // Check if this is a new source vs. initial mount
    const isInitialMount = isFirstMountRef.current;
    const changedSource =
      previousSrcRef.current !== src && previousSrcRef.current !== "";
    const hasPendingRetry = appliedRetryVersionRef.current !== retryVersion;

    // Update for next render
    isFirstMountRef.current = false;
    previousSrcRef.current = src;
    appliedRetryVersionRef.current = retryVersion;

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
      void initHls(
        videoEl,
        changedSource || hasPendingRetry,
        setupVersion,
        nativeErrorHandler
      );
    } else {
      // Not HLS => just assign the src
      fallbackToSrc(videoEl, src);
    }

    // Cleanup on unmount
    return () => {
      setupVersionRef.current += 1;
      videoEl.removeEventListener("error", nativeErrorHandler);
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
    initialize,
    isMobileEnvironment,
    fallbackSrc,
    cleanupHls,
    retryVersion,
  ]);

  const suspendLoading = useEffectEvent((video: HTMLVideoElement) => {
    if (hlsRetryTimeoutRef.current !== null) {
      clearTimeout(hlsRetryTimeoutRef.current);
      hlsRetryTimeoutRef.current = null;
    }
    video.pause();
    if (hlsRef.current) {
      suspendedHlsRef.current = hlsRef.current;
      hlsRef.current.stopLoad();
    } else if (isMobileEnvironment) {
      suspendedVideoRef.current ??= suspendVideoSource(video);
    }
  });

  const resumeLoading = useEffectEvent((video: HTMLVideoElement) => {
    if (hlsRef.current && suspendedHlsRef.current === hlsRef.current) {
      suspendedHlsRef.current = null;
      if (needsManifestReloadRef.current) {
        needsManifestReloadRef.current = false;
        const safeSource = getSafeVideoSource(src);
        if (safeSource) hlsRef.current.loadSource(safeSource);
      }
      hlsRef.current.startLoad(-1);
    }
    const suspended = suspendedVideoRef.current;
    if (suspended) {
      suspendedVideoRef.current = null;
      return restoreVideoSource(video, suspended);
    }
    return undefined;
  });

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let removeRestoreListener: (() => void) | undefined;
    if (canLoad) removeRestoreListener = resumeLoading(video);
    else suspendLoading(video);
    return () => removeRestoreListener?.();
  }, [canLoad, isMobileEnvironment, src, initialize, retryVersion]);

  return {
    /** A ref to the <video> element, which the caller can render. */
    videoRef,
    /** True if still loading or parsing the manifest, etc. */
    isLoading,
    isFullscreen,
    /** Rebuild the selected playback pipeline after a terminal media error. */
    retry,
  };
}
