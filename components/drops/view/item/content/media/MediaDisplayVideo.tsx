"use client";

import React, { useCallback, useEffect, useRef } from "react";
import { useMobileBatterySavings } from "@/hooks/useMobileAppActivity";
import { useInView } from "@/hooks/useInView";
import { useOptimizedVideo } from "@/hooks/useOptimizedVideo";
import { useHlsPlayer } from "@/hooks/useHlsPlayer";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import clsx from "clsx";
import SeizeVideoPlayer from "./SeizeVideoPlayer";
import VideoPlaybackErrorOverlay from "./VideoPlaybackErrorOverlay";
import { useVideoPlaybackError } from "./useVideoPlaybackError";
import { useMediaActions } from "./useMediaActions";
import { assignRef } from "./SeizeVideoPlayer.config";
import { useChatVideoPlayback } from "./ChatVideoPlayback";
import { useRememberedVideoPlayback } from "./VideoPlaybackMemory";

interface Props {
  readonly src: string;
  readonly mimeType?: string | undefined;
  readonly showControls?: boolean | undefined;
  readonly isInertPreview?: boolean | undefined;
  readonly fillContainer?: boolean | undefined;
}

const MediaDisplayVideo: React.FC<Props> = ({
  src,
  mimeType,
  showControls = false,
  isInertPreview = false,
  fillContainer = false,
}) => {
  const { isApp } = useDeviceInfo();
  const isMobileEnvironment = useMobileBatterySavings();
  const [wrapperRef, inView] = useInView<HTMLDivElement>({
    freezeOnceVisible: false,
    rootMargin: isMobileEnvironment ? "0px" : "400px 0px",
    threshold: 0.1,
  });
  const wasFullscreenRef = useRef(false);
  const locale = useBrowserLocale();
  const chat = useChatVideoPlayback(src);
  const savedPlayback = useRememberedVideoPlayback(src);
  const shouldAutoPlay =
    inView && !isApp && !chat.isChat && !savedPlayback?.userControlled;
  const shouldLoadVideo = inView && (!chat.isChat || chat.requested);
  const { downloadMedia, isDownloading, openLabel, openMedia } =
    useMediaActions({
      url: src,
      fallbackFileName: "video",
      dialogTitle: "Save video",
      mimeType,
    });

  // Poll for HLS → MP4 → fallback original
  const { playableUrl, isHls } = useOptimizedVideo(src, {
    enabled: inView && (!chat.isChat || !chat.requested),
    pollInterval: 15000,
    maxRetries: 8,
    preferHls: true,
    exponentialBackoff: false,
  });

  // Use HLS hook to handle the video ref, loading states, etc.
  const {
    videoRef,
    retry,
    isFullscreen: isVideoFullscreen,
  } = useHlsPlayer({
    enabled: shouldLoadVideo,
    src: chat.rendition?.playableUrl ?? playableUrl,
    isHls: chat.rendition?.isHls ?? isHls,
    fallbackSrc: src, // if HLS fails, revert to original
    autoPlay: shouldAutoPlay,
  });
  const { setVideoElement } = chat;
  const setVideoRef = useCallback(
    (element: HTMLVideoElement | null) => {
      assignRef(videoRef, element);
      setVideoElement(element);
    },
    [videoRef, setVideoElement]
  );

  const { handlePlaybackError, hasPlaybackError, retryPlayback } =
    useVideoPlaybackError({
      onRetry: retry,
      resetKey: playableUrl,
      videoRef,
    });
  // Inline attributes for iOS / legacy WebKit
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.setAttribute("webkit-playsinline", "true");
    vid.setAttribute("x5-playsinline", "true");
  }, [videoRef]);

  useEffect(() => {
    if (!isApp) {
      return;
    }

    const pauseWhenFullscreenCloses = () => {
      const vid = videoRef.current;
      if (!vid) {
        return;
      }

      const fullscreenElement = document.fullscreenElement;
      if (isVideoFullscreen || (fullscreenElement?.contains(vid) ?? false)) {
        wasFullscreenRef.current = true;
        return;
      }

      if (wasFullscreenRef.current) {
        wasFullscreenRef.current = false;
        vid.pause();
      }
    };

    pauseWhenFullscreenCloses();
    document.addEventListener("fullscreenchange", pauseWhenFullscreenCloses);
    return () => {
      document.removeEventListener(
        "fullscreenchange",
        pauseWhenFullscreenCloses
      );
    };
  }, [isApp, isVideoFullscreen, videoRef]);

  return (
    <div
      ref={wrapperRef}
      className={clsx(
        "tw-relative tw-flex tw-w-full tw-items-start",
        fillContainer
          ? "tw-h-full tw-max-h-full tw-justify-center"
          : "tw-justify-start"
      )}
    >
      <SeizeVideoPlayer
        videoRef={setVideoRef}
        onPlaybackRequest={
          chat.isChat
            ? () => chat.requestPlayback({ playableUrl, isHls })
            : undefined
        }
        preload={chat.isChat && !chat.requested ? "none" : undefined}
        data-url={src}
        template={isInertPreview ? "card-preview" : "ambient-media"}
        autoPlay={shouldAutoPlay}
        layout={fillContainer ? "fill" : "natural"}
        align={fillContainer ? "center" : "left"}
        showActions={showControls}
        onDownload={showControls ? downloadMedia : undefined}
        onOpen={showControls ? openMedia : undefined}
        openLabel={showControls ? openLabel : undefined}
        isDownloading={isDownloading}
        locale={locale}
        onError={handlePlaybackError}
      />
      {hasPlaybackError && (
        <VideoPlaybackErrorOverlay onRetry={retryPlayback} />
      )}
    </div>
  );
};

export default React.memo(MediaDisplayVideo);
