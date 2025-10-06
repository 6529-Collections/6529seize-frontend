"use client";

import { useState } from "react";
import PencilIcon from "@/components/utils/icons/PencilIcon";
import WaveGroupEdit from "./WaveGroupEdit";
import { ApiWave } from "@/generated/models/ApiWave";
import { WaveGroupType } from "../WaveGroup";
import { ApiUpdateWaveRequest } from "@/generated/models/ApiUpdateWaveRequest";

export default function WaveGroupEditButton({
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
        title="Edit"
        onClick={() => setIsEditOpen(true)}
        className="tw-border-none tw-bg-transparent tw-p-0 tw-items-center tw-text-iron-300 hover:tw-text-iron-400 tw-duration-300 tw-ease-out tw-transition-all">
        <PencilIcon />
      </button>
      <WaveGroupEdit
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
