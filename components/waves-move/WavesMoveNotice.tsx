"use client";

import { InformationCircleIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import type { ApiWave } from "@/generated/models/ApiWave";
import { Time } from "@/helpers/time";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { useWavesMovePhase } from "@/hooks/useWavesMovePhase";
import { useWavesMoveScope } from "./WavesMoveScope";
import { formatUtcDate } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { resultTimesBetween } from "@/lib/waves-move/frozenResults";
import {
  getWavesMoveSchedule,
  MAX_TIMER_DELAY_MS,
  type WavesMovePhase,
  type WavesMoveSchedule,
} from "@/lib/waves-move/schedule";

// The notice the viewer hid, by its text: the next phase, or a change of
// wording, shows again.
const DISMISSED_KEY = "wavesMove.dismissedNotice";

const readDismissed = (): string | null => {
  try {
    // Throws on the server and where storage is blocked.
    return globalThis.localStorage.getItem(DISMISSED_KEY);
  } catch {
    return null;
  }
};

const writeDismissed = (text: string): void => {
  try {
    globalThis.localStorage.setItem(DISMISSED_KEY, text);
  } catch {
    // Hidden for this page only.
  }
};

const formatWeekday = (locale: SupportedLocale, ms: number): string =>
  formatUtcDate(locale, ms, { weekday: "long" });

const formatDay = (locale: SupportedLocale, ms: number): string =>
  t(locale, "wavesMove.day", {
    weekday: formatWeekday(locale, ms),
    day: formatUtcDate(locale, ms, { day: "numeric" }),
    month: formatUtcDate(locale, ms, { month: "long" }),
  });

const formatTime = (locale: SupportedLocale, ms: number): string =>
  formatUtcDate(locale, ms, {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });

const getWavesMoveNoticeText = (
  locale: SupportedLocale,
  phase: WavesMovePhase,
  schedule: WavesMoveSchedule
): string | null => {
  const { freezeAtMs, switchOnMs } = schedule;
  switch (phase) {
    case "notice":
      return t(locale, "wavesMove.notice", {
        freezeWeekday: formatWeekday(locale, freezeAtMs),
        freezeTime: formatTime(locale, freezeAtMs),
        switchOnWeekday: formatWeekday(locale, switchOnMs),
        switchOnTime: formatTime(locale, switchOnMs),
      });
    case "frozen":
      return t(locale, "wavesMove.frozen", {
        switchOnWeekday: formatWeekday(locale, switchOnMs),
        switchOnTime: formatTime(locale, switchOnMs),
      });
    case "moved":
      return t(locale, "wavesMove.moved", {
        switchOnDay: formatDay(locale, switchOnMs),
      });
    case "none":
      return null;
  }
};

/**
 * While frozen, the latest of the wave's result times since the freeze that
 * has passed: 6529.io won't settle it. The clock is read again at the next
 * one, and when the page becomes visible.
 */
function useFrozenResult(
  phase: WavesMovePhase,
  schedule: WavesMoveSchedule | null,
  wave: ApiWave | null | undefined
): number | null {
  const [nowMs, setNowMs] = useState(() => Time.currentMillis());
  const times =
    phase === "frozen" && schedule !== null
      ? resultTimesBetween(wave, schedule.freezeAtMs, schedule.switchOnMs)
      : [];
  const passed = times.filter((time) => time <= nowMs).at(-1) ?? null;
  const upcoming = times.find((time) => time > nowMs) ?? null;
  useEffect(() => {
    if (upcoming === null) {
      return;
    }
    // Set again after each firing: a clock read early only waits once more.
    const timer = setTimeout(
      () => setNowMs(Time.currentMillis()),
      Math.min(
        Math.max(upcoming - Time.currentMillis(), 0) + 1,
        MAX_TIMER_DELAY_MS
      )
    );
    return () => clearTimeout(timer);
  }, [upcoming, nowMs]);
  useEffect(() => {
    // A suspended tab or app runs no timers.
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        setNowMs(Time.currentMillis());
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);
  return passed;
}

/**
 * Says when votes, entries and wave settings move to the 6529 Network and
 * what that means for changing them on this site. Renders nothing unless the
 * waves freeze and switch-on are set, and inside a wave that stays on
 * 6529.io. The viewer can hide it until it says something new. Given the
 * wave, it also says that a result due while waves are frozen is counted on
 * the 6529 Network after the switch-on.
 */
export default function WavesMoveNotice({
  className = "",
  siteWide = false,
  wave,
}: {
  readonly className?: string | undefined;
  /** For creating a wave, which moves wherever it starts: ignores the scope. */
  readonly siteWide?: boolean | undefined;
  /** The wave, for a result due while waves are frozen. */
  readonly wave?: ApiWave | undefined;
}) {
  const locale = useBrowserLocale();
  const phase = useWavesMovePhase();
  const scope = useWavesMoveScope();
  const schedule = getWavesMoveSchedule();
  const frozenResultMs = useFrozenResult(phase, schedule, wave);
  // Read once: the server and the hydrating render show no phase, so this
  // never changes the first markup.
  const [dismissed, setDismissed] = useState<string | null>(readDismissed);
  const noticeText =
    schedule === null || (scope === "stays" && !siteWide)
      ? null
      : getWavesMoveNoticeText(locale, phase, schedule);
  const text =
    noticeText !== null && schedule !== null && frozenResultMs !== null
      ? `${noticeText} ${t(locale, "wavesMove.resultPending", {
          resultWeekday: formatWeekday(locale, frozenResultMs),
          resultTime: formatTime(locale, frozenResultMs),
          switchOnWeekday: formatWeekday(locale, schedule.switchOnMs),
          switchOnTime: formatTime(locale, schedule.switchOnMs),
        })}`
      : noticeText;

  // Hiding the notice with the result sentence also hides the plain notice
  // elsewhere; hiding the plain one still shows the sentence when it comes.
  if (text === null || dismissed?.startsWith(text) === true) {
    return null;
  }

  const hide = () => {
    writeDismissed(text);
    setDismissed(text);
  };

  return (
    <section
      aria-label={t(locale, "wavesMove.noticeLabel")}
      data-testid="waves-move-notice"
      className={`tailwind-scope tw-flex tw-items-start tw-gap-3 tw-rounded-xl tw-border tw-border-solid tw-border-primary-400/30 tw-bg-primary-400/5 tw-px-4 tw-py-3 ${className}`.trim()}
    >
      <InformationCircleIcon
        aria-hidden="true"
        className="tw-mt-0.5 tw-size-5 tw-shrink-0 tw-text-primary-300"
      />
      <p className="tw-m-0 tw-flex-1 tw-text-sm tw-leading-6 tw-text-iron-200">
        {text}
      </p>
      <button
        type="button"
        onClick={hide}
        aria-label={t(locale, "wavesMove.hide")}
        className="-tw-my-1 -tw-mr-2 tw-flex tw-size-8 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-transparent tw-text-iron-400 tw-transition-colors focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-300 desktop-hover:hover:tw-text-iron-200"
      >
        <XMarkIcon aria-hidden="true" className="tw-size-5" />
      </button>
    </section>
  );
}
