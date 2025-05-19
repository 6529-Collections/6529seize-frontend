import React, { useMemo } from "react";
import { MinimalWave } from "../../../../contexts/wave/hooks/useEnhancedWavesList";
import BrainLeftSidebarWave from "./BrainLeftSidebarWave";
import SectionHeader from "./SectionHeader";
import { faThumbtack } from "@fortawesome/free-solid-svg-icons";
import CommonSwitch from "../../../utils/switch/CommonSwitch";
import { useShowFollowingWaves } from "../../../../hooks/useShowFollowingWaves";
import { useAuth } from "../../../auth/Auth";

interface UnifiedWavesListWavesProps {
  readonly waves: MinimalWave[];
  readonly onHover: (waveId: string) => void;
  readonly hideToggle?: boolean;
  readonly hidePin?: boolean;
  readonly hideHeaders?: boolean;
}

const UnifiedWavesListWaves: React.FC<UnifiedWavesListWavesProps> = ({
  waves,
  onHover,
  hideToggle = false,
  hidePin = false,
  hideHeaders = false,
}) => {
  const [following, setFollowing] = useShowFollowingWaves();
  const { connectedProfile, activeProfileProxy } = useAuth();

  const isConnectedIdentity = useMemo(() => {
    return !!connectedProfile?.handle && !activeProfileProxy;
  }, [connectedProfile?.handle, activeProfileProxy]);

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

  const joinedToggle = !hideToggle && isConnectedIdentity ? (
    <CommonSwitch
      label="Joined"
      isOn={following}
      setIsOn={setFollowing}
    />
  ) : null;

  return (
    <div className="tw-flex tw-flex-col">
      {!hideHeaders && pinnedWaves.length > 0 && (
        <>
          <SectionHeader label="Pinned" icon={faThumbtack} />
          <div className="tw-flex tw-flex-col tw-mb-3">
            {pinnedWaves.map((wave) => (
              <div key={wave.id}>
                <BrainLeftSidebarWave wave={wave} onHover={onHover} showPin={!hidePin} />
              </div>
            ))}
          </div>
        </>
      )}
      {regularWaves.length > 0 && (
        <>
          {!hideHeaders && (
            <SectionHeader label="All Waves" rightContent={joinedToggle} />
          )}
          <div className="tw-flex tw-flex-col">
            {regularWaves.map((wave) => (
              <div key={wave.id}>
                <BrainLeftSidebarWave wave={wave} onHover={onHover} showPin={!hidePin} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default UnifiedWavesListWaves;
