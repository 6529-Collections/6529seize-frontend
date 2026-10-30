import type { ReactNode } from "react";

/** Keeps the existing connection explanation and action together. */
export default function CollectConnectionPrompt({
  message,
  children,
}: {
  readonly message: ReactNode;
  readonly children: ReactNode;
}) {
  return (
    <div
      data-collect-connection-header
      className="tw-grid tw-items-center tw-gap-3 tw-border-0 tw-border-b tw-border-solid tw-border-iron-800 tw-pb-4"
    >
      <p role="status" className="tw-m-0 tw-text-sm tw-text-iron-400">
        <span className="[text-wrap:pretty]">{message}</span>
      </p>
      <div className="[&>button]:tw-w-full">{children}</div>
    </div>
  );
}
