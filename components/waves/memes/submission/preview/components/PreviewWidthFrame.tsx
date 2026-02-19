import type { ReactNode } from "react";

interface PreviewWidthFrameProps {
  readonly maxWidthClass: string;
  readonly minWidthClass?: string;
  readonly contentClassName?: string;
  readonly disablePointerEvents?: boolean;
  readonly children: ReactNode;
}

export function PreviewWidthFrame({
  maxWidthClass,
  minWidthClass,
  contentClassName,
  disablePointerEvents = true,
  children,
}: PreviewWidthFrameProps) {
  const frameClassName = ["tw-w-full", maxWidthClass, minWidthClass]
    .filter(Boolean)
    .join(" ");
  const contentClasses = [
    disablePointerEvents ? "tw-pointer-events-none" : "",
    contentClassName,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="tw-flex tw-w-full tw-justify-center">
      <div className={frameClassName}>
        <div className={contentClasses}>{children}</div>
      </div>
    </div>
  );
}
