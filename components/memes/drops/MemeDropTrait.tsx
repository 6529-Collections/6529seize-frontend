import React from "react";
import { formatNumberWithCommas } from "../../../helpers/Helpers";
import { FIELD_TO_LABEL_MAP } from "../../waves/memes/traits/schema";
import Tippy from "@tippyjs/react";
import useIsMobileDevice from "../../../hooks/isMobileDevice";

interface MemeDropTraitProps {
  readonly label: string;
  readonly value: string;
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

const MemeDropTrait: React.FC<MemeDropTraitProps> = ({ label, value }) => {
  const isMobile = useIsMobileDevice();
  const convertedValue = convertValue(value);

  if (label === FIELD_TO_LABEL_MAP.pointsLoki) {
    console.log(value, typeof value);
  }
  return (
    <div className="tw-px-2 tw-py-1 tw-rounded-md tw-bg-iron-800 tw-flex tw-flex-col tw-gap-y-1.5">
      <span className="tw-text-iron-400 tw-text-xs tw-mr-1.5 tw-uppercase tw-font-normal">{label}:</span>
      <Tippy
        disabled={isMobile}
        content={convertedValue}
        placement="top"
        theme="dark"
      >
        <span className="tw-text-iron-50 tw-text-xs tw-font-medium tw-truncate">
          {convertedValue}
        </span>
      </Tippy>
    </div>
  );
};

export default MemeDropTrait;
