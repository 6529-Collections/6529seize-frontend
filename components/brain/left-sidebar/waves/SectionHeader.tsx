import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";

interface SectionHeaderProps {
  readonly label: string;
  readonly icon?: IconDefinition;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ label, icon }) => {
  return (
    <div className="tw-flex tw-items-center tw-gap-x-2 tw-px-5 tw-pt-2 tw-pb-1">
      {icon && (
        <FontAwesomeIcon
          icon={icon}
          className="tw-size-3 tw-text-iron-400"
        />
      )}
      <span className="tw-text-xs tw-font-semibold tw-uppercase tw-text-iron-400">
        {label}
      </span>
    </div>
  );
};

export default SectionHeader;