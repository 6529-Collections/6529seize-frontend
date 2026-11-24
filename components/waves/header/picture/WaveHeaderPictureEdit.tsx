"use client";

import { useRef, useState } from "react";
import { useAuth } from "@/components/auth/Auth";
import {
  getWaveImageFileError,
  WAVE_IMAGE_TYPES,
} from "@/components/waves/create-wave/overview/wave-image-file";
import { createPortal } from "react-dom";
import {
  useWaveInformationPanel,
  WAVE_PICTURE_EDIT_VIEW,
} from "@/components/brain/mobile/WaveInformationPanelContext";
import type { ApiWave } from "@/generated/models/ApiWave";
import PencilIcon, {
  PencilIconSize,
} from "@/components/utils/icons/PencilIcon";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import WaveHeaderPictureEditModal from "./WaveHeaderPictureEditModal";

export default function WaveHeaderPictureEdit({
  wave,
}: {
  readonly wave: ApiWave;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { setToast } = useAuth();
  const locale = useBrowserLocale();
  const panel = useWaveInformationPanel(
    t(locale, "waves.header.pictureEditTitle"),
    WAVE_PICTURE_EDIT_VIEW
  );
  const editor = (
    <WaveHeaderPictureEditModal
      key={
        selectedFile
          ? `${selectedFile.name}:${selectedFile.lastModified}`
          : wave.id
      }
      initialFile={panel.isPhone ? selectedFile : null}
      isOpen={panel.isOpen}
      wave={wave}
      onClose={() => {
        setSelectedFile(null);
        panel.close();
      }}
      embedded={panel.isInSheet}
    />
  );

  return (
    <>
      {panel.isPhone && (
        <input
          ref={input}
          type="file"
          accept={WAVE_IMAGE_TYPES.join(",")}
          className="tw-hidden"
          aria-label={t(locale, "waves.information.choosePicture")}
          onChange={(event) => {
            const file = event.target.files?.item(0);
            event.target.value = "";
            if (!file) return;
            const message = getWaveImageFileError(file);
            if (message !== null) {
              setToast({ type: "error", message });
              return;
            }
            setSelectedFile(file);
            panel.open();
          }}
        />
      )}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (panel.isPhone) input.current?.click();
          else panel.open(e.currentTarget);
        }}
        aria-label={t(locale, "waves.header.pictureEditLabel")}
        aria-expanded={panel.isOpen}
        aria-controls={panel.isInSheet ? panel.contentId : undefined}
        aria-haspopup={panel.isInSheet ? undefined : "dialog"}
        className="tw-pointer-events-none tw-absolute tw-inset-0 tw-flex tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-black/45 tw-p-0 tw-text-iron-100 tw-opacity-0 tw-transition tw-duration-200 tw-ease-out focus:tw-outline-none focus-visible:tw-pointer-events-auto focus-visible:tw-opacity-100 focus-visible:tw-ring-2 focus-visible:tw-ring-primary-500 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-iron-900 desktop-hover:group-hover:tw-pointer-events-auto desktop-hover:group-hover:tw-opacity-100 touch-only:tw-pointer-events-auto touch-only:tw-items-start touch-only:tw-justify-end touch-only:tw-bg-transparent touch-only:tw-opacity-100"
      >
        <span className="tw-flex tw-items-center tw-justify-center touch-only:tw-size-7 touch-only:tw-rounded-full touch-only:tw-border touch-only:tw-border-iron-800/60 touch-only:tw-bg-iron-950 touch-only:tw-shadow-md">
          <PencilIcon size={PencilIconSize.SMALL} />
        </span>
      </button>
      {panel.isInSheet
        ? panel.isOpen &&
          panel.container &&
          createPortal(editor, panel.container)
        : editor}
    </>
  );
}
