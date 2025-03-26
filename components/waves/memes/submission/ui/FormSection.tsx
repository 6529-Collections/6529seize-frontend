import React from "react";

interface FormSectionProps {
  readonly title: string;
  readonly children: React.ReactNode;
  readonly titleClassName?: string;
  readonly contentClassName?: string;
}

/**
 * FormSection - A reusable component for creating form sections with titles
 *
 * This component allows customizing the styling of the section, title,
 * and content areas through className props.
 */
const FormSection: React.FC<FormSectionProps> = ({
  title,
  children,
  titleClassName = "tw-text-lg tw-font-semibold tw-text-iron-100 tw-mb-4",
  contentClassName = "",
}) => {
  return (
    <div>
      <div className={titleClassName}>{title}</div>
      <div className={contentClassName}>{children}</div>
    </div>
  );
};

export default FormSection;
