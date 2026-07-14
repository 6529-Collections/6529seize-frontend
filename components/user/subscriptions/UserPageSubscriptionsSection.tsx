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
      className="tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950 tw-py-4 tw-shadow-[0_16px_40px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.035)] sm:tw-py-5"
    >
      <div className="tw-flex tw-flex-col tw-gap-2 tw-px-4 sm:tw-flex-row sm:tw-items-center sm:tw-justify-between sm:tw-gap-4 sm:tw-px-5">
        <h2
          id={titleId}
          className="tw-m-0 tw-text-base tw-font-semibold tw-leading-6 tw-text-iron-50"
        >
          {title}
        </h2>
        {action !== undefined && (
          <div className="tw-min-w-0 tw-text-xs tw-font-medium tw-text-iron-400">
            {action}
          </div>
        )}
      </div>
      <div className="tw-mt-4 tw-px-4 sm:tw-mt-5 sm:tw-px-5">{children}</div>
    </section>
  );
}
