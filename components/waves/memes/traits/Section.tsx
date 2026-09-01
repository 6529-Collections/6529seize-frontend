import React from "react";

interface SectionProps {
  readonly title: string;
  readonly children: React.ReactNode;
  readonly className?: string | undefined;
}

/**
 * Base Section component
 * Renders a section of form fields with a title
 */
const SectionComponent: React.FC<SectionProps> = ({ title, children }) => {
  return (
    <div className="tw-space-y-6">
      <div className="tw-flex tw-items-center tw-gap-5">
        <h3 className="tw-mb-0 tw-mt-0 tw-whitespace-nowrap tw-text-[11px] tw-font-semibold tw-uppercase tw-tracking-wider tw-text-iron-500">
          {title}
        </h3>
        <div className="tw-h-px tw-flex-1 tw-bg-iron-800/80"></div>
      </div>
      {children}
    </div>
  );
};

export const Section = SectionComponent;
Section.displayName = "Section";
