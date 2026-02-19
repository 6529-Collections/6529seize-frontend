import type { ReactNode } from "react";

interface PreviewCaseSectionProps {
  readonly title: string;
  readonly description?: string;
  readonly children: ReactNode;
}

export function PreviewCaseSection({
  title,
  description,
  children,
}: PreviewCaseSectionProps) {
  return (
    <section className="tw-space-y-3">
      <h5 className="tw-mb-0 tw-text-sm tw-font-semibold tw-text-iron-200">
        {title}
      </h5>
      {description && (
        <p className="tw-mb-0 tw-text-xs tw-text-iron-400">{description}</p>
      )}
      {children}
    </section>
  );
}
