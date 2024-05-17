import { useContext, useRef, useState } from "react";
import { AuthContext } from "../../auth/Auth";
import HeaderProxyDropdown from "./HeaderProxyDropdown";
import { useClickAway, useKeyPressEvent } from "react-use";
import { ProfileProxy } from "../../../generated/models/ProfileProxy";

export default function HeaderProxy() {
  const {
    activeProfileProxy,
    receivedProfileProxies,
    setActiveProfileProxy,
    connectedProfile,
  } = useContext(AuthContext);

  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  useClickAway(containerRef, () => setIsOpen(false));
  useKeyPressEvent("Escape", () => setIsOpen(false));

  const onActiveProfileProxy = async (profileProxy: ProfileProxy | null) => {
    await setActiveProfileProxy(profileProxy);
    setIsOpen(false);
  };

  if (!receivedProfileProxies.length || !connectedProfile) return null;
  return (
    <div className="tailwind-scope tw-relative" ref={containerRef}>
      <button
        aria-label="Choose proxy"
        title="Choose proxy"
        type="button"
        className="tw-bg-white tw-h-10 tw-w-8 tw-ml-0.5 tw-border-0 focus:tw-outline-none tw-flex tw-items-center tw-justify-center hover:tw-bg-iron-300"
        onClick={() => setIsOpen(!isOpen)}
      >
        <svg
          className="tw-flex-shrink-0 tw-h-6 tw-w-6 tw-text-iron-950"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
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
      <HeaderProxyDropdown
        connectedProfile={connectedProfile}
        receivedProfileProxies={receivedProfileProxies}
        activeProfileProxy={activeProfileProxy}
        setActiveProfileProxy={onActiveProfileProxy}
        isOpen={isOpen}
      />
    </div>
  );
}
