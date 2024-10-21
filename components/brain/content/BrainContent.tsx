import React from "react";
import BrainContentPinnedWaves from "./BrainContentPinnedWaves";
import BrainContentInput from "./input/BrainContentInput";

interface BrainContentProps {
  readonly children: React.ReactNode;
  readonly showPinnedWaves?: boolean;
}

const BrainContent: React.FC<BrainContentProps> = ({ children, showPinnedWaves = true }) => {
  return (
    <div className="tw-mt-8 tw-pb-8 tw-flex-1 tw-h-full tw-flex tw-flex-col tw-overflow-y-auto no-scrollbar">
      {showPinnedWaves && <BrainContentPinnedWaves />}
      <BrainContentInput />
      <div className="tw-mt-2 tw-flex-1">
        <div>{children}</div>
      </div>
    </div>
  );
};

export default BrainContent;
