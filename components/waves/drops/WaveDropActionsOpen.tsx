"use client";

import React from "react";
import { ApiDropType } from "@/generated/models/ApiDropType";
import { Tooltip } from "react-tooltip";
import { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

interface WaveDropActionsOpenProps {
  readonly drop: ExtendedDrop;
}

const WaveDropActionsOpen: React.FC<WaveDropActionsOpenProps> = ({ drop }) => {
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

  return (
    <>
      <button
        className="tw-text-iron-400 desktop-hover:hover:tw-text-white tw-cursor-pointer tw-transition-colors tw-bg-transparent tw-border-0 tw-p-0"
        onClick={() => onDropClick(drop)}
        aria-label="Open drop"
        data-tooltip-id={`open-${drop.id}`}>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          className="tw-w-4 tw-h-4"
          xmlns="http://www.w3.org/2000/svg">
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
          zIndex: 99999,
          pointerEvents: "none",
        }}>
        <span className="tw-text-xs">Open</span>
      </Tooltip>
    </>
  );
};

export default WaveDropActionsOpen;
