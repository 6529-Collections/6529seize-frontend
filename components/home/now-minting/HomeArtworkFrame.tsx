import clsx from "clsx";
import type { ReactNode } from "react";

/** Artwork owns its height so neighboring loading states cannot resize it. */
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
        "tw-relative tw-w-full",
        reserveMobileHeight &&
          "tw-h-[clamp(360px,65vw,640px)] lg:tw-h-full lg:tw-min-h-[640px]"
      )}
    >
      <div
        className={clsx(
          "tw-flex tw-w-full tw-min-w-0 tw-items-center tw-justify-center",
          reserveMobileHeight && "tw-h-full lg:tw-absolute lg:tw-inset-0"
        )}
      >
        {children}
      </div>
    </div>
  );
}
