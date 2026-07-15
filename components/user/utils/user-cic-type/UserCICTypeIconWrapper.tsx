"use client";

import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { Tooltip } from "react-tooltip";
import { TOOLTIP_STYLES } from "@/helpers/tooltip.helpers";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import UserCICTypeIconTooltip from "./tooltip/UserCICTypeIconTooltip";
import UserCICTypeIcon from "./UserCICTypeIcon";

const subscribeToClientRender = () => () => undefined;
const getClientRenderSnapshot = () => true;
const getServerRenderSnapshot = () => false;

export default function UserCICTypeIconWrapper({
  profile,
}: {
  readonly profile: ApiIdentity;
}) {
  const tooltipId = `user-cic-type-tooltip-${profile.id ?? "unknown"}`;
  const canRenderTooltip = useSyncExternalStore(
    subscribeToClientRender,
    getClientRenderSnapshot,
    getServerRenderSnapshot
  );

  return (
    <>
      <button
        type="button"
        data-tooltip-id={tooltipId}
        aria-label={t(DEFAULT_LOCALE, "user.cicType.details")}
        className="tw-inline-flex tw-size-6 tw-items-center tw-justify-center tw-rounded-full tw-border-none tw-bg-transparent tw-p-0 tw-cursor-help focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
      >
        <UserCICTypeIcon cic={profile.cic} />
      </button>

      {canRenderTooltip &&
        createPortal(
          <Tooltip
            id={tooltipId}
            clickable={true}
            place="right"
            positionStrategy="fixed"
            opacity={1}
            style={{
              ...TOOLTIP_STYLES,
              padding: "0",
              maxWidth: "360px",
              pointerEvents: "auto",
            }}
          >
            <div className="tailwind-scope">
              <UserCICTypeIconTooltip profile={profile} />
            </div>
          </Tooltip>,
          document.body
        )}
    </>
  );
}
