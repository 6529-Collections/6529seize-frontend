"use client";

import React, { memo, useEffect, useRef } from "react";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiDropMentionedUser } from "@/generated/models/ApiDropMentionedUser";
import type { ApiDropGroupMention } from "@/generated/models/ApiDropGroupMention";
import type { ApiMentionedWave } from "@/generated/models/ApiMentionedWave";
import WaveDropPartDrop from "./WaveDropPartDrop";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { ImageScale } from "@/helpers/image.helpers";
import type { DropContentPresentation } from "./dropContentPresentation";
import useLongPressClickSuppression from "@/hooks/useLongPressClickSuppression";

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
  readonly onSave?:
    | ((
        newContent: string,
        mentions?: ApiDropMentionedUser[],
        mentionedGroups?: ApiDropGroupMention[],
        mentionedWaves?: ApiMentionedWave[]
      ) => void)
    | undefined;
  readonly onCancel?: (() => void) | undefined;
  readonly isCompetitionDrop?: boolean | undefined;
  readonly mediaImageScale?: ImageScale | undefined;
  readonly mediaContainerHeightClassName?: string | undefined;
  readonly fullWidthMedia?: boolean | undefined;
  readonly fullWidthLinkPreviews?: boolean | undefined;
  readonly hasTouch?: boolean | undefined;
  readonly onLinkCardActionsActiveChange?:
    | ((href: string, active: boolean) => void)
    | undefined;
  readonly contentPresentation?: DropContentPresentation | undefined;
  readonly embedPath?: readonly string[] | undefined;
  readonly quotePath?: readonly string[] | undefined;
  readonly embedDepth?: number | undefined;
  readonly maxEmbedDepth?: number | undefined;
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
    mediaContainerHeightClassName,
    fullWidthMedia = false,
    fullWidthLinkPreviews = false,
    hasTouch = false,
    onLinkCardActionsActiveChange,
    contentPresentation = "default",
    embedPath,
    quotePath,
    embedDepth,
    maxEmbedDepth,
  }) => {
    const activePart = drop.parts[activePartIndex];

    const isStorm = drop.parts.length > 1;
    const havePreviousPart = activePartIndex > 0;
    const haveNextPart = activePartIndex < drop.parts.length - 1;

    const isTemporaryDrop = drop.id.startsWith("temp-");
    const isInteractive = !isTemporaryDrop && !!onDropContentClick;

    const longPressTimeout = useRef<NodeJS.Timeout | null>(null);
    const touchStartX = useRef(0);
    const touchStartY = useRef(0);
    const {
      markNextClickForSuppression,
      releaseSuppressionAfterTouchEnd,
      clearSuppression,
      handleClickCapture,
    } = useLongPressClickSuppression();

    useEffect(() => {
      if (hasTouch) {
        return;
      }

      if (longPressTimeout.current) {
        clearTimeout(longPressTimeout.current);
        longPressTimeout.current = null;
      }
      setLongPressTriggered(false);
      clearSuppression();
    }, [hasTouch, clearSuppression, setLongPressTriggered]);

    useEffect(() => {
      return () => {
        if (longPressTimeout.current) {
          clearTimeout(longPressTimeout.current);
          longPressTimeout.current = null;
        }
      };
    }, []);

    const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
      if (isTemporaryDrop || !hasTouch) return;

      touchStartX.current = e.touches[0]!.clientX;
      touchStartY.current = e.touches[0]!.clientY;

      longPressTimeout.current = setTimeout(() => {
        markNextClickForSuppression();
        setLongPressTriggered(true);
        onLongPress();
      }, LONG_PRESS_DURATION);
    };

    const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
      if (!hasTouch) return;
      const touchX = e.touches[0]!.clientX;
      const touchY = e.touches[0]!.clientY;

      const deltaX = Math.abs(touchX - touchStartX.current);
      const deltaY = Math.abs(touchY - touchStartY.current);

      if (
        (deltaX > MOVE_THRESHOLD || deltaY > MOVE_THRESHOLD) &&
        longPressTimeout.current
      ) {
        clearTimeout(longPressTimeout.current);
        longPressTimeout.current = null;
      }
    };

    const handleTouchEnd = () => {
      if (longPressTimeout.current) {
        clearTimeout(longPressTimeout.current);
        longPressTimeout.current = null;
      }
      releaseSuppressionAfterTouchEnd();
      setLongPressTriggered(false);
    };

    const handleClick = (
      event:
        | React.MouseEvent<HTMLDivElement>
        | React.KeyboardEvent<HTMLDivElement>
    ) => {
      const selection = globalThis.getSelection?.() ?? null;
      if (selection?.toString()) {
        return;
      }
      if (isTemporaryDrop || !onDropContentClick) return;

      event.stopPropagation();
      onDropContentClick(drop);
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (!isInteractive) return;
      const isActivationKey =
        event.key === "Enter" || event.key === " " || event.key === "Space";

      if (!isActivationKey) {
        return;
      }

      event.preventDefault();
      handleClick(event);
    };

    if (!activePart) {
      return null;
    }

    return (
      <div
        onClickCapture={handleClickCapture}
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        className={`touch-select-none tw-no-underline ${
          isInteractive ? "tw-cursor-pointer" : "tw-cursor-default"
        }`}
        role={isInteractive ? "button" : undefined}
        tabIndex={isInteractive ? 0 : undefined}
        onKeyDown={handleKeyDown}
      >
        <div className="tw-relative tw-overflow-hidden tw-transition-all tw-duration-300 tw-ease-out">
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
            mediaContainerHeightClassName={mediaContainerHeightClassName}
            fullWidthMedia={fullWidthMedia}
            fullWidthLinkPreviews={fullWidthLinkPreviews}
            onLinkCardActionsActiveChange={onLinkCardActionsActiveChange}
            contentPresentation={contentPresentation}
            embedPath={embedPath}
            quotePath={quotePath}
            embedDepth={embedDepth}
            maxEmbedDepth={maxEmbedDepth}
          />
        </div>
      </div>
    );
  }
);

WaveDropPart.displayName = "WaveDropPart";

export default WaveDropPart;
