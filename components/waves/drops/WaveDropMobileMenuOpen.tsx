"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React from "react";

import { ApiDropType } from "@/generated/models/ApiDropType";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { startDropOpen } from "@/utils/monitoring/dropOpenTiming";

interface WaveDropMobileMenuOpenProps {
  readonly drop: ExtendedDrop;
  readonly onOpenChange: () => void;
}

const WaveDropMobileMenuOpen: React.FC<WaveDropMobileMenuOpenProps> = ({
  drop,
  onOpenChange,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams()!;
  const canBeOpened = drop.drop_type !== ApiDropType.Chat;

  if (!canBeOpened) {
    return null;
  }

  const onDropClick = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("drop", drop.id);
    startDropOpen({
      dropId: drop.id,
      waveId: drop.wave.id,
      source: "leaderboard_mobile_menu",
      isMobile: true,
    });
    router.push(`${pathname}?${params.toString()}`);
    onOpenChange();
  };

  return (
    <button
      onClick={onDropClick}
      className="tw-flex tw-select-none tw-items-center tw-gap-x-4 tw-rounded-xl tw-border-0 tw-bg-iron-950 tw-p-4 tw-transition-colors tw-duration-200 active:tw-bg-iron-800"
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        className="tw-h-5 tw-w-5 tw-flex-shrink-0 tw-text-iron-300"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M21 9L21 3M21 3H15M21 3L13 11M10 5H7.8C6.11984 5 5.27976 5 4.63803 5.32698C4.07354 5.6146 3.6146 6.07354 3.32698 6.63803C3 7.27976 3 8.11984 3 9.8V16.2C3 17.8802 3 18.7202 3.32698 19.362C3.6146 19.9265 4.07354 20.3854 4.63803 20.673C5.27976 21 6.11984 21 7.8 21H14.2C15.8802 21 16.7202 21 17.362 20.673C17.9265 20.3854 18.3854 19.9265 18.673 19.362C19 18.7202 19 17.8802 19 16.2V14"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="tw-text-base tw-font-semibold tw-text-iron-300">
        Open drop
      </span>
    </button>
  );
};

export default WaveDropMobileMenuOpen;
