import React, { useMemo } from "react";
import { MinimalWave } from "../../../../contexts/wave/MyStreamContext";
import BrainLeftSidebarWave from "./BrainLeftSidebarWave";
import SectionHeader from "./SectionHeader";
import { faThumbtack } from "@fortawesome/free-solid-svg-icons";
interface UnifiedWavesListWavesProps {
  readonly waves: MinimalWave[];
  readonly activeWaveId: string | null;
}

const UnifiedWavesListWaves: React.FC<UnifiedWavesListWavesProps> = ({
  waves,
  activeWaveId,
}) => {
  // Split waves into pinned, active (unpinned), and regular waves
  const { pinnedWaves, activeUnpinnedWave, regularWaves } = useMemo(() => {
    const pinned: MinimalWave[] = [];
    const regular: MinimalWave[] = [];
    let activeWave: MinimalWave | null = null;

    waves.forEach((wave) => {
      // Check if this is the active wave
      const isActive = wave.id === activeWaveId;

      if (wave.isPinned) {
        // Always add pinned waves to the pinned section
        pinned.push(wave);
      } else if (isActive) {
        // Store active unpinned wave separately
        activeWave = wave;
      } else {
        // Regular unpinned waves
        regular.push(wave);
      }
    });

    // Sort pinned waves to prioritize the active pinned wave at the top
    const sortedPinnedWaves = [...pinned].sort((a, b) => {
      // If a is active, it should come first
      if (a.id === activeWaveId) return -1;
      // If b is active, it should come first
      if (b.id === activeWaveId) return 1;
      // Otherwise maintain their order
      return 0;
    });

    return {
      pinnedWaves: sortedPinnedWaves,
      activeUnpinnedWave: activeWave as MinimalWave | null,
      regularWaves: regular,
    };
  }, [waves, activeWaveId]);

  if (!waves.length) {
    return null;
  }

  return (
    <div className="tw-flex tw-flex-col">
      {activeUnpinnedWave && (
        <>
          <SectionHeader label="Active" />
          <div className="tw-flex tw-flex-col tw-mb-3">
            <div>
              <BrainLeftSidebarWave wave={activeUnpinnedWave} />
            </div>
          </div>
        </>
      )}
      {pinnedWaves.length > 0 && (
        <>
          <SectionHeader label="Pinned" icon={faThumbtack} />
          <div className="tw-flex tw-flex-col tw-mb-3">
            {pinnedWaves.map((wave) => (
              <div key={wave.id}>
                <BrainLeftSidebarWave wave={wave} />
              </div>
            ))}
          </div>
        </>
      )}
      {regularWaves.length > 0 && (
        <>
          <SectionHeader label="All Waves" />
          <div className="tw-flex tw-flex-col">
            {regularWaves.map((wave) => (
              <div key={wave.id}>
                <BrainLeftSidebarWave wave={wave} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default UnifiedWavesListWaves;
