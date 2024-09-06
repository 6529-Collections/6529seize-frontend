import { useState } from "react";
import PencilIcon from "../../../../../../utils/icons/PencilIcon";
import WaveGroupEdit from "./WaveGroupEdit";
import { Wave } from "../../../../../../../generated/models/Wave";
import { WaveGroupType } from "../WaveGroup";
import { UpdateWaveRequest } from "../../../../../../../generated/models/UpdateWaveRequest";

export default function WaveGroupEditButton({
  wave,
  type,
  onEdit,
}: {
  readonly wave: Wave;
  readonly type: WaveGroupType;
  readonly onEdit: (body: UpdateWaveRequest) => Promise<void>;
}) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  return (
    <div>
      <button
        title="Edit"
        onClick={() => setIsEditOpen(true)}
        className="tw-border-none tw-bg-transparent tw-p-0 tw-items-center group-hover:tw-block tw-hidden tw-text-iron-300 hover:tw-text-iron-400 tw-duration-300 tw-ease-out tw-transition-all"
      >
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
