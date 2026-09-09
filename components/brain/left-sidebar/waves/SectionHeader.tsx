import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

interface SectionHeaderProps {
  readonly label: string;
  readonly icon?: IconDefinition | undefined;
  readonly labelTrailingContent?: React.ReactNode | undefined;
  readonly rightContent?: React.ReactNode | undefined;
  readonly paddingClassName?: string | undefined;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
  label,
  icon,
  labelTrailingContent,
  rightContent,
  paddingClassName = "tw-px-4",
}) => {
  return (
    <div
      className={`tw-flex tw-items-center tw-justify-between ${paddingClassName}`}
    >
      <div className="tw-flex tw-items-center tw-gap-x-2">
        {icon !== undefined && (
          <FontAwesomeIcon icon={icon} className="tw-size-3 tw-text-iron-400" />
        )}
        <span className="tw-text-xl tw-font-semibold tw-tracking-tight tw-text-iron-50">
          {label}
        </span>
        {labelTrailingContent}
      </div>
      {rightContent !== undefined && rightContent !== null && (
        <div className="tw-flex tw-items-center">{rightContent}</div>
      )}
    </div>
  );
};

export default SectionHeader;
