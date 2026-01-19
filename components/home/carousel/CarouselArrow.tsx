"use client";

import type { CSSProperties } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft } from "@fortawesome/free-solid-svg-icons";

interface CarouselArrowProps {
  readonly direction: "left" | "right";
  readonly onClick: () => void;
  readonly disabled?: boolean;
  readonly placement?: "floating" | "inline";
  readonly className?: string;
  readonly style?: CSSProperties;
}

export default function CarouselArrow({
  direction,
  onClick,
  disabled = false,
  placement = "floating",
  className = "",
  style,
}: CarouselArrowProps) {
  const isLeft = direction === "left";
  const placementClasses =
    placement === "inline"
      ? "tw-static tw-translate-x-0 tw-translate-y-0"
      : "tw-absolute tw-top-1/2 -tw-translate-x-1/2 -tw-translate-y-1/2";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={isLeft ? "Previous" : "Next"}
      className={`${placementClasses} tw-z-20 tw-flex tw-h-11 tw-w-11 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-border-white/10 tw-bg-white/20 tw-text-white tw-backdrop-blur-md tw-transition-all tw-duration-300 hover:tw-border-white/20 hover:tw-bg-white/[0.15] disabled:tw-cursor-not-allowed disabled:tw-opacity-45 disabled:tw-text-white/60 disabled:tw-border-white/10 disabled:tw-bg-white/15 disabled:hover:tw-border-white/15 disabled:hover:tw-bg-white/15 ${className}`}
      style={style}
    >
      <FontAwesomeIcon
        icon={faChevronLeft}
        className={`tw-size-4 tw-shrink-0 ${isLeft ? "" : "tw-rotate-180"}`}
      />
    </button>
  );
}
