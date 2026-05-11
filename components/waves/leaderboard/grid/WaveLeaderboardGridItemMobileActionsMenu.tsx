"use client";

import CommonDropdownItemsMobileWrapper from "@/components/utils/select/dropdown/CommonDropdownItemsMobileWrapper";
import WaveDropMobileMenuCopyLink from "@/components/waves/drops/WaveDropMobileMenuCopyLink";
import WaveDropMobileMenuOpen from "@/components/waves/drops/WaveDropMobileMenuOpen";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { useDropCurationMutation } from "@/hooks/drops/useDropCurationMutation";
import React, { useCallback } from "react";
import { createPortal } from "react-dom";

interface WaveLeaderboardGridItemMobileActionsMenuProps {
  readonly drop: ExtendedDrop;
  readonly isOpen: boolean;
  readonly setIsActive: (isActive: boolean) => void;
  readonly canOpenDrop: boolean;
  readonly isCuratable: boolean;
  readonly isCurated: boolean;
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
  isCuratable,
  isCurated,
  canShowVotingAction,
  onVoteClick,
}) => {
  const { toggleCuration, isPending: isCurating } = useDropCurationMutation();

  const handleMobileCurateClick = useCallback(() => {
    if (!isCuratable || drop.id.startsWith("temp-")) {
      return;
    }

    toggleCuration({
      dropId: drop.id,
      waveId: drop.wave.id,
      isCuratable,
      isCurated,
    });
    setIsActive(false);
  }, [
    drop.id,
    drop.wave.id,
    isCuratable,
    isCurated,
    setIsActive,
    toggleCuration,
  ]);

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

        {isCuratable && (
          <button
            type="button"
            onClick={handleMobileCurateClick}
            disabled={isCurating || drop.id.startsWith("temp-")}
            className={`tw-flex tw-select-none tw-items-center tw-gap-x-4 tw-rounded-xl tw-border-0 tw-bg-iron-950 tw-p-4 tw-text-left tw-transition-colors tw-duration-200 ${
              isCurating || drop.id.startsWith("temp-")
                ? "tw-cursor-default tw-opacity-60"
                : "active:tw-bg-iron-800"
            }`}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              className="tw-h-5 tw-w-5 tw-flex-shrink-0 tw-text-iron-300"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M8 12H16M8 16H13M8.6 21H15.4C16.5201 21 17.0802 21 17.508 20.782C17.8843 20.5903 18.1903 20.2843 18.382 19.908C18.6 19.4802 18.6 18.9201 18.6 17.8V8.2C18.6 7.07989 18.6 6.51984 18.382 6.09202C18.1903 5.71569 17.8843 5.40973 17.508 5.21799C17.0802 5 16.5201 5 15.4 5H8.6C7.47989 5 6.91984 5 6.49202 5.21799C6.11569 5.40973 5.80973 5.71569 5.61799 6.09202C5.4 6.51984 5.4 7.07989 5.4 8.2V17.8C5.4 18.9201 5.4 19.4802 5.61799 19.908C5.80973 20.2843 6.11569 20.5903 6.49202 20.782C6.91984 21 7.47989 21 8.6 21ZM15.75 3V7.5M13.5 5.25H18"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="tw-text-base tw-font-semibold tw-text-iron-300">
              {isCurated ? "Uncurate drop" : "Curate drop"}
            </span>
          </button>
        )}

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
