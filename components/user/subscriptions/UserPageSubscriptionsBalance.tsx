import DotLoader, { Spinner } from "@/components/dotLoader/DotLoader";
import { MEMES_MINT_PRICE } from "@/constants/constants";
import type { SubscriptionDetails } from "@/generated/models/SubscriptionDetails";
import { numberWithCommas } from "@/helpers/Helpers";
import { faRefresh } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import EthereumIcon from "../utils/icons/EthereumIcon";

export default function UserPageSubscriptionsBalance(
  props: Readonly<{
    details: SubscriptionDetails | undefined;
    show_refresh: boolean;
    fetching: boolean;
    refresh: () => void;
  }>
) {
  return (
    <div>
      <div className="tw-pb-2">
        <div className="tw-flex tw-items-center tw-gap-2">
          <h5 className="tw-mb-0 tw-whitespace-nowrap">Current Balance</h5>
          {props.show_refresh && (
            <>
              {props.fetching ? (
                <Spinner />
              ) : (
                <FontAwesomeIcon
                  icon={faRefresh}
                  onClick={() => {
                    props.refresh();
                  }}
                  style={{
                    height: "24px",
                    cursor: "pointer",
                  }}
                  aria-label="Refresh balance"
                  tabIndex={0}
                  role="button"
                />
              )}
            </>
          )}
        </div>
      </div>
      <div className="tw-pt-1">
        <div>
          {props.fetching ? (
            <DotLoader />
          ) : (
            <span className="tw-flex tw-items-center tw-gap-3">
              <span className="tw-flex tw-items-center tw-gap-2">
                <div className="tw-flex tw-items-center tw-gap-1">
                  <b>
                    {props.details?.balance
                      ? numberWithCommas(
                          Math.round(props.details.balance * 1000000) / 1000000
                        )
                      : 0}
                  </b>
                  <div className="tw-flex tw-h-5 tw-w-5 tw-flex-shrink-0 tw-items-center tw-justify-center tw-text-iron-50">
                    <EthereumIcon />
                  </div>
                </div>
                {props.details && props.details.balance > 0 && (
                  <>
                    (
                    {(props.details.balance / MEMES_MINT_PRICE).toLocaleString(
                      undefined,
                      {
                        maximumFractionDigits: 0,
                      }
                    )}{" "}
                    cards)
                  </>
                )}
              </span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
