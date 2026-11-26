import type React from "react";
import type { CurationWavePreviewCardVariant } from "./types";

export const CurationPreviewShell: React.FC<{
  readonly variant: CurationWavePreviewCardVariant;
  readonly twoColumns?: boolean | undefined;
  readonly maxHeight?: number | undefined;
  readonly children: React.ReactNode;
}> = ({ variant, twoColumns = false, maxHeight, children }) => {
  if (variant === "sheet") {
    return (
      <div className="tailwind-scope tw-w-full tw-flex-none tw-bg-iron-950 tw-text-iron-50">
        {children}
      </div>
    );
  }

  const widthClassName = twoColumns
    ? "tw-w-[720px] tw-max-w-[720px]"
    : "tw-w-[calc(100vw-24px)] tw-max-w-[360px]";

  return (
    <div
      style={maxHeight === undefined ? undefined : { maxHeight }}
      className={`tailwind-scope -tw-mx-4 -tw-my-3 tw-flex tw-max-h-[calc(100vh-32px)] tw-min-h-0 ${widthClassName} tw-flex-col tw-overflow-y-auto tw-rounded-xl tw-bg-iron-950 tw-text-iron-50 tw-scrollbar-thin tw-scrollbar-track-iron-800 tw-scrollbar-thumb-iron-500 desktop-hover:hover:tw-scrollbar-thumb-iron-300`}
    >
      {children}
    </div>
  );
};
