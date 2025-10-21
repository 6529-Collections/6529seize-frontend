"use client";

import {
  forwardRef,
  ReactNode,
  useCallback,
  useImperativeHandle,
  useState,
} from "react";
import PencilIcon from "@/components/utils/icons/PencilIcon";
import WaveGroupEdit from "./WaveGroupEdit";
import { ApiWave } from "@/generated/models/ApiWave";
import { WaveGroupType } from "../WaveGroup";
import { ApiUpdateWaveRequest } from "@/generated/models/ApiUpdateWaveRequest";

export type WaveGroupEditButtonHandle = {
  open: () => void;
};

interface WaveGroupEditButtonProps {
  readonly wave: ApiWave;
  readonly type: WaveGroupType;
  readonly onWaveUpdate: (body: ApiUpdateWaveRequest) => Promise<void>;
  readonly renderTrigger?: (options: { open: () => void }) => ReactNode;
}

const WaveGroupEditButton = forwardRef<
  WaveGroupEditButtonHandle,
  WaveGroupEditButtonProps
>(function WaveGroupEditButton(
  { wave, type, onWaveUpdate, renderTrigger },
  ref,
) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const handleOpen = useCallback(() => {
    setIsEditOpen(true);
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      open: handleOpen,
    }),
    [handleOpen],
  );

  return (
    <>
      {renderTrigger ? (
        renderTrigger({ open: handleOpen })
      ) : (
        <button
          title="Edit"
          onClick={handleOpen}
          className="tw-border-none tw-bg-transparent tw-p-0 tw-items-center tw-text-iron-300 hover:tw-text-iron-400 tw-duration-300 tw-ease-out tw-transition-all">
          <PencilIcon />
        </button>
      )}
      <WaveGroupEdit
        wave={wave}
        isEditOpen={isEditOpen}
        type={type}
        setIsEditOpen={setIsEditOpen}
        onWaveUpdate={async (body) => {
          setIsEditOpen(false);
          await onWaveUpdate(body);
        }}
      />
    </>
  );
});

export default WaveGroupEditButton;
