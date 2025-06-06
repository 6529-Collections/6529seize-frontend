import React from "react";
import { formatNumberWithCommas } from "../../../helpers/Helpers";
import Tippy from "@tippyjs/react";
import useIsMobileDevice from "../../../hooks/isMobileDevice";
import { FIELD_TO_LABEL_MAP } from "../../waves/memes/traits/schema";

interface DropTraitProps {
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

const DropTrait: React.FC<DropTraitProps> = ({ label, value }) => {
  const isMobile = useIsMobileDevice();
  const convertedValue = convertValue(value);

  const labelText =
    FIELD_TO_LABEL_MAP[label as keyof typeof FIELD_TO_LABEL_MAP] ?? label;

  return (
    <div className="tw-px-2 tw-py-1 tw-rounded-md tw-bg-iron-800 tw-flex tw-flex-col tw-gap-y-1.5">
      <span className="tw-text-iron-400 tw-text-xs tw-mr-1.5 tw-font-normal">
        {labelText}
      </span>
      <Tippy
        disabled={isMobile}
        content={convertedValue}
        placement="top"
        theme="dark">
        <span className="tw-text-iron-50 tw-text-sm tw-font-medium tw-truncate">
          {convertedValue}
        </span>
      </Tippy>
    </div>
  );
};

export default DropTrait;
