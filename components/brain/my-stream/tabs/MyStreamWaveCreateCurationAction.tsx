"use client";

import { PlusIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import type { ApiWave } from "@/generated/models/ApiWave";
import { useWaveCurations } from "@/hooks/waves/useWaveCurations";
import MyStreamActionTooltip from "../MyStreamActionTooltip";
import MyStreamWaveCurationCreateDialog from "./MyStreamWaveCurationCreateDialog";
import { useState } from "react";

interface MyStreamWaveCreateCurationActionProps {
  readonly wave: ApiWave;
  readonly onCreated: (curationId: string) => void;
  readonly className?: string | undefined;
}

export default function MyStreamWaveCreateCurationAction({
  wave,
  onCreated,
  className,
}: MyStreamWaveCreateCurationActionProps) {
  const { data: curations = [] } = useWaveCurations({
    waveId: wave.id,
  });
  const canManageCurations =
    wave.wave.authenticated_user_eligible_for_admin === true;
  const [isCreateCurationOpen, setIsCreateCurationOpen] = useState(false);

  if (!canManageCurations) {
    return null;
  }

  const createCurationTooltipId = `my-stream-create-curation-${wave.id}`;
  const showCreateFirstCurationCallout = curations.length === 0;
  const createButtonTooltipProps = showCreateFirstCurationCallout
    ? {}
    : {
        "data-tooltip-id": createCurationTooltipId,
        "data-tooltip-content": "Create curation",
      };

  return (
    <>
      <div
        className={clsx(
          "tw-flex tw-flex-shrink-0 tw-items-center tw-gap-2",
          className
        )}
      >
        <button
          type="button"
          onClick={() => setIsCreateCurationOpen(true)}
          {...createButtonTooltipProps}
          className={
            showCreateFirstCurationCallout
              ? "tw-inline-flex tw-h-9 tw-w-9 tw-items-center tw-justify-center tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-text-xs tw-font-semibold tw-text-iron-100 tw-transition desktop-hover:hover:tw-border-iron-500 desktop-hover:hover:tw-bg-iron-800 desktop-hover:hover:tw-text-white md:tw-h-auto md:tw-w-auto md:tw-gap-2 md:tw-rounded-lg md:tw-px-3.5 md:tw-py-2"
              : "tw-inline-flex tw-h-9 tw-w-9 tw-items-center tw-justify-center tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-text-iron-200 tw-transition desktop-hover:hover:tw-border-iron-500 desktop-hover:hover:tw-bg-iron-800 desktop-hover:hover:tw-text-white"
          }
          aria-label="Create curation"
        >
          <PlusIcon
            className={`tw-h-4 tw-w-4 tw-flex-shrink-0 ${
              showCreateFirstCurationCallout ? "md:-tw-ml-1" : ""
            }`}
          />
          {showCreateFirstCurationCallout && (
            <span className="tw-hidden tw-whitespace-nowrap md:tw-inline">
              Create first curation
            </span>
          )}
        </button>
      </div>
      <MyStreamActionTooltip id={createCurationTooltipId} />

      {isCreateCurationOpen && (
        <MyStreamWaveCurationCreateDialog
          wave={wave}
          isOpen={isCreateCurationOpen}
          onClose={() => setIsCreateCurationOpen(false)}
          onSaved={(curation) => onCreated(curation.id)}
        />
      )}
    </>
  );
}
