"use client";

import HighlightDropWrapper from "@/components/drops/view/HighlightDropWrapper";
import {
  renderDropsListDropContent,
  type DropsListItemData,
} from "@/components/drops/view/dropsListShared";
import {
  VideoPlaybackMemoryContext,
  type VideoPlaybackSnapshot,
} from "@/components/drops/view/item/content/media/VideoPlaybackMemory";
import { DropLocation } from "@/components/waves/drops/Drop";
import {
  clearWaveDropNearViewport,
  setWaveDropNearViewport,
} from "@/contexts/wave/drop-visibility";
import { useMyStreamActions } from "@/contexts/wave/MyStreamContext";
import type { Drop, ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { DropSize } from "@/helpers/waves/drop.helpers";
import { memo, useEffect, useState } from "react";

/** The list's video memory for a row, created on first use. */
export type GetVideoPlaybackMemory = (
  rowKey: string
) => Map<string, VideoPlaybackSnapshot>;

interface WaveChatVirtualRowProps {
  readonly drop: Drop;
  readonly previousDrop: Drop | null;
  readonly nextDrop: Drop | null;
  readonly itemData: DropsListItemData;
  readonly signatureGroup: readonly ExtendedDrop[] | undefined;
  readonly suspendLightDropHydration: boolean;
  readonly getVideoPlaybackMemory: GetVideoPlaybackMemory;
}

/**
 * One drop row of the windowed chat. A row is mounted only while it is in or
 * near the viewport (or pinned), so mounting stands for what the old
 * per-row observers tracked: the drop counts as near the viewport, and a
 * light placeholder asks for its full drop.
 */
export const WaveChatVirtualRow = memo(
  ({
    drop,
    previousDrop,
    nextDrop,
    itemData,
    signatureGroup,
    suspendLightDropHydration,
    getVideoPlaybackMemory,
  }: WaveChatVirtualRowProps) => {
    const { fetchAroundSerialNo } = useMyStreamActions();
    const isTarget = itemData.serialNo === drop.serial_no;
    const waveId = drop.type === DropSize.FULL ? drop.wave.id : drop.waveId;
    // Video position and sound settings outlive the row's unmount, as they did
    // when offscreen rows were kept as placeholders.
    const [videoMemory] = useState(() =>
      getVideoPlaybackMemory(drop.stableKey)
    );

    useEffect(() => {
      setWaveDropNearViewport({
        waveId,
        dropId: drop.id,
        isNearViewport: true,
      });
      return () => {
        clearWaveDropNearViewport(waveId, drop.id);
      };
    }, [drop.id, waveId]);

    useEffect(() => {
      if (drop.type === DropSize.LIGHT && !suspendLightDropHydration) {
        fetchAroundSerialNo(waveId, drop.serial_no);
      }
    }, [
      drop.serial_no,
      drop.type,
      fetchAroundSerialNo,
      suspendLightDropHydration,
      waveId,
    ]);

    return (
      <HighlightDropWrapper
        id={`drop-${drop.serial_no}`}
        serialNo={drop.serial_no}
        waveDropId={drop.type === DropSize.FULL ? drop.stableHash : undefined}
        ref={isTarget ? itemData.targetDropRef : null}
        active={isTarget}
        // Read when the row renders; the active row re-renders when it becomes
        // active, which is when the highlight observer uses this root.
        scrollContainer={itemData.scrollContainerRef.current ?? null}
        className={isTarget ? "tw-scroll-mt-20" : ""}
      >
        <VideoPlaybackMemoryContext.Provider value={videoMemory}>
          {renderDropsListDropContent({
            drop,
            previousDrop,
            nextDrop,
            itemData,
            location: DropLocation.WAVE,
            moderationPresentation: "default",
            signatureGroup,
          })}
        </VideoPlaybackMemoryContext.Provider>
      </HighlightDropWrapper>
    );
  }
);
WaveChatVirtualRow.displayName = "WaveChatVirtualRow";
