"use client";

import { useEffect, useRef, useState } from "react";
import {
  checkVideoAvailability,
  getVideoConversions,
  isVideoUrl,
} from "@/helpers/video.helpers";
import { useMobileAppActivity } from "./useMobileAppActivity";

interface VideoPoster {
  readonly url: string;
  readonly aspectRatio: number;
}

/** Load a small preview only; never attach or decode the video to get a frame. */
export function useChatVideoPoster(
  originalUrl: string,
  enabled: boolean
): VideoPoster | undefined {
  const active = useMobileAppActivity();
  const url = isVideoUrl(originalUrl)
    ? getVideoConversions(originalUrl)?.POSTER
    : undefined;
  const [poster, setPoster] = useState<VideoPoster>();
  const attempts = useRef({ url, count: 0 });

  useEffect(() => {
    if (attempts.current.url !== url) attempts.current = { url, count: 0 };
    if (!url || !enabled || !active || poster?.url === url) return;
    let disposed = false;
    const isCurrent = () => !disposed;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    let image: HTMLImageElement | undefined;

    const retry = () => {
      if (isCurrent() && attempts.current.count < 8) {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          void check();
        }, 15000);
      }
    };
    const check = async () => {
      if (!isCurrent() || attempts.current.count >= 8) return;
      attempts.current.count += 1;
      const available = await checkVideoAvailability(url);
      if (!isCurrent()) return;
      if (!available) {
        retry();
        return;
      }
      const preview = new Image();
      image = preview;
      preview.onload = () => {
        if (!isCurrent()) return;
        if (preview.naturalWidth <= 0 || preview.naturalHeight <= 0) {
          retry();
          return;
        }
        setPoster({
          url,
          aspectRatio: preview.naturalWidth / preview.naturalHeight,
        });
      };
      preview.onerror = retry;
      preview.src = url;
    };
    void check();
    return () => {
      disposed = true;
      clearTimeout(timeout);
      if (image) {
        image.onload = null;
        image.onerror = null;
        image.removeAttribute("src");
      }
    };
  }, [url, enabled, active, poster?.url]);

  return poster?.url === url ? poster : undefined;
}
