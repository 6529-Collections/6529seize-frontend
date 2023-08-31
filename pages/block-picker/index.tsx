import dynamic from "next/dynamic";
import Breadcrumb, { Crumb } from "../../components/breadcrumb/Breadcrumb";
import HeaderPlaceholder from "../../components/header/HeaderPlaceholder";
import { Poppins } from "next/font/google";
import { useState } from "react";

import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";

import BlockPickerTimeWindowSelect from "../../components/block-picker/BlockPickerTimeWindowSelect";
import BlockPickerDateSelect from "../../components/block-picker/BlockPickerDateSelect";
import BlockPickerBlockNumberIncludes from "../../components/block-picker/BlockPickerBlockNumberIncludes";
import { distributionPlanApiPost } from "../../services/distribution-plan-api";

import Countdown from "../../components/distribution-plan-tool/common/Countdown";
import BlockPickerAdvancedItem from "../../components/block-picker/advanced/BlockPickerAdvancedItem";
import AllowlistToolLoader from "../../components/allowlist-tool/common/AllowlistToolLoader";

export interface PredictBlockNumbersResponseApiModel {
  readonly blockNumberIncludes: number;
  readonly count: number;
  readonly blockNumbers: number[];
}

const Header = dynamic(() => import("../../components/header/Header"), {
  ssr: false,
  loading: () => <HeaderPlaceholder />,
});

const poppins = Poppins({
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  display: "swap",
});

export enum BlockPickerTimeWindow {
  NONE = "NONE",
  ONE_MINUTE = "ONE_MINUTE",
  FIVE_MINUTES = "FIVE_MINUTES",
  TEN_MINUTES = "TEN_MINUTES",
  HALF_HOUR = "HALF_HOUR",
  ONE_HOUR = "ONE_HOUR",
  TWO_HOURS = "TWO_HOURS",
  FOUR_HOURS = "FOUR_HOURS",
  SIX_HOURS = "SIX_HOURS",
  TWELVE_HOURS = "TWELVE_HOURS",
  ONE_DAY = "ONE_DAY",
  TWO_DAYS = "TWO_DAYS",
}

const BlockPickerTimeWindowToMilliseconds = {
  [BlockPickerTimeWindow.NONE]: 0,
  [BlockPickerTimeWindow.ONE_MINUTE]: 60000,
  [BlockPickerTimeWindow.FIVE_MINUTES]: 300000,
  [BlockPickerTimeWindow.TEN_MINUTES]: 600000,
  [BlockPickerTimeWindow.HALF_HOUR]: 1800000,
  [BlockPickerTimeWindow.ONE_HOUR]: 3600000,
  [BlockPickerTimeWindow.TWO_HOURS]: 7200000,
  [BlockPickerTimeWindow.FOUR_HOURS]: 14400000,
  [BlockPickerTimeWindow.SIX_HOURS]: 21600000,
  [BlockPickerTimeWindow.TWELVE_HOURS]: 43200000,
  [BlockPickerTimeWindow.ONE_DAY]: 86400000,
  [BlockPickerTimeWindow.TWO_DAYS]: 172800000,
};

export default function BlockPicker() {
  const [defaultBreadCrumbs] = useState<Crumb[]>([
    { display: "Home", href: "/" },
    { display: "Block picker" },
  ]);
  const [breadcrumbs] = useState<Crumb[]>(defaultBreadCrumbs);

  const [date, setDate] = useState<string>(
    new Date().toLocaleDateString("en-GB").split("/").reverse().join("-")
  );
  const [time, setTime] = useState<string>(
    new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
  );

  const [timeWindow, setTimeWindow] = useState<BlockPickerTimeWindow>(
    BlockPickerTimeWindow.NONE
  );

  const [blockNumberIncludes, setBlockNumberIncludes] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const [predictedBlock, setPredictedBlock] = useState<{
    blockNumber: number;
    timestamp: number;
  } | null>(null);

  const [predictedBlocks, setPredictedBlocks] = useState<
    PredictBlockNumbersResponseApiModel[]
  >([
    {
      blockNumberIncludes: 42,
      count: 69,
      blockNumbers: [42069],
    },
  ]);

  const getPredictedBlock = async (
    timestamp: number
  ): Promise<number | null> => {
    const endpoint = "/other/predict-block-number";
    const { data } = await distributionPlanApiPost<number>({
      endpoint,
      body: { timestamp },
    });
    return typeof data === "number" ? data : null;
  };

  const getPredictedBlocks = async ({
    timeWindow,
    timestamp,
    blockNos,
  }: {
    timestamp: number;
    timeWindow: BlockPickerTimeWindow;
    blockNos: number[];
  }): Promise<PredictBlockNumbersResponseApiModel[] | null> => {
    const endpoint = "/other/predict-block-numbers";
    const maxTimestamp =
      timestamp + BlockPickerTimeWindowToMilliseconds[timeWindow];

    const { data } = await distributionPlanApiPost<
      PredictBlockNumbersResponseApiModel[]
    >({
      endpoint,
      body: {
        minTimestamp: timestamp,
        maxTimestamp,
        blockNumberIncludes: blockNos,
      },
    });
    return Array.isArray(data) ? data : null;
  };

  const getData = async () => {
    const localDateTimeString = `${date} ${time}`;
    const localDateTime = new Date(localDateTimeString.replace(" ", "T"));
    const timestamp = localDateTime.getTime();
    if (!!blockNumberIncludes.length) {
      const blockNos = blockNumberIncludes
        .split(",")
        .map((blockNo) => parseInt(blockNo.trim()));

      const haveInvalidBlockNos = blockNos.some((blockNo) => isNaN(blockNo));
      if (haveInvalidBlockNos) {
        alert(
          "Invalid block numbers, please use comma separated numbers. Example: 42, 69, 42069"
        );
        return;
      }
      const predictedBlock = await getPredictedBlock(timestamp);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const predictedBlocks = await getPredictedBlocks({
        timestamp,
        timeWindow,
        blockNos,
      });

      setPredictedBlock(
        predictedBlock
          ? {
              blockNumber: predictedBlock,
              timestamp,
            }
          : null
      );

      setPredictedBlocks(predictedBlocks ?? []);
      return;
    }

    const predictedBlock = await getPredictedBlock(timestamp);
    setPredictedBlock(
      predictedBlock
        ? {
            blockNumber: predictedBlock,
            timestamp,
          }
        : null
    );
    setPredictedBlocks([]);
  };

  const onSubmit = async () => {
    setLoading(true);
    await getData();
    setLoading(false);
  };

  return (
    <>
      <Header />
      <Breadcrumb breadcrumbs={breadcrumbs} />
      <div className={`tw-bg-neutral-900 ${poppins.className}`}>
        <div
          id="allowlist-tool"
          className="tw-overflow-y-auto tw-min-h-screen tw-relative tw-pt-8 tw-pb-12 tw-px-4 min-[992px]:tw-max-w-[960px] min-[1200px]:tw-max-w-[1150px] min-[1300px]:tw-max-w-[1250px] min-[1400px]:tw-max-w-[1350px] min-[1500px]:tw-max-w-[1450px] min-[1600px]:tw-max-w-[1550px] tw-mx-auto"
        >
          <div className="tw-w-full tw-flex tw-gap-x-4 tw-gap-y-5">
            <div className="tw-w-1/2">
              <BlockPickerDateSelect
                date={date}
                setDate={setDate}
                time={time}
                setTime={setTime}
              />
            </div>

            <div className="tw-w-1/2">
              <div className="tw-flex tw-w-full tw-gap-x-4">
                <BlockPickerTimeWindowSelect
                  timeWindow={timeWindow}
                  setTimeWindow={setTimeWindow}
                />
                <BlockPickerBlockNumberIncludes
                  blockNumberIncludes={blockNumberIncludes}
                  setBlockNumberIncludes={setBlockNumberIncludes}
                />
              </div>
            </div>
            <div className="tw-mt-6">
              <button
                type="button"
                className="tw-w-[5.25rem] tw-relative tw-inline-flex tw-items-center tw-justify-center tw-cursor-pointer tw-bg-primary-500 tw-px-4 tw-py-3 tw-text-sm tw-font-medium tw-text-white tw-border tw-border-solid tw-border-primary-500 tw-rounded-lg hover:tw-bg-primary-600 hover:tw-border-primary-600 tw-transition tw-duration-300 tw-ease-ou"
                onClick={onSubmit}
              >
                {!loading ? "Submit" : <AllowlistToolLoader />}
              </button>
            </div>
          </div>

          <div>
            <div className="tw-mt-8 tw-pt-6 tw-border-t tw-border-solid tw-border-x-0 tw-border-b-0 tw-border-neutral-700">
              <div className="sm:tw-flex sm:tw-items-baseline sm:tw-justify-between">
                <div className="sm:tw-w-0 sm:tw-flex-1">
                  <p className="tw-mb-0 tw-text-base tw-font-semibold tw-text-neutral-100 tw-space-x-1">
                    <span>Block number:</span>
                    <span>13274288</span>
                  </p>
                  <div className="tw-mt-2 tw-inline-flex tw-items-center tw-text-sm tw-text-neutral-400">
                    <svg
                      className="tw-flex-shrink-0 tw-mr-2 tw-h-4 tw-w-4 tw-text-neutral-400"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M21 10H3M16 2V6M8 2V6M7.8 22H16.2C17.8802 22 18.7202 22 19.362 21.673C19.9265 21.3854 20.3854 20.9265 20.673 20.362C21 19.7202 21 18.8802 21 17.2V8.8C21 7.11984 21 6.27976 20.673 5.63803C20.3854 5.07354 19.9265 4.6146 19.362 4.32698C18.7202 4 17.8802 4 16.2 4H7.8C6.11984 4 5.27976 4 4.63803 4.32698C4.07354 4.6146 3.6146 5.07354 3.32698 5.63803C3 6.27976 3 7.11984 3 8.8V17.2C3 18.8802 3 19.7202 3.32698 20.362C3.6146 20.9265 4.07354 21.3854 4.63803 21.673C5.27976 22 6.11984 22 7.8 22Z"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                    <span>30/08/2023, 20:00</span>
                  </div>
                </div>
                <div className="tw-inline-flex tw-items-center tw-text-sm tw-text-neutral-100">
                  <svg
                    className="tw-flex-shrink-0 tw-mr-2 tw-h-4 tw-w-4 tw-text-neutral-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 6V12L16 14M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                  <span> 5 minutes, 11 seconds</span>
                </div>
              </div>
            </div>
            <div className="tw-mt-4 tw-flow-root">
              <div className="tw-overflow-x-auto tw-ring-1 tw-ring-white/10 tw-rounded-lg">
                <table className="tw-min-w-full tw-divide-y tw-divide-neutral-700/60">
                  <thead className="tw-bg-neutral-800/60">
                    <tr>
                      <th
                        scope="col"
                        className="tw-py-3 tw-pl-4 tw-pr-3 tw-whitespace-nowrap tw-text-left tw-text-[0.6875rem] tw-leading-[1.125rem] tw-font-medium tw-text-neutral-400 tw-uppercase tw-tracking-[0.25px] sm:tw-pl-6"
                      >
                        Block inlcudes
                      </th>
                      <th
                        scope="col"
                        className="tw-py-3 tw-pr-4 tw-pl-3 tw-whitespace-nowrap tw-text-left tw-text-[0.6875rem] tw-leading-[1.125rem] tw-font-medium tw-text-neutral-400 tw-uppercase tw-tracking-[0.25px] sm:tw-pr-6"
                      >
                        Count
                      </th>
                    </tr>
                  </thead>
                  <tbody className="tw-divide-y tw-divide-neutral-700/40">
                    <tr className="tw-cursor-pointer hover:tw-bg-neutral-800/60 tw-transition tw-duration-300 tw-ease-out">
                      <td className="tw-whitespace-nowrap tw-py-4 tw-pl-4 tw-pr-3 tw-text-xs tw-font-medium tw-text-white sm:tw-pl-6">
                        info
                      </td>
                      <td className="tw-whitespace-nowrap tw-py-4 tw-pl-3 tw-pr-4 tw-text-xs tw-font-medium tw-text-white sm:tw-pr-6">
                        info
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {
            <div className="tw-mt-8">
              <div>
                {predictedBlock && (
                  <div>
                    <p className="tw-mb-0 tw-font-semibold tw-text-base tw-text-neutral-100">
                      <span>Block number:</span> {predictedBlock.blockNumber}
                    </p>
                    <p className="tw-mb-0 tw-font-normal tw-text-base tw-text-neutral-400">
                      <span>Date:</span>
                      {new Date(predictedBlock.timestamp).toLocaleString(
                        "en-GB",
                        {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </p>
                    <div className="tw-inline-flex tw-space-x-2">
                      <div>In:</div>{" "}
                      <Countdown timestamp={predictedBlock.timestamp} />
                    </div>
                  </div>
                )}
              </div>

              <div className="tw-w-1/3">
                {!!predictedBlocks.length && (
                  <div className="tw-space-y-2">
                    {predictedBlocks.map((block) => (
                      <BlockPickerAdvancedItem
                        key={block.blockNumberIncludes}
                        item={block}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          }
        </div>
      </div>
      <ToastContainer />
    </>
  );
}
