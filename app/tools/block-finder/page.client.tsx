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
import { parseLocalDateTime } from "@/helpers/block-finder.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
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

class PredictionRequestError extends Error {
  readonly reason: string | undefined;

  constructor(reason: string | undefined) {
    super(
      reason
        ? `Failed to predict block numbers: ${reason}`
        : "Failed to predict block numbers"
    );
    this.name = "PredictionRequestError";
    this.reason = reason;
  }
}

async function readApiErrorReason(
  response: Response
): Promise<string | undefined> {
  const errorResponse: unknown = await response.json().catch(() => null);
  const message = (errorResponse as { message?: unknown } | null)?.message;
  return typeof message === "string" && message.trim() !== ""
    ? message
    : undefined;
}

function getPredictionFailedMessage(
  locale: SupportedLocale,
  error: unknown
): string {
  if (error instanceof PredictionRequestError && error.reason) {
    return t(locale, "tools.blockFinder.toast.predictFailedWithReason", {
      reason: error.reason,
    });
  }
  return t(locale, "tools.blockFinder.toast.predictFailed");
}

export default function BlockFinderClient() {
  const { setTitle } = useTitle();
  const { setToast } = useAuth();
  const locale = useBrowserLocale();

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
        message: t(
          locale,
          "tools.blockFinder.toast.timeWindowNeedsBlockNumbers"
        ),
        type: "error",
      });
      return;
    }

    if (
      blockNumberIncludes &&
      !/^\d+(,\s*\d+)*$/.test(blockNumberIncludes.trim())
    ) {
      setToast({
        message: t(locale, "tools.blockFinder.toast.invalidBlockNumbers"),
        type: "error",
      });
      return;
    }

    // The date and time inputs hold the user's LOCAL wall-clock time.
    const startDate = parseLocalDateTime(date, time);
    if (!startDate) {
      setToast({
        message: t(locale, "tools.blockFinder.toast.invalidDateTime"),
        type: "error",
      });
      return;
    }

    setLoading(true);
    try {
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
        throw new PredictionRequestError(await readApiErrorReason(response));
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
      setToast({
        message: getPredictionFailedMessage(locale, error),
        type: "error",
      });
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
