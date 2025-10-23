"use client";

import { useAuth } from "@/components/auth/Auth";
import BlockPickerBlockNumberIncludes from "@/components/block-picker/BlockPickerBlockNumberIncludes";
import BlockPickerDateSelect from "@/components/block-picker/BlockPickerDateSelect";
import BlockPickerTimeWindowSelect from "@/components/block-picker/BlockPickerTimeWindowSelect";
import BlockPickerResult from "@/components/block-picker/result/BlockPickerResult";
import PrimaryButton from "@/components/utils/button/PrimaryButton";
import { publicEnv } from "@/config/env";
import { useTitle } from "@/contexts/TitleContext";
import { useEffect, useState } from "react";

interface PredictBlockNumberRequestApiModel {
  timestamp: number;
}

interface PredictBlockNumbersRequestApiModel {
  minTimestamp: number;
  maxTimestamp: number;
  blockNumberIncludes?: number[];
}

export interface PredictBlockNumbersResponseApiModel {
  readonly blockNumberIncludes: number;
  readonly count: number;
  readonly blockNumbers: number[];
}

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

export default function BlockFinderClient() {
  const { setTitle } = useTitle();
  const { setToast } = useAuth();

  const [date, setDate] = useState<string>("");
  const [time, setTime] = useState<string>("");
  const [timeWindow, setTimeWindow] = useState<BlockPickerTimeWindow>(
    BlockPickerTimeWindow.NONE
  );
  const [blockNumberIncludes, setBlockNumberIncludes] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [predictedBlocks, setPredictedBlocks] = useState<{
    timestamp?: number;
    blocknumber?: number;
    blocks?: PredictBlockNumbersResponseApiModel[];
  } | null>(null);

  useEffect(() => {
    setTitle("Block Finder | Tools");
  }, [setTitle]);

  const onSubmit = async () => {
    setPredictedBlocks(null);
    if (timeWindow !== BlockPickerTimeWindow.NONE && !blockNumberIncludes) {
      setToast({
        message:
          "You must provide some block number inclusions when using a time window!",
        type: "error",
      });
      return;
    }

    if (
      blockNumberIncludes &&
      !/^\d+(,\s*\d+)*$/.test(blockNumberIncludes.trim())
    ) {
      setToast({
        message: "Block numbers must be numeric and comma-separated!",
        type: "error",
      });
      return;
    }

    setLoading(true);
    try {
      const dateObj = new Date(date);
      const [hours, minutes] = time.split(":");
      const startDate = new Date(dateObj);
      startDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const minTimestamp = startDate.getTime();

      let path;
      let body:
        | PredictBlockNumbersRequestApiModel
        | PredictBlockNumberRequestApiModel;
      if (blockNumberIncludes) {
        path = "/other/predict-block-numbers";
        const numbers = blockNumberIncludes
          .split(",")
          .map((number) => parseInt(number.trim()));
        const maxTimestamp =
          minTimestamp + BlockPickerTimeWindowToMilliseconds[timeWindow];

        body = {
          minTimestamp,
          maxTimestamp,
          blockNumberIncludes: numbers,
        };
      } else {
        path = "/other/predict-block-number";
        body = {
          timestamp: minTimestamp,
        };
      }

      const response = await fetch(
        `${publicEnv.ALLOWLIST_API_ENDPOINT}${path}`,
        {
          method: "POST",
          body: JSON.stringify(body),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        let message = "Failed to predict block numbers";
        const errorResponse = await response.json().catch(() => null);
        if (errorResponse?.message) {
          message = `${message}: ${errorResponse.message}`;
        }
        throw new Error(message);
      }

      if (blockNumberIncludes) {
        const data =
          (await response.json()) as PredictBlockNumbersResponseApiModel[];
        setPredictedBlocks({
          blocks: data,
        });
      } else {
        const data = await response.text();
        setPredictedBlocks({
          timestamp: minTimestamp,
          blocknumber: Number(data),
        });
      }
    } catch (error) {
      console.error("Error predicting block numbers:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tw-bg-neutral-900">
      <div className="tailwind-scope tw-overflow-y-auto tw-min-h-screen tw-relative tw-pt-8 tw-pb-12 tw-px-4 min-[1000px]:tw-max-w-[850px] min-[1100px]:tw-max-w-[950px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-[1280px] tw-mx-auto">
        <h1 className="tw-text-white pb-4">
          Block Finder
        </h1>
        <div className="tw-w-full tw-mt-3 tw-mb-5 tw-flex tw-gap-x-4 tw-gap-y-5">
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
                disabled={timeWindow === BlockPickerTimeWindow.NONE}
                blockNumberIncludes={blockNumberIncludes}
                setBlockNumberIncludes={setBlockNumberIncludes}
              />
            </div>
          </div>
          <div className="tw-mt-6">
            <div className="tw-w-[5.25rem]">
              <PrimaryButton
                onClicked={onSubmit}
                disabled={!date || !time}
                loading={loading}
                padding="tw-px-4 tw-py-3">
                Submit
              </PrimaryButton>
            </div>
          </div>
        </div>
        {!loading && !!predictedBlocks && (
          <BlockPickerResult
            blocknumber={predictedBlocks.blocknumber ?? undefined}
            timestamp={predictedBlocks.timestamp ?? 0}
            predictedBlocks={predictedBlocks.blocks ?? []}
          />
        )}
      </div>
    </div>
  );
}
