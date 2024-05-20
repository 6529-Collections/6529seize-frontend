import { useAccount } from "wagmi";
import HeaderUserConnected from "./HeaderUserConnected";
import HeaderUserConnect from "./HeaderUserConnect";

export default function HeaderUser() {
  const { address } = useAccount();
  return (
    <div className="tailwind-scope">
      {address ? (
        <HeaderUserConnected connectedAddress={address} />
      ) : (
        <HeaderUserConnect />
      )}
    </div>
  );
}
