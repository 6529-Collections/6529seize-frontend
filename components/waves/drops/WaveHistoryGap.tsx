"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useMyStreamActions } from "@/contexts/wave/MyStreamContext";
import type { WaveHistoryGap as HistoryGap } from "@/contexts/wave/hooks/types";
import { DropSize } from "@/helpers/waves/drop.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

const STATUS_MESSAGES = {
  idle: "waves.historyGap.load",
  loading: "waves.historyGap.loading",
  error: "waves.historyGap.retry",
} as const;

export function WaveHistoryGap({
  waveId,
  gap,
  scrollContainerRef,
}: {
  readonly waveId: string;
  readonly gap: HistoryGap;
  readonly scrollContainerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const { fetchNextPageForWave } = useMyStreamActions();
  const locale = useBrowserLocale();
  const element = useRef<HTMLDivElement>(null);
  const loading = useRef(false);
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const load = useCallback(async () => {
    if (loading.current) return;
    loading.current = true;
    setState("loading");
    try {
      const result = await fetchNextPageForWave({
        waveId,
        type: DropSize.FULL,
        gap,
      });
      setState(result === null ? "error" : "idle");
    } catch {
      setState("error");
    } finally {
      loading.current = false;
    }
  }, [fetchNextPageForWave, gap, waveId]);

  useEffect(() => {
    if (!element.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) void load();
      },
      { root: scrollContainerRef.current, rootMargin: "200px" }
    );
    observer.observe(element.current);
    return () => observer.disconnect();
  }, [load, scrollContainerRef]);

  return (
    <div ref={element} className="tw-flex tw-justify-center tw-px-4 tw-py-3">
      <button
        type="button"
        aria-label={t(locale, "waves.historyGap.load")}
        aria-busy={state === "loading"}
        disabled={state === "loading"}
        onClick={() => void load()}
        className="tw-min-h-10 tw-rounded-lg tw-border tw-border-iron-700 tw-bg-iron-900 tw-px-4 tw-py-2 tw-text-sm tw-text-iron-200 hover:tw-bg-iron-800 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 disabled:tw-opacity-60"
      >
        {t(locale, STATUS_MESSAGES[state])}
      </button>
      <span className="tw-sr-only" role="status" aria-live="polite">
        {state !== "idle" ? t(locale, STATUS_MESSAGES[state]) : ""}
      </span>
    </div>
  );
}
