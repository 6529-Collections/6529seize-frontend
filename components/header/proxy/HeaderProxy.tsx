import { useContext, useState } from "react";
import { AuthContext } from "../../auth/Auth";
import HeaderProxyDropdown from "./HeaderProxyDropdown";

export default function HeaderProxy() {
  const { activeProfileProxy, receivedProfileProxies, setActiveProfileProxy } =
    useContext(AuthContext);

  const [isOpen, setIsOpen] = useState(false);

  if (!receivedProfileProxies.length) return null;
  return (
    <div className="tailwind-scope">
      <button onClick={() => setIsOpen(!isOpen)}>chev-down</button>
      <HeaderProxyDropdown
        receivedProfileProxies={receivedProfileProxies}
        activeProfileProxy={activeProfileProxy}
        setActiveProfileProxy={setActiveProfileProxy}
        isOpen={isOpen}
      />
    </div>
  );
}
