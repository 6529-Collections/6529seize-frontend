import { useRef, useState } from "react";
import { useClickAway, useKeyPressEvent } from "react-use";
import { IProfileAndConsolidations } from "../../../../entities/IProfile";
import HeaderUserProxyDropdown from "./HeaderUserProxyDropdown";

export default function HeaderUserProxy({
  profile,
}: {
  readonly profile: IProfileAndConsolidations;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  useClickAway(containerRef, () => setIsOpen(false));
  useKeyPressEvent("Escape", () => setIsOpen(false));
  return (
    <div className="tailwind-scope" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        type="button"
        aria-label="Choose proxy"
        title="Choose proxy"
        className="tw-relative tw-flex tw-items-center tw-justify-center tw-rounded-r-lg tw-bg-iron-800 tw-px-2 tw-h-10 tw-ring-1 tw-ring-inset tw-ring-iron-700 tw-border-0 tw-text-iron-50 tw-shadow-sm hover:tw-bg-iron-700 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 tw-transition tw-duration-300 tw-ease-out"
      >
        <svg
          className="tw-h-5 tw-w-5 tw-flex-shrink-0"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M6 9L12 15L18 9"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <HeaderUserProxyDropdown
        profile={profile}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </div>
  );
}
