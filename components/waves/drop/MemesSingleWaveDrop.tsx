"use client";

import React, { useCallback, useMemo, useState } from "react";
import { SingleWaveDropChat } from "./SingleWaveDropChat";
import { DropSize, ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { useDrop } from "@/hooks/useDrop";
import { useWaveData } from "@/hooks/useWaveData";
import { MemesSingleWaveDropInfoPanel } from "./MemesSingleWaveDropInfoPanel";
import { useRouter, usePathname } from "next/navigation";
import { XMarkIcon } from "@heroicons/react/24/outline";

interface MemesSingleWaveDropProps {
  readonly drop: ExtendedDrop;
  readonly onClose: () => void;
}

export const MemesSingleWaveDrop: React.FC<MemesSingleWaveDropProps> = ({
  drop: initialDrop,
  onClose,
}) => {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const { drop } = useDrop({ dropId: initialDrop.id });

  const onWaveNotFound = useCallback(() => {
    router.push(pathname);
  }, [router, pathname]);

  const { data: wave } = useWaveData({
    waveId: drop?.wave.id ?? null,
    onWaveNotFound,
  });

  const [isChatOpen, setIsChatOpen] = useState(false);

  const toggleChat = useCallback(() => {
    setIsChatOpen((prev) => !prev);
  }, []);

  const extendedDrop = useMemo(
    () =>
      drop
        ? {
            type: DropSize.FULL as const,
            ...drop,
            stableHash: initialDrop.stableHash,
            stableKey: initialDrop.stableKey,
          }
        : null,
    [drop, initialDrop.stableHash, initialDrop.stableKey]
  );

  return (
    <div className="tw-w-full tw-h-full tw-bg-black tw-flex tw-flex-col lg:tw-flex-row">
      <div className="tw-flex-1 tw-relative tw-h-full lg:tw-h-screen">
        <header className="tw-absolute tw-top-0 tw-left-0 tw-right-3 tw-py-4 lg:tw-pb-8 tw-flex tw-justify-center tw-z-20 tw-pointer-events-none tw-bg-gradient-to-b tw-from-black tw-via-black/80 tw-to-transparent">
          <div className="tw-w-full tw-px-8 tw-flex tw-items-center tw-justify-between tw-pointer-events-auto">
            <span className="tw-text-xs tw-text-white/30 tw-font-medium tw-uppercase tw-tracking-widest">
              {wave?.name ?? "The Memes"}
            </span>
            <button
              type="button"
              aria-label="Close panel"
              onClick={onClose}
              className="tw-flex tw-items-center tw-justify-center tw-h-10 tw-w-10 tw-flex-shrink-0 tw-rounded-full tw-bg-iron-950 tw-text-white tw-transition tw-duration-200 tw-border tw-border-solid tw-border-iron-800/70 desktop-hover:hover:tw-border-iron-700 desktop-hover:hover:tw-bg-iron-900 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-iron-600/70 active:tw-scale-95"
            >
              <XMarkIcon className="tw-w-5 tw-h-5 tw-flex-shrink-0" />
            </button>
          </div>
        </header>

        <div className="tw-h-full tw-overflow-y-auto tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 hover:tw-scrollbar-thumb-iron-300">
          {extendedDrop && wave && (
            <MemesSingleWaveDropInfoPanel
              drop={extendedDrop}
              wave={wave}
              isChatOpen={isChatOpen}
              onToggleChat={toggleChat}
            />
          )}
        </div>
      </div>

      <div
        className={`tw-hidden lg:tw-flex tw-flex-col tw-h-full tw-bg-black tw-transition-all tw-duration-300 tw-ease-in-out ${
          isChatOpen
            ? "tw-w-[400px] tw-border-l tw-border-solid tw-border-white/10 tw-border-y-0 tw-border-r-0"
            : "tw-w-0 tw-overflow-hidden tw-border-none"
        }`}
      >
        {wave && drop && (
          <SingleWaveDropChat key={drop.id} wave={wave} drop={drop} />
        )}
      </div>
    </div>
  );
};
