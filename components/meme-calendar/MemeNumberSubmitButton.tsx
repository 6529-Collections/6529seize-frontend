"use client";

import Button from "@/components/utils/button/Button";
import { buildTooltipId, TOOLTIP_STYLES } from "@/helpers/tooltip.helpers";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import { useId } from "react";
import { Tooltip } from "react-tooltip";

interface MemeNumberSubmitButtonProps {
  readonly inputId: string;
  readonly label: string;
}

export default function MemeNumberSubmitButton({
  inputId,
  label,
}: MemeNumberSubmitButtonProps) {
  const tooltipId = buildTooltipId(useId(), "meme-number-submit");

  return (
    <>
      <Button
        type="submit"
        variant="secondary"
        size={null}
        aria-controls={inputId}
        aria-label={label}
        data-tooltip-id={tooltipId}
        data-tooltip-content={label}
        className="!tw-h-full !tw-w-9 !tw-rounded-none !tw-border-0 !tw-bg-iron-800 !tw-p-0 !tw-shadow-none focus-visible:!tw-outline-none active:!tw-bg-iron-900 desktop-hover:hover:!tw-bg-iron-700"
      >
        <ArrowRightIcon aria-hidden="true" className="tw-size-4" />
      </Button>
      <Tooltip
        id={tooltipId}
        place="top"
        positionStrategy="fixed"
        offset={8}
        delayShow={250}
        opacity={1}
        style={TOOLTIP_STYLES}
      />
    </>
  );
}
