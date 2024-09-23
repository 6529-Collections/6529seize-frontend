import React from 'react';
import { Drop } from '../../../../generated/models/Drop';
import { DropPart } from '../../../../generated/models/DropPart';
import WaveDetailedDropPartTitle from './WaveDetailedDropPartTitle';
import WaveDetailedDropPartContent from './WaveDetailedDropPartContent';

interface WaveDetailedDropPartDropProps {
  drop: Drop;
  activePart: DropPart;
  havePreviousPart: boolean;
  haveNextPart: boolean;
  isStorm: boolean;
  activePartIndex: number;
  setActivePartIndex: (index: number) => void;
  checkOverflow: () => void;
  showMore: boolean;
}

const WaveDetailedDropPartDrop: React.FC<WaveDetailedDropPartDropProps> = ({
  drop,
  activePart,
  havePreviousPart,
  haveNextPart,
  isStorm,
  activePartIndex,
  setActivePartIndex,
  checkOverflow,
  showMore,
}) => {
  return (
    <div className="tw-mt-1 tw-flex tw-gap-x-3 tw-h-full tw-relative">
      <div className="tw-flex tw-flex-col tw-w-full tw-h-full tw-self-center sm:tw-self-start">
        <div>
          <WaveDetailedDropPartTitle title={drop.title} />
          <WaveDetailedDropPartContent
            drop={drop}
            activePart={activePart}
            havePreviousPart={havePreviousPart}
            haveNextPart={haveNextPart}
            isStorm={isStorm}
            activePartIndex={activePartIndex}
            setActivePartIndex={setActivePartIndex}
            checkOverflow={checkOverflow}
            showMore={showMore}
          />
        </div>
      </div>
    </div>
  );
};

export default WaveDetailedDropPartDrop;