import { useState } from "react";
import CommonAnimationWrapper from "../../utils/animation/CommonAnimationWrapper";
import CommonAnimationOpacity from "../../utils/animation/CommonAnimationOpacity";
import HeaderSearchModal from "./HeaderSearchModal";
import { useKey } from "react-use";

export default function HeaderSearchButton() {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  useKey(
    (event) => event.metaKey && event.key === "k",
    () => setIsOpen(true),
    { event: "keydown" }
  );

  return (
    <div className="tailwind-scope">
      <button
        type="button"
        title="Search"
        aria-label="Search"
        onClick={() => setIsOpen(true)}
        className="lg:tw-ml-4 tw-mr-4 sm:tw-mr-6 min-[1300px]:tw-mr-0 tw-h-10 tw-w-10 tw-flex tw-items-center tw-justify-center tw-bg-transparent tw-focus-none tw-border-none">
        <svg
          className="tw-h-6 tw-w-6 tw-flex-shrink-0 tw-text-iron-300 tw-transition tw-duration-300 tw-ease-out hover:tw-text-iron-50"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg">
          <path
            d="M21 21L16.65 16.65M19 11C19 15.4183 15.4183 19 11 19C6.58172 19 3 15.4183 3 11C3 6.58172 6.58172 3 11 3C15.4183 3 19 6.58172 19 11Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <CommonAnimationWrapper mode="sync" initial={true}>
        {isOpen && (
          <CommonAnimationOpacity
            key="modal"
            elementClasses="tw-absolute tw-z-10"
            elementRole="dialog"
            onClicked={(e) => e.stopPropagation()}>
            <HeaderSearchModal onClose={() => setIsOpen(false)} />
          </CommonAnimationOpacity>
        )}
      </CommonAnimationWrapper>
    </div>
  );
}
