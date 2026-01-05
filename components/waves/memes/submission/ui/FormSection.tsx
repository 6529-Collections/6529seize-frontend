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
  titleClassName = "tw-text-lg tw-font-semibold tw-text-iron-100",
  contentClassName = "",
  headerRight,
}) => {
  return (
    <div>
      <div className="tw-flex tw-justify-between tw-items-center tw-mb-4">
        <div className={titleClassName}>{title}</div>
        {headerRight && <div>{headerRight}</div>}
      </div>
      <div className={contentClassName}>{children}</div>
    </div>
  );
};

export default FormSection;
