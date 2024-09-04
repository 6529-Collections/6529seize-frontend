import { useState } from "react";
import { Wave } from "../../../../../generated/models/Wave";
import PencilIcon from "../../../../utils/icons/PencilIcon";
import CommonAnimationWrapper from "../../../../utils/animation/CommonAnimationWrapper";
import CommonAnimationOpacity from "../../../../utils/animation/CommonAnimationOpacity";
import WaveHeaderNameEditModal from "./WaveHeaderNameEditModal";

export default function WaveHeaderNameEdit({ wave }: { readonly wave: Wave }) {
  const [isEditNameOpen, setIsEditNameOpen] = useState(false);
  return (
    <div>
      <button
        onClick={() => setIsEditNameOpen(true)}
        className="tw-border-none tw-bg-transparent tw-p-0 tw-items-center tw-pb-3 group-hover:tw-block tw-hidden tw-text-neutral-400"
      >
        <PencilIcon />
      </button>
      <CommonAnimationWrapper mode="sync" initial={true}>
        {isEditNameOpen && (
          <CommonAnimationOpacity
            key="modal"
            elementClasses="tw-absolute tw-z-10"
            elementRole="dialog"
            onClicked={(e) => e.stopPropagation()}
          >
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
