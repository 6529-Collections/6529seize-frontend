import type { ReactNode } from "react";

export default function NFTMediaContainer({
  children,
  className,
  textCenter = false,
}: {
  readonly children: ReactNode;
  readonly className?: string | undefined;
  readonly textCenter?: boolean | undefined;
}) {
  return (
    <div
      className={`tw-flex tw-w-full tw-items-center tw-justify-center tw-bg-iron-900 tw-p-0 ${
        textCenter ? "tw-text-center" : ""
      } ${className ?? ""}`.trim()}
    >
      {children}
    </div>
  );
}
