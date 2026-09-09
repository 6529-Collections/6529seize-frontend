import type { ReactNode } from "react";

export const TDH_PANEL =
  "tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-900/50";
export const TDH_TEXT = "tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-300";
export const TDH_FOCUS =
  "focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-4 focus-visible:tw-outline-primary-400";

export default function TDHSection({
  id,
  title,
  description,
  children,
}: {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      className="tw-grid tw-scroll-mt-24 tw-grid-cols-1 tw-items-start tw-gap-5 tw-border-0 tw-border-t tw-border-solid tw-border-iron-800 tw-py-8 sm:tw-py-10 lg:tw-grid-cols-[minmax(0,1fr)_minmax(0,2.5fr)] lg:tw-gap-10"
    >
      <div>
        <h2
          id={`${id}-heading`}
          tabIndex={-1}
          className="tw-m-0 tw-text-xl tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-iron-50 focus:tw-outline-none"
        >
          {title}
        </h2>
        {description && (
          <p className="tw-mb-0 tw-mt-3 tw-text-sm tw-leading-6 tw-text-iron-400">
            {description}
          </p>
        )}
      </div>
      <div className="tw-min-w-0">{children}</div>
    </section>
  );
}
