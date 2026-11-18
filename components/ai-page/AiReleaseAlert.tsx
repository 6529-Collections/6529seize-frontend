import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

import { LINK } from "@/components/validator-page/validatorStyles";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/ai-download";
import { aiReleaseList } from "@/lib/ai-page/releaseList";
import type { AiRelease } from "@/lib/ai-page/releaseFeed";
import type { ValidatorFeedSupport } from "@/lib/validator-page/releaseFeed";
import { AI_BODY } from "./AiPageFrame";

// Rendered on the server, in the locale the server renders.
const LOCALE = DEFAULT_LOCALE;

/** `2026-11-08T00:00:00Z` as `2026-11-08 00:00 UTC`. */
function formatUtc(time: string): string {
  return `${time.slice(0, 10)} ${time.slice(11, 16)} UTC`;
}

/**
 * What the signed list says about the newest release that a visitor must
 * read before anything else: it is unsafe to run, or it is an urgent
 * update, with the list's reason and deadline. Nothing otherwise, and
 * nothing from the Ed25519 feed, which has no such fields.
 */
export default function AiReleaseAlert({
  release,
  support,
}: {
  readonly release: AiRelease;
  readonly support?: ValidatorFeedSupport | undefined;
}) {
  const unsafe = Boolean(release.unsafeReason);
  if (!unsafe && !release.urgent) {
    return null;
  }
  const reason = unsafe ? release.unsafeReason : release.reason;
  const deadline =
    !unsafe && support?.minSupported && support.deadline
      ? t(LOCALE, "ai.alert.deadline", {
          minimum: support.minSupported,
          version: release.version,
          deadline: formatUtc(support.deadline),
        })
      : null;
  const deadlineReason = deadline ? support?.deadlineReason : null;
  return (
    <section
      id="release-alert"
      aria-labelledby="release-alert-title"
      className="tw-mb-4 tw-flex tw-items-start tw-gap-3 tw-rounded-xl tw-border tw-border-solid tw-border-error/40 tw-bg-error/10 tw-p-4 sm:tw-p-5"
    >
      <ExclamationTriangleIcon
        aria-hidden="true"
        className="tw-mt-0.5 tw-size-5 tw-flex-none tw-text-error"
      />
      <div className="tw-min-w-0">
        <h2
          id="release-alert-title"
          className="tw-m-0 tw-text-base tw-font-semibold tw-leading-6 tw-text-iron-50"
        >
          {t(LOCALE, unsafe ? "ai.alert.unsafe" : "ai.alert.urgent", {
            version: release.version,
          })}
        </h2>
        {reason && <p className={`tw-mb-0 tw-mt-1 ${AI_BODY}`}>{reason}</p>}
        {deadline && (
          <p className={`tw-mb-0 tw-mt-1 ${AI_BODY}`}>
            <strong className="tw-font-semibold tw-text-iron-50">
              {deadline}
            </strong>
            {deadlineReason && ` ${deadlineReason}`}
          </p>
        )}
        <p className="tw-mb-0 tw-mt-2 tw-text-sm tw-leading-6">
          <Link
            href={aiReleaseList.releaseHref(release.version)}
            className={LINK}
          >
            {t(LOCALE, "ai.alert.notes", { version: release.version })}
          </Link>
        </p>
      </div>
    </section>
  );
}
