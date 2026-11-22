"use client";

import { LockClosedIcon } from "@heroicons/react/24/outline";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { useIdentityEditingPaused } from "@/hooks/useIdentityMovePhase";
import { formatUtcDate } from "@/i18n/format";
import { t } from "@/i18n/messages";
import { getIdentityFreezeAtMs } from "@/lib/identity-move/schedule";
import { formatUtcDay } from "@/lib/tdh-chain/tdhDay";

/**
 * xTDH stops changing at the identity freeze (NEXT_PUBLIC_IDENTITY_FREEZE_AT,
 * the identity move's one flag). From then the xTDH pages say so, and grants
 * can't be created or changed until one-time grants exist on the 6529
 * Network. Renders nothing before the freeze or when no freeze is set.
 */
export default function XtdhFrozenNotice({
  className = "",
}: {
  readonly className?: string;
}) {
  const locale = useBrowserLocale();
  const paused = useIdentityEditingPaused();
  const freezeAtMs = getIdentityFreezeAtMs();
  if (!paused || freezeAtMs === null) {
    return null;
  }
  const body = t(locale, "xtdh.frozen.body", {
    day: formatUtcDay(locale, freezeAtMs),
    time: formatUtcDate(locale, freezeAtMs, {
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }),
  });
  return (
    <section
      aria-label={t(locale, "xtdh.frozen.label")}
      data-testid="xtdh-frozen-notice"
      className={`tailwind-scope tw-flex tw-items-start tw-gap-3 tw-rounded-xl tw-border tw-border-solid tw-border-primary-400/30 tw-bg-primary-400/5 tw-px-4 tw-py-3 ${className}`.trim()}
    >
      <LockClosedIcon
        aria-hidden="true"
        className="tw-mt-0.5 tw-size-5 tw-shrink-0 tw-text-primary-300"
      />
      <div className="tw-text-sm tw-leading-6">
        <p className="tw-m-0 tw-font-semibold tw-text-iron-100">
          {t(locale, "xtdh.frozen.title")}
        </p>
        <p className="tw-m-0 tw-text-iron-200">{body}</p>
      </div>
    </section>
  );
}
