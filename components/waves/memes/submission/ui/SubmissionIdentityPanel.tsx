"use client";

import ProfileAvatar, {
  ProfileBadgeSize,
} from "@/components/common/profile/ProfileAvatar";
import { buildTooltipId, TOOLTIP_STYLES } from "@/helpers/tooltip.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t, type MessageKey } from "@/i18n/messages";
import { useId } from "react";
import { Tooltip } from "react-tooltip";
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
};

export function SubmissionIdentityPanel({
  identity,
}: SubmissionIdentityPanelProps) {
  const locale = useBrowserLocale();
  const tooltipId = buildTooltipId("submission-connection", useId());
  const { profile, address, profileStatus: status } = identity;
  const connectionLabel = t(
    locale,
    address
      ? "memes.submission.identity.walletConnected"
      : "memes.submission.identity.walletNotConnected"
  );
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
  const statusColor = isWarning ? "tw-text-amber-300" : "tw-text-iron-300";

  if (!profile) {
    return (
      <output className="tw-mb-0 tw-block tw-py-1 tw-text-sm tw-text-iron-300">
        {t(
          locale,
          statusMessageKey ?? "memes.submission.identity.connectPrompt"
        )}
      </output>
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
    <div className="tw-flex tw-min-w-0 tw-flex-1 tw-flex-wrap tw-items-center tw-gap-x-3 tw-gap-y-1 tw-py-1 tw-text-sm">
      <div className="tw-flex tw-min-w-0 tw-max-w-full tw-items-center tw-gap-2">
        <button
          type="button"
          aria-label={connectionLabel}
          data-tooltip-id={tooltipId}
          data-tooltip-content={connectionLabel}
          className="tw-relative tw-flex tw-shrink-0 tw-cursor-help tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-transparent tw-p-0 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
        >
          <ProfileAvatar
            pfpUrl={profile.pfp}
            size={ProfileBadgeSize.COMPACT}
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
          <span
            aria-hidden="true"
            className={`tw-absolute -tw-bottom-0.5 -tw-right-0.5 tw-size-2.5 tw-rounded-full tw-ring-2 tw-ring-iron-950 ${address ? "tw-bg-emerald-400" : "tw-bg-amber-400"}`}
          />
        </button>
        <p className="tw-m-0 tw-min-w-0 tw-break-words tw-leading-5 tw-text-iron-400">
          <span className="tw-sr-only">
            {t(locale, "memes.submission.identity.submittingAs")}{" "}
          </span>
          <span className="tw-font-semibold tw-text-iron-100">
            {profileLabel}
          </span>
        </p>
      </div>
      {statusMessageKey && (
        <p
          className={`tw-m-0 tw-flex tw-min-w-0 tw-items-center tw-gap-1 ${statusColor}`}
          role={isWarning ? "alert" : "status"}
        >
          {t(locale, statusMessageKey)}
        </p>
      )}
      <Tooltip
        id={tooltipId}
        place="top"
        positionStrategy="fixed"
        style={TOOLTIP_STYLES}
        openEvents={{ mouseenter: true, focus: true, click: true }}
        closeEvents={{ mouseleave: true, blur: true }}
        globalCloseEvents={{
          escape: true,
          scroll: true,
          clickOutsideAnchor: true,
        }}
      />
    </div>
  );
}
