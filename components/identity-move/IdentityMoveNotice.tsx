"use client";

import { InformationCircleIcon } from "@heroicons/react/24/outline";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { useIdentityMovePhase } from "@/hooks/useIdentityMovePhase";
import { formatUtcDate } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import {
  getIdentityFreezeAtMs,
  getIdentitySwitchOnMs,
  type IdentityMovePhase,
} from "@/lib/identity-move/schedule";

const formatDay = (locale: SupportedLocale, ms: number): string =>
  t(locale, "identityMove.day", {
    weekday: formatUtcDate(locale, ms, { weekday: "long" }),
    day: formatUtcDate(locale, ms, { day: "numeric" }),
    month: formatUtcDate(locale, ms, { month: "long" }),
  });

const formatTime = (locale: SupportedLocale, ms: number): string =>
  formatUtcDate(locale, ms, {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });

const getNoticeText = (
  locale: SupportedLocale,
  phase: IdentityMovePhase,
  freezeAtMs: number
): string | null => {
  const switchOnMs = getIdentitySwitchOnMs(freezeAtMs);
  switch (phase) {
    case "notice":
      return t(locale, "identityMove.notice", {
        freezeDay: formatDay(locale, freezeAtMs),
        freezeTime: formatTime(locale, freezeAtMs),
        switchOnWeekday: formatUtcDate(locale, switchOnMs, {
          weekday: "long",
        }),
      });
    case "frozen":
      return t(locale, "identityMove.frozen", {
        switchOnDay: formatDay(locale, switchOnMs),
        switchOnTime: formatTime(locale, switchOnMs),
      });
    case "moved":
      return t(locale, "identityMove.moved", {
        switchOnDay: formatDay(locale, switchOnMs),
      });
    case "none":
      return null;
  }
};

/**
 * Says when profiles, handles, ratings, consolidations and delegations move
 * to the 6529 Network and what that means for editing them on this site.
 * Renders nothing unless NEXT_PUBLIC_IDENTITY_FREEZE_AT is set.
 */
export default function IdentityMoveNotice({
  className = "",
}: {
  readonly className?: string;
}) {
  const locale = useBrowserLocale();
  const phase = useIdentityMovePhase();
  const freezeAtMs = getIdentityFreezeAtMs();
  const text =
    freezeAtMs === null ? null : getNoticeText(locale, phase, freezeAtMs);

  if (text === null) {
    return null;
  }

  return (
    <section
      aria-label={t(locale, "identityMove.noticeLabel")}
      data-testid="identity-move-notice"
      className={`tailwind-scope tw-flex tw-items-start tw-gap-3 tw-rounded-xl tw-border tw-border-solid tw-border-primary-400/30 tw-bg-primary-400/5 tw-px-4 tw-py-3 ${className}`.trim()}
    >
      <InformationCircleIcon
        aria-hidden="true"
        className="tw-mt-0.5 tw-size-5 tw-shrink-0 tw-text-primary-300"
      />
      <p className="tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-200">
        {text}
      </p>
    </section>
  );
}
