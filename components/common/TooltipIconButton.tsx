"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { TOOLTIP_STYLES } from "@/helpers/tooltip.helpers";
import { useId, useState } from "react";
import type { ComponentPropsWithoutRef, FocusEvent, MouseEvent } from "react";

interface TooltipIconButtonProps extends Omit<
  ComponentPropsWithoutRef<"button">,
  "children"
> {
  readonly icon: IconDefinition;
  readonly tooltipText: string;
  readonly iconClassName?: string | undefined;
  readonly buttonSizeClassName?: string | undefined;
  readonly buttonShapeClassName?: string | undefined;
  readonly tooltipWidth?: string | undefined;
  readonly tooltipPosition?: "top" | "bottom" | "left" | "right" | undefined;
}

export default function TooltipIconButton({
  icon,
  tooltipText,
  iconClassName = "tw-text-iron-400 tw-size-4",
  buttonSizeClassName = "tw-size-6",
  buttonShapeClassName = "tw-rounded-full",
  tooltipWidth = "tw-w-72",
  tooltipPosition = "top",
  type = "button",
  tabIndex = 0,
  className,
  onClick,
  onFocus,
  onBlur,
  onMouseEnter,
  onMouseLeave,
  "aria-label": ariaLabel,
  "aria-describedby": ariaDescribedByProp,
  ...rest
}: TooltipIconButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const tooltipId = useId();
  const tooltipElementId = `${tooltipId}-tooltip`;
  const ariaDescribedBy = [ariaDescribedByProp, tooltipElementId]
    .filter(Boolean)
    .join(" ");
  const buttonClassName = `tw-relative tw-inline-flex ${buttonSizeClassName} tw-shrink-0 tw-cursor-pointer tw-items-center tw-justify-center ${buttonShapeClassName} tw-border-none tw-bg-transparent tw-p-0 tw-leading-none focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-iron-950 ${className ?? ""}`;
  const showTooltip = isHovered || isFocused;

  const getPositionClasses = () => {
    switch (tooltipPosition) {
      case "top":
        return "tw-bottom-full tw-left-1/2 tw-mb-2 -tw-translate-x-1/2";
      case "bottom":
        return "tw-left-1/2 tw-top-full tw-mt-2 -tw-translate-x-1/2";
      case "left":
        return "tw-right-full tw-top-1/2 tw-mr-2 -tw-translate-y-1/2";
      case "right":
        return "tw-left-full tw-top-1/2 tw-ml-2 -tw-translate-y-1/2";
    }
  };

  const handleMouseEnter = (event: MouseEvent<HTMLButtonElement>) => {
    setIsHovered(true);
    onMouseEnter?.(event);
  };

  const handleMouseLeave = (event: MouseEvent<HTMLButtonElement>) => {
    setIsHovered(false);
    onMouseLeave?.(event);
  };

  const handleFocus = (event: FocusEvent<HTMLButtonElement>) => {
    setIsFocused(true);
    onFocus?.(event);
  };

  const handleBlur = (event: FocusEvent<HTMLButtonElement>) => {
    setIsFocused(false);
    onBlur?.(event);
  };

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onClick?.(event);
  };

  return (
    <button
      type={type}
      className={buttonClassName}
      tabIndex={tabIndex}
      aria-label={ariaLabel ?? tooltipText}
      aria-describedby={ariaDescribedBy}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onClick={handleClick}
      {...rest}
    >
      <FontAwesomeIcon icon={icon} className={iconClassName} />
      {showTooltip && (
        <div
          id={tooltipElementId}
          role="tooltip"
          style={TOOLTIP_STYLES}
          className={`tw-absolute ${getPositionClasses()} ${tooltipWidth} tw-max-w-[calc(100vw-2rem)] tw-whitespace-normal tw-text-left tw-leading-4`}
        >
          {tooltipText}
        </div>
      )}
    </button>
  );
}
