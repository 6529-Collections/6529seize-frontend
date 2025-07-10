"use client";

import { useState } from "react";
import { ApiWave } from "../../../../../../generated/models/ApiWave";
import { WaveGroupType } from "../WaveGroup";
import WaveGroupRemove from "./WaveGroupRemove";
import { ApiUpdateWaveRequest } from "../../../../../../generated/models/ApiUpdateWaveRequest";

export default function WaveGroupRemoveButton({
  wave,
  type,
  onEdit,
}: {
  readonly wave: ApiWave;
  readonly type: WaveGroupType;
  readonly onEdit: (body: ApiUpdateWaveRequest) => Promise<void>;
}) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  return (
    <div>
      <button
        title="Remove"
        onClick={() => setIsEditOpen(true)}
        className="tw-border-none tw-bg-transparent tw-p-0 tw-items-center">
        <svg
          className="tw-flex-shrink-0 tw-size-5 tw-text-red tw-transition tw-duration-300 tw-ease-out hover:tw-scale-110"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg">
          <path
            d="M15 9L9 15M9 9L15 15M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <WaveGroupRemove
        wave={wave}
        isEditOpen={isEditOpen}
        type={type}
        setIsEditOpen={setIsEditOpen}
        onEdit={async (body) => {
          setIsEditOpen(false);
          await onEdit(body);
        }}
      />
    </div>
  );
}
