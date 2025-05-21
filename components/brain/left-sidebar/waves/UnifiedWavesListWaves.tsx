import React, { useMemo, forwardRef, useImperativeHandle, useRef } from "react";
import { MinimalWave } from "../../../../contexts/wave/hooks/useEnhancedWavesList";
import BrainLeftSidebarWave from "./BrainLeftSidebarWave";
import SectionHeader from "./SectionHeader";
import { faThumbtack } from "@fortawesome/free-solid-svg-icons";
import CommonSwitch from "../../../utils/switch/CommonSwitch";
import { useShowFollowingWaves } from "../../../../hooks/useShowFollowingWaves";
import { useAuth } from "../../../auth/Auth";
import { useVirtualizedWaves } from "../../../../hooks/useVirtualizedWaves";

interface UnifiedWavesListWavesProps {
  readonly waves: MinimalWave[];
  readonly onHover: (waveId: string) => void;
  readonly scrollContainerRef: React.RefObject<HTMLDivElement | null>;
}

export interface UnifiedWavesListWavesHandle {
  containerRef: React.RefObject<HTMLDivElement>;
  sentinelRef: React.RefObject<HTMLDivElement>;
}

const UnifiedWavesListWaves = forwardRef<
  UnifiedWavesListWavesHandle,
  UnifiedWavesListWavesProps
>(({ waves, onHover, scrollContainerRef }, ref) => {
  const [following, setFollowing] = useShowFollowingWaves();
  const listContainerRef = useRef<HTMLDivElement>(null);
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

  const virtual = useVirtualizedWaves(
    regularWaves,
    "unified-waves-regular",
    scrollContainerRef,
    listContainerRef,
    62,
    5
  );

  useImperativeHandle(ref, () => ({
    containerRef: virtual.containerRef as React.RefObject<HTMLDivElement>,
    sentinelRef: virtual.sentinelRef as React.RefObject<HTMLDivElement>,
  }));

  if (!waves.length) {
    return null;
  }

  const joinedToggle = isConnectedIdentity ? (
    <CommonSwitch label="Joined" isOn={following} setIsOn={setFollowing} />
  ) : null;

  return (
    <div className="tw-flex tw-flex-col">
      {pinnedWaves.length > 0 && (
        <>
          <SectionHeader label="Pinned" icon={faThumbtack} />
          <div className="tw-flex tw-flex-col tw-mb-3">
            {pinnedWaves.map((wave) => (
              <div key={wave.id}>
                <BrainLeftSidebarWave wave={wave} onHover={onHover} />
              </div>
            ))}
          </div>
        </>
      )}
      {regularWaves.length > 0 && (
        <>
          <SectionHeader label="All Waves" rightContent={joinedToggle} />
          <div
            ref={listContainerRef}
            style={{ height: virtual.totalHeight, position: "relative" }}
          >
            {virtual.virtualItems.map((v) => {
              if (v.index === regularWaves.length) {
                return (
                  <div
                    key="sentinel"
                    ref={virtual.sentinelRef}
                    style={{
                      position: "absolute",
                      top: v.start,
                      height: v.size,
                      width: "100%",
                    }}
                  />
                );
              }
              const wave = regularWaves[v.index];
              return (
                <div
                  key={wave.id}
                  style={{
                    position: "absolute",
                    top: v.start,
                    height: v.size,
                    width: "100%",
                  }}
                >
                  <BrainLeftSidebarWave wave={wave} onHover={onHover} />
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
});

UnifiedWavesListWaves.displayName = "UnifiedWavesListWaves";
export default UnifiedWavesListWaves;
