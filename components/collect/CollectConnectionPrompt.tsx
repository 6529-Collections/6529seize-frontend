import type { ReactNode } from "react";
import { InformationCircleIcon } from "@heroicons/react/20/solid";

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
      className="tw-flex tw-flex-wrap tw-items-center tw-gap-3"
    >
      <p
        role="status"
        className="tw-m-0 tw-flex tw-min-w-0 tw-flex-[1_1_240px] tw-items-start tw-gap-2 tw-text-[13px] tw-leading-[18px] tw-text-iron-400"
      >
        <InformationCircleIcon
          aria-hidden="true"
          className="tw-mt-0.5 tw-size-3.5 tw-shrink-0 tw-text-iron-500"
        />
        <span>{message}</span>
      </p>
      <div className="tw-flex-auto md:max-lg:tw-flex-none [&>button]:tw-w-full">
        {children}
      </div>
    </div>
  );
}
