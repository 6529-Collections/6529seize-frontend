import { useState } from "react";
import CommonAnimationWrapper from "../utils/animation/CommonAnimationWrapper";
import CommonAnimationOpacity from "../utils/animation/CommonAnimationOpacity";
import FilterBuilder from "./FilterBuilder";
import { IProfileAndConsolidations } from "../../entities/IProfile";
import FilterModal from "./FilterModal";

export default function FiltersButton({
  profile,
}: {
  readonly profile: IProfileAndConsolidations;
}) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div>
      <button onClick={() => setIsOpen(!isOpen)}>filters</button>
      <CommonAnimationWrapper mode="sync" initial={true}>
        {isOpen && (
          <CommonAnimationOpacity
            key="modal"
            elementClasses="tw-absolute tw-z-10"
            elementRole="dialog"
            onClicked={(e) => e.stopPropagation()}
          >
            <FilterModal profile={profile} onClose={() => setIsOpen(false)} />
          </CommonAnimationOpacity>
        )}
      </CommonAnimationWrapper>
    </div>
  );
}
