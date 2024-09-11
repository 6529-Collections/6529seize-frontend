import React, { memo, useState, useEffect } from "react";
import { Drop } from "../../../../generated/models/Drop";
import CommonAnimationHeight from "../../../utils/animation/CommonAnimationHeight";
import WaveDetailedDropPartDrop from "./WaveDetailedDropPartDrop";
import WaveDetailedDropPartOverflow from "./WaveDetailedDropPartOverflow";

interface WaveDetailedDropPartProps {
  drop: Drop;
  activePartIndex: number;
  setActivePartIndex: (index: number) => void;
}

const WaveDetailedDropPart: React.FC<WaveDetailedDropPartProps> = memo(
  ({ drop, activePartIndex, setActivePartIndex }) => {
    const [activePart, setActivePart] = useState(drop.parts[activePartIndex]);

    useEffect(() => {
      setActivePart(drop.parts[activePartIndex]);
    }, [activePartIndex, drop.parts]);

    const isStorm = drop.parts.length && drop.parts.length > 1;
    const showPrevButton = !!activePartIndex && activePartIndex > 1;
    const showNextButton =
      !!activePartIndex && activePartIndex < drop.parts.length - 1;
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [isOverflowing, setIsOverflowing] = useState(false);
    const checkOverflow = () => {
      const tolerance = 2; // Adjust this value as needed
      if (containerRef.current) {
        const { scrollHeight, clientHeight } = containerRef.current;
        setIsOverflowing(scrollHeight > clientHeight + tolerance);
      }
    };
    const [showMore, setShowMore] = useState(false);






    return (
      <div>
        <CommonAnimationHeight onAnimationCompleted={checkOverflow}>
          <div
            ref={containerRef}
            className="tw-relative tw-overflow-hidden tw-transform tw-transition-all tw-duration-300 tw-ease-out"
          >
            <WaveDetailedDropPartDrop
              drop={drop}
              activePart={activePart}
              showPrevButton={showPrevButton}
              showNextButton={showNextButton}
              activePartIndex={activePartIndex}
              setActivePartIndex={setActivePartIndex}
              checkOverflow={checkOverflow}
              showMore={showMore}
            />
            <WaveDetailedDropPartOverflow
              isOverflowing={isOverflowing}
              showMore={showMore}
              setShowMore={setShowMore}
            />
          </div>
        </CommonAnimationHeight>
      </div>
    );
  }
);

WaveDetailedDropPart.displayName = "WaveDetailedDropPart";

export default WaveDetailedDropPart;
