import { useState, type RefObject } from "react";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { formatVideoTime } from "./videoTime";

interface VideoProgress {
  readonly src?: string | undefined;
  readonly duration: number;
  readonly currentTime: number;
}

export function useVideoProgress(
  videoRef: RefObject<HTMLVideoElement | null>,
  src: string | undefined,
  locale: SupportedLocale
) {
  const [timing, setTiming] = useState<VideoProgress>({
    duration: 0,
    currentTime: 0,
  });

  function updateProgress() {
    const video = videoRef.current;
    const duration =
      video && Number.isFinite(video.duration) && video.duration > 0
        ? video.duration
        : 0;
    const currentTime = duration > 0 && video ? video.currentTime : 0;
    setTiming((current) =>
      current.src === src &&
      current.duration === duration &&
      current.currentTime === currentTime
        ? current
        : { src, duration, currentTime }
    );
  }

  function resetTiming() {
    setTiming({ src, duration: 0, currentTime: 0 });
  }

  const duration = timing.src === src ? timing.duration : 0;
  const currentTime = timing.src === src ? timing.currentTime : 0;
  const seekDisabled = duration <= 0;
  const progress = seekDisabled
    ? 0
    : Math.min(100, Math.max(0, (currentTime / duration) * 100));
  const currentTimeLabel = formatVideoTime(currentTime, duration, locale);
  const durationLabel = seekDisabled
    ? "—"
    : formatVideoTime(duration, duration, locale);

  return {
    updateProgress,
    resetTiming,
    seekDisabled,
    progress,
    currentTimeLabel,
    durationLabel,
    seekValueText: t(locale, "media.video.position", {
      current: currentTimeLabel,
      duration: durationLabel,
    }),
  };
}
