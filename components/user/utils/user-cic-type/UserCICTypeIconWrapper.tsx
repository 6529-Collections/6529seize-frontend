"use client";

import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { Tooltip } from "react-tooltip";
import { TOOLTIP_STYLES } from "@/helpers/tooltip.helpers";
import UserCICTypeIconTooltip from "./tooltip/UserCICTypeIconTooltip";
import UserCICTypeIcon from "./UserCICTypeIcon";

const subscribeToClientRender = () => () => undefined;
const getClientRenderSnapshot = () => true;
const getServerRenderSnapshot = () => false;

export default function UserCICTypeIconWrapper({
  profile,
  ariaHidden = false,
  className = "",
}: {
  readonly profile: ApiIdentity;
  readonly ariaHidden?: boolean | undefined;
  readonly className?: string | undefined;
}) {
  const tooltipId = `user-cic-type-tooltip-${profile.id ?? "unknown"}`;
  const canRenderTooltip = useSyncExternalStore(
    subscribeToClientRender,
    getClientRenderSnapshot,
    getServerRenderSnapshot
  );

  return (
    <>
      <div
        data-tooltip-id={tooltipId}
        className={`tw-cursor-help tw-rounded-full ${className}`}
        aria-hidden={ariaHidden || undefined}
      >
        <UserCICTypeIcon cic={profile.cic} />
      </div>

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
            <UserCICTypeIconTooltip profile={profile} />
          </Tooltip>,
          document.body
        )}
    </>
  );
}
