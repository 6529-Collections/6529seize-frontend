import React, { memo, useState, useEffect } from "react";
import { Drop } from "../../../../generated/models/Drop";
import CommonAnimationHeight from "../../../utils/animation/CommonAnimationHeight";
import WaveDetailedDropPartDrop from "./WaveDetailedDropPartDrop";
import WaveDetailedDropPartOverflow from "./WaveDetailedDropPartOverflow";
import { useRouter } from "next/router";

interface WaveDetailedDropPartProps {
  readonly drop: Drop;
  readonly activePartIndex: number;
  readonly setActivePartIndex: (index: number) => void;
  readonly onActiveDropClick?: () => void;
}

const WaveDetailedDropPart: React.FC<WaveDetailedDropPartProps> = memo(
  ({ drop, activePartIndex, setActivePartIndex, onActiveDropClick }) => {
    const router = useRouter();
    const [activePart, setActivePart] = useState(drop.parts[activePartIndex]);

    useEffect(() => {
      setActivePart(drop.parts[activePartIndex]);
    }, [activePartIndex, drop.parts]);

    const isStorm = !!drop.parts.length && drop.parts.length > 1;
    const havePreviousPart = activePartIndex > 0;
    const haveNextPart = activePartIndex < drop.parts.length - 1;
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [isOverflowing, setIsOverflowing] = useState(false);
    const [showMore, setShowMore] = useState(false);

    const checkOverflow = () => {
      const tolerance = 2;
      if (containerRef.current) {
        const { scrollHeight, clientHeight } = containerRef.current;
        setIsOverflowing(scrollHeight > clientHeight + tolerance);
      }
    };

    const isTemporaryDrop = drop.id.startsWith("temp-");

    const handleClick = () => {
      if (!isTemporaryDrop) {
        const currentDropId = router.query.drop;
        if (currentDropId === drop.id) {
          onActiveDropClick?.();
          return;
        }
        const newPath = `/waves/${drop.wave.id}?drop=${drop.id}`;
        router.push(newPath);
      }
    };

    return (
      <div
        onClick={handleClick}
        className={`tw-no-underline ${
          isTemporaryDrop ? "tw-cursor-default" : "tw-cursor-pointer"
        }`}
        role={isTemporaryDrop ? undefined : "button"}
        tabIndex={isTemporaryDrop ? undefined : 0}
        onKeyDown={(e) =>
          !isTemporaryDrop && e.key === "Enter" && handleClick()
        }
      >
        <CommonAnimationHeight onAnimationCompleted={checkOverflow}>
          <div
            ref={containerRef}
            className="tw-relative tw-overflow-hidden tw-transform tw-transition-all tw-duration-300 tw-ease-out"
          >
            <WaveDetailedDropPartDrop
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
