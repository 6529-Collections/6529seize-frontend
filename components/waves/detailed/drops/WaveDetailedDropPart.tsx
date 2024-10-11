import React, { memo, useState, useEffect, useRef } from "react";
import { Drop } from "../../../../generated/models/Drop";
import WaveDetailedDropPartDrop from "./WaveDetailedDropPartDrop";

interface WaveDetailedDropPartProps {
  readonly drop: Drop;
  readonly activePartIndex: number;
  readonly setActivePartIndex: (index: number) => void;
  readonly onDropClick: () => void;
  readonly onQuoteClick: (drop: Drop) => void;
  readonly onLongPress: () => void;
  readonly setLongPressTriggered: (triggered: boolean) => void;
}

const LONG_PRESS_DURATION = 500; // milliseconds
const MOVE_THRESHOLD = 10; // pixels

const WaveDetailedDropPart: React.FC<WaveDetailedDropPartProps> = memo(
  ({
    drop,
    activePartIndex,
    setActivePartIndex,
    onDropClick,
    onQuoteClick,
    onLongPress,
    setLongPressTriggered,
  }) => {
    const [activePart, setActivePart] = useState(drop.parts[activePartIndex]);

    useEffect(() => {
      setActivePart(drop.parts[activePartIndex]);
    }, [activePartIndex, drop.parts]);

    const isStorm = drop.parts.length > 1;
    const havePreviousPart = activePartIndex > 0;
    const haveNextPart = activePartIndex < drop.parts.length - 1;

    const isTemporaryDrop = drop.id.startsWith("temp-");

    const longPressTimeout = useRef<NodeJS.Timeout | null>(null);
    const touchStartX = useRef(0);
    const touchStartY = useRef(0);

    const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
      if (isTemporaryDrop) return;

      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;

      longPressTimeout.current = setTimeout(() => {
        setLongPressTriggered(true);
        onLongPress();
      }, LONG_PRESS_DURATION);
    };

    const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
      const touchX = e.touches[0].clientX;
      const touchY = e.touches[0].clientY;

      const deltaX = Math.abs(touchX - touchStartX.current);
      const deltaY = Math.abs(touchY - touchStartY.current);

      if (deltaX > MOVE_THRESHOLD || deltaY > MOVE_THRESHOLD) {
        if (longPressTimeout.current) {
          clearTimeout(longPressTimeout.current);
          longPressTimeout.current = null;
        }
      }
    };

    const handleTouchEnd = () => {
      if (longPressTimeout.current) {
        clearTimeout(longPressTimeout.current);
        longPressTimeout.current = null;
      }
      setLongPressTriggered(false);
    };

    const handleClick = () => {
      if (isTemporaryDrop) return;
      onDropClick();
    };

    return (
      <div
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        className={`tw-no-underline ${
          isTemporaryDrop ? "tw-cursor-default" : "tw-cursor-pointer"
        }`}
        role={isTemporaryDrop ? undefined : "button"}
        tabIndex={isTemporaryDrop ? undefined : 0}
        onKeyDown={(e) =>
          !isTemporaryDrop && e.key === "Enter" && handleClick()
        }
      >
        <div className="tw-relative tw-overflow-hidden tw-transform tw-transition-all tw-duration-300 tw-ease-out">
          <WaveDetailedDropPartDrop
            drop={drop}
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
    );
  }
);

WaveDetailedDropPart.displayName = "WaveDetailedDropPart";

export default WaveDetailedDropPart;
