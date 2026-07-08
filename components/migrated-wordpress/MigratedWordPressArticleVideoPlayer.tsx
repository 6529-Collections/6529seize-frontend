"use client";

import { useEffect, useRef } from "react";

import type { MigratedWordPressArticleVideo } from "./types";

/**
 * Muted looping article videos must honor prefers-reduced-motion
 * (WCAG 2.2.2 Pause, Stop, Hide). The video is server-rendered without
 * autoplay so reduced-motion users never see motion; playback and looping
 * start after hydration only when the user allows motion. Controls stay
 * available either way.
 */
export default function MigratedWordPressArticleVideoPlayer({
  video,
}: {
  readonly video: MigratedWordPressArticleVideo;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const element = videoRef.current;
    if (!element) {
      return;
    }

    const prefersReducedMotion = globalThis.matchMedia?.(
      "(prefers-reduced-motion: reduce)"
    )?.matches;
    if (prefersReducedMotion) {
      return;
    }

    element.loop = true;
    // Promise.resolve guards jsdom, where play() returns undefined.
    void Promise.resolve(element.play()).catch(() => {
      // Autoplay can be rejected by the browser; controls remain usable.
    });
  }, []);

  return (
    <video
      aria-label={video.title}
      className="tw-aspect-square tw-w-full tw-bg-black tw-object-cover"
      controls
      muted
      playsInline
      preload="metadata"
      ref={videoRef}
    >
      <source src={video.src} type="video/mp4" />
      Sorry, your browser does not support embedded videos.
    </video>
  );
}
