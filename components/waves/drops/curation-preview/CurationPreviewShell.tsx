import type React from "react";
import type { CurationWavePreviewCardVariant } from "./types";

export const CurationPreviewShell: React.FC<{
  readonly variant: CurationWavePreviewCardVariant;
  readonly expanded?: boolean | undefined;
  readonly children: React.ReactNode;
}> = ({ variant, expanded = false, children }) => {
  if (variant === "sheet") {
    return (
      <div className="tailwind-scope tw-w-full tw-overflow-hidden tw-rounded-t-lg tw-bg-iron-950 tw-text-iron-50">
        {children}
      </div>
    );
  }

  const widthClassName = expanded
    ? "tw-w-[360px] min-[760px]:tw-w-[720px]"
    : "tw-w-[360px]";
  const overflowClassName = expanded
    ? "tw-overflow-y-auto min-[760px]:tw-overflow-hidden"
    : "tw-overflow-hidden";

  return (
    <div
      className={`tailwind-scope -tw-mx-4 -tw-my-3 tw-max-h-[calc(100vh-32px)] ${widthClassName} ${overflowClassName} tw-rounded-xl tw-bg-iron-950 tw-text-iron-50 tw-scrollbar-thin tw-scrollbar-track-iron-800 tw-scrollbar-thumb-iron-500 desktop-hover:hover:tw-scrollbar-thumb-iron-300`}
    >
      {children}
    </div>
  );
};
