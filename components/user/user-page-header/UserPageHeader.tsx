import { IProfileAndConsolidations } from "../../../entities/IProfile";
import { formatNumber } from "../../../helpers/Helpers";
import UserPageHeaderAddresses from "./addresses/UserPageHeaderAddresses";

export default function UserPageHeader({
  profile,
  activeAddress,
  onActiveAddress,
}: {
  profile: IProfileAndConsolidations;
  activeAddress: string | null;
  onActiveAddress: (address: string) => void;
}) {
  const value = 16942069;
  return (
    <div className="tailwind-scope">
      {formatNumber(value)} (Rep: Soon™)
      <UserPageHeaderAddresses
        addresses={profile.consolidation.wallets}
        activeAddress={activeAddress}
        onActiveAddress={onActiveAddress}
      />
    </div>
  );
}
