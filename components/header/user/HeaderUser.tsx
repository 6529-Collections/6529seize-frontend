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
        <div className="tw-flex tw-items-center tw-gap-x-3">
          <HeaderUserConnect />
          <HeaderSearchButton />
        </div>
      )}
    </div>
  );
}
