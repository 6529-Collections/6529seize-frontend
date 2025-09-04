import React from "react";

interface SectionHeaderProps {
  readonly label?: string;
  readonly icon?: any;
  readonly rightContent?: React.ReactNode;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ 
  label, 
  icon: IconComponent, 
  rightContent 
}) => {
  return (
    <div className="tw-flex tw-items-center tw-justify-between tw-px-5 tw-pt-2 tw-pb-3">
      <div className="tw-flex tw-items-center tw-gap-x-2">
        {IconComponent && <IconComponent className="tw-size-4" />}
        {label && (
          <h3 className="tw-text-sm tw-font-semibold tw-text-iron-50 tw-mb-0">
            {label}
          </h3>
        )}
      </div>
      {rightContent && (
        <div className="tw-flex tw-items-center">
          {rightContent}
        </div>
      )}
    </div>
  );
};

export default SectionHeader;