import React from "react";
import CreateDropActions from "../../waves/detailed/CreateDropActions";
import PrimaryButton from "../../utils/button/PrimaryButton";
import BrainContentPinnedWaves from "./BrainContentPinnedWaves";
import BrainContentInput from "./input/BrainContentInput";

interface BrainContentProps {
  children: React.ReactNode;
}

const BrainContent: React.FC<BrainContentProps> = ({ children }) => {
  return (
    <div className="tw-mt-8 tw-flex-1 tw-h-full tw-flex tw-flex-col tw-overflow-y-auto no-scrollbar">
      <BrainContentPinnedWaves />
      <BrainContentInput />
      <div className="tw-mt-2 tw-flex-1">
        <div>{children}</div>
      </div>
    </div>
  );
};

export default BrainContent;
