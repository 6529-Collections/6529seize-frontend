import React from "react";
import {
  COMPOSER_ACTION_BUTTON_CLASS_NAME,
  COMPOSER_ACTION_IDLE_CLASS_NAME,
  COMPOSER_ACTION_ICON_CLASS_NAME,
} from "./composerPresentation";
import { Tooltip } from "react-tooltip";
import { TOOLTIP_STYLES } from "@/helpers/tooltip.helpers";
import useIsMobileScreen from "@/hooks/isMobileScreen";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

interface StormButtonProps {
  readonly isStormMode: boolean;
  readonly isPollActive: boolean;
  readonly submitting: boolean;
  readonly breakIntoStorm: () => void;
}

const StormButton: React.FC<StormButtonProps> = ({
  isStormMode,
  isPollActive,
  submitting,
  breakIntoStorm,
}) => {
  const isMobile = useIsMobileScreen();
  const locale = useBrowserLocale();
  const label = t(
    locale,
    isStormMode
      ? "waves.stormComposer.addPart"
      : "waves.stormComposer.breakIntoStorm"
  );
  const disabled = isPollActive || submitting;

  return (
    <div>
      <button
        onClick={breakIntoStorm}
        disabled={disabled}
        type="button"
        aria-label={label}
        className={`${COMPOSER_ACTION_BUTTON_CLASS_NAME} ${
          isMobile ? "tw-w-auto tw-gap-1.5 tw-px-2.5" : "tw-px-0"
        } ${
          disabled
            ? "tw-cursor-default tw-text-iron-600"
            : `tw-cursor-pointer ${COMPOSER_ACTION_IDLE_CLASS_NAME}`
        }`}
        data-tooltip-id="storm-button-tooltip"
      >
        <svg
          className={`tw-flex-shrink-0 ${
            isMobile
              ? "tw-h-[1.1rem] tw-w-[1.1rem]"
              : COMPOSER_ACTION_ICON_CLASS_NAME
          } ${disabled ? "tw-opacity-50" : ""}`}
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M21 4H3M20 8L6 8M18 12L9 12M15 16L8 16M17 20H12"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {isMobile && (
          <span className="tw-text-[11px] tw-font-medium">{label}</span>
        )}
      </button>
      {!isMobile && (
        <Tooltip
          id="storm-button-tooltip"
          place="top"
          offset={8}
          opacity={1}
          positionStrategy="fixed"
          style={TOOLTIP_STYLES}
        >
          <span className="tw-text-xs">{label}</span>
        </Tooltip>
      )}
    </div>
  );
};

export default StormButton;
