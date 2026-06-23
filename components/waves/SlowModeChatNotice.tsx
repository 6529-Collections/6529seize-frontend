"use client";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { ApiWave } from "@/generated/models/ApiWave";
import {
  SLOW_MODE_MIN_MS,
  formatSlowModeCountdown,
  formatSlowModeInterval,
  getSlowModeRemainingMs,
} from "@/helpers/waves/slow-mode.helpers";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

interface SlowModeChatNoticeProps {
  readonly wave: ApiWave;
  readonly isDropMode: boolean;
}

export default function SlowModeChatNotice({
  wave,
  isDropMode,
}: SlowModeChatNoticeProps) {
  const cooldownMs = wave.chat.slow_mode_cooldown_ms ?? null;
  const isSlowModeEnabled =
    typeof cooldownMs === "number" && cooldownMs >= SLOW_MODE_MIN_MS;
  const nextDropAllowed = wave.chat.next_drop_allowed ?? null;

  if (isDropMode || !isSlowModeEnabled) {
    return null;
  }

  return (
    <ActiveSlowModeChatNotice
      key={`${wave.id}:${cooldownMs}:${nextDropAllowed ?? "none"}`}
      waveId={wave.id}
      cooldownMs={cooldownMs}
      nextDropAllowed={nextDropAllowed}
    />
  );
}

interface ActiveSlowModeChatNoticeProps {
  readonly waveId: string;
  readonly cooldownMs: number;
  readonly nextDropAllowed: number | null;
}

function ActiveSlowModeChatNotice({
  waveId,
  cooldownMs,
  nextDropAllowed,
}: ActiveSlowModeChatNoticeProps) {
  const queryClient = useQueryClient();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (nextDropAllowed === null) {
      return;
    }

    if (nextDropAllowed <= Date.now()) {
      return;
    }

    let didInvalidate = false;
    const intervalId = setInterval(() => {
      const currentTime = Date.now();
      setNow(currentTime);

      if (currentTime < nextDropAllowed || didInvalidate) {
        return;
      }

      didInvalidate = true;
      clearInterval(intervalId);
      void queryClient
        .invalidateQueries({
          queryKey: [QueryKey.WAVE, { wave_id: waveId }],
        })
        .catch(() => undefined);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [nextDropAllowed, queryClient, waveId]);

  const remainingMs = getSlowModeRemainingMs({ nextDropAllowed, now });
  const message =
    remainingMs > 0
      ? `Slow mode: send again in ${formatSlowModeCountdown(remainingMs)}`
      : `Slow mode: one message every ${formatSlowModeInterval(cooldownMs)}`;

  return (
    <p
      className="tw-mb-2 tw-mt-0 tw-text-[11px] tw-font-medium tw-leading-4 tw-text-iron-400"
      aria-live={remainingMs > 0 ? "polite" : undefined}
    >
      {message}
    </p>
  );
}
