"use client";

import { useState } from "react";
import type { ApiWave } from "@/generated/models/ApiWave";
import PencilIcon, { PencilIconSize } from "@/components/utils/icons/PencilIcon";
import CommonAnimationWrapper from "@/components/utils/animation/CommonAnimationWrapper";
import CommonAnimationOpacity from "@/components/utils/animation/CommonAnimationOpacity";
import WaveHeaderNameEditModal from "./WaveHeaderNameEditModal";

export default function WaveHeaderNameEdit({
  wave,
}: {
  readonly wave: ApiWave;
}) {
  const [isEditNameOpen, setIsEditNameOpen] = useState(false);
  return (
    <div>
      <button
        onClick={() => setIsEditNameOpen(true)}
        className="tw-border-none tw-bg-transparent tw-p-0 tw-items-center desktop-hover:group-hover:tw-flex tw-hidden tw-text-iron-300 desktop-hover:hover:tw-text-iron-400 tw-duration-300 tw-ease-out tw-transition-all">
        <PencilIcon size={PencilIconSize.SMALL} />
      </button>
      <CommonAnimationWrapper mode="sync" initial={true}>
        {isEditNameOpen && (
          <CommonAnimationOpacity
            key="modal"
            elementClasses="tw-absolute tw-z-50"
            elementRole="dialog"
            onClicked={(e) => e.stopPropagation()}>
            <WaveHeaderNameEditModal
              wave={wave}
              onClose={() => setIsEditNameOpen(false)}
            />
          </CommonAnimationOpacity>
        )}
      </CommonAnimationWrapper>
    </div>
  );
}
