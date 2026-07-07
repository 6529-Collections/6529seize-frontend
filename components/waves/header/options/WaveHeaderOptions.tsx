"use client";

import CommonDropdownItemsDefaultWrapper from "@/components/utils/select/dropdown/CommonDropdownItemsDefaultWrapper";
import type { ApiWave } from "@/generated/models/ApiWave";
import { EllipsisVerticalIcon } from "@heroicons/react/24/outline";
import { useRef, useState } from "react";
import WaveDelete from "./delete/WaveDelete";
import WaveProfileWaveAction from "./profile-wave/WaveProfileWaveAction";

export default function WaveHeaderOptions({
  wave,
  showOwnerActions,
}: {
  readonly wave: ApiWave;
  readonly showOwnerActions: boolean;
}) {
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  if (!showOwnerActions) {
    return null;
  }

  return (
    <div className="tw-relative tw-z-20">
      <button
        ref={buttonRef}
        type="button"
        className="tw-flex tw-size-8 tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-transparent tw-text-iron-500 tw-transition-all tw-duration-200 active:tw-bg-iron-700 desktop-hover:hover:tw-bg-iron-700 desktop-hover:hover:tw-text-iron-300"
        id="options-menu-0-button"
        aria-expanded={isOptionsOpen}
        aria-haspopup="true"
        onClick={(e) => {
          e.stopPropagation();
          setIsOptionsOpen((open) => !open);
        }}
      >
        <span className="tw-sr-only">Open options</span>
        <EllipsisVerticalIcon
          className="tw-size-4 tw-flex-shrink-0"
          aria-hidden="true"
        />
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
            <WaveDelete wave={wave} />
          </div>
        </li>
      </CommonDropdownItemsDefaultWrapper>
    </div>
  );
}
