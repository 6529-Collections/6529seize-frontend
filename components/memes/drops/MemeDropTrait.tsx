import { formatNumberWithCommas } from "@/helpers/Helpers";
import useIsMobileDevice from "@/hooks/isMobileDevice";
import React from "react";
import { Tooltip } from "react-tooltip";

interface MemeDropTraitProps {
  readonly label: string;
  readonly value: string;
  readonly dropId?: string | undefined;
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

const MemeDropTrait: React.FC<MemeDropTraitProps> = ({
  label,
  value,
  dropId,
}) => {
  const isMobile = useIsMobileDevice();
  const convertedValue = convertValue(value);
  const tooltipId = dropId
    ? `meme-drop-trait-${dropId}-${label}`
    : `meme-drop-trait-${label}`;

  return (
    <div className="tw-flex tw-flex-col tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-900 tw-px-3 tw-py-1.5">
      <span className="tw-mb-1 tw-block tw-text-[9px] tw-font-normal tw-uppercase tw-tracking-wide tw-text-iron-500">
        {label}
      </span>
      <>
        <span
          className="tw-truncate tw-text-xs tw-font-medium tw-text-iron-200"
          data-tooltip-id={tooltipId}
        >
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
            }}
          >
            <span className="tw-text-xs">{convertedValue}</span>
          </Tooltip>
        )}
      </>
    </div>
  );
};

export default MemeDropTrait;
