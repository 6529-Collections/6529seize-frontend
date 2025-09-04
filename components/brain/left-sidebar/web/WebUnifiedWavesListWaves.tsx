"use client";

import React, { useMemo, forwardRef, useImperativeHandle, useRef } from "react";
import { MinimalWave } from "../../../../contexts/wave/hooks/useEnhancedWavesList";
import WebBrainLeftSidebarWave from "./WebBrainLeftSidebarWave";
import SectionHeader from "../waves/SectionHeader";
import JoinedToggle from "../waves/JoinedToggle";
import {
  useVirtualizedWaves,
  VirtualItem,
} from "../../../../hooks/useVirtualizedWaves";

// Lightweight type guard that checks essential properties only
function isValidWave(wave: unknown): wave is MinimalWave {
  if (wave === null || wave === undefined || typeof wave !== "object") {
    return false;
  }

  const w = wave as MinimalWave;
  // Check only essential properties for performance
  return (
    typeof w.id === "string" &&
    w.id.length > 0 &&
    typeof w.name === "string" &&
    typeof w.isPinned === "boolean"
  );
}

// Height for empty waves placeholder to maintain consistent layout
const EMPTY_WAVES_PLACEHOLDER_HEIGHT = "48px" as const;

// Virtualization constants
const WAVE_ROW_HEIGHT = 62 as const; // Height of each wave row in pixels

export interface WebUnifiedWavesListWavesHandle {
  sentinelRef: React.RefObject<HTMLDivElement | null>;
}

interface WebUnifiedWavesListWavesProps {
  readonly waves: MinimalWave[];
  readonly onHover: (waveId: string) => void;
  readonly hideHeaders?: boolean;
  readonly hideToggle?: boolean;
  readonly hidePin?: boolean;
  readonly scrollContainerRef?: React.RefObject<HTMLDivElement | null>;
}

const WebUnifiedWavesListWaves = forwardRef<
  WebUnifiedWavesListWavesHandle,
  WebUnifiedWavesListWavesProps
>(({ waves, onHover, hideHeaders = false, hideToggle = false, hidePin = false, scrollContainerRef }, ref) => {
  const listContainerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    sentinelRef,
  }));

  // Split waves into pinned and regular
  const { pinnedWaves, regularWaves } = useMemo(() => {
    const pinned: MinimalWave[] = [];
    const regular: MinimalWave[] = [];
    
    waves.forEach((wave) => {
      if (wave.isPinned) {
        pinned.push(wave);
      } else {
        regular.push(wave);
      }
    });
    
    return { pinnedWaves: pinned, regularWaves: regular };
  }, [waves]);

  // Use virtualization hook for regular waves  
  const virtual = useVirtualizedWaves<MinimalWave>(
    regularWaves,
    "web-unified-waves-regular",
    scrollContainerRef || listContainerRef,
    listContainerRef,
    WAVE_ROW_HEIGHT,
    5 // overscan
  );

  return (
    <div className="tw-flex tw-flex-col">
      {/* Always show "All Waves" header with toggle when not hidden */}
      {!hideHeaders && (
        <SectionHeader
          label="All Waves"
          rightContent={hideToggle ? undefined : <JoinedToggle />}
        />
      )}

      {/* Conditionally show pinned section */}
      {!hideHeaders && pinnedWaves.length > 0 && (
        <>
          <section
            className="tw-flex tw-flex-col tw-mb-3"
            aria-label="Pinned waves"
          >
            {pinnedWaves
              .filter((wave): wave is MinimalWave => {
                if (!isValidWave(wave)) {
                  console.warn("Invalid pinned wave object", wave);
                  return false;
                }
                return true;
              })
              .map((wave) => (
                <div key={wave.id}>
                  <WebBrainLeftSidebarWave
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
            position: "relative",
          }}
          aria-label="Regular waves list"
        >
          {virtual.virtualItems.map((v: VirtualItem) => {
            if (v.index === regularWaves.length) {
              return (
                <div
                  key="sentinel"
                  ref={sentinelRef}
                  style={{
                    position: "absolute",
                    width: "100%",
                    top: v.start,
                    height: v.size,
                  }}
                />
              );
            }
            const wave = regularWaves[v.index];
            if (!isValidWave(wave)) {
              console.warn("Invalid wave object at index", v.index, wave);
              return null;
            }
            return (
              <div
                key={wave.id}
                style={{
                  position: "absolute",
                  width: "100%",
                  top: v.start,
                  height: v.size,
                }}
              >
                <WebBrainLeftSidebarWave
                  wave={wave}
                  onHover={onHover}
                  showPin={!hidePin}
                />
              </div>
            );
          })}
        </section>
      ) : (
        <div ref={listContainerRef} style={{ minHeight: EMPTY_WAVES_PLACEHOLDER_HEIGHT }} />
      )}
    </div>
  );
});

WebUnifiedWavesListWaves.displayName = "WebUnifiedWavesListWaves";
export default WebUnifiedWavesListWaves;