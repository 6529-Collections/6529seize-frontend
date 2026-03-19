import React from "react";

interface FormSectionProps {
  readonly title: string;
  readonly children: React.ReactNode;
  readonly titleClassName?: string | undefined;
  readonly contentClassName?: string | undefined;
  readonly headerRight?: React.ReactNode;
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
  titleClassName = "tw-text-base tw-font-semibold tw-tracking-tight tw-text-iron-100",
  contentClassName = "",
  headerRight,
}) => {
  return (
    <div>
      <div className="tw-mb-4 tw-flex tw-items-center tw-justify-between">
        <div className={titleClassName}>{title}</div>
        {headerRight !== undefined && <div>{headerRight}</div>}
      </div>
      <div className={contentClassName}>{children}</div>
    </div>
  );
};

export default FormSection;
