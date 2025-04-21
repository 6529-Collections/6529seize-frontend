import { useState } from "react";
import CommonAnimationWrapper from "../../utils/animation/CommonAnimationWrapper";
import CommonAnimationOpacity from "../../utils/animation/CommonAnimationOpacity";
import HeaderSearchModal from "./HeaderSearchModal";
import { useKey } from "react-use";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";

export default function HeaderSearchButton() {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  useKey(
    (event) => event.metaKey && event.key === "k",
    () => setIsOpen(true),
    { event: "keydown" }
  );

  return (
    <div className="tailwind-scope tw:self-center">
      <button
        type="button"
        aria-label="Search"
        title="Search"
        onClick={() => setIsOpen(true)}
        className="tw:flex tw:items-center tw:justify-center tw:rounded-lg tw:bg-iron-800 tw:ring-1 tw:ring-inset tw:ring-iron-700 tw:h-10 tw:w-10 tw:border-0 tw:text-iron-300 tw:hover:text-iron-50 tw:shadow-sm tw:hover:bg-iron-700 tw:focus-visible:outline tw:focus-visible:outline-primary-400 tw:transition tw:duration-300 tw:ease-out"
      >
        <FontAwesomeIcon
          icon={faMagnifyingGlass}
          className="tw:size-4 tw:shrink-0"
        />
      </button>
      <CommonAnimationWrapper mode="sync" initial={true}>
        {isOpen && (
          <CommonAnimationOpacity
            key="modal"
            elementClasses="tw:absolute tw:z-10"
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
