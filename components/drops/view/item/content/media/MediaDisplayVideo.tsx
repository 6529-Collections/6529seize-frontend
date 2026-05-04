"use client";

import React, { useEffect, useCallback, useRef, useState } from "react";
import { useInView } from "@/hooks/useInView";
import { useOptimizedVideo } from "@/hooks/useOptimizedVideo";
import { useHlsPlayer } from "@/hooks/useHlsPlayer";
import {
  downloadMediaUrl,
  getDownloadFilenameFromUrl,
  triggerDirectDownload,
} from "@/helpers/media-download.helpers";
import useCapacitor from "@/hooks/useCapacitor";
import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";

interface Props {
  readonly src: string;
  readonly showControls?: boolean | undefined;
  readonly disableClickHandler?: boolean | undefined;
}

const MediaDisplayVideo: React.FC<Props> = ({
  src,
  showControls = false,
  disableClickHandler = false,
}) => {
  // Intersection observer for scroll-based triggers
  const [wrapperRef, inView] = useInView<HTMLDivElement>({ threshold: 0.1 });
  const { isCapacitor } = useCapacitor();
  const [showDownloadButton, setShowDownloadButton] = useState(false);
  const hideDownloadButtonTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isDownloadingRef = useRef(false);

  // Poll for HLS → MP4 → fallback original
  const { playableUrl, isHls } = useOptimizedVideo(src, {
    pollInterval: 15000,
    maxRetries: 8,
    preferHls: true,
    exponentialBackoff: false,
  });

  // Use HLS hook to handle the video ref, loading states, etc.
  const { videoRef, isLoading } = useHlsPlayer({
    src: playableUrl,
    isHls,
    fallbackSrc: src, // if HLS fails, revert to original
    autoPlay: inView, // only autoplay if in view
  });

  // Inline attributes for iOS / legacy WebKit
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.setAttribute("webkit-playsinline", "true");
    vid.setAttribute("x5-playsinline", "true");
  }, [videoRef]);

  useEffect(() => {
    return () => {
      if (hideDownloadButtonTimeoutRef.current) {
        clearTimeout(hideDownloadButtonTimeoutRef.current);
      }
    };
  }, []);

  // Additional effect: if out of view, we can pause
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid || isLoading) return;

    if (!inView) {
      vid.pause();
    } else {
      // Attempt to play if we're in view
      vid.play().catch(() => {});
    }
  }, [inView, isLoading, videoRef]);

  // Tap-to-toggle if no controls
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLVideoElement>) => {
      if (disableClickHandler) return;
      const vid = videoRef.current;
      if (!vid) return;
      e.preventDefault();
      e.stopPropagation();
      if (vid.paused) {
        vid.play().catch(() => {});
      } else {
        vid.pause();
      }
    },
    [disableClickHandler, videoRef]
  );

  const showDownloadButtonTemporarily = useCallback(() => {
    if (!showControls) return;

    setShowDownloadButton(true);
    if (hideDownloadButtonTimeoutRef.current) {
      clearTimeout(hideDownloadButtonTimeoutRef.current);
    }
    hideDownloadButtonTimeoutRef.current = setTimeout(() => {
      setShowDownloadButton(false);
      hideDownloadButtonTimeoutRef.current = null;
    }, 2500);
  }, [showControls]);

  const hideDownloadButton = useCallback(() => {
    if (hideDownloadButtonTimeoutRef.current) {
      clearTimeout(hideDownloadButtonTimeoutRef.current);
      hideDownloadButtonTimeoutRef.current = null;
    }
    setShowDownloadButton(false);
  }, []);

  const handleDownload = useCallback(
    async (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (isDownloadingRef.current) {
        return;
      }
      const fileName = getDownloadFilenameFromUrl(src, "video");
      isDownloadingRef.current = true;
      try {
        await downloadMediaUrl({
          url: src,
          fileName,
          isCapacitor,
          dialogTitle: "Save video",
          shareTitle: "Video",
        });
      } catch {
        triggerDirectDownload(src, fileName);
      } finally {
        isDownloadingRef.current = false;
      }
      showDownloadButtonTemporarily();
    },
    [isCapacitor, showDownloadButtonTemporarily, src]
  );

  return (
    <div
      ref={wrapperRef}
      className="tw-relative tw-h-full tw-w-full"
      onMouseEnter={showDownloadButtonTemporarily}
      onMouseMove={showDownloadButtonTemporarily}
      onMouseLeave={hideDownloadButton}
      onFocus={showDownloadButtonTemporarily}
      onBlur={hideDownloadButton}
      onTouchStart={showDownloadButtonTemporarily}
    >
      <video
        ref={videoRef}
        className="tw-h-full tw-w-full tw-rounded-xl tw-object-contain"
        muted
        loop
        controls={showControls}
        playsInline
        preload="auto"
        onClick={showControls ? undefined : handleClick}
      />
      {showControls && (
        <button
          aria-label="Download video"
          className={`tw-absolute tw-right-3 tw-top-[calc(50%-1.75rem)] tw-z-10 tw-flex tw-size-9 -tw-translate-y-1/2 tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-black/65 tw-p-1.5 tw-text-white tw-shadow-lg tw-backdrop-blur-sm tw-transition-opacity tw-duration-200 desktop-hover:hover:tw-bg-black/80 ${
            showDownloadButton
              ? "tw-pointer-events-auto tw-opacity-100"
              : "tw-pointer-events-none tw-opacity-0"
          }`}
          onClick={(event) => {
            void handleDownload(event);
          }}
          onFocus={showDownloadButtonTemporarily}
          type="button"
        >
          <ArrowDownTrayIcon className="tw-size-4" />
        </button>
      )}
    </div>
  );
};

export default React.memo(MediaDisplayVideo);
