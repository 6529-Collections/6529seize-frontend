"use client";

import { CONTENT_PAGE_CONTAINER_CLASS } from "@/components/about/AboutLayout";
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
  blockNumberIncludes?: number[] | undefined;
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
    timestamp?: number | undefined;
    blocknumber?: number | undefined;
    blocks?: PredictBlockNumbersResponseApiModel[] | undefined;
  } | null>(null);

  useEffect(() => {
    setTitle("Block Finder | Tools");
  }, [setTitle]);

  const onSubmit = async () => {
    setPredictedBlocks(null);
    if (timeWindow !== BlockPickerTimeWindow.NONE && !blockNumberIncludes) {
      setToast({
        message: "Add at least one block number when using a time window.",
        type: "error",
      });
      return;
    }

    if (
      blockNumberIncludes &&
      !/^\d+(,\s*\d+)*$/.test(blockNumberIncludes.trim())
    ) {
      setToast({
        message: "Enter block numbers separated by commas.",
        type: "error",
      });
      return;
    }

    setLoading(true);
    try {
      const dateObj = new Date(date);
      const [hours, minutes] = time.split(":");
      const startDate = new Date(dateObj);
      startDate.setHours(parseInt(hours!), parseInt(minutes!), 0, 0);

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
    <div className="tw-min-h-[100dvh] tw-bg-iron-950 tw-text-iron-300">
      <div
        className={`tailwind-scope tw-relative tw-min-h-screen tw-overflow-y-auto ${CONTENT_PAGE_CONTAINER_CLASS}`}
      >
        <h1 className="tw-pb-6 tw-text-iron-50">Block Finder</h1>
        <div className="tw-mb-5 tw-mt-3 tw-flex tw-w-full tw-flex-col tw-gap-5 lg:tw-flex-row lg:tw-items-end lg:tw-gap-4">
          <div className="tw-w-full tw-min-w-0 lg:tw-flex-1">
            <BlockPickerDateSelect
              date={date}
              setDate={setDate}
              time={time}
              setTime={setTime}
            />
          </div>
          <div className="tw-w-full tw-min-w-0 lg:tw-flex-1">
            <div className="tw-flex tw-w-full tw-flex-col tw-gap-4 sm:tw-flex-row">
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
          <div className="tw-w-fit lg:tw-shrink-0">
            <PrimaryButton
              onClicked={onSubmit}
              disabled={!date || !time}
              loading={loading}
            >
              Submit
            </PrimaryButton>
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
