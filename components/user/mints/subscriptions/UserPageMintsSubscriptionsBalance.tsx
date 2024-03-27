import DotLoader, { Spinner } from "../../../dotLoader/DotLoader";
import EthereumIcon from "../../utils/icons/EthereumIcon";
import { numberWithCommas } from "../../../../helpers/Helpers";
import { SubscriptionDetails } from "../../../../entities/ISubscription";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";

export default function UserPageMintsSubscriptionsBalance(
  props: Readonly<{
    details: SubscriptionDetails | undefined;
    show_refresh: boolean;
    fetching: boolean;
    refresh: () => void;
  }>
) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  return (
    <span className="d-flex align-items-center gap-1">
      <span>Current Balance:</span>
      {!props.details ? (
        <DotLoader />
      ) : (
        <span className="d-flex align-items-center gap-3">
          <span className="d-flex align-items-center gap-1">
            <b>
              {numberWithCommas(
                Math.round(props.details.balance * 1000000) / 1000000
              )}
            </b>
          </span>
          {props.show_refresh && (
            <>
              {props.fetching || isRefreshing ? (
                <Spinner />
              ) : (
                <FontAwesomeIcon
                  icon="refresh"
                  onClick={() => {
                    setIsRefreshing(true);
                    setTimeout(() => {
                      setIsRefreshing(false);
                    }, 1000);
                    props.refresh();
                  }}
                  style={{
                    height: "24px",
                    cursor: "pointer",
                  }}
                />
              )}
            </>
          )}
        </span>
      )}
    </span>
  );
}
