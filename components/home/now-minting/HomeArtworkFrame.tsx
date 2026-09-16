import type { ReactNode } from "react";

/** Both homepage drop states reserve the same area before media metadata arrives. */
export default function HomeArtworkFrame({
  children,
}: {
  readonly children: ReactNode;
}) {
  return (
    <div className="tw-relative tw-flex tw-h-[clamp(360px,65vw,640px)] tw-w-full tw-items-center tw-justify-center tw-p-3">
      <div className="tw-flex tw-h-full tw-w-full tw-min-w-0 tw-items-center tw-justify-center">
        {children}
      </div>
    </div>
  );
}
