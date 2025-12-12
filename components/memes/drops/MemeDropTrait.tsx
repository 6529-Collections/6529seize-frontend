import React from "react";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import { FIELD_TO_LABEL_MAP } from "@/components/waves/memes/traits/schema";
import { Tooltip } from "react-tooltip";
import useIsMobileDevice from "@/hooks/isMobileDevice";

interface MemeDropTraitProps {
  readonly label: string;
  readonly value: string;
  readonly dropId?: string;
}

const convertValue = (value: string) => {
  if (value === "true") {
    return "Yes";
  }
  if (value === "false") {
    return "No";
  }

  if (!isNaN(Number(value))) {
    return formatNumberWithCommas(Number(value));
  }

  return value;
};

const MemeDropTrait: React.FC<MemeDropTraitProps> = ({ label, value, dropId }) => {
  const isMobile = useIsMobileDevice();
  const convertedValue = convertValue(value);
  const tooltipId = dropId ? `meme-drop-trait-${dropId}-${label}` : `meme-drop-trait-${label}`;

  if (label === FIELD_TO_LABEL_MAP.pointsLoki) {
    console.log(value, typeof value);
  }

  return (
    <div className="tw-bg-iron-900 tw-border tw-border-solid tw-border-white/10 tw-rounded-md tw-px-3 tw-py-1.5 tw-flex tw-flex-col">
      <span className="tw-block tw-text-[9px] tw-uppercase tw-tracking-wider tw-text-iron-600 tw-font-bold tw-mb-0.5">
        {label}
      </span>
      <>
        <span
          className="tw-text-xs tw-text-iron-400 tw-truncate"
          data-tooltip-id={tooltipId}>
          {convertedValue}
        </span>
        {!isMobile && (
          <Tooltip
            id={tooltipId}
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
            <span className="tw-text-xs">{convertedValue}</span>
          </Tooltip>
        )}
      </>
    </div>
  );
};

export default MemeDropTrait;
