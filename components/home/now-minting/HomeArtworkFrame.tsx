import artworkStyles from "@/components/drops/view/item/content/media/ArtworkFrame.module.css";
import clsx from "clsx";
import type { ReactNode } from "react";

/** Videos size themselves; desktop still images can fit the details column. */
export default function HomeArtworkFrame({
  children,
  reserveMobileHeight = false,
  fitImageToDetails = false,
  reserveImageFrame = false,
}: {
  readonly children: ReactNode;
  readonly reserveMobileHeight?: boolean;
  readonly fitImageToDetails?: boolean;
  readonly reserveImageFrame?: boolean;
}) {
  return (
    <div
      className={clsx(
        "tw-relative tw-w-full",
        fitImageToDetails && artworkStyles["homeImageFrame"],
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
        {reserveImageFrame ? (
          <div data-artwork-image-container className="tw-w-full">
            <div
              data-artwork-image-frame
              className={artworkStyles["submissionImage"]}
            >
              {children}
            </div>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
