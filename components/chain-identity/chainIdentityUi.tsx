import type { ReactNode } from "react";

export const CHAIN_INPUT_CLASS =
  "tw-min-h-11 tw-w-full tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-black/20 tw-px-3 tw-py-2 tw-text-base tw-text-white placeholder:tw-text-iron-500 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 disabled:tw-cursor-not-allowed disabled:tw-text-iron-500";

export const CHAIN_LABEL_CLASS =
  "tw-mb-1.5 tw-block tw-text-sm tw-font-medium tw-text-iron-300";

export const CHAIN_HINT_CLASS = "tw-mb-0 tw-mt-1.5 tw-text-xs tw-text-iron-400";

export const shortHex = (value: string): string =>
  value.length > 14 ? `${value.slice(0, 8)}…${value.slice(-6)}` : value;

/** One titled part of the identity page. */
export function ChainSection({
  id,
  heading,
  body,
  children,
}: {
  readonly id: string;
  readonly heading: string;
  readonly body?: string | undefined;
  readonly children?: ReactNode;
}) {
  return (
    <section
      aria-labelledby={`${id}-heading`}
      className="tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.07] tw-bg-iron-950/60 tw-p-4 sm:tw-p-5"
    >
      <h2
        id={`${id}-heading`}
        className="tw-m-0 tw-text-lg tw-font-semibold tw-text-iron-100"
      >
        {heading}
      </h2>
      {body !== undefined && body !== "" && (
        <p className="tw-mb-0 tw-mt-1.5 tw-max-w-3xl tw-text-sm tw-leading-6 tw-text-iron-300">
          {body}
        </p>
      )}
      {children !== undefined && children !== null && (
        <div className="tw-mt-4">{children}</div>
      )}
    </section>
  );
}
