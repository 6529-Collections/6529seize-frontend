import { CheckBadgeIcon, ShieldCheckIcon } from "@heroicons/react/20/solid";

import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/ai-download";
import { describeCodeSignature } from "@/lib/ai-page/releaseFiles";

// Rendered on the server, in the locale the server renders.
const LOCALE = DEFAULT_LOCALE;
const BADGE =
  "tw-inline-flex tw-items-center tw-gap-1 tw-whitespace-nowrap tw-rounded-full tw-border tw-border-solid tw-border-white/10 tw-bg-white/[0.04] tw-px-2 tw-py-0.5 tw-text-xs tw-font-medium tw-text-iron-200";

/**
 * Who signed a file and whether Apple notarized it, from the signed feed.
 * Nothing for a file with no code signature.
 */
export default function AiTrustBadges({
  signed,
}: {
  /** The feed's `signed` text for the file. */
  readonly signed: string | null;
}) {
  const { signer, notarized } = describeCodeSignature(signed);
  if (!signer && !notarized) {
    return null;
  }
  return (
    <span className="tw-flex tw-flex-wrap tw-gap-1.5">
      {signer && (
        <span className={BADGE}>
          <ShieldCheckIcon
            aria-hidden="true"
            className="tw-size-3.5 tw-text-success"
          />
          {t(LOCALE, "ai.badge.signed", { signer })}
        </span>
      )}
      {notarized && (
        <span className={BADGE}>
          <CheckBadgeIcon
            aria-hidden="true"
            className="tw-size-3.5 tw-text-success"
          />
          {t(LOCALE, "ai.badge.notarized")}
        </span>
      )}
    </span>
  );
}
