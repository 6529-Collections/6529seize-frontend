import type { ReactNode } from "react";

export const SC_PANEL =
  "tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-900/50";
export const SC_TEXT = "tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-300";
export const SC_FOCUS =
  "focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-4 focus-visible:tw-outline-primary-400";
export const SC_LINK = `tw-text-primary-300 tw-underline-offset-4 hover:tw-underline ${SC_FOCUS}`;
export const SC_HEADING_3 =
  "tw-m-0 tw-text-base tw-font-semibold tw-leading-6 tw-text-iron-100";

// The dot shows each safe collecting role's temperature: a vault is
// ice-cold, a transaction wallet warm and a social wallet hot.
export const ROLE_DOT = {
  vault: "tw-bg-sky-400",
  transaction: "tw-bg-amber-400",
  social: "tw-bg-rose-400",
  old: "tw-bg-iron-500",
} as const;

export type SafeCollectingRole = keyof typeof ROLE_DOT;

export const SAFE_COLLECTING_ROLES: readonly SafeCollectingRole[] = [
  "vault",
  "transaction",
  "social",
  "old",
];

/** A titled section with the heading beside the content on wide screens. */
export default function SafeCollectingSection({
  id,
  title,
  description,
  children,
}: {
  readonly id: string;
  readonly title: string;
  readonly description?: string | undefined;
  readonly children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      className="tw-grid tw-scroll-mt-24 tw-grid-cols-1 tw-items-start tw-gap-5 tw-border-0 tw-border-t tw-border-solid tw-border-iron-800 tw-py-8 sm:tw-py-10 lg:tw-grid-cols-[minmax(0,1fr)_minmax(0,2.5fr)] lg:tw-gap-10"
    >
      <div className="lg:tw-sticky lg:tw-top-28">
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
