import HeaderUserConnected from "./HeaderUserConnected";
import HeaderUserConnect from "./HeaderUserConnect";
import { useSeizeConnect } from "../../../hooks/useSeizeConnect";

export default function HeaderUser() {
  const { address } = useSeizeConnect();
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
