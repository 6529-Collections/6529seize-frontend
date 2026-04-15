"use client";

import CommonDropdownItemsDefaultWrapper from "@/components/utils/select/dropdown/CommonDropdownItemsDefaultWrapper";
import type { ApiWave } from "@/generated/models/ApiWave";
import { useRef, useState } from "react";
import WaveDelete from "./delete/WaveDelete";
import WaveMute from "./mute/WaveMute";
import WaveProfileWaveAction from "./profile-wave/WaveProfileWaveAction";

export default function WaveHeaderOptions({
  wave,
}: {
  readonly wave: ApiWave;
}) {
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  return (
    <div className="tw-relative tw-z-20">
      <button
        ref={buttonRef}
        type="button"
        className="tw-flex tw-size-8 tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-transparent tw-text-iron-300 tw-transition tw-duration-300 tw-ease-out hover:tw-bg-iron-800 desktop-hover:hover:tw-text-iron-300 desktop-hover:hover:tw-ring-1 desktop-hover:hover:tw-ring-inset desktop-hover:hover:tw-ring-iron-700"
        id="options-menu-0-button"
        aria-expanded={isOptionsOpen}
        aria-haspopup="true"
        onClick={(e) => {
          e.stopPropagation();
          setIsOptionsOpen((open) => !open);
        }}
      >
        <span className="tw-sr-only">Open options</span>
        <svg
          className="tw-size-5 tw-flex-shrink-0"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M10 3a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM10 8.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM11.5 15.5a1.5 1.5 0 10-3 0 1.5 1.5 0 003 0z" />
        </svg>
      </button>
      <CommonDropdownItemsDefaultWrapper
        isOpen={isOptionsOpen}
        setOpen={setIsOptionsOpen}
        buttonRef={buttonRef}
      >
        <li className="tw-list-none">
          <div className="tw-flex tw-flex-col tw-gap-y-0.5 tw-py-1">
            <WaveProfileWaveAction
              wave={wave}
              onSuccess={() => setIsOptionsOpen(false)}
            />
            <WaveMute wave={wave} onSuccess={() => setIsOptionsOpen(false)} />
            <WaveDelete wave={wave} />
          </div>
        </li>
      </CommonDropdownItemsDefaultWrapper>
    </div>
  );
}
