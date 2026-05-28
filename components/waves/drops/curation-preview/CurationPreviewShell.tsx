import type React from "react";
import type { CurationWavePreviewCardVariant } from "./types";

export const CurationPreviewShell: React.FC<{
  readonly variant: CurationWavePreviewCardVariant;
  readonly children: React.ReactNode;
}> = ({ variant, children }) => {
  if (variant === "sheet") {
    return (
      <div className="tailwind-scope tw-w-full tw-overflow-hidden tw-rounded-t-lg tw-bg-[#131316] tw-text-iron-50">
        {children}
      </div>
    );
  }

  return (
    <div className="tailwind-scope -tw-mx-4 -tw-my-3 tw-max-h-[calc(100vh-32px)] tw-w-[300px] tw-overflow-hidden tw-rounded-lg tw-bg-[#131316] tw-text-iron-50">
      {children}
    </div>
  );
};
