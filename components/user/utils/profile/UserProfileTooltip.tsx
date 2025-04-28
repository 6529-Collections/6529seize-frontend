import DropPfp from "../../../drops/create/utils/DropPfp";
import { formatNumberWithCommasOrDash } from "../../../../helpers/Helpers";
import { useIdentity } from "../../../../hooks/useIdentity";
import { useIdentityBalance } from "../../../../hooks/useIdentityBalance";
export default function UserProfileTooltip({
  user,
}: {
  readonly user: string;
}) {
  const { profile } = useIdentity({
    handleOrWallet: user,
    initialProfile: null,
  });

  const { data: balance } = useIdentityBalance({
    consolidationKey: profile?.consolidation_key ?? null,
  });

  return (
    <div className="tw-p-3">
      <DropPfp pfpUrl={profile?.pfp} />
      <div>{profile?.handle}</div>
      <div>TDH: {formatNumberWithCommasOrDash(profile?.tdh ?? 0)}</div>
      <div>Level: {formatNumberWithCommasOrDash(profile?.level ?? 0)}</div>
      <div>NIC: {formatNumberWithCommasOrDash(profile?.cic ?? 0)}</div>
      <div>REP: {formatNumberWithCommasOrDash(profile?.rep ?? 0)}</div>
      <div>Balance: {formatNumberWithCommasOrDash(balance?.total_balance ?? 0)}</div>
    </div>
  );
}
