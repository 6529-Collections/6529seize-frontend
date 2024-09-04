import { useState } from "react";
import PencilIcon from "../../../../../../utils/icons/PencilIcon";
import WaveGroupEdit from "./WaveGroupEdit";
import { Wave } from "../../../../../../../generated/models/Wave";
import { WaveGroupType } from "../WaveGroup";
import { CreateNewWave } from "../../../../../../../generated/models/CreateNewWave";

export default function WaveGroupEditButton({
  wave,
  type,
  onEdit,
}: {
  readonly wave: Wave;
  readonly type: WaveGroupType;
  readonly onEdit: (body: CreateNewWave) => void;
}) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  return (
    <div>
      <button
        onClick={() => setIsEditOpen(true)}
        className="tw-border-none tw-bg-transparent tw-p-0 tw-items-center group-hover:tw-block tw-hidden tw-text-neutral-400"
      >
        <PencilIcon />
      </button>
      <WaveGroupEdit
        wave={wave}
        isEditOpen={isEditOpen}
        type={type}
        setIsEditOpen={setIsEditOpen}
        onEdit={(body) => {
          setIsEditOpen(false);
          onEdit(body);
        }}
      />
    </div>
  );
}
