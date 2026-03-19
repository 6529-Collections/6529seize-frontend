import React, { memo } from "react";

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
        <h3 className="tw-whitespace-nowrap tw-text-[10px] tw-font-bold tw-uppercase tw-tracking-wider tw-text-iron-500 tw-mb-0">
          {title}
        </h3>
        <div className="tw-h-px tw-flex-1 tw-bg-iron-800/80"></div>
      </div>
      {children}
    </div>
  );
};

/**
 * Custom equality function for optimizing re-renders
 * Only re-renders when title or className changes
 */
const areSectionPropsEqual = (
  prevProps: SectionProps,
  nextProps: SectionProps
): boolean => {
  return (
    prevProps.title === nextProps.title &&
    (prevProps.className ?? "") === (nextProps.className ?? "")
    // React handles children comparison internally
  );
};

/**
 * Memoized Section component to prevent unnecessary re-renders
 */
export const Section = memo(SectionComponent, areSectionPropsEqual);
Section.displayName = "Section";
