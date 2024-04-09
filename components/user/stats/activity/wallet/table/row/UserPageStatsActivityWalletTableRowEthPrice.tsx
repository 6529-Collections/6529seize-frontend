import Tippy from "@tippyjs/react";
import { formatNumberWithCommasOrDash } from "../../../../../../../helpers/Helpers";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default function UserPageStatsActivityWalletTableRowEthPrice({
  ethPrice,
  value,
  gas,
}: {
  readonly ethPrice: number;
  readonly value: number;
  readonly gas: number;
}) {
  return (
    <Tippy
      theme="light"
      placement="top"
      content={
        <div className="tw-flex tw-flex-col">
          <div className="tw-inline-flex tw-justify-between tw-space-x-2">
            <div>ETH PRICE</div>{" "}
            <div>&#36;{formatNumberWithCommasOrDash(+ethPrice.toFixed(2))}</div>
          </div>
          {value > 0 && (
            <div className="tw-inline-flex tw-justify-between tw-space-x-2">
              <div>VALUE</div>{" "}
              <div>&#36;{formatNumberWithCommasOrDash(+value.toFixed(2))}</div>
            </div>
          )}
          <div className="tw-inline-flex tw-justify-between tw-space-x-2">
            <div>GAS</div>
            <div>&#36;{formatNumberWithCommasOrDash(+gas.toFixed(2))}</div>
          </div>
          {value > 0 && (
            <div className="tw-inline-flex tw-justify-between tw-space-x-2">
              <div>
                <b>TOTAL</b>
              </div>{" "}
              <div>
                <b>
                  &#36;{formatNumberWithCommasOrDash(+(value + gas).toFixed(2))}
                </b>
              </div>
            </div>
          )}
        </div>
      }>
      <div
        aria-label="Gas Information"
        className="tw-h-10 tw-w-10 tw-flex tw-justify-center tw-items-center tw-rounded-full focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400">
        <FontAwesomeIcon height={20} icon="dollar"></FontAwesomeIcon>
      </div>
    </Tippy>
  );
}
