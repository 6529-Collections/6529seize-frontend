import type { ReactNode } from "react";

export default function NFTMediaContainer({
  children,
  className,
  forceIronBackground = true,
  textCenter = false,
}: {
  readonly children: ReactNode;
  readonly className?: string | undefined;
  readonly forceIronBackground?: boolean | undefined;
  readonly textCenter?: boolean | undefined;
}) {
  return (
    <div
      className={`tw-flex tw-w-full tw-items-center tw-justify-center ${
        forceIronBackground ? "!tw-bg-iron-900" : ""
      } tw-p-0 ${
        textCenter ? "tw-text-center" : ""
      } ${className ?? ""}`.trim()}
    >
      {children}
    </div>
  );
}
