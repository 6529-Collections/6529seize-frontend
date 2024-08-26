import { useAccount } from "wagmi";
import HeaderUserConnected from "./HeaderUserConnected";
import HeaderUserConnect from "./HeaderUserConnect";

export default function HeaderUser(
  props: Readonly<{
    onConnectClick: () => void;
  }>
) {
  const { address } = useAccount();
  return (
    <div className="tailwind-scope">
      {address ? (
        <HeaderUserConnected connectedAddress={address} />
      ) : (
        <div className="tw-mx-3">
          <HeaderUserConnect onConnectClick={props.onConnectClick} />
        </div>
      )}
    </div>
  );
}
