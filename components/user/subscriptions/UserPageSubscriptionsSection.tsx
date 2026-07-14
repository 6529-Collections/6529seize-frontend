import type { ReactNode } from "react";

export default function UserPageSubscriptionsSection({
  id,
  title,
  action,
  children,
}: Readonly<{
  id: string;
  title: string;
  action?: ReactNode | undefined;
  children: ReactNode;
}>) {
  const titleId = `${id}-title`;

  return (
    <section
      aria-labelledby={titleId}
      className="tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950"
    >
      <div className="tw-flex tw-flex-col tw-gap-2 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-bg-iron-900/60 tw-px-4 tw-py-3 sm:tw-flex-row sm:tw-items-center sm:tw-justify-between sm:tw-gap-4 sm:tw-px-5">
        <h2
          id={titleId}
          className="tw-m-0 tw-text-base tw-font-semibold tw-leading-6 tw-text-iron-100"
        >
          {title}
        </h2>
        {action !== undefined && (
          <div className="tw-min-w-0 tw-text-sm tw-text-iron-400">{action}</div>
        )}
      </div>
      <div className="tw-p-4 sm:tw-p-5">{children}</div>
    </section>
  );
}
