"use client";

import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import {
  useChainIdentityActive,
  useIdentityMovePhase,
} from "@/hooks/useIdentityMovePhase";
import { formatUtcDate } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import {
  getIdentityFreezeAtMs,
  getIdentitySwitchOnMs,
  type IdentityMovePhase,
} from "@/lib/identity-move/schedule";
import IdentityMoveCallout from "./IdentityMoveCallout";
import {
  formatIdentityMoveDay,
  formatIdentityMoveTime,
} from "./identityMoveFormat";

const HOUR_MS = 60 * 60 * 1000;

const getNoticeText = (
  locale: SupportedLocale,
  phase: IdentityMovePhase,
  freezeAtMs: number
): string | null => {
  const switchOnMs = getIdentitySwitchOnMs(freezeAtMs);
  switch (phase) {
    case "notice":
      return t(locale, "identityMove.notice", {
        freezeDay: formatIdentityMoveDay(locale, freezeAtMs),
        freezeTime: formatIdentityMoveTime(locale, freezeAtMs),
        freezeHours: String(Math.round((switchOnMs - freezeAtMs) / HOUR_MS)),
        switchOnWeekday: formatUtcDate(locale, switchOnMs, {
          weekday: "long",
        }),
      });
    case "frozen":
      return t(locale, "identityMove.frozen", {
        switchOnDay: formatIdentityMoveDay(locale, switchOnMs),
        switchOnTime: formatIdentityMoveTime(locale, switchOnMs),
      });
    case "moved":
      return t(locale, "identityMove.moved", {
        switchOnDay: formatIdentityMoveDay(locale, switchOnMs),
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
  const chainActive = useChainIdentityActive();
  const freezeAtMs = getIdentityFreezeAtMs();
  const text =
    freezeAtMs === null ? null : getNoticeText(locale, phase, freezeAtMs);

  if (text === null) {
    return null;
  }

  if (chainActive) {
    return (
      <IdentityMoveCallout
        label={t(locale, "identityMove.noticeLabel")}
        text={t(locale, "identityMove.movedChain")}
        link={{
          href: "/network/identity",
          label: t(locale, "identityMove.movedChainLink"),
        }}
        testId="identity-move-notice"
        className={className}
      />
    );
  }

  return (
    <IdentityMoveCallout
      label={t(locale, "identityMove.noticeLabel")}
      text={text}
      testId="identity-move-notice"
      className={className}
    />
  );
}
