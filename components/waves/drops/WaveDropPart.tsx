"use client";

import React, { memo, useState, useEffect, useRef } from "react";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import WaveDropPartDrop from "./WaveDropPartDrop";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { ImageScale } from "@/helpers/image.helpers";

interface WaveDropPartProps {
  readonly drop: ExtendedDrop;
  readonly activePartIndex: number;
  readonly setActivePartIndex: (index: number) => void;
  readonly onDropContentClick?: ((drop: ExtendedDrop) => void) | undefined;
  readonly onQuoteClick: (drop: ApiDrop) => void;
  readonly onLongPress: () => void;
  readonly setLongPressTriggered: (triggered: boolean) => void;
  readonly isEditing?: boolean | undefined;
  readonly isSaving?: boolean | undefined;
  readonly onSave?: ((newContent: string) => void) | undefined;
  readonly onCancel?: (() => void) | undefined;
  readonly isCompetitionDrop?: boolean | undefined;
  readonly mediaImageScale?: ImageScale | undefined;
}

const LONG_PRESS_DURATION = 500; // milliseconds
const MOVE_THRESHOLD = 10; // pixels

const WaveDropPart: React.FC<WaveDropPartProps> = memo(
  ({
    drop,
    activePartIndex,
    setActivePartIndex,
    onDropContentClick,
    onQuoteClick,
    onLongPress,
    setLongPressTriggered,
    isEditing = false,
    isSaving = false,
    onSave,
    onCancel,
    isCompetitionDrop = false,
    mediaImageScale = ImageScale.AUTOx450,
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

      touchStartX.current = e.touches[0]!.clientX;
      touchStartY.current = e.touches[0]!.clientY;

      longPressTimeout.current = setTimeout(() => {
        setLongPressTriggered(true);
        onLongPress();
      }, LONG_PRESS_DURATION);
    };

    const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
      const touchX = e.touches[0]!.clientX;
      const touchY = e.touches[0]!.clientY;

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
      if (window.getSelection()?.toString()) {
        return;
      }
      if (isTemporaryDrop || !onDropContentClick) return;
      onDropContentClick(drop);
    };

    if (!activePart) {
      return null;
    }

    return (
      <div
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        className={`tw-no-underline touch-select-none ${
          isTemporaryDrop || !onDropContentClick
            ? "tw-cursor-default"
            : "tw-cursor-pointer"
        }`}
        role={isTemporaryDrop || !onDropContentClick ? undefined : "button"}
        tabIndex={isTemporaryDrop || !onDropContentClick ? undefined : 0}
        onKeyDown={(e) =>
          !isTemporaryDrop && e.key === "Enter" && handleClick()
        }
      >
        <div className="tw-relative tw-overflow-hidden  tw-transition-all tw-duration-300 tw-ease-out">
          <WaveDropPartDrop
            drop={drop}
            activePart={activePart}
            havePreviousPart={havePreviousPart}
            haveNextPart={haveNextPart}
            isStorm={isStorm}
            activePartIndex={activePartIndex}
            setActivePartIndex={setActivePartIndex}
            onQuoteClick={onQuoteClick}
            isEditing={isEditing}
            isSaving={isSaving}
            onSave={onSave}
            onCancel={onCancel}
            isCompetitionDrop={isCompetitionDrop}
            mediaImageScale={mediaImageScale}
          />
        </div>
      </div>
    );
  }
);

WaveDropPart.displayName = "WaveDropPart";

export default WaveDropPart;
