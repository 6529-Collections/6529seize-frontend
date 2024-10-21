import React, { ReactNode, useState } from "react";

import BrainMobileTabs from "./mobile/BrainMobileTabs";
import BrainContent from "./content/BrainContent";
import BrainMobileWaves from "./mobile/BrainMobileWaves";

interface Props {
  children: ReactNode;
}

const BrainMobile: React.FC<Props> = ({ children }) => {
  const [isWavesButtonActive, setIsWavesButtonActive] = useState(false);

  return (
    <div className="tw-relative tw-flex tw-flex-col">
      <div className="tw-pt-3">
        <BrainMobileTabs
          onWavesButtonClick={setIsWavesButtonActive}
          isWavesButtonActive={isWavesButtonActive}
        />
        {isWavesButtonActive ? (
          <BrainMobileWaves />
        ) : (
          <BrainContent showPinnedWaves={true}>{children}</BrainContent>
        )}
      </div>
    </div>
  );
};

export default BrainMobile;
