"use client";

import {
  forwardRef,
  ReactNode,
  useCallback,
  useImperativeHandle,
  useState,
} from "react";
import { faCircleXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { ApiWave } from "@/generated/models/ApiWave";
import { WaveGroupType } from "../WaveGroup.types";
import WaveGroupRemove from "./WaveGroupRemove";
import type { ApiUpdateWaveRequest } from "@/generated/models/ApiUpdateWaveRequest";

export type WaveGroupRemoveButtonHandle = {
  open: () => void;
};

interface WaveGroupRemoveButtonProps {
  readonly wave: ApiWave;
  readonly type: WaveGroupType;
  readonly onWaveUpdate: (
    body: ApiUpdateWaveRequest,
    opts?: { readonly skipAuth?: boolean },
  ) => Promise<void>;
  readonly renderTrigger?: ((options: { readonly open: () => void }) => ReactNode) | null;
}

const WaveGroupRemoveButton = forwardRef<
  WaveGroupRemoveButtonHandle,
  WaveGroupRemoveButtonProps
>(function WaveGroupRemoveButton(
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

  const handleWaveUpdate = useCallback(
    async (body: ApiUpdateWaveRequest) => {
      await onWaveUpdate(body);
      setIsEditOpen(false);
    },
    [onWaveUpdate],
  );

  let triggerContent: ReactNode | null;

  if (renderTrigger === null) {
    triggerContent = null;
  } else if (renderTrigger) {
    triggerContent = renderTrigger({ open: handleOpen });
  } else {
    triggerContent = (
      <button
        type="button"
        aria-haspopup="dialog"
        aria-label="Remove"
        title="Remove"
        onClick={handleOpen}
        className="tw-border-none tw-bg-transparent tw-p-0 tw-flex tw-items-center">
        <FontAwesomeIcon
          icon={faCircleXmark}
          className="tw-flex-shrink-0 tw-size-5 tw-text-red tw-transition tw-duration-300 tw-ease-out hover:tw-scale-110"
        />
      </button>
    );
  }

  return (
    <>
      {triggerContent}
      <WaveGroupRemove
        wave={wave}
        isEditOpen={isEditOpen}
        type={type}
        setIsEditOpen={setIsEditOpen}
        onWaveUpdate={handleWaveUpdate}
      />
    </>
  );
});

export default WaveGroupRemoveButton;
