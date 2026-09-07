"use client";

import ProfileAvatar, {
  ProfileBadgeSize,
} from "@/components/common/profile/ProfileAvatar";
import { shortenAddress } from "@/helpers/address.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t, type MessageKey } from "@/i18n/messages";
import type { MemesSubmissionIdentity } from "../hooks/useMemesSubmissionIdentity";

interface SubmissionIdentityPanelProps {
  readonly identity: MemesSubmissionIdentity;
}

const STATUS_MESSAGE_KEYS: Partial<
  Record<MemesSubmissionIdentity["status"], MessageKey>
> = {
  "loading-profile": "memes.submission.identity.loadingProfile",
  "needs-profile": "memes.submission.identity.needsProfile",
  "needs-auth": "memes.submission.identity.needsAuth",
  "verifying-profile": "memes.submission.identity.verifyingProfile",
  "checking-eligibility": "memes.submission.identity.checking",
  "eligibility-error": "memes.submission.identity.checkError",
  ineligible: "memes.submission.identity.ineligible",
  "limit-reached": "memes.submission.identity.limitReached",
  "not-started": "memes.submission.identity.notStarted",
  ended: "memes.submission.identity.ended",
  eligible: "memes.submission.identity.eligible",
};

export function SubmissionIdentityPanel({
  identity,
}: SubmissionIdentityPanelProps) {
  const locale = useBrowserLocale();
  const { profile, address, walletName, status } = identity;
  const statusMessageKey = STATUS_MESSAGE_KEYS[status];
  const isWarning = [
    "needs-profile",
    "needs-auth",
    "eligibility-error",
    "ineligible",
    "limit-reached",
    "not-started",
    "ended",
  ].includes(status);
  const statusColor = (() => {
    if (status === "eligible") return "tw-text-emerald-300";
    if (isWarning) return "tw-text-amber-300";
    return "tw-text-iron-300";
  })();

  if (!profile || !address) {
    return (
      <div className="tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900/60 tw-p-4">
        <p
          className="tw-mb-0 tw-text-sm tw-text-iron-300"
          role="status"
        >
          {t(locale, "memes.submission.identity.connectPrompt")}
        </p>
      </div>
    );
  }

  const profileHandle = profile.handle?.trim() ?? "";
  let identityName = profileHandle;
  if (identityName.length === 0) {
    identityName = profile.display.trim();
  }
  if (identityName.length === 0) {
    identityName = t(locale, "memes.submission.identity.unknownProfile");
  }
  const profileLabel =
    profileHandle.length > 0 ? `@${profileHandle}` : identityName;
  const fallback = identityName.charAt(0).toUpperCase();

  return (
    <div className="tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900/60 tw-p-4">
      <p className="tw-mb-3 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-400">
        {t(locale, "memes.submission.identity.submittingAs")}
      </p>
      <div className="tw-flex tw-items-center tw-gap-3">
        <ProfileAvatar
          pfpUrl={profile.pfp}
          size={ProfileBadgeSize.MEDIUM}
          alt=""
          fallbackContent={
            <span
              className="tw-text-sm tw-font-semibold tw-text-iron-300"
              aria-hidden="true"
            >
              {fallback}
            </span>
          }
        />
        <div className="tw-min-w-0 tw-flex-1">
          <p className="tw-mb-0 tw-truncate tw-text-sm tw-font-semibold tw-text-iron-100">
            {profileLabel}
          </p>
          <p className="tw-mb-0 tw-text-xs tw-text-iron-400">
            {t(locale, "memes.submission.identity.wallet")}:{" "}
            <span className="tw-font-mono">{shortenAddress(address)}</span>
            {walletName ? ` · ${walletName}` : ""}
          </p>
        </div>
      </div>
      {statusMessageKey && (
        <p
          className={`tw-mb-0 tw-mt-3 tw-text-sm ${statusColor}`}
          role={isWarning ? "alert" : "status"}
        >
          {t(locale, statusMessageKey)}
        </p>
      )}
    </div>
  );
}
