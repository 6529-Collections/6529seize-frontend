"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft } from "@fortawesome/free-solid-svg-icons";

interface CarouselArrowProps {
  readonly direction: "left" | "right";
  readonly onClick: () => void;
  readonly disabled?: boolean;
}

export default function CarouselArrow({
  direction,
  onClick,
  disabled = false,
}: CarouselArrowProps) {
  const isLeft = direction === "left";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={isLeft ? "Previous" : "Next"}
      className={`tw-absolute tw-top-1/2 tw-z-10 tw-flex tw-size-10 tw--translate-y-1/2 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-800 tw-text-iron-300 tw-transition-all tw-duration-200 hover:tw-bg-iron-700 hover:tw-text-white disabled:tw-pointer-events-none disabled:tw-opacity-0 ${
        isLeft ? "tw-left-0" : "tw-right-0"
      }`}
    >
      <FontAwesomeIcon
        icon={faChevronLeft}
        className={`tw-size-5 ${isLeft ? "" : "tw-rotate-180"}`}
      />
    </button>
  );
}
