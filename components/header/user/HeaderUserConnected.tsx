import HeaderUserConnecting from "./HeaderUserConnecting";
import HeaderUserContext from "./HeaderUserContext";
import { useIdentity } from "../../../hooks/useIdentity";

export default function HeaderUserConnected({
  connectedAddress,
}: {
  readonly connectedAddress: string;
}) {
  const { isLoading, profile } = useIdentity({
    handleOrWallet: connectedAddress,
    initialProfile: null,
  });

  return (
    <div>
      {isLoading || !profile ? (
        <HeaderUserConnecting />
      ) : (
        <HeaderUserContext profile={profile} />
      )}
    </div>
  );
}
