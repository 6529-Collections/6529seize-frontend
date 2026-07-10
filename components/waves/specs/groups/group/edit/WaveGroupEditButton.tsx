"use client";

import type { ReactNode } from "react";
import { forwardRef, useCallback, useImperativeHandle, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPen } from "@fortawesome/free-solid-svg-icons";
import WaveGroupEdit from "./WaveGroupEdit";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { WaveGroupType } from "../WaveGroup.types";
import type { ApiUpdateWaveRequest } from "@/generated/models/ApiUpdateWaveRequest";

export type WaveGroupEditButtonHandle = {
  open: () => void;
};

interface WaveGroupEditButtonProps {
  readonly wave: ApiWave;
  readonly type: WaveGroupType;
  readonly onWaveUpdate: (
    body: ApiUpdateWaveRequest,
    opts?: { readonly skipAuth?: boolean | undefined }
  ) => Promise<void>;
  readonly renderTrigger?:
    | ((options: { readonly open: () => void }) => ReactNode)
    | null
    | undefined;
}

const WaveGroupEditButton = forwardRef<
  WaveGroupEditButtonHandle,
  WaveGroupEditButtonProps
>(function WaveGroupEditButton(
  { wave, type, onWaveUpdate, renderTrigger },
  ref
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
    [handleOpen]
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
        className="tw-flex tw-h-6 tw-w-6 tw-items-center tw-justify-center tw-rounded-lg tw-border-none tw-bg-transparent tw-p-0 tw-text-iron-500 tw-transition-all tw-duration-300 tw-ease-out hover:tw-bg-iron-800 hover:tw-text-iron-300 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
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
