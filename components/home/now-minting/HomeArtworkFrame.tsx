import clsx from "clsx";
import type { ReactNode } from "react";

/** Mobile artwork uses its natural height; desktop artwork fits the complete grid row. */
export default function HomeArtworkFrame({
  children,
  reserveMobileHeight = false,
}: {
  readonly children: ReactNode;
  readonly reserveMobileHeight?: boolean;
}) {
  return (
    <div
      className={clsx(
        "tw-relative tw-w-full lg:tw-h-full lg:tw-min-h-[640px]",
        reserveMobileHeight && "tw-h-[clamp(360px,65vw,640px)]"
      )}
    >
      <div
        className={clsx(
          "tw-flex tw-w-full tw-min-w-0 tw-items-center tw-justify-center lg:tw-absolute lg:tw-inset-0 lg:tw-h-full",
          reserveMobileHeight && "tw-h-full"
        )}
      >
        {children}
      </div>
    </div>
  );
}
