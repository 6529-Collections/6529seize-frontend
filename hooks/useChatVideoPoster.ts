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

const MAX_POSTER_CHECKS = 20;
const MAX_FALLBACK_CHECKS = 4;

/** Load small previews only; never attach or decode video to get a frame. */
export function useChatVideoPoster(
  originalUrl: string,
  enabled: boolean
): VideoPoster | undefined {
  const active = useMobileAppActivity();
  const conversions = isVideoUrl(originalUrl)
    ? getVideoConversions(originalUrl)
    : undefined;
  const url = conversions?.POSTER;
  const fallbackUrl = conversions?.FIRST_FRAME_POSTER;
  const [poster, setPoster] = useState<VideoPoster>();
  const loaded = useRef<VideoPoster | undefined>(undefined);
  const attempts = useRef({ url, count: 0, fallbackCount: 0 });

  useEffect(() => {
    if (attempts.current.url !== url) {
      attempts.current = { url, count: 0, fallbackCount: 0 };
    }
    if (
      !url ||
      !fallbackUrl ||
      !enabled ||
      !active ||
      loaded.current?.url === url
    )
      return;
    let disposed = false;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    let image: HTMLImageElement | undefined;

    const retry = () => {
      if (
        disposed ||
        attempts.current.count >= MAX_POSTER_CHECKS ||
        attempts.current.fallbackCount >= MAX_FALLBACK_CHECKS
      )
        return;
      // Conversion can outlast two minutes. Back off to one check per minute,
      // retaining the shared HEAD cache and pausing outside view/background.
      const delay = Math.min(15000 * 2 ** (attempts.current.count - 1), 60000);
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        void check();
      }, delay);
    };
    const load = (imageUrl: string) => {
      const preview = new Image();
      image = preview;
      preview.onload = () => {
        if (disposed) return;
        if (preview.naturalWidth <= 0 || preview.naturalHeight <= 0) {
          retry();
          return;
        }
        const next = {
          url: imageUrl,
          aspectRatio: preview.naturalWidth / preview.naturalHeight,
        };
        loaded.current = next;
        setPoster(next);
        if (imageUrl !== url) retry();
      };
      preview.onerror = retry;
      preview.src = imageUrl;
    };
    const check = async () => {
      if (
        disposed ||
        attempts.current.count >= MAX_POSTER_CHECKS ||
        attempts.current.fallbackCount >= MAX_FALLBACK_CHECKS
      )
        return;
      attempts.current.count += 1;
      const hasFallback = loaded.current?.url === fallbackUrl;
      if (hasFallback) attempts.current.fallbackCount += 1;
      const available = await checkVideoAvailability(url);
      if (disposed) return;
      if (available) {
        load(url);
        return;
      }
      if (!hasFallback && (await checkVideoAvailability(fallbackUrl))) {
        if (!disposed) load(fallbackUrl);
        return;
      }
      retry();
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
  }, [url, fallbackUrl, enabled, active]);

  return poster?.url === url || poster?.url === fallbackUrl
    ? poster
    : undefined;
}
