import { useAccount } from "wagmi";
import HeaderUserConnected from "./HeaderUserConnected";
import HeaderUserConnect from "./HeaderUserConnect";
import HeaderSearchButton from "../header-search/HeaderSearchButton";

export default function HeaderUser() {
  const { address } = useAccount();
  return (
    <div className="tailwind-scope">
      {address ? (
        <HeaderUserConnected connectedAddress={address} />
      ) : (
        <div className="tw-inline-flex">
          <HeaderUserConnect />
          <HeaderSearchButton />
        </div>
      )}
    </div>
  );
}
