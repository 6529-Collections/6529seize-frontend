import Tippy from "@tippyjs/react";
import { formatNumberWithCommasOrDash } from "../../../../../../../helpers/Helpers";

export default function UserPageStatsActivityWalletTableRowGas({
  gas,
  gasGwei,
  gasPriceGwei,
}: {
  readonly gas: number;
  readonly gasGwei: number;
  readonly gasPriceGwei: number;
}) {
  return (
    <Tippy
      theme="dark"
      placement="top"
      content={
        <div className="tw-flex tw-flex-col">
          <div className="tw-inline-flex tw-justify-between tw-space-x-2">
            <div> Gas:</div>{" "}
            <div>{formatNumberWithCommasOrDash(+gas.toFixed(5))}</div>
          </div>
          <div className="tw-inline-flex tw-justify-between tw-space-x-2">
            <div>GWEI:</div> <div> {formatNumberWithCommasOrDash(gasGwei)}</div>
          </div>
          <div className="tw-inline-flex tw-justify-between tw-space-x-2">
            <div>Gas Price:</div>
            <div>{formatNumberWithCommasOrDash(+gasPriceGwei.toFixed(2))}</div>
          </div>
        </div>
      }
    >
      <div
        aria-label="Gas Information"
        className="tw-h-10 tw-w-10 tw-flex tw-justify-center tw-items-center tw-rounded-full focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400"
      >
        <svg
          aria-hidden="true"
          className="tw-flex-shrink-0 tw-w-6 tw-h-6 sm:tw-w-5 sm:tw-h-5 tw-text-iron-300"
          x="0px"
          y="0px"
          viewBox="0 0 494.06 494.06"
          width="512"
          height="512"
        >
          <g>
            <path
              fill="currentColor"
              d="M259.18,58.7H106.39c-8.29,0-15,6.71-15,15v105.86c0,8.28,6.71,15,15,15h152.79c8.28,0,15-6.72,15-15V73.7   C274.18,65.41,267.46,58.7,259.18,58.7z M244.18,164.56H121.39V88.7h122.79V164.56z"
            ></path>
            <path
              fill="currentColor"
              d="M471.96,85.81l-0.005-0.002l-64.033-60.604c-6.017-5.694-15.51-5.433-21.205,0.584c-5.694,6.017-5.434,15.51,0.584,21.205   l33.228,31.449c-20.81,7.71-35.689,27.77-35.689,51.229c0,24.41,16.11,45.14,38.25,52.1v185.58c0,4.97-4.05,9.01-9.01,9.01   c-4.97,0-9.01-4.04-9.01-9.01v-94.3c0-24.8-20.19-44.99-44.99-44.99h-34.79V50.05c0-24.82-20.18-45-45-45H85.27   c-24.81,0-45,20.18-45,45v333.78h-5.19C15.73,383.83,0,399.57,0,418.92v55.09c0,8.29,6.71,15,15,15h335.57c8.28,0,15-6.71,15-15   v-55.09c0-19.35-15.74-35.09-35.09-35.09h-5.19V258.06h34.79c8.26,0,14.99,6.73,14.99,14.99v94.3c0,21.51,17.5,39.01,39.01,39.01   s39.01-17.5,39.01-39.01V182.56c23.53-6.08,40.97-27.49,40.97-52.89C494.06,111.73,485.36,95.78,471.96,85.81z M295.29,383.83   H70.27V50.05c0-8.27,6.73-15,15-15h195.02c8.28,0,15,6.73,15,15C295.29,55.79,295.29,378.771,295.29,383.83z M335.57,418.92v40.09   H30v-40.09c0-2.81,2.28-5.09,5.08-5.09c11.613,0,281.437,0,295.4,0C333.29,413.83,335.57,416.11,335.57,418.92z M439.45,154.28   c-13.54,0-24.61-11.023-24.61-24.61c0-13.57,11.04-24.61,24.61-24.61s24.61,11.04,24.61,24.61   C464.06,143.247,453.011,154.28,439.45,154.28z"
            ></path>
          </g>
        </svg>
      </div>
    </Tippy>
  );
}
