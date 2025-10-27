"use client";

import {
  forwardRef,
  ReactNode,
  useCallback,
  useImperativeHandle,
  useState,
} from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPen } from "@fortawesome/free-solid-svg-icons";
import WaveGroupEdit from "./WaveGroupEdit";
import type { ApiWave } from "@/generated/models/ApiWave";
import { WaveGroupType } from "../WaveGroup.types";
import type { ApiUpdateWaveRequest } from "@/generated/models/ApiUpdateWaveRequest";

export type WaveGroupEditButtonHandle = {
  open: () => void;
};

interface WaveGroupEditButtonProps {
  readonly wave: ApiWave;
  readonly type: WaveGroupType;
  readonly onWaveUpdate: (
    body: ApiUpdateWaveRequest,
    opts?: { readonly skipAuth?: boolean },
  ) => Promise<void>;
  readonly renderTrigger?: ((options: { readonly open: () => void }) => ReactNode) | null;
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

  let triggerContent: ReactNode | null;

  if (renderTrigger) {
    triggerContent = renderTrigger({ open: handleOpen });
  } else if (renderTrigger === null) {
    triggerContent = null;
  } else {
    triggerContent = (
      <button
        type="button"
        aria-label="Edit group"
        title="Edit"
        onClick={handleOpen}
        className="tw-border-none tw-bg-transparent tw-p-0 tw-items-center tw-text-iron-300 hover:tw-text-iron-400 tw-duration-300 tw-ease-out tw-transition-all"
      >
        <FontAwesomeIcon icon={faPen} className="tw-h-4 tw-w-4" />
      </button>
    );
  }

  return (
    <>
      {triggerContent}
      <WaveGroupEdit
        wave={wave}
        isEditOpen={isEditOpen}
        type={type}
        setIsEditOpen={setIsEditOpen}
        onWaveUpdate={async (body) => {
          await onWaveUpdate(body);
          setIsEditOpen(false);
        }}
      />
    </>
  );
});

export default WaveGroupEditButton;
