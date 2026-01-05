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
    <div className="tw-space-y-5">
      <div className="tw-flex tw-items-center tw-gap-3">
        <div className="-tw-mt-2 tw-h-0.5 tw-w-8 tw-bg-gradient-to-r tw-from-iron-700 tw-to-transparent tw-rounded-full"></div>
        <h3 className="tw-text-sm tw-font-medium tw-text-iron-400 tw-uppercase tw-tracking-wider">
          {title}
        </h3>
        <div className="-tw-mt-2 tw-flex-1 tw-h-0.5 tw-bg-gradient-to-r tw-from-iron-800 tw-to-transparent tw-rounded-full"></div>
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
