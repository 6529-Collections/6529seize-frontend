import { useState } from "react";
import { distributionPlanApiPost } from "../../../services/distribution-plan-api";
import BlockPickerAdvancedItem from "./BlockPickerAdvancedItem";

export interface PredictBlockNumbersResponseApiModel {
  readonly blockNumberIncludes: number;
  readonly count: number;
  readonly blockNumbers: number[];
}

export default function BlockPickerAdvanced() {
  const [minDate, setMinDate] = useState<string>(
    new Date().toLocaleDateString("en-GB").split("/").reverse().join("-")
  );
  const [minTime, setMinTime] = useState<string>(
    new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
  );

  const [maxDate, setMaxDate] = useState<string>(
    new Date().toLocaleDateString("en-GB").split("/").reverse().join("-")
  );

  const [maxTime, setMaxTime] = useState<string>(
    new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
  );

  const [blockNumberIncludes, setBlockNumberIncludes] = useState<string>("");

  const [loading, setLoading] = useState<boolean>(false);

  const [predictedBlocks, setPredictedBlocks] = useState<
    PredictBlockNumbersResponseApiModel[]
  >([]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
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
    const minLocalDateTimeString = `${minDate} ${minTime}`;
    const minLocalDateTime = new Date(minLocalDateTimeString.replace(" ", "T"));
    const minTimestamp = minLocalDateTime.getTime();

    const maxLocalDateTimeString = `${maxDate} ${maxTime}`;
    const maxLocalDateTime = new Date(maxLocalDateTimeString.replace(" ", "T"));
    const maxTimestamp = maxLocalDateTime.getTime();

    setLoading(true);

    const endpoint = "/other/predict-block-numbers";
    const { data, success } = await distributionPlanApiPost<
      PredictBlockNumbersResponseApiModel[]
    >({
      endpoint,
      body: { minTimestamp, maxTimestamp, blockNumberIncludes: blockNos },
    });

    setLoading(false);
    if (!success) {
      setPredictedBlocks([]);
      return;
    }
    setPredictedBlocks(data ?? []);
  };
  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input
          type="date"
          name="min-date"
          id="min-date"
          value={minDate}
          required
          onChange={(e) => setMinDate(e.target.value)}
          className="tw-form-input tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-neutral-700/40 tw-text-white tw-font-light tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-neutral-700/40 placeholder:tw-text-neutral-500  focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 hover:tw-ring-neutral-700 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
        />
        <input
          type="time"
          name="min-time"
          id="min-time"
          value={minTime}
          required
          onChange={(e) => setMinTime(e.target.value)}
          className="tw-form-input tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-neutral-700/40 tw-text-white tw-font-light tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-neutral-700/40 placeholder:tw-text-neutral-500  focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 hover:tw-ring-neutral-700 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
        />
        <input
          type="date"
          name="max-date"
          id="max-date"
          value={maxDate}
          required
          onChange={(e) => setMaxDate(e.target.value)}
          className="tw-form-input tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-neutral-700/40 tw-text-white tw-font-light tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-neutral-700/40 placeholder:tw-text-neutral-500  focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 hover:tw-ring-neutral-700 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
        />
        <input
          type="time"
          name="max-time"
          id="max-time"
          value={maxTime}
          required
          onChange={(e) => setMaxTime(e.target.value)}
          className="tw-form-input tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-neutral-700/40 tw-text-white tw-font-light tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-neutral-700/40 placeholder:tw-text-neutral-500  focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 hover:tw-ring-neutral-700 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
        />
        <input
          type="text"
          name="block-number-includes"
          id="block-number-includes"
          value={blockNumberIncludes}
          required
          onChange={(e) => setBlockNumberIncludes(e.target.value)}
          className="tw-form-input tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-neutral-700/40 tw-text-white tw-font-light tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-neutral-700/40 placeholder:tw-text-neutral-500  focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 hover:tw-ring-neutral-700 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
        />
        <button type="submit">Get Blocks</button>
      </form>

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
  );
}
