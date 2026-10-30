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
        className="tw-inline-flex tw-size-5 tw-cursor-help tw-items-center tw-justify-center tw-rounded-full tw-border-none tw-bg-transparent tw-p-0 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
      >
        <UserCICTypeIcon cic={profile.cic} />
      </button>

      {canRenderTooltip &&
        createPortal(
          <Tooltip
            id={tooltipId}
            clickable={true}
            className="!tw-bg-iron-950 max-sm:!tw-left-1/2 max-sm:-tw-translate-x-1/2"
            classNameArrow="max-sm:tw-hidden"
            place="right"
            positionStrategy="fixed"
            opacity={1}
            style={{
              ...TOOLTIP_STYLES,
              padding: "0",
              maxWidth: "min(360px, calc(100vw - 16px))",
              pointerEvents: "auto",
            }}
          >
            <div className="tailwind-scope tw-max-h-[calc(100dvh-1rem)] tw-overflow-y-auto">
              <UserCICTypeIconTooltip profile={profile} />
            </div>
          </Tooltip>,
          document.body
        )}
    </>
  );
}
