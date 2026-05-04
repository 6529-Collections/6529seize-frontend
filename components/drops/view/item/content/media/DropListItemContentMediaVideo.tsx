"use client";

import { getDownloadFilenameFromUrl } from "@/helpers/media-download.helpers";
import { useInView } from "@/hooks/useInView";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { useOptimizedVideo } from "@/hooks/useOptimizedVideo";
import { useHlsPlayer } from "@/hooks/useHlsPlayer";
import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import React, { useCallback, useEffect, useRef, useState } from "react";
import useDownloader from "react-use-downloader";

interface Props {
  readonly src: string;
  readonly disableAutoPlay?: boolean | undefined;
}

function DropListItemContentMediaVideo({
  src,
  disableAutoPlay = false,
}: Props) {
  const [wrapperRef, inView] = useInView<HTMLDivElement>({ threshold: 0.1 });
  const { isApp } = useDeviceInfo();
  const { download } = useDownloader();
  const [showDownloadButton, setShowDownloadButton] = useState(false);
  const hideDownloadButtonTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 1) Pick up the best URL (HLS or MP4)
  const { playableUrl, isHls } = useOptimizedVideo(src, {
    pollInterval: 10000,
    maxRetries: 8,
    preferHls: true,
    exponentialBackoff: false,
  });

  // 2) Setup HLS (or native) once and get back the videoRef + loading state
  const { videoRef, isLoading } = useHlsPlayer({
    src: playableUrl,
    isHls,
    fallbackSrc: src,
    autoPlay: inView && !isApp && !disableAutoPlay,
  });

  // 3) Play/pause & mute based on scroll visibility
  const shouldAutoPlay = inView && !isApp && !disableAutoPlay;

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl || isLoading) return;

    if (shouldAutoPlay) {
      // ensure muted autoplay works
      videoEl.muted = true;
      if (!isApp) videoEl.play().catch(() => {});
    } else {
      videoEl.pause();
      videoEl.muted = true;
    }
  }, [shouldAutoPlay, isApp, isLoading, videoRef]);

  // 4) Inline attributes for iOS / legacy WebKit
  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;
    videoEl.setAttribute("webkit-playsinline", "true");
    videoEl.setAttribute("x5-playsinline", "true");
  }, [videoRef]);

  useEffect(() => {
    return () => {
      if (hideDownloadButtonTimeoutRef.current) {
        clearTimeout(hideDownloadButtonTimeoutRef.current);
      }
    };
  }, []);

  const showDownloadButtonTemporarily = useCallback(() => {
    setShowDownloadButton(true);
    if (hideDownloadButtonTimeoutRef.current) {
      clearTimeout(hideDownloadButtonTimeoutRef.current);
    }
    hideDownloadButtonTimeoutRef.current = setTimeout(() => {
      setShowDownloadButton(false);
      hideDownloadButtonTimeoutRef.current = null;
    }, 2500);
  }, []);

  const hideDownloadButton = useCallback(() => {
    if (hideDownloadButtonTimeoutRef.current) {
      clearTimeout(hideDownloadButtonTimeoutRef.current);
      hideDownloadButtonTimeoutRef.current = null;
    }
    setShowDownloadButton(false);
  }, []);

  const handleDownload = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();
      download(src, getDownloadFilenameFromUrl(src, "video"));
      showDownloadButtonTemporarily();
    },
    [download, showDownloadButtonTemporarily, src]
  );

  return (
    <div
      ref={wrapperRef}
      className="tw-group tw-relative tw-flex tw-h-full tw-w-full tw-items-center tw-justify-center"
      onMouseEnter={showDownloadButtonTemporarily}
      onMouseMove={showDownloadButtonTemporarily}
      onMouseLeave={hideDownloadButton}
      onFocus={showDownloadButtonTemporarily}
      onBlur={hideDownloadButton}
      onTouchStart={showDownloadButtonTemporarily}
    >
      <video
        ref={videoRef}
        playsInline
        controls
        autoPlay={false}
        muted
        loop
        className={`tw-h-full tw-w-full tw-rounded-xl tw-object-contain`}
      >
        Your browser does not support the video tag.
      </video>
      <button
        aria-label="Download video"
        className={`tw-absolute tw-right-3 tw-top-[calc(50%-1.75rem)] tw-z-10 tw-flex tw-size-9 -tw-translate-y-1/2 tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-black/65 tw-p-1.5 tw-text-white tw-shadow-lg tw-backdrop-blur-sm tw-transition-opacity tw-duration-200 desktop-hover:hover:tw-bg-black/80 ${
          showDownloadButton
            ? "tw-pointer-events-auto tw-opacity-100"
            : "tw-pointer-events-none tw-opacity-0"
        }`}
        onClick={handleDownload}
        onFocus={showDownloadButtonTemporarily}
        type="button"
      >
        <ArrowDownTrayIcon className="tw-size-4" />
      </button>
    </div>
  );
}

export default React.memo(DropListItemContentMediaVideo);
