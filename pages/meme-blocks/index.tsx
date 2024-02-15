import dynamic from "next/dynamic";
import Breadcrumb, { Crumb } from "../../components/breadcrumb/Breadcrumb";
import HeaderPlaceholder from "../../components/header/HeaderPlaceholder";
import { Poppins } from "next/font/google";
import { useState } from "react";
import Head from "next/head";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";

import BlockPickerTimeWindowSelect from "../../components/block-picker/BlockPickerTimeWindowSelect";
import BlockPickerDateSelect from "../../components/block-picker/BlockPickerDateSelect";
import BlockPickerBlockNumberIncludes from "../../components/block-picker/BlockPickerBlockNumberIncludes";
import { distributionPlanApiPost } from "../../services/distribution-plan-api";

import AllowlistToolLoader from "../../components/allowlist-tool/common/AllowlistToolLoader";
import BlockPickerResult from "../../components/block-picker/result/BlockPickerResult";

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
    { display: "Meme Blocks" },
  ]);
  const [breadcrumbs] = useState<Crumb[]>(defaultBreadCrumbs);
  const targetDate =
    new Date().getTime() +
    BlockPickerTimeWindowToMilliseconds[BlockPickerTimeWindow.ONE_HOUR];

  const [date, setDate] = useState<string>(
    new Date(targetDate)
      .toLocaleDateString("en-GB")
      .split("/")
      .reverse()
      .join("-")
  );
  const [time, setTime] = useState<string>(
    new Date(targetDate).toLocaleTimeString([], {
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
      if (
        haveInvalidBlockNos ||
        !blockNos.length ||
        blockNumberIncludes.includes(".")
      ) {
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
      <Head>
        <title>Meme Blocks | 6529 SEIZE</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content="Meme Blocks | 6529 SEIZE" />
        <meta
          property="og:url"
          content={`${process.env.BASE_ENDPOINT}/meme-blocks`}
        />
        <meta property="og:title" content="Meme Blocks" />
        <meta property="og:description" content="6529 SEIZE" />
        <meta
          property="og:image"
          content={`${process.env.BASE_ENDPOINT}/Seize_Logo_Glasses_2.png`}
        />
      </Head>
      <Header />
      <Breadcrumb breadcrumbs={breadcrumbs} />
      <div className={`tw-bg-neutral-900 ${poppins.className}`}>
        <div className="tailwind-scope tw-overflow-y-auto tw-min-h-screen tw-relative tw-pt-8 tw-pb-12 tw-px-4 min-[1000px]:tw-max-w-[850px] min-[1100px]:tw-max-w-[950px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-[1280px] tw-mx-auto">
          <h1 className="tw-text-white pb-4">
            <span className="font-lightest">Meme</span> Blocks
          </h1>
          <div className="tw-w-full tw-mt-3 tw-flex tw-gap-x-4 tw-gap-y-5">
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
                onClick={onSubmit}>
                {!loading ? "Submit" : <AllowlistToolLoader />}
              </button>
            </div>
          </div>

          {!loading && !!predictedBlock && (
            <BlockPickerResult
              blocknumber={predictedBlock.blockNumber}
              timestamp={predictedBlock.timestamp}
              predictedBlocks={predictedBlocks}
            />
          )}
        </div>
      </div>
      <ToastContainer />
    </>
  );
}
