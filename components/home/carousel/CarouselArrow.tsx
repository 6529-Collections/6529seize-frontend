"use client";

import type { CSSProperties } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft } from "@fortawesome/free-solid-svg-icons";

interface CarouselArrowProps {
  readonly direction: "left" | "right";
  readonly onClick: () => void;
  readonly disabled?: boolean;
  readonly className?: string;
  readonly style?: CSSProperties;
}

export default function CarouselArrow({
  direction,
  onClick,
  disabled = false,
  className = "",
  style,
}: CarouselArrowProps) {
  const isLeft = direction === "left";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={isLeft ? "Previous" : "Next"}
      className={`tw-absolute tw-top-1/2 tw-z-20 -tw-translate-x-1/2 -tw-translate-y-1/2 tw-flex tw-p-3 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-border-white/10 tw-bg-black/50 tw-text-white tw-backdrop-blur-md tw-transition-all hover:tw-border-white/30 hover:tw-bg-black/80 disabled:tw-pointer-events-none disabled:tw-opacity-0 ${className}`}
      style={style}
    >
      <FontAwesomeIcon
        icon={faChevronLeft}
        className={`tw-size-4 shrink-0 ${isLeft ? "" : "tw-rotate-180"}`}
      />
    </button>
  );
}
