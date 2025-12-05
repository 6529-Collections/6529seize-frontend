"use client";

import { ApiIdentity } from "@/generated/models/ApiIdentity";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Tooltip } from "react-tooltip";
import UserCICTypeIconTooltip from "./tooltip/UserCICTypeIconTooltip";
import UserCICTypeIcon from "./UserCICTypeIcon";

export default function UserCICTypeIconWrapper({
  profile,
}: {
  readonly profile: ApiIdentity;
}) {
  const tooltipId = `user-cic-type-tooltip-${profile.id}`;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      <div data-tooltip-id={tooltipId} className="tw-cursor-pointer">
        <UserCICTypeIcon cic={profile.cic} />
      </div>

      {mounted &&
        createPortal(
          <Tooltip
            id={tooltipId}
            clickable={true}
            place="right"
            opacity={1}
            border="1px solid #333"
            style={{
              backgroundColor: "#26272B",
              borderRadius: "8px",
              padding: "0",
              maxWidth: "360px",
              zIndex: 9999,
            }}
          >
            <UserCICTypeIconTooltip profile={profile} />
          </Tooltip>,
          document.body
        )}
    </>
  );
}
