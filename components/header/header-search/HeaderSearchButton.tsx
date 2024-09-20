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
    <div className="tailwind-scope tw-self-center">
      <button
        type="button"
        aria-label="Search"
        title="Search"
        onClick={() => setIsOpen(true)}
        className="tw-flex tw-items-center tw-justify-center tw-rounded-lg tw-bg-iron-800 tw-ring-1 tw-ring-inset tw-ring-iron-700 tw-h-10 tw-w-10 tw-border-0 tw-text-iron-300 hover:tw-text-iron-50 tw-shadow-sm hover:tw-bg-iron-700 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 tw-transition tw-duration-300 tw-ease-out"
      >
        <svg
          className="tw-h-5 tw-w-5 tw-flex-shrink-0"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
          />
        </svg>
      </button>
      <CommonAnimationWrapper mode="sync" initial={true}>
        {isOpen && (
          <CommonAnimationOpacity
            key="modal"
            elementClasses="tw-absolute tw-z-10"
            elementRole="dialog"
            onClicked={(e) => e.stopPropagation()}
          >
            <HeaderSearchModal onClose={() => setIsOpen(false)} />
          </CommonAnimationOpacity>
        )}
      </CommonAnimationWrapper>
    </div>
  );
}
