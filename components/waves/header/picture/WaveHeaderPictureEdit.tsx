"use client";

import { useState } from "react";
import type { ApiWave } from "@/generated/models/ApiWave";
import PencilIcon, {
  PencilIconSize,
} from "@/components/utils/icons/PencilIcon";
import CommonAnimationWrapper from "@/components/utils/animation/CommonAnimationWrapper";
import CommonAnimationOpacity from "@/components/utils/animation/CommonAnimationOpacity";
import WaveHeaderPictureEditModal from "./WaveHeaderPictureEditModal";

export default function WaveHeaderPictureEdit({
  wave,
}: {
  readonly wave: ApiWave;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(true);
        }}
        aria-label="Edit wave picture"
        className="tw-absolute tw-inset-0 tw-hidden tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-black/45 tw-p-0 tw-text-iron-100 tw-transition tw-duration-200 tw-ease-out focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary-500 focus:tw-ring-offset-2 focus:tw-ring-offset-iron-900 desktop-hover:group-hover:tw-flex touch-only:tw-flex touch-only:tw-items-start touch-only:tw-justify-end touch-only:tw-bg-transparent"
      >
        <span className="tw-flex tw-items-center tw-justify-center touch-only:tw-size-7 touch-only:tw-rounded-full touch-only:tw-border touch-only:tw-border-iron-800/60 touch-only:tw-bg-iron-950 touch-only:tw-shadow-md">
          <PencilIcon size={PencilIconSize.SMALL} />
        </span>
      </button>
      <CommonAnimationWrapper mode="sync" initial={true}>
        {isOpen && (
          <CommonAnimationOpacity
            key="picture-modal"
            elementClasses="tw-absolute tw-z-50"
            elementRole="dialog"
            onClicked={(e) => e.stopPropagation()}
          >
            <WaveHeaderPictureEditModal
              key={wave.id}
              wave={wave}
              onClose={() => setIsOpen(false)}
            />
          </CommonAnimationOpacity>
        )}
      </CommonAnimationWrapper>
    </>
  );
}
