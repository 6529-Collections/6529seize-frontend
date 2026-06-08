"use client";

import CommonDropdownItemsDefaultWrapper from "@/components/utils/select/dropdown/CommonDropdownItemsDefaultWrapper";
import { useAuth } from "@/components/auth/Auth";
import type { ApiWave } from "@/generated/models/ApiWave";
import { EllipsisVerticalIcon } from "@heroicons/react/24/outline";
import { useRef, useState } from "react";
import CreateWaveModal from "@/components/waves/create-wave/CreateWaveModal";
import WaveDelete from "./delete/WaveDelete";
import WaveMute from "./mute/WaveMute";
import WaveProfileWaveAction from "./profile-wave/WaveProfileWaveAction";

export default function WaveHeaderOptions({
  wave,
  showOwnerActions = true,
}: {
  readonly wave: ApiWave;
  readonly showOwnerActions?: boolean | undefined;
}) {
  const { connectedProfile, activeProfileProxy } = useAuth();
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [isCreateSubwaveOpen, setIsCreateSubwaveOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const isDirectMessage = wave.chat.scope.group?.is_direct_message ?? false;
  const canCreateSubwave =
    Boolean(connectedProfile) &&
    !activeProfileProxy &&
    !isDirectMessage &&
    !wave.parent_wave &&
    wave.wave.authenticated_user_eligible_for_admin === true;

  return (
    <div className="tw-relative tw-z-20">
      <button
        ref={buttonRef}
        type="button"
        className="tw-flex tw-size-9 tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-transparent tw-text-iron-300 tw-transition tw-duration-300 tw-ease-out hover:tw-bg-iron-800 desktop-hover:hover:tw-text-iron-300 desktop-hover:hover:tw-ring-1 desktop-hover:hover:tw-ring-inset desktop-hover:hover:tw-ring-iron-700"
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
            {canCreateSubwave && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsCreateSubwaveOpen(true);
                  setIsOptionsOpen(false);
                }}
                className="tw-flex tw-w-full tw-items-center tw-gap-2 tw-border-none tw-bg-transparent tw-px-3 tw-py-1 tw-text-left tw-text-sm tw-leading-6 tw-text-iron-300 tw-transition tw-duration-300 tw-ease-out hover:tw-bg-iron-800"
                role="menuitem"
                tabIndex={-1}
              >
                Create subwave
              </button>
            )}
            {showOwnerActions && (
              <WaveProfileWaveAction
                wave={wave}
                onSuccess={() => setIsOptionsOpen(false)}
              />
            )}
            <WaveMute wave={wave} onSuccess={() => setIsOptionsOpen(false)} />
            {showOwnerActions && <WaveDelete wave={wave} />}
          </div>
        </li>
      </CommonDropdownItemsDefaultWrapper>
      {connectedProfile && (
        <CreateWaveModal
          isOpen={isCreateSubwaveOpen}
          onClose={() => setIsCreateSubwaveOpen(false)}
          profile={connectedProfile}
          parentWaveId={wave.id}
        />
      )}
    </div>
  );
}
