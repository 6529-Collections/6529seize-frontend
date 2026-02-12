"use client";

import {
  useDropCurationMutation,
  type DropCurationTarget,
} from "@/hooks/drops/useDropCurationMutation";
import type { MouseEvent } from "react";
import { Tooltip } from "react-tooltip";

interface DropCurationButtonProps extends DropCurationTarget {
  readonly className?: string | undefined;
}

export default function DropCurationButton({
  dropId,
  waveId,
  isCuratable,
  isCurated,
  className,
}: DropCurationButtonProps) {
  const { toggleCuration, isPending } = useDropCurationMutation();
  const isTemporaryDrop = dropId.startsWith("temp-");
  const isDisabled = isPending || isTemporaryDrop;
  const tooltipId = `curate-drop-${dropId}`;

  if (!isCuratable) {
    return null;
  }

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    toggleCuration({
      dropId,
      waveId,
      isCuratable,
      isCurated,
    });
  };

  return (
    <>
      <button
        type="button"
        className={`tw-inline-flex tw-items-center tw-gap-x-1.5 tw-rounded-full tw-border tw-border-solid tw-px-2.5 tw-py-1 tw-text-xs tw-font-medium tw-leading-none tw-transition-colors tw-duration-200 ${
          isCurated
            ? "tw-border-[#3CCB7F]/40 tw-bg-[#3CCB7F]/10 tw-text-[#8DE8B2] desktop-hover:hover:tw-bg-[#3CCB7F]/20"
            : "tw-border-iron-700 tw-bg-transparent tw-text-iron-400 desktop-hover:hover:tw-border-iron-500 desktop-hover:hover:tw-text-iron-200"
        } ${isDisabled ? "tw-cursor-wait tw-opacity-70" : "tw-cursor-pointer"} ${
          className ?? ""
        }`}
        onClick={handleClick}
        disabled={isDisabled}
        aria-pressed={isCurated}
        aria-label={isCurated ? "Remove curation from drop" : "Curate drop"}
        {...(!isDisabled ? { "data-tooltip-id": tooltipId } : {})}
      >
        <span>{isCurated ? "Curated" : "Curate"}</span>
      </button>
      {!isDisabled && (
        <Tooltip
          id={tooltipId}
          place="top"
          positionStrategy="absolute"
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
          <span className="tw-text-xs">{isCurated ? "Curated" : "Curate"}</span>
        </Tooltip>
      )}
    </>
  );
}
