"use client";

import { useState } from "react";
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
  const [isOpen, setIsOpen] = useState(false);
  const locale = useBrowserLocale();

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(true);
        }}
        aria-label={t(locale, "waves.header.pictureEditLabel")}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        className="tw-pointer-events-none tw-absolute tw-inset-0 tw-flex tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-black/45 tw-p-0 tw-text-iron-100 tw-opacity-0 tw-transition tw-duration-200 tw-ease-out focus:tw-outline-none focus-visible:tw-pointer-events-auto focus-visible:tw-opacity-100 focus-visible:tw-ring-2 focus-visible:tw-ring-primary-500 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-iron-900 desktop-hover:group-hover:tw-pointer-events-auto desktop-hover:group-hover:tw-opacity-100 touch-only:tw-pointer-events-auto touch-only:tw-items-start touch-only:tw-justify-end touch-only:tw-bg-transparent touch-only:tw-opacity-100"
      >
        <span className="tw-flex tw-items-center tw-justify-center touch-only:tw-size-7 touch-only:tw-rounded-full touch-only:tw-border touch-only:tw-border-iron-800/60 touch-only:tw-bg-iron-950 touch-only:tw-shadow-md">
          <PencilIcon size={PencilIconSize.SMALL} />
        </span>
      </button>
      <WaveHeaderPictureEditModal
        key={wave.id}
        isOpen={isOpen}
        wave={wave}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}
