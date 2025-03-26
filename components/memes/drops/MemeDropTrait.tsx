import React from "react";
import { formatNumberWithCommas } from "../../../helpers/Helpers";
import { FIELD_TO_LABEL_MAP } from "../../waves/memes/traits/schema";

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
  if (label === FIELD_TO_LABEL_MAP.pointsLoki) {
    console.log(value, typeof value);
  }
  return (
    <div className="tw-px-2 tw-py-1 tw-rounded-md tw-bg-iron-800/50 tw-flex tw-items-center tw-justify-between">
      <span className="tw-text-iron-400 tw-text-xs tw-mr-1.5 tw-whitespace-nowrap">{label}:</span>
      <span className="tw-text-iron-200 tw-text-xs tw-font-medium tw-truncate">
        {convertValue(value)}
      </span>
    </div>
  );
};

export default MemeDropTrait;
