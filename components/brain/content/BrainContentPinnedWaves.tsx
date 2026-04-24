"use client";

import React, { useCallback, useMemo, useState } from "react";
import PinnedWavesScroller from "./pinned-waves/subcomponents/PinnedWavesScroller";
import { useWaveData } from "@/hooks/useWaveData";
import { useRouter } from "next/navigation";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { getWaveHomeRoute } from "@/helpers/navigation.helpers";
import { useMyStream } from "@/contexts/wave/MyStreamContext";
import { usePinnedWaveSnapshotSync } from "./pinned-waves/hooks/usePinnedWaveSnapshotSync";

const BrainContentPinnedWaves: React.FC = () => {
  const router = useRouter();
  const { activeWave, directMessages } = useMyStream();
  const currentWaveId = activeWave.id;
  const { data: currentWave } = useWaveData({
    waveId: currentWaveId,
  });
  const { isApp } = useDeviceInfo();
  const directMessagesList = directMessages.list;
  const currentWaveIsDirectMessage = useMemo(
    () =>
      Boolean(
        currentWaveId &&
        directMessagesList.some((wave) => wave.id === currentWaveId)
      ),
    [currentWaveId, directMessagesList]
  );
  const [hoveredWaveId, setHoveredWaveId] = useState<string | null>(null);
  const clearHoveredWaveId = useCallback(() => {
    setHoveredWaveId(null);
  }, []);

  const { cancelRefresh, pinnedWaves, removeId } = usePinnedWaveSnapshotSync({
    currentWaveId,
    currentWave,
    currentWaveIsDirectMessage,
  });

  const onRemove = useCallback(
    (waveId: string) => {
      cancelRefresh(waveId);

      if (currentWaveId === waveId) {
        const isDirectMessage = directMessagesList.some((w) => w.id === waveId);
        router.replace(getWaveHomeRoute({ isDirectMessage, isApp }));
      }

      removeId(waveId);
    },
    [cancelRefresh, currentWaveId, directMessagesList, isApp, removeId, router]
  );

  if (!pinnedWaves.length) {
    return null;
  }

  return (
    <PinnedWavesScroller
      pinnedWaves={pinnedWaves}
      currentWaveId={currentWaveId}
      hoveredWaveId={hoveredWaveId}
      onHoverWave={setHoveredWaveId}
      onHoverExit={clearHoveredWaveId}
      onRemove={onRemove}
    />
  );
};

export default BrainContentPinnedWaves;
