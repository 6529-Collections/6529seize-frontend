"use client";

import React, {
  useMemo,
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { MinimalWave } from "../../../../contexts/wave/hooks/useEnhancedWavesList";
import WebBrainLeftSidebarWave from "./WebBrainLeftSidebarWave";
import SectionHeader from "../waves/SectionHeader";
import WavesFilterToggle from "../waves/WavesFilterToggle";
import {
  useVirtualizedWaves,
  VirtualItem,
} from "../../../../hooks/useVirtualizedWaves";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import PrimaryButton from "@/components/utils/button/PrimaryButton";
import CreateWaveModal from "../../../waves/create-wave/CreateWaveModal";
import { useAuth } from "../../../auth/Auth";
import useDeviceInfo from "../../../../hooks/useDeviceInfo";
import Tooltip from "../../../common/Tooltip";

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
>(
  (
    {
      waves,
      onHover,
      hideHeaders = false,
      hideToggle = false,
      hidePin = false,
      scrollContainerRef,
    },
    ref
  ) => {
    const listContainerRef = useRef<HTMLDivElement>(null);
    const sentinelRef = useRef<HTMLDivElement>(null);
    const { connectedProfile } = useAuth();
    const { isApp } = useDeviceInfo();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

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
      <>
        <div className="tw-flex tw-flex-col">
          {/* Waves header with create button */}
          {!hideHeaders && (
            <SectionHeader
              label="Waves"
              rightContent={
                !isApp && connectedProfile ? (
                  <div 
                    data-tooltip-id="create-wave-tooltip"
                    data-tooltip-content="Create wave"
                  >
                    <PrimaryButton
                      onClicked={() => setIsCreateModalOpen(true)}
                      loading={false}
                      disabled={false}
                      padding="tw-px-2 tw-py-2"
                    >
                      <FontAwesomeIcon
                        icon={faPlus}
                        className="tw-size-4 tw-flex-shrink-0"
                      />
                    </PrimaryButton>
                  </div>
                ) : undefined
              }
            />
          )}

          {/* Waves filter toggle on its own row */}
          {!hideHeaders && !hideToggle && (
            <div className="tw-pb-3 tw-mt-4 tw-flex tw-px-4">
              <WavesFilterToggle />
            </div>
          )}

          <div>
            {/* Conditionally show pinned section */}
            {!hideHeaders && pinnedWaves.length > 0 && (
              <>
                <section
                  className="tw-flex tw-flex-col"
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
            <div className="tw-border-t tw-border-iron-700 tw-border-solid tw-border-x-0 tw-border-b-0 tw-my-3"></div>
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
              <div
                ref={listContainerRef}
                style={{ minHeight: EMPTY_WAVES_PLACEHOLDER_HEIGHT }}
              />
            )}
          </div>
        </div>

        {/* Create Wave Modal */}
        {connectedProfile && (
          <CreateWaveModal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            profile={connectedProfile}
          />
        )}
        
        {/* Tooltip */}
        <Tooltip id="create-wave-tooltip" />
      </>
    );
  }
);

WebUnifiedWavesListWaves.displayName = "WebUnifiedWavesListWaves";
export default WebUnifiedWavesListWaves;
