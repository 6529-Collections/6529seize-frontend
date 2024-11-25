import React from "react";
import { ApiDrop } from "../../../../generated/models/ApiDrop";
import { ApiDropPart } from "../../../../generated/models/ApiDropPart";
import WaveDetailedDropPartTitle from "./WaveDetailedDropPartTitle";
import WaveDetailedDropPartContent from "./WaveDetailedDropPartContent";

interface WaveDetailedDropPartDropProps {
  drop: ApiDrop;
  activePart: ApiDropPart;
  havePreviousPart: boolean;
  haveNextPart: boolean;
  isStorm: boolean;
  activePartIndex: number;
  setActivePartIndex: (index: number) => void;
  onQuoteClick: (drop: ApiDrop) => void;
}

const WaveDetailedDropPartDrop: React.FC<WaveDetailedDropPartDropProps> = ({
  drop,
  activePart,
  havePreviousPart,
  haveNextPart,
  isStorm,
  activePartIndex,
  setActivePartIndex,
  onQuoteClick,
}) => {
  return (
    <div className="tw-flex tw-gap-x-3 tw-h-full tw-relative">
      <div className="tw-flex tw-flex-col tw-w-full tw-h-full tw-self-center sm:tw-self-start">
        <div>
          <WaveDetailedDropPartTitle title={drop.title} />
          <WaveDetailedDropPartContent
            mentionedUsers={drop.mentioned_users}
            referencedNfts={drop.referenced_nfts}
            wave={drop.wave}
            activePart={activePart}
            havePreviousPart={havePreviousPart}
            haveNextPart={haveNextPart}
            isStorm={isStorm}
            activePartIndex={activePartIndex}
            setActivePartIndex={setActivePartIndex}
            onQuoteClick={onQuoteClick}
          />
        </div>
      </div>
    </div>
  );
};

export default WaveDetailedDropPartDrop;
