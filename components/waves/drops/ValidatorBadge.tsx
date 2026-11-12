"use client";

import { TOOLTIP_STYLES } from "@/helpers/tooltip.helpers";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import useIsMobileDevice from "@/hooks/isMobileDevice";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { useId, useState } from "react";
import { Tooltip } from "react-tooltip";
import AuthorBadgeButton from "@/components/common/profile/AuthorBadgeButton";
import type { AuthorBadgeSize } from "@/components/common/profile/AuthorBadgeButton";

/**
 * Three-node network mark SVG forming a check shape.
 * Communicates validator network participation and confirmation.
 * Uses currentColor for theming compatibility.
 */
const ValidatorMarkIcon = ({
  className,
}: {
  readonly className?: string | undefined;
}) => (
  <svg
    viewBox="0 0 12 12"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    {/* Connection lines between nodes */}
    <path
      d="M2.5 6.5 L5.5 9.5 L9.5 3.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    {/* Node 1: top-left of check */}
    <circle cx="2.5" cy="6.5" r="1.5" fill="currentColor" />
    {/* Node 2: bottom center (vertex of check) */}
    <circle cx="5.5" cy="9.5" r="1.5" fill="currentColor" />
    {/* Node 3: top-right of check */}
    <circle cx="9.5" cy="3.5" r="1.5" fill="currentColor" />
  </svg>
);

interface ValidatorBadgeData {
  readonly isValidator: boolean;
  readonly lastQualifyingCycle?: number | null | undefined;
  readonly qualifyingDays?: number | null | undefined;
  readonly observedThroughCycle?: number | null | undefined;
}

interface ValidatorBadgeProps {
  readonly validator: ValidatorBadgeData;
  readonly onBadgeClick: () => void;
  readonly tooltipId?: string | undefined;
  readonly size?: AuthorBadgeSize | undefined;
}

export const ValidatorBadge = ({
  validator,
  onBadgeClick,
  tooltipId = "validator-badge",
  size = "default",
}: ValidatorBadgeProps) => {
  const locale = useBrowserLocale();
  const id = useId();
  const isMobile = useIsMobileDevice();
  const { hasTouchScreen } = useDeviceInfo();
  const showTooltip = !isMobile && !hasTouchScreen;
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);

  const fullTooltipId = `${tooltipId}-${id}`;
  const label = t(locale, "validator.badge.ariaLabel");
  const tooltipText = t(locale, "validator.badge.tooltip");

  if (!validator.isValidator) {
    return null;
  }

  return (
    <span className="tw-inline-flex">
      <AuthorBadgeButton
        size={size}
        aria-label={label}
        aria-describedby={showTooltip && isTooltipOpen ? fullTooltipId : undefined}
        {...(showTooltip && { "data-tooltip-id": fullTooltipId })}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setIsTooltipOpen(false);
          onBadgeClick();
        }}
        onMouseEnter={() => setIsTooltipOpen(true)}
        onMouseLeave={() => setIsTooltipOpen(false)}
        className="tw-text-success"
      >
        <ValidatorMarkIcon />
      </AuthorBadgeButton>
      {showTooltip && (
        <Tooltip
          id={fullTooltipId}
          place="top"
          positionStrategy="fixed"
          offset={8}
          opacity={1}
          style={{
            ...TOOLTIP_STYLES,
            maxWidth: "min(16rem, calc(100vw - 2rem))",
          }}
          isOpen={isTooltipOpen}
        >
          <span className="tw-block tw-text-center tw-text-xs tw-leading-snug">
            {tooltipText}
          </span>
        </Tooltip>
      )}
    </span>
  );
};

export type { ValidatorBadgeData };
