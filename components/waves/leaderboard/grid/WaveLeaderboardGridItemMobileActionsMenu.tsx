"use client";

import CommonDropdownItemsMobileWrapper from "@/components/utils/select/dropdown/CommonDropdownItemsMobileWrapper";
import WaveDropMobileMenuCopyLink from "@/components/waves/drops/WaveDropMobileMenuCopyLink";
import WaveDropMobileMenuOpen from "@/components/waves/drops/WaveDropMobileMenuOpen";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import React, { useCallback } from "react";
import { createPortal } from "react-dom";

interface WaveLeaderboardGridItemMobileActionsMenuProps {
  readonly drop: ExtendedDrop;
  readonly isOpen: boolean;
  readonly setIsActive: (isActive: boolean) => void;
  readonly canOpenDrop: boolean;
  readonly canShowVotingAction: boolean;
  readonly onVoteClick: () => void;
}

export const WaveLeaderboardGridItemMobileActionsMenu: React.FC<
  WaveLeaderboardGridItemMobileActionsMenuProps
> = ({
  drop,
  isOpen,
  setIsActive,
  canOpenDrop,
  canShowVotingAction,
  onVoteClick,
}) => {
  const handleMobileVoteClick = useCallback(() => {
    setIsActive(false);
    onVoteClick();
  }, [onVoteClick, setIsActive]);

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <CommonDropdownItemsMobileWrapper isOpen={isOpen} setOpen={setIsActive}>
      <div className="tw-grid tw-grid-cols-1 tw-gap-y-2">
        {canOpenDrop && (
          <WaveDropMobileMenuOpen
            drop={drop}
            onOpenChange={() => setIsActive(false)}
          />
        )}
        <WaveDropMobileMenuCopyLink
          drop={drop}
          onCopy={() => setIsActive(false)}
        />

        {canShowVotingAction && (
          <button
            type="button"
            onClick={handleMobileVoteClick}
            className="tw-flex tw-select-none tw-items-center tw-gap-x-4 tw-rounded-xl tw-border-0 tw-bg-iron-950 tw-p-4 tw-text-left tw-transition-colors tw-duration-200 active:tw-bg-iron-800"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              className="tw-h-5 tw-w-5 tw-flex-shrink-0 tw-text-iron-300"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 2.75L14.8379 8.50092L21.1845 9.42395L16.5923 13.8991L17.6765 20.221L12 17.2379L6.32352 20.221L7.4077 13.8991L2.8155 9.42395L9.16215 8.50092L12 2.75Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="tw-text-base tw-font-semibold tw-text-iron-300">
              Vote
            </span>
          </button>
        )}
      </div>
    </CommonDropdownItemsMobileWrapper>,
    document.body
  );
};
