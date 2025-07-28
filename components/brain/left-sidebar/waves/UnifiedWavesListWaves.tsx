"use client";

import React, { useMemo, forwardRef, useImperativeHandle, useRef } from "react";
import { MinimalWave } from "../../../../contexts/wave/hooks/useEnhancedWavesList";
import BrainLeftSidebarWave from "./BrainLeftSidebarWave";
import SectionHeader from "./SectionHeader";
import { faThumbtack } from "@fortawesome/free-solid-svg-icons";
import CommonSwitch from "../../../utils/switch/CommonSwitch";
import { useShowFollowingWaves } from "../../../../hooks/useShowFollowingWaves";
import { useAuth } from "../../../auth/Auth";
import { useVirtualizedWaves } from "../../../../hooks/useVirtualizedWaves";

// Interface for virtualization items (matches useVirtualizedWaves)
interface VirtualItem {
  index: number;
  start: number;
  size: number;
}

// Type guard to ensure wave object is valid
function isValidWave(wave: unknown): wave is MinimalWave {
  return (
    wave !== null &&
    wave !== undefined &&
    typeof wave === "object" &&
    typeof (wave as MinimalWave).id === "string" &&
    (wave as MinimalWave).id.length > 0
  );
}

// Height for empty waves placeholder to maintain consistent layout (matches UnifiedWavesListEmpty)
const EMPTY_WAVES_PLACEHOLDER_HEIGHT = "48px" as const;

// Virtualization constants
const WAVE_ROW_HEIGHT = 62 as const; // Height of each wave row in pixels
const VIRTUALIZATION_OVERSCAN = 5 as const; // Number of extra items to render outside viewport

interface UnifiedWavesListWavesProps {
  readonly waves: MinimalWave[];
  readonly onHover: (waveId: string) => void;
  readonly hideToggle?: boolean;
  readonly hidePin?: boolean;
  readonly hideHeaders?: boolean;
  readonly scrollContainerRef: React.RefObject<HTMLDivElement | null>;
}

export interface UnifiedWavesListWavesHandle {
  readonly containerRef: React.RefObject<HTMLDivElement | null>;
  readonly sentinelRef: React.RefObject<HTMLDivElement | null>;
}

const UnifiedWavesListWaves = forwardRef<
  UnifiedWavesListWavesHandle,
  UnifiedWavesListWavesProps
>(
  (
    { waves, onHover, scrollContainerRef, hideToggle, hidePin, hideHeaders },
    ref
  ) => {
    const [following, setFollowing] = useShowFollowingWaves();
    const listContainerRef = useRef<HTMLDivElement>(null);
    const { connectedProfile, activeProfileProxy } = useAuth();

    const isConnectedIdentity = useMemo(() => {
      return !!connectedProfile?.handle && !activeProfileProxy;
    }, [connectedProfile?.handle, activeProfileProxy]);

    // Split waves into pinned and regular waves (no separate active section)
    const { pinnedWaves, regularWaves } = useMemo(() => {
      const pinned = waves.filter(wave => wave.isPinned);
      const regular = waves.filter(wave => !wave.isPinned);

      // No special sorting for active waves - keep them in their original position
      return {
        pinnedWaves: pinned,
        regularWaves: regular,
      } as const;
    }, [waves]);

    const virtual = useVirtualizedWaves<MinimalWave>(
      regularWaves,
      "unified-waves-regular",
      scrollContainerRef,
      listContainerRef,
      WAVE_ROW_HEIGHT,
      VIRTUALIZATION_OVERSCAN
    );

    useImperativeHandle(ref, () => ({
      containerRef: virtual.containerRef,
      sentinelRef: virtual.sentinelRef,
    }));


    const joinedToggle = useMemo(() => 
      !hideToggle && isConnectedIdentity ? (
        <CommonSwitch label="Joined" isOn={following} setIsOn={setFollowing} />
      ) : null,
      // setFollowing is referentially stable (useCallback with empty deps)
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [hideToggle, isConnectedIdentity, following]
    );

    return (
      <div className="tw-flex tw-flex-col">
        {/* Always show "All Waves" header with toggle when not hidden */}
        {!hideHeaders && (
          <SectionHeader label="All Waves" rightContent={joinedToggle} />
        )}
        
        {/* Conditionally show pinned section */}
        {!hideHeaders && pinnedWaves.length > 0 && (
          <>
            <SectionHeader label="Pinned" icon={faThumbtack} />
            <section 
              className="tw-flex tw-flex-col tw-mb-3"
              aria-label="Pinned waves">
              {pinnedWaves
                .filter((wave): wave is MinimalWave => {
                  if (!isValidWave(wave)) {
                    console.error("Invalid pinned wave object", wave);
                    return false;
                  }
                  return true;
                })
                .map((wave) => (
                  <div key={wave.id}>
                    <BrainLeftSidebarWave
                      wave={wave}
                      onHover={onHover}
                      showPin={!hidePin}
                    />
                  </div>
                ))}
            </section>
          </>
        )}
        
        {/* Conditionally show regular waves or maintain structure */}
        {regularWaves.length > 0 ? (
          <section
            ref={listContainerRef}
            style={{ 
              height: virtual.totalHeight, 
              position: "relative" 
            } satisfies React.CSSProperties}
            aria-label="Regular waves list">
            {virtual.virtualItems.map((v: VirtualItem) => {
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
                    } satisfies React.CSSProperties}
                  />
                );
              }
              const wave = regularWaves[v.index];
              if (!isValidWave(wave)) {
                console.error("Invalid wave object at index", v.index, wave);
                return null;
              }
              // TypeScript now knows wave is definitely MinimalWave
              return (
                <div
                  key={wave.id}
                  style={{
                    position: "absolute",
                    top: v.start,
                    height: v.size,
                    width: "100%",
                  } satisfies React.CSSProperties}>
                  <BrainLeftSidebarWave
                    wave={wave}
                    onHover={onHover}
                    showPin={!hidePin}
                  />
                </div>
              );
            })}
          </section>
        ) : (
          <div 
            ref={listContainerRef} 
            style={{ minHeight: EMPTY_WAVES_PLACEHOLDER_HEIGHT } satisfies React.CSSProperties} 
          />
        )}
      </div>
    );
  }
);

UnifiedWavesListWaves.displayName = "UnifiedWavesListWaves";
export default UnifiedWavesListWaves;
