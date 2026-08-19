import type { ReactNode } from "react";

export default function GroupCreateSectionHeader({
  icon,
  title,
}: {
  readonly icon: ReactNode;
  readonly title: ReactNode;
}) {
  return (
    <div className="tw-inline-flex tw-items-center tw-gap-3">
      <span className="tw-inline-flex tw-size-9 tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950">
        {icon}
      </span>
      <p className="tw-m-0 tw-text-xl tw-font-semibold !tw-leading-none tw-text-iron-50 sm:tw-text-2xl">
        {title}
      </p>
    </div>
  );
}
