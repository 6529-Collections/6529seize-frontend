import clsx from "clsx";
import type { ReactNode } from "react";

export default function GroupCriteriaRulePanel({
  mobilePresentation,
  children,
}: {
  readonly mobilePresentation: boolean;
  readonly children: ReactNode;
}) {
  return (
    <div
      data-group-criteria-rule-panel
      className={clsx(
        "tw-min-w-0 [&>div]:tw-border-0 [&>div]:tw-shadow-none",
        mobilePresentation
          ? "[&>div:not([data-group-criteria-sections])]:tw-rounded-xl [&>div:not([data-group-criteria-sections])]:tw-bg-iron-900 [&>div:not([data-group-criteria-sections])]:tw-p-4 [&_button.tw-bg-iron-900]:tw-bg-iron-800 [&_input.tw-form-input]:tw-h-11 [&_input.tw-form-input]:tw-py-0"
          : "[&>div]:tw-bg-transparent [&>div]:tw-p-0"
      )}
    >
      {children}
    </div>
  );
}
