"use client";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { ApiWave } from "@/generated/models/ApiWave";
import {
  SLOW_MODE_MIN_MS,
  formatSlowModeCountdown,
  formatSlowModeInterval,
  getSlowModeRemainingMs,
} from "@/helpers/waves/slow-mode.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { useVisibleInterval } from "@/hooks/usePageVisibility";
import { t } from "@/i18n/messages";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

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
  const locale = useBrowserLocale();
  const [now, setNow] = useState(() => Date.now());
  const isCoolingDown = nextDropAllowed !== null && now < nextDropAllowed;

  // Ticks only while the cooldown runs and the page is visible; the tick that
  // reaches the cooldown end (or the first one after the page is shown again)
  // refreshes the wave and stops the timer.
  useVisibleInterval(
    () => {
      const currentTime = Date.now();
      setNow(currentTime);

      if (nextDropAllowed === null || currentTime < nextDropAllowed) {
        return;
      }

      void queryClient
        .invalidateQueries({
          queryKey: [QueryKey.WAVE, { wave_id: waveId }],
        })
        .catch(() => undefined);
    },
    isCoolingDown ? 1000 : null
  );

  const remainingMs = getSlowModeRemainingMs({ nextDropAllowed, now });
  const message =
    remainingMs > 0
      ? t(locale, "waves.slowMode.notice.cooldown", {
          countdown: formatSlowModeCountdown(remainingMs),
        })
      : t(locale, "waves.slowMode.notice.interval", {
          interval: formatSlowModeInterval(cooldownMs),
        });

  return (
    <p
      className="tw-mb-2 tw-mt-0 tw-text-[11px] tw-font-medium tw-leading-4 tw-text-iron-400"
      aria-live={remainingMs > 0 ? "polite" : undefined}
    >
      {message}
    </p>
  );
}
