import type React from "react";
import type { CurationWavePreviewCardVariant } from "./types";

export const CurationPreviewShell: React.FC<{
  readonly variant: CurationWavePreviewCardVariant;
  readonly expanded?: boolean | undefined;
  readonly children: React.ReactNode;
}> = ({ variant, expanded = false, children }) => {
  if (variant === "sheet") {
    const expandedHeightClassName = expanded
      ? "tw-h-[calc(100svh-4rem)]"
      : "tw-max-h-[calc(100svh-4rem)]";

    return (
      <div
        className={`tailwind-scope tw-flex tw-min-h-0 tw-w-full tw-flex-col tw-overflow-hidden tw-rounded-t-lg tw-bg-iron-950 tw-text-iron-50 ${expandedHeightClassName}`}
      >
        {children}
      </div>
    );
  }

  const widthClassName = expanded
    ? "tw-w-[calc(100vw-24px)] tw-max-w-[360px] min-[760px]:tw-w-[720px] min-[760px]:tw-max-w-[720px]"
    : "tw-w-[calc(100vw-24px)] tw-max-w-[360px]";
  const heightClassName = expanded
    ? "tw-h-[calc(100vh-32px)] min-[760px]:tw-h-auto"
    : "";

  return (
    <div
      className={`tailwind-scope -tw-mx-4 -tw-my-3 tw-flex tw-max-h-[calc(100vh-32px)] tw-min-h-0 ${heightClassName} ${widthClassName} tw-flex-col tw-overflow-hidden tw-rounded-xl tw-bg-iron-950 tw-text-iron-50 tw-scrollbar-thin tw-scrollbar-track-iron-800 tw-scrollbar-thumb-iron-500 desktop-hover:hover:tw-scrollbar-thumb-iron-300`}
    >
      {children}
    </div>
  );
};
