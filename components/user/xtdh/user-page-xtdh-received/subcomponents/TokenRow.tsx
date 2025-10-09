'use client';

import { useMemo } from "react";
import type { XtdhReceivedToken } from "@/types/xtdh";
import { formatRate, formatTotal } from "../utils";
import { UserPageXtdhReceivedGranterAvatarGroup } from "./GranterAvatarGroup";
import { UserPageXtdhReceivedGranterRow } from "./GranterRow";

export interface UserPageXtdhReceivedTokenRowProps {
  readonly token: XtdhReceivedToken;
  readonly expanded: boolean;
  readonly onToggle: () => void;
}

export function UserPageXtdhReceivedTokenRow({
  token,
  expanded,
  onToggle,
}: UserPageXtdhReceivedTokenRowProps) {
  const additionalGranters = useMemo(
    () => Math.max(token.granterCount - token.granterPreviews.length, 0),
    [token]
  );
  const granterPanelId = `token-granters-${token.tokenId}`;

  return (
    <div className="tw-rounded-xl tw-border tw-border-iron-800 tw-bg-iron-900 tw-p-4">
      <div className="tw-flex tw-flex-col md:tw-flex-row md:tw-items-center md:tw-justify-between tw-gap-4">
        <div className="tw-flex tw-items-center tw-gap-3">
          <img
            src={token.tokenImage}
            alt={`${token.tokenName} artwork`}
            className="tw-h-12 tw-w-12 tw-rounded-lg tw-object-cover tw-border tw-border-iron-700"
            loading="lazy"
          />
          <div className="tw-flex tw-flex-col tw-gap-1">
            <span className="tw-text-sm tw-font-semibold tw-text-iron-50">
              {token.tokenName}
            </span>
            <span className="tw-text-xs tw-text-iron-300">
              {formatRate(token.xtdhRate)}
            </span>
          </div>
        </div>
        <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-4">
          <div className="tw-flex tw-flex-col tw-gap-1">
            <span className="tw-text-[11px] tw-font-semibold tw-uppercase tw-text-iron-400">
              Total Received
            </span>
            <span className="tw-text-sm tw-font-semibold tw-text-iron-100">
              {formatTotal(token.totalXtdhReceived)}
            </span>
          </div>
          <UserPageXtdhReceivedGranterAvatarGroup
            granters={token.granterPreviews}
            granterCount={token.granterCount}
            additional={additionalGranters}
          />
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={expanded}
            aria-controls={granterPanelId}
            className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-iron-700 tw-bg-iron-850 tw-px-3 tw-py-2 tw-text-xs tw-font-semibold tw-text-iron-200 hover:tw-bg-iron-800 tw-transition tw-duration-300 tw-ease-out"
          >
            {expanded ? "Hide granters" : "View granters"}
          </button>
        </div>
      </div>
      {expanded && (
        <div
          id={granterPanelId}
          className="tw-mt-4 tw-space-y-2"
          role="region"
          aria-label={`Granters for ${token.tokenName}`}
        >
          {token.granters.map((granter) => (
            <UserPageXtdhReceivedGranterRow
              key={`${token.tokenId}-${granter.profileId}`}
              granter={granter}
            />
          ))}
        </div>
      )}
    </div>
  );
}
