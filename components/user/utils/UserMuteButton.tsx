"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell, faBellSlash } from "@fortawesome/free-solid-svg-icons";
import { Tooltip } from "react-tooltip";

import CircleLoader, {
  CircleLoaderSize,
} from "@/components/distribution-plan-tool/common/CircleLoader";
import { TOOLTIP_STYLES } from "@/helpers/tooltip.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import useProfileMute from "@/hooks/useProfileMute";
import { t } from "@/i18n/messages";

export default function UserMuteButton({
  handle,
  buttonClassName,
  iconClassName,
}: {
  readonly handle: string;
  readonly buttonClassName: string;
  readonly iconClassName: string;
}) {
  const { isMuted, isPending, toggleMute } = useProfileMute(handle);
  const locale = useBrowserLocale();
  const identityKey = handle.trim();
  const tooltipId = `mute-${identityKey || "profile"}`;
  const ariaLabel = isMuted
    ? t(locale, "profile.mute.action.unmuteAriaLabel")
    : t(locale, "profile.mute.action.muteAriaLabel");
  const buttonStateClass = isMuted
    ? "tw-bg-error/10 tw-text-error tw-ring-error/40 enabled:hover:tw-bg-error/15"
    : "tw-bg-iron-800 tw-text-iron-300 tw-ring-iron-700 enabled:hover:tw-bg-iron-700 enabled:hover:tw-ring-iron-600";
  const statusText = isMuted
    ? t(locale, "profile.mute.status.muted")
    : t(locale, "profile.mute.status.unmuted");

  return (
    <>
      <button
        onClick={() => void toggleMute()}
        disabled={isPending}
        type="button"
        aria-label={ariaLabel}
        className={`${buttonClassName} ${buttonStateClass} tw-flex tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-font-semibold tw-ring-1 tw-ring-inset tw-transition tw-duration-300 tw-ease-out enabled:tw-cursor-pointer disabled:tw-cursor-default disabled:tw-opacity-70`}
        data-tooltip-id={tooltipId}
      >
        {isPending ? (
          <CircleLoader size={CircleLoaderSize.SMALL} />
        ) : (
          <FontAwesomeIcon
            icon={isMuted ? faBellSlash : faBell}
            className={iconClassName}
          />
        )}
      </button>
      <Tooltip
        id={tooltipId}
        place="top"
        offset={8}
        delayShow={250}
        opacity={1}
        positionStrategy="fixed"
        style={TOOLTIP_STYLES}
      >
        <span className="tw-text-xs">
          {isMuted
            ? t(locale, "profile.mute.action.unmute")
            : t(locale, "profile.mute.action.mute")}
        </span>
      </Tooltip>
      <span className="tw-sr-only" role="status" aria-live="polite">
        {statusText}
      </span>
    </>
  );
}
