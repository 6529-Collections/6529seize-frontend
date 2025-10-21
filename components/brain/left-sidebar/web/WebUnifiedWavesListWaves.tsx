"use client";

import React, {
  useMemo,
  forwardRef,
  useImperativeHandle,
  useRef,
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
import { Tooltip as ReactTooltip } from "react-tooltip";
import useCreateModalState from "@/hooks/useCreateModalState";

function isValidWave(wave: unknown): wave is MinimalWave {
  if (wave === null || wave === undefined || typeof wave !== "object") {
    return false;
  }

  const w = wave as MinimalWave;
  return (
    typeof w.id === "string" &&
    w.id.length > 0 &&
    typeof w.name === "string" &&
    typeof w.isPinned === "boolean"
  );
}

const EMPTY_WAVES_PLACEHOLDER_HEIGHT = "48px" as const;

const WAVE_ROW_HEIGHT_DEFAULT = 62 as const;
const WAVE_ROW_HEIGHT_CONDENSED = 52 as const;

export interface WebUnifiedWavesListWavesHandle {
  sentinelRef: React.RefObject<HTMLElement | null>;
}

interface WebUnifiedWavesListWavesProps {
  readonly waves: MinimalWave[];
  readonly onHover: (waveId: string) => void;
  readonly hideHeaders?: boolean;
  readonly hideToggle?: boolean;
  readonly hidePin?: boolean;
  readonly scrollContainerRef?: React.RefObject<HTMLElement | null>;
  readonly basePath?: string;
  readonly isCondensed?: boolean;
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
      basePath = "/waves",
      isCondensed = false,
    },
    ref
  ) => {
    const listContainerRef = useRef<HTMLDivElement>(null);
    const sentinelRef = useRef<HTMLDivElement>(null);
    const { connectedProfile } = useAuth();
    const { isWaveModalOpen, openWave, close, isApp } = useCreateModalState();

    const globalScope = globalThis as typeof globalThis & {
      window?: Window;
      navigator?: Navigator;
    };
    const browserWindow = globalScope.window;
    const browserNavigator = globalScope.navigator;

    const isTouchDevice =
      !!browserWindow &&
      ("ontouchstart" in browserWindow ||
        (browserNavigator?.maxTouchPoints ?? 0) > 0 ||
        browserWindow.matchMedia?.("(pointer: coarse)")?.matches);

    useImperativeHandle(ref, () => ({
      sentinelRef,
    }));

    const shouldRenderCreateWaveButton = !isApp && !!connectedProfile;

    const { pinnedWaves, regularWaves } = useMemo(() => {
      const pinned: MinimalWave[] = [];
      const regular: MinimalWave[] = [];

      for (const wave of waves) {
        if (wave.isPinned) {
          pinned.push(wave);
        } else {
          regular.push(wave);
        }
      }

      return { pinnedWaves: pinned, regularWaves: regular };
    }, [waves]);

    const rowHeight = isCondensed
      ? WAVE_ROW_HEIGHT_CONDENSED
      : WAVE_ROW_HEIGHT_DEFAULT;

    const virtual = useVirtualizedWaves<MinimalWave>(
      regularWaves,
      "web-unified-waves-regular",
      scrollContainerRef || listContainerRef,
      listContainerRef,
      rowHeight,
      5
    );

    return (
      <>
        <div className="tw-flex tw-flex-col">
          {!hideHeaders &&
            (isCondensed ? (
              shouldRenderCreateWaveButton && (
                <div className="tw-flex tw-justify-center tw-px-2 tw-mb-3.5">
                  <div
                    data-tooltip-id="create-wave-tooltip"
                    data-tooltip-content="Create wave"
                  >
                    <PrimaryButton
                      onClicked={openWave}
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
                </div>
              )
            ) : (
              <SectionHeader
                label="Waves"
                rightContent={
                  shouldRenderCreateWaveButton ? (
                    <div
                      data-tooltip-id="create-wave-tooltip"
                      data-tooltip-content="Create wave"
                    >
                      <PrimaryButton
                        onClicked={openWave}
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
            ))}

          {!hideHeaders && !hideToggle && !isCondensed && (
            <div className="tw-pb-3 tw-mt-4 tw-flex tw-px-4">
              <WavesFilterToggle />
            </div>
          )}

          <div>
          {!hideHeaders && pinnedWaves.length > 0 && (
            <section
              className={`tw-flex tw-flex-col ${
                isCondensed ? "tw-gap-y-2 tw-items-center" : ""
              }`}
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
                  <div key={wave.id} className="tw-w-full">
                    <WebBrainLeftSidebarWave
                      wave={wave}
                      onHover={onHover}
                      showPin={!hidePin && !isCondensed}
                      basePath={basePath}
                      condensed={isCondensed}
                    />
                  </div>
                ))}
            </section>
          )}
          {!hideHeaders &&
            pinnedWaves.length > 0 &&
            regularWaves.length > 0 && (
              <div className="tw-border-t tw-border-iron-700 tw-border-solid tw-border-x-0 tw-border-b-0 tw-my-3" />
            )}
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
                        basePath={basePath}
                        condensed={isCondensed}
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

        {connectedProfile && (
          <CreateWaveModal
            isOpen={isWaveModalOpen}
            onClose={close}
            profile={connectedProfile}
          />
        )}

        {!isTouchDevice && (
          <ReactTooltip
            id="create-wave-tooltip"
            place="bottom"
            offset={8}
            opacity={1}
            style={{
              padding: "6px 10px",
              background: "#37373E",
              color: "white",
              fontSize: "12px",
              fontWeight: 500,
              borderRadius: "6px",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
              zIndex: 10000,
            }}
            border="1px solid #4C4C55"
          />
        )}
      </>
    );
  }
);

WebUnifiedWavesListWaves.displayName = "WebUnifiedWavesListWaves";
export default WebUnifiedWavesListWaves;
