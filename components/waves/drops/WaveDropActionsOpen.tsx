"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React from "react";
import { Tooltip } from "react-tooltip";

import { ApiDropType } from "@/generated/models/ApiDropType";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";

interface WaveDropActionsOpenProps {
  readonly drop: ExtendedDrop;
  readonly isDropdownItem?: boolean | undefined;
  readonly onOpen?: (() => void) | undefined;
}

const WaveDropActionsOpen: React.FC<WaveDropActionsOpenProps> = ({
  drop,
  isDropdownItem = false,
  onOpen,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams()!;
  const canBeOpened = drop.drop_type !== ApiDropType.Chat;

  const onDropClick = (drop: ExtendedDrop) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("drop", drop.id);
    router.push(`${pathname}?${params.toString()}`);
  };

  if (!canBeOpened) {
    return null;
  }

  if (isDropdownItem) {
    return (
      <button
        type="button"
        onClick={() => {
          onDropClick(drop);
          onOpen?.();
        }}
        className="tw-flex tw-w-full tw-cursor-pointer tw-items-center tw-gap-x-3 tw-rounded-lg tw-border-0 tw-bg-transparent tw-px-3 tw-py-2 tw-text-iron-300 tw-transition-colors tw-duration-200 desktop-hover:hover:tw-bg-iron-800"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          className="tw-h-4 tw-w-4 tw-flex-shrink-0"
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
        <span className="tw-text-sm tw-font-medium">Open</span>
      </button>
    );
  }

  return (
    <>
      <button
        type="button"
        className="tw-cursor-pointer tw-border-0 tw-bg-transparent tw-px-2 tw-text-iron-400 tw-transition-colors desktop-hover:hover:tw-text-white"
        onClick={() => onDropClick(drop)}
        aria-label="Open drop"
        data-tooltip-id={`open-${drop.id}`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          className="tw-h-5 tw-w-5"
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
      </button>
      <Tooltip
        id={`open-${drop.id}`}
        place="top"
        offset={8}
        opacity={1}
        style={{
          padding: "4px 8px",
          background: "#37373E",
          color: "white",
          fontSize: "13px",
          fontWeight: 500,
          borderRadius: "6px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          zIndex: 20,
          pointerEvents: "none",
        }}
      >
        <span className="tw-text-xs">Open</span>
      </Tooltip>
    </>
  );
};

export default WaveDropActionsOpen;
