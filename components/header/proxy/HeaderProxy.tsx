import { useContext, useRef, useState } from "react";
import { AuthContext } from "../../auth/Auth";
import HeaderProxyDropdown from "./HeaderProxyDropdown";
import { useClickAway, useKeyPressEvent } from "react-use";
import { ProfileProxy } from "../../../generated/models/ProfileProxy";

export default function HeaderProxy() {
  const { activeProfileProxy, receivedProfileProxies, setActiveProfileProxy } =
    useContext(AuthContext);

  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  useClickAway(containerRef, () => setIsOpen(false));
  useKeyPressEvent("Escape", () => setIsOpen(false));

  const onActiveProfileProxy = async (profileProxy: ProfileProxy | null) => {
    await setActiveProfileProxy(profileProxy);
    setIsOpen(false);
  };

  if (!receivedProfileProxies.length) return null;
  return (
    <div className="tailwind-scope" ref={containerRef}>
      <button onClick={() => setIsOpen(!isOpen)}>chev-down</button>
      <HeaderProxyDropdown
        receivedProfileProxies={receivedProfileProxies}
        activeProfileProxy={activeProfileProxy}
        setActiveProfileProxy={onActiveProfileProxy}
        isOpen={isOpen}
      />
    </div>
  );
}
