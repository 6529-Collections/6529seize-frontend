"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useMyStreamActions } from "@/contexts/wave/MyStreamContext";
import type {
  WaveHistoryGap as HistoryGap,
  WaveHistoryGapDirection,
} from "@/contexts/wave/hooks/types";
import { DropSize } from "@/helpers/waves/drop.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { holdReverseScrollAnchor } from "./holdReverseScrollAnchor";

const STATUS_MESSAGES = {
  idle: "waves.historyGap.load",
  loading: "waves.historyGap.loading",
  error: "waves.historyGap.retry",
} as const;

// Inserted drops keep changing height while their media loads.
const ANCHOR_SETTLE_MS = 1500;

/**
 * Fill the gap from the side the reader is on, so the next drops in reading
 * order load first. A reader scrolling down came from older drops (for
 * example after jumping to an old post) and needs the gap's oldest drops; a
 * reader scrolling up needs its newest. Without a scroll to go by, the
 * marker's place on screen decides: below the middle, the reader is above it.
 */
const getFillDirection = (
  marker: HTMLElement,
  container: HTMLElement | null,
  scrollDirection: WaveHistoryGapDirection | null
): WaveHistoryGapDirection => {
  if (scrollDirection) return scrollDirection;
  if (!container) return "older";
  const markerRect = marker.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();
  const markerCenter = markerRect.top + markerRect.height / 2;
  const containerCenter = containerRect.top + containerRect.height / 2;
  return markerCenter > containerCenter ? "newer" : "older";
};

export function WaveHistoryGap({
  waveId,
  gap,
  scrollContainerRef,
  onAnnounce,
  suspendAutoLoad = false,
}: {
  readonly waveId: string;
  readonly gap: HistoryGap;
  readonly scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  readonly onAnnounce: (message: string) => void;
  /** Hold automatic loading, e.g. while the chat scrolls to a target. */
  readonly suspendAutoLoad?: boolean | undefined;
}) {
  const { fetchNextPageForWave } = useMyStreamActions();
  const locale = useBrowserLocale();
  const element = useRef<HTMLDivElement>(null);
  const loading = useRef(false);
  const scrollDirection = useRef<WaveHistoryGapDirection | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const load = useCallback(async () => {
    const marker = element.current;
    if (loading.current || !marker) return;
    loading.current = true;
    const container = scrollContainerRef.current;
    const direction = getFillDirection(
      marker,
      container,
      scrollDirection.current
    );
    // Newer drops are inserted above the marker, between it and the drops the
    // reader is on. Keep those drops still so the new ones load out of view.
    const anchor = direction === "newer" ? marker.previousElementSibling : null;
    const releaseAnchor =
      anchor && container ? holdReverseScrollAnchor(container, anchor) : null;
    let didLoad = false;
    setState("loading");
    onAnnounce(t(locale, "waves.historyGap.loading"));
    try {
      const result = await fetchNextPageForWave({
        waveId,
        type: DropSize.FULL,
        gap,
        direction,
      });
      didLoad = result !== null;
      setState(result === null ? "error" : "idle");
      onAnnounce(
        t(
          locale,
          result === null ? "waves.historyGap.retry" : "waves.historyGap.loaded"
        )
      );
    } catch {
      setState("error");
      onAnnounce(t(locale, "waves.historyGap.retry"));
    } finally {
      loading.current = false;
      if (releaseAnchor) {
        // The new rows render after this resolves, and this marker may be
        // replaced by then, so the release cannot depend on its lifecycle.
        setTimeout(releaseAnchor, didLoad ? ANCHOR_SETTLE_MS : 0);
      }
    }
  }, [
    fetchNextPageForWave,
    gap,
    locale,
    onAnnounce,
    scrollContainerRef,
    waveId,
  ]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    let previousTop = container.scrollTop;
    const onScroll = () => {
      const top = container.scrollTop;
      if (top !== previousTop) {
        scrollDirection.current = top > previousTop ? "newer" : "older";
        previousTop = top;
      }
    };
    container.addEventListener("scroll", onScroll, { passive: true });
    return () => container.removeEventListener("scroll", onScroll);
  }, [scrollContainerRef]);

  useEffect(() => {
    if (!element.current || suspendAutoLoad) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) void load();
      },
      { root: scrollContainerRef.current, rootMargin: "200px" }
    );
    observer.observe(element.current);
    return () => observer.disconnect();
  }, [load, scrollContainerRef, suspendAutoLoad]);

  return (
    <div ref={element} className="tw-flex tw-justify-center tw-px-4 tw-py-3">
      <button
        type="button"
        aria-busy={state === "loading"}
        aria-disabled={state === "loading"}
        onClick={() => void load()}
        className="tw-min-h-10 tw-rounded-lg tw-border tw-border-iron-700 tw-bg-iron-900 tw-px-4 tw-py-2 tw-text-sm tw-text-iron-200 aria-disabled:tw-opacity-60 hover:tw-bg-iron-800 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
      >
        {t(locale, STATUS_MESSAGES[state])}
      </button>
    </div>
  );
}
