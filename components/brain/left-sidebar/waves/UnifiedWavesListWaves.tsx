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
  // Split waves into pinned and regular waves (no separate active section)
  const { pinnedWaves, regularWaves } = useMemo(() => {
    const pinned: MinimalWave[] = [];
    const regular: MinimalWave[] = [];

    waves.forEach((wave) => {
      if (wave.isPinned) {
        // Add pinned waves to the pinned section
        pinned.push(wave);
      } else {
        // All unpinned waves go to the regular section
        regular.push(wave);
      }
    });

    // No special sorting for active waves - keep them in their original position
    return {
      pinnedWaves: pinned,
      regularWaves: regular,
    };
  }, [waves]);

  if (!waves.length) {
    return null;
  }

  return (
    <div className="tw-flex tw-flex-col">
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
