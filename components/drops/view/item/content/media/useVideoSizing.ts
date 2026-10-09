"use client";

import { useState } from "react";
import {
  getAspectRatio,
  getNaturalWidthClassName,
  getOrientation,
  getResponsiveVideoStyle,
  getVideoRatio,
  type VideoLayout,
} from "./SeizeVideoPlayer.config";
import { useVideoViewportHeight } from "./useVideoViewportHeight";

interface VideoSize {
  readonly width: number;
  readonly height: number;
  readonly src: string | undefined;
  readonly identity: string | undefined;
}

/** Keep preview geometry stable while measuring only the current video. */
export function useVideoSizing({
  directSrc,
  identity,
  layout,
  aspectRatioHint,
  isFullscreen,
}: {
  readonly directSrc: string | undefined;
  readonly identity: string | undefined;
  readonly layout: VideoLayout;
  readonly aspectRatioHint: number | undefined;
  readonly isFullscreen: boolean;
}) {
  const [videoSize, setVideoSize] = useState<VideoSize>();
  const viewportHeight = useVideoViewportHeight();
  const currentVideoSize =
    videoSize?.src === directSrc && videoSize?.identity === identity
      ? videoSize
      : undefined;
  const previewRatio =
    layout === "natural" ? getVideoRatio(aspectRatioHint, 1) : undefined;
  const sizingRatio =
    previewRatio ??
    getVideoRatio(currentVideoSize?.width, currentVideoSize?.height);
  const orientation = getOrientation(sizingRatio ?? 0, 1);
  const aspectRatio = currentVideoSize
    ? getAspectRatio(currentVideoSize.width, currentVideoSize.height)
    : undefined;

  return {
    recordVideoSize: (video: HTMLVideoElement) => {
      setVideoSize({
        width: video.videoWidth,
        height: video.videoHeight,
        src: directSrc,
        identity,
      });
    },
    widthClassName: getNaturalWidthClassName(orientation, layout),
    responsiveMediaStyle: getResponsiveVideoStyle({
      layout,
      isFullscreen,
      videoSize: currentVideoSize,
      directSrc,
      aspectRatioHint,
      aspectRatio,
      viewportHeight,
    }),
  };
}
