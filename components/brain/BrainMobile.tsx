import React, { ReactNode, useState } from "react";
import BrainMobileTabs from "./mobile/BrainMobileTabs";
import BrainMobileWaves from "./mobile/BrainMobileWaves";
import { useRouter } from "next/router";

interface Props {
  children: ReactNode;
}

const BrainMobile: React.FC<Props> = ({ children }) => {
  const router = useRouter();
  const [isWavesButtonActive, setIsWavesButtonActive] = useState(false);

  return (
    <div className="tw-relative tw-flex tw-flex-col tw-px-2 sm:tw-px-4 md:tw-px-6 tw-h-full tw-overflow-y-auto">
   
        <BrainMobileTabs
          onWavesButtonClick={setIsWavesButtonActive}
          isWavesButtonActive={isWavesButtonActive}
        />
        {isWavesButtonActive ? <BrainMobileWaves activeWaveId={router.query.wave as string}/> : children}
  
    </div>
  );
};

export default BrainMobile;
