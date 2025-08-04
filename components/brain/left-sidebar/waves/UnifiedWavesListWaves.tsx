"use client";

import React, { useMemo, forwardRef, useImperativeHandle, useRef } from "react";
import { MinimalWave } from "../../../../contexts/wave/hooks/useEnhancedWavesList";
import BrainLeftSidebarWave from "./BrainLeftSidebarWave";
import SectionHeader from "./SectionHeader";
import JoinedToggle from "./JoinedToggle";
import {
  useVirtualizedWaves,
  VirtualItem,
} from "../../../../hooks/useVirtualizedWaves";

// VirtualItem interface is now imported from useVirtualizedWaves

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

// Comprehensive validation for debugging purposes only
function validateWaveDetailed(wave: unknown): wave is MinimalWave {
  if (!isValidWave(wave)) return false;
  return (
    typeof wave.type === "string" &&
    wave.newDropsCount !== null &&
    typeof wave.newDropsCount === "object" &&
    typeof wave.newDropsCount.count === "number" &&
    (wave.newDropsCount.latestDropTimestamp === null ||
      typeof wave.newDropsCount.latestDropTimestamp === "number") &&
    Array.isArray(wave.contributors) &&
    (wave.picture === null || typeof wave.picture === "string")
  );
}

// Height for empty waves placeholder to maintain consistent layout (matches UnifiedWavesListEmpty)
const EMPTY_WAVES_PLACEHOLDER_HEIGHT = "48px" as const;

// Virtualization constants
const WAVE_ROW_HEIGHT = 62 as const; // Height of each wave row in pixels
const VIRTUALIZATION_OVERSCAN = 5 as const; // Number of extra items to render outside viewport

// Common styles for positioned elements
const listContainerStyle = {
  position: "relative",
} as const satisfies React.CSSProperties;

const absolutePositionedStyle = {
  position: "absolute",
  width: "100%",
} as const satisfies React.CSSProperties;

const emptyPlaceholderStyle = {
  minHeight: EMPTY_WAVES_PLACEHOLDER_HEIGHT,
} as const satisfies React.CSSProperties;

/**
 * Props for the UnifiedWavesListWaves component.
 */
interface UnifiedWavesListWavesProps {
  /** Array of waves to display in the list */
  readonly waves: MinimalWave[];
  /** Callback function called when a wave is hovered */
  readonly onHover: (waveId: string) => void;
  /** Whether to hide the joined waves toggle. When true, toggle is not rendered */
  readonly hideToggle?: boolean;
  /** Whether to hide the pin functionality for waves */
  readonly hidePin?: boolean;
  /** Whether to hide section headers (All Waves, Pinned) */
  readonly hideHeaders?: boolean;
  /** Reference to the scroll container for virtualization */
  readonly scrollContainerRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * Handle interface for UnifiedWavesListWaves component refs.
 * Used for accessing internal container and sentinel refs for virtualization.
 */
export interface UnifiedWavesListWavesHandle {
  /** Reference to the main container element for virtualization */
  readonly containerRef: React.RefObject<HTMLDivElement | null>;
  /** Reference to the sentinel element used for intersection observation */
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
    const listContainerRef = useRef<HTMLDivElement>(null);

    // Split waves into pinned and regular waves (no separate active section)
    const { pinnedWaves, regularWaves } = useMemo(() => {
      const pinned = waves.filter((wave) => wave.isPinned);
      const regular = waves.filter((wave) => !wave.isPinned);

      // No special sorting for active waves - keep them in their original position
      return {
        pinnedWaves: pinned,
        regularWaves: regular,
      };
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
          <section className="tw-flex tw-flex-col" aria-label="Pinned waves">
              {pinnedWaves
                .filter((wave): wave is MinimalWave => {
                  if (!isValidWave(wave)) {
                    console.warn("Invalid pinned wave object", wave);
                    if (!validateWaveDetailed(wave)) {
                      console.warn(
                        "Pinned wave failed detailed validation:",
                        wave
                      );
                    }
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
        )}

        {/* Add divider between pinned and regular waves */}
        {!hideHeaders && pinnedWaves.length > 0 && regularWaves.length > 0 && (
          <div className="tw-border-t tw-border-iron-700 tw-border-solid tw-border-x-0 tw-border-b-0 tw-my-3" />
        )}

        {/* Conditionally show regular waves or maintain structure */}
        {regularWaves.length > 0 ? (
          <section
            ref={listContainerRef}
            style={{
              height: virtual.totalHeight,
              ...listContainerStyle,
            }}
            aria-label="Regular waves list"
          >
            {virtual.virtualItems.map((v: VirtualItem) => {
              if (v.index === regularWaves.length) {
                return (
                  <div
                    key="sentinel"
                    ref={virtual.sentinelRef}
                    style={{
                      ...absolutePositionedStyle,
                      top: v.start,
                      height: v.size,
                    }}
                  />
                );
              }
              const wave = regularWaves[v.index];
              if (!isValidWave(wave)) {
                console.warn("Invalid wave object at index", v.index, wave);
                if (!validateWaveDetailed(wave)) {
                  console.warn("Wave failed detailed validation:", wave);
                }
                return null;
              }
              // TypeScript now knows wave is definitely MinimalWave
              return (
                <div
                  key={wave.id}
                  style={{
                    ...absolutePositionedStyle,
                    top: v.start,
                    height: v.size,
                  }}
                >
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
          <div ref={listContainerRef} style={emptyPlaceholderStyle} />
        )}
      </div>
    );
  }
);

UnifiedWavesListWaves.displayName = "UnifiedWavesListWaves";
export default UnifiedWavesListWaves;
