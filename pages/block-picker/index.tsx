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
  >([]);

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
          className="tw-overflow-y-auto tw-min-h-screen tw-relative tw-pt-8 tw-pb-12 tw-px-14"
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
            <div className="tw-self-end">
              <button
                type="button"
                className="tw-w-36 tw-relative tw-inline-flex tw-items-center tw-justify-center tw-cursor-pointer tw-bg-primary-500 tw-px-4 tw-py-3 tw-text-sm tw-font-medium tw-text-white tw-border tw-border-solid tw-border-primary-500 tw-rounded-lg hover:tw-bg-primary-600 hover:tw-border-primary-600 tw-transition tw-duration-300 tw-ease-ou"
                onClick={onSubmit}
              >
                {!loading ? 'Submit' : <AllowlistToolLoader/>}
              </button>
            </div>
          </div>
          <div className="tw-w-full tw-flex">
            <div className="tw-w-1/3">
              {predictedBlock && (
                <div>
                  <p>Block number: {predictedBlock.blockNumber}</p>
                  <p>
                    Date:
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
        </div>
      </div>
      <ToastContainer />
    </>
  );
}
