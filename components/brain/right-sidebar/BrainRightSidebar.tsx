"use client";

import React, { useState } from "react";
import { createPortal } from "react-dom";
import type { ApiWave } from "@/generated/models/ApiWave";
import { commonApiFetch } from "@/services/api/common-api";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { WaveContent } from "./WaveContent";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { useSidebarState } from "../../../hooks/useSidebarState";
import { ChevronDoubleRightIcon } from "@heroicons/react/24/outline";
import { Mode, type SidebarTab } from "./BrainRightSidebarTypes";

export { SidebarTab } from "./BrainRightSidebarTypes";

interface BrainRightSidebarProps {
  readonly waveId: string | null | undefined;
  readonly activeTab: SidebarTab;
  readonly setActiveTab: (tab: SidebarTab) => void;
  readonly variant?: "overlay" | "inline" | undefined;
}

interface SidebarState {
  readonly wave: ApiWave | undefined;
  readonly mode: Mode;
  readonly setMode: React.Dispatch<React.SetStateAction<Mode>>;
  readonly close: () => void;
}

const useBrainRightSidebarState = (
  waveId: string | null | undefined
): SidebarState => {
  const { closeRightSidebar } = useSidebarState();

  const { data: wave } = useQuery<ApiWave>({
    queryKey: [QueryKey.WAVE, { wave_id: waveId }],
    queryFn: async () => {
      if (!waveId) {
        throw new Error("Wave id is required");
      }
      return commonApiFetch<ApiWave>({
        endpoint: `waves/${waveId}`,
      });
    },
    enabled: !!waveId,
    staleTime: 60000,
    placeholderData: keepPreviousData,
  });

  const [mode, setMode] = useState<Mode>(Mode.CONTENT);

  return {
    wave,
    mode,
    setMode,
    close: closeRightSidebar,
  };
};

const SidebarContent = ({
  wave,
  mode,
  setMode,
  activeTab,
  setActiveTab,
}: {
  wave: ApiWave | undefined;
  mode: Mode;
  setMode: React.Dispatch<React.SetStateAction<Mode>>;
  activeTab: SidebarTab;
  setActiveTab: (tab: SidebarTab) => void;
}) => {
  if (!wave) return null;

  return (
    <WaveContent
      wave={wave}
      mode={mode}
      setMode={setMode}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
    />
  );
};

const BrainRightSidebar: React.FC<BrainRightSidebarProps> = ({
  waveId,
  activeTab,
  setActiveTab,
  variant = "overlay",
}) => {
  const { wave, mode, setMode, close } = useBrainRightSidebarState(waveId);
  const isOverlay = variant === "overlay";

  const panel = (
    <div
      className={`tw-flex tw-h-full tw-w-[20.5rem] tw-min-w-0 tw-max-w-full tw-flex-col tw-overflow-hidden tw-bg-iron-950 ${
        isOverlay
          ? `tw-fixed tw-inset-y-0 tw-right-0 tw-z-[100] tw-border-y-0 tw-border-l tw-border-r-0 tw-border-solid tw-border-iron-800 tw-shadow-2xl lg:tw-bg-opacity-95 lg:tw-backdrop-blur min-[1300px]:tw-bg-opacity-100 min-[1300px]:tw-backdrop-blur-none`
          : "tw-max-h-[calc(100vh-16px)] tw-rounded-lg tw-border tw-border-solid tw-border-iron-800"
      }`}
    >
      {isOverlay && (
        <div className="tw-absolute -tw-left-5 tw-top-2 tw-z-[110]">
          <button
            type="button"
            onClick={close}
            className="tw-group tw-flex tw-size-8 tw-items-center tw-justify-center tw-rounded-xl tw-border tw-border-r-0 tw-border-solid tw-border-iron-650 tw-bg-iron-700 tw-shadow-[0_8px_20px_rgba(0,0,0,0.35)] tw-transition-all tw-duration-200 desktop-hover:hover:tw-border-iron-500 desktop-hover:hover:tw-bg-iron-600 desktop-hover:hover:tw-shadow-[0_12px_26px_rgba(0,0,0,0.45)]"
            aria-label="Close sidebar"
          >
            <ChevronDoubleRightIcon
              strokeWidth={2}
              className="tw-size-4 tw-text-iron-200 tw-transition-all tw-duration-200"
            />
          </button>
        </div>
      )}

      <div className="tw-h-full tw-min-h-0 tw-min-w-0 tw-overflow-hidden tw-text-sm tw-text-iron-500">
        <SidebarContent
          wave={wave}
          mode={mode}
          setMode={setMode}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      </div>
    </div>
  );

  if (isOverlay && typeof document !== "undefined") {
    return createPortal(
      <>
        <button
          type="button"
          onClick={close}
          aria-label="Close right overlay"
          className="tw-fixed tw-inset-0 tw-z-[90] tw-border-0 tw-bg-black/50 focus:tw-outline-none"
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              close();
            }
          }}
        />
        {panel}
      </>,
      document.body
    );
  }

  return panel;
};

export default BrainRightSidebar;
