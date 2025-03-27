import React, { memo } from "react";
import { SectionProps } from "./types";

/**
 * Base Section component
 * Renders a section of form fields with a title
 */
const SectionComponent: React.FC<SectionProps> = ({ title, children }) => {
  return (
    <div>
      <div className="tw-text-base tw-font-medium tw-text-iron-300 tw-mb-2 sm:tw-mb-4">
        {title}
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
