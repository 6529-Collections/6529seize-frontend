import { useState } from "react";
import clsx from "clsx";
import useDeviceInfo from "../../../hooks/useDeviceInfo";
import CommonAnimationWrapper from "../../utils/animation/CommonAnimationWrapper";
import CommonAnimationOpacity from "../../utils/animation/CommonAnimationOpacity";
import HeaderSearchModal from "./HeaderSearchModal";
import { useKey } from "react-use";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

export default function HeaderSearchButton() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const { isApp } = useDeviceInfo();

  useKey(
    (event) => event.metaKey && event.key === "k",
    () => setIsOpen(true),
    { event: "keydown" }
  );

  const iconSizeClasses = isApp ? "tw-h-6 tw-w-6" : "tw-h-5 tw-w-5";

  return (
    <div className="tailwind-scope tw-self-center">
      <button
        type="button"
        aria-label="Search"
        title="Search"
        onClick={() => setIsOpen(true)}
        className={clsx(
          "tw-flex tw-items-center tw-justify-center tw-rounded-lg tw-h-10 tw-w-10 tw-border-0 tw-text-iron-300 hover:tw-text-iron-50 tw-shadow-sm focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 tw-transition tw-duration-300 tw-ease-out",
          isApp
            ? "tw-bg-black"
            : "tw-bg-iron-800 tw-ring-1 tw-ring-inset tw-ring-iron-700 hover:tw-bg-iron-700"
        )}
      >
        <MagnifyingGlassIcon
          className={clsx("tw-flex-shrink-0", iconSizeClasses)}
        />
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
