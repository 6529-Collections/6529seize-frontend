import { useState } from "react";
import CommonAnimationWrapper from "../../utils/animation/CommonAnimationWrapper";
import CommonAnimationOpacity from "../../utils/animation/CommonAnimationOpacity";
import SearchProfileModal from "./SearchProfileModal";

export default function SearchProfileButton() {
  const [isSearchProfileOpen, setIsSearchProfileOpen] =
    useState<boolean>(false);

  return (
    <div className="tailwind-scope">
      <button onClick={() => setIsSearchProfileOpen(true)}>search</button>
      <CommonAnimationWrapper mode="sync" initial={true}>
        {isSearchProfileOpen && (
          <CommonAnimationOpacity
            key="modal"
            elementClasses="tw-absolute tw-z-10"
            elementRole="dialog"
            onClicked={(e) => e.stopPropagation()}
          >
            <SearchProfileModal onClose={() => setIsSearchProfileOpen(false)} />
          </CommonAnimationOpacity>
        )}
      </CommonAnimationWrapper>
    </div>
  );
}
