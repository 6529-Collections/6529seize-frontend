import DotLoader from "../../../dotLoader/DotLoader";
import { useEffect, useState } from "react";
import EthereumIcon from "../../utils/icons/EthereumIcon";
import { IProfileAndConsolidations } from "../../../../entities/IProfile";
import { commonApiFetch } from "../../../../services/api/common-api";
import { SubscriptionBalance } from "../../../../entities/ISubscription";

export default function UserPageMintsSubscriptionsBalance(
  props: Readonly<{
    profile: IProfileAndConsolidations;
  }>
) {
  const [balance, setBalance] = useState<number>(0);
  const [fetching, setFetching] = useState<boolean>(true);

  useEffect(() => {
    commonApiFetch<SubscriptionBalance>({
      endpoint: `subscriptions/consolidation-balance/${props.profile.consolidation.consolidation_key}`,
    }).then((data) => {
      setBalance(data.balance);
      setFetching(false);
    });
  }, []);

  return (
    <span className="d-flex align-items-center gap-1">
      <span>Current Balance:</span>
      {fetching ? (
        <DotLoader />
      ) : (
        <span className="d-flex align-items-center gap-1">
          <b>{balance}</b>
          <div className="tw-flex tw-items-center tw-justify-center tw-flex-shrink-0 tw-h-5 tw-w-5 tw-text-iron-50">
            <EthereumIcon />
          </div>
        </span>
      )}
    </span>
  );
}
