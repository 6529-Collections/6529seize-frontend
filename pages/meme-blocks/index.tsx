import { Poppins } from "next/font/google";
import { useEffect, useState } from "react";
import PrimaryButton from "../../components/utils/button/PrimaryButton";

import BlockPickerTimeWindowSelect from "../../components/block-picker/BlockPickerTimeWindowSelect";
import BlockPickerDateSelect from "../../components/block-picker/BlockPickerDateSelect";
import BlockPickerBlockNumberIncludes from "../../components/block-picker/BlockPickerBlockNumberIncludes";
import { distributionPlanApiPost } from "../../services/distribution-plan-api";
import BlockPickerResult from "../../components/block-picker/result/BlockPickerResult";
import { useTitle } from "../../contexts/TitleContext";
import { useAuth } from "@/components/auth/Auth";

export interface PredictBlockNumbersResponseApiModel {
  readonly blockNumberIncludes: number;
  readonly count: number;
  readonly blockNumbers: number[];
}

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
  const { setTitle } = useTitle();
  const { setToast } = useAuth();

  const [date, setDate] = useState<string>("");
  const [time, setTime] = useState<string>("");
  const [timeWindow, setTimeWindow] = useState<BlockPickerTimeWindow>(
    BlockPickerTimeWindow.NONE
  );
  const [blockNumberIncludes, setBlockNumberIncludes] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [predictedBlock, setPredictedBlock] = useState<{
    blockNumber: number;
    timestamp: number;
  } | null>(null);
  const [predictedBlocks, setPredictedBlocks] =
    useState<PredictBlockNumbersResponseApiModel | null>(null);

  useEffect(() => {
    setTitle("Meme Blocks | Tools");
  }, [setTitle]);

  const onSubmit = async () => {
    if (blockNumberIncludes && !/^\d+$/.test(blockNumberIncludes)) {
      setToast({
        message: "Block numbers must be numeric!",
        type: "error",
      });
      return;
    }

    if (!date || !time) return;

    setLoading(true);
    try {
      const dateObj = new Date(date);
      const [hours, minutes] = time.split(":");
      const timestamp = new Date(dateObj);
      timestamp.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const endTimestamp = new Date(
        timestamp.getTime() + BlockPickerTimeWindowToMilliseconds[timeWindow]
      );

      const response =
        await distributionPlanApiPost<PredictBlockNumbersResponseApiModel>({
          endpoint: "block-numbers/predict",
          body: {
            timestamp: timestamp.toISOString(),
            endTimestamp: endTimestamp.toISOString(),
            blockNumberIncludes: blockNumberIncludes
              ? parseInt(blockNumberIncludes)
              : undefined,
          },
        });

      if (
        response.success &&
        response.data &&
        response.data.blockNumbers.length > 0
      ) {
        setPredictedBlock({
          blockNumber: response.data.blockNumbers[0],
          timestamp: timestamp.getTime(),
        });
        setPredictedBlocks(response.data);
      }
    } catch (error) {
      console.error("Error predicting block numbers:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
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
            <div className="tw-w-[5.25rem]">
              <PrimaryButton
                onClicked={onSubmit}
                disabled={false}
                loading={loading}
                padding="tw-px-4 tw-py-3">
                Submit
              </PrimaryButton>
            </div>
          </div>
        </div>

        {!loading && !!predictedBlock && (
          <BlockPickerResult
            blocknumber={predictedBlock.blockNumber}
            timestamp={predictedBlock.timestamp}
            predictedBlocks={predictedBlocks ? [predictedBlocks] : []}
          />
        )}
      </div>
    </div>
  );
}

BlockPicker.metadata = {
  title: "Meme Blocks",
  description: "Tools",
};
