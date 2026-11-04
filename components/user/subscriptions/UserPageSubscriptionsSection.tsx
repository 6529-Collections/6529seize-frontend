import type { ReactNode } from "react";

export default function UserPageSubscriptionsSection({
  id,
  title,
  titleAside,
  action,
  description,
  className,
  headerClassName,
  children,
}: Readonly<{
  id: string;
  title: string;
  titleAside?: ReactNode;
  action?: ReactNode | undefined;
  description?: ReactNode;
  className?: string | undefined;
  headerClassName?: string | undefined;
  children: ReactNode;
}>) {
  const titleId = `${id}-title`;

  return (
    <section
      id={id}
      aria-labelledby={titleId}
      className={`tw-min-w-0 tw-scroll-mt-24 ${className ?? ""}`}
    >
      <div
        className={`tw-mb-3.5 tw-flex tw-items-center tw-justify-between tw-gap-3 md:tw-gap-4 ${headerClassName ?? ""}`}
      >
        <div className="tw-flex tw-min-w-0 tw-flex-wrap tw-items-center tw-gap-x-4 tw-gap-y-1">
          <h2
            id={titleId}
            tabIndex={-1}
            className="tw-m-0 tw-min-w-0 tw-break-words tw-text-lg tw-font-semibold tw-leading-7 tw-tracking-tight tw-text-iron-100 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-4 focus-visible:tw-outline-primary-400"
          >
            {title}
          </h2>
          {titleAside}
        </div>
        {action !== undefined && (
          <div className="tw-max-w-full tw-flex-none tw-text-right tw-font-medium tw-leading-5 tw-text-iron-400">
            {action}
          </div>
        )}
      </div>
      {description !== undefined && (
        <div className="-tw-mt-1 tw-mb-4 tw-text-sm tw-leading-6 tw-text-iron-400">
          {description}
        </div>
      )}
      {children}
    </section>
  );
}
