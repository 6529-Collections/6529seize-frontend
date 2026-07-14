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
    <section aria-labelledby={titleId} className="tw-min-w-0">
      <div className="tw-mb-4 tw-flex tw-flex-col tw-gap-2 tw-px-0.5 sm:tw-flex-row sm:tw-items-center sm:tw-justify-between sm:tw-gap-4">
        <h2
          id={titleId}
          className="tw-m-0 tw-text-lg tw-font-semibold tw-leading-7 tw-tracking-tight tw-text-iron-100"
        >
          {title}
        </h2>
        {action !== undefined && (
          <div className="tw-min-w-0 tw-text-xs tw-font-medium tw-leading-5 tw-text-iron-400 sm:tw-text-right">
            {action}
          </div>
        )}
      </div>
      {children}
    </section>
  );
}
