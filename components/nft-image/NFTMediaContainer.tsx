import type { ReactNode } from "react";

export default function NFTMediaContainer({
  children,
  className,
  textCenter = false,
  artworkImageFrame = false,
}: {
  readonly children: ReactNode;
  readonly className?: string | undefined;
  readonly textCenter?: boolean | undefined;
  readonly artworkImageFrame?: boolean | undefined;
}) {
  return (
    <div
      data-artwork-image-frame={artworkImageFrame || undefined}
      className={`tw-flex tw-w-full tw-items-center tw-justify-center tw-bg-iron-900 tw-p-0 ${
        textCenter ? "tw-text-center" : ""
      } ${className ?? ""}`.trim()}
    >
      {children}
    </div>
  );
}
