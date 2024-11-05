import HeaderUserConnected from "./HeaderUserConnected";
import HeaderUserConnect from "./HeaderUserConnect";
import { useSeizeConnectContext } from "../../auth/SeizeConnectContext";

export default function HeaderUser() {
  const { address } = useSeizeConnectContext();

  return (
    <div className="tailwind-scope">
      {address ? (
        <HeaderUserConnected connectedAddress={address} />
      ) : (
        <div className="tw-mx-3">
          <HeaderUserConnect />
        </div>
      )}
    </div>
  );
}
