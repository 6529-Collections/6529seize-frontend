import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import type { ReactNode } from "react";

/**
 * The notice under the title of every page of a release section, such as
 * "6529 AI is untested" or "6529 Desktop is a test release".
 */
export default function ReleaseSectionNotice({
  id,
  title,
  children,
}: {
  /** The heading's id, which names the section. */
  readonly id: string;
  readonly title: string;
  readonly children: ReactNode;
}) {
  return (
    <section
      aria-labelledby={id}
      className="tw-mb-10 tw-flex tw-items-start tw-gap-3 tw-rounded-xl tw-border tw-border-solid tw-border-amber-400/40 tw-bg-amber-400/10 tw-p-5 sm:tw-p-6"
    >
      <ExclamationTriangleIcon
        aria-hidden="true"
        className="tw-mt-0.5 tw-size-6 tw-flex-none tw-text-amber-300"
      />
      <div className="tw-min-w-0">
        <h2
          id={id}
          className="tw-m-0 tw-text-lg tw-font-semibold tw-leading-7 tw-text-iron-50"
        >
          {title}
        </h2>
        <p className="tw-mb-0 tw-mt-1 tw-text-base tw-leading-7 tw-text-iron-200">
          {children}
        </p>
      </div>
    </section>
  );
}
