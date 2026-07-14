import type { ReactNode } from "react";

export default function UserPageSubscriptionsSection({
  id,
  title,
  action,
  className,
  children,
}: Readonly<{
  id: string;
  title: string;
  action?: ReactNode | undefined;
  className?: string | undefined;
  children: ReactNode;
}>) {
  const titleId = `${id}-title`;

  return (
    <section
      aria-labelledby={titleId}
      className={`tw-min-w-0 ${className ?? ""}`}
    >
      <div className="tw-mb-5 tw-flex tw-flex-col tw-gap-2 sm:tw-flex-row sm:tw-items-center sm:tw-justify-between sm:tw-gap-4">
        <h2
          id={titleId}
          className="tw-m-0 tw-text-xl tw-font-medium tw-leading-7 tw-tracking-tight tw-text-iron-100"
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
