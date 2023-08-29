import { useState } from "react";
import { distributionPlanApiPost } from "../../../services/distribution-plan-api";
import Countdown from "../../distribution-plan-tool/common/Countdown";

export default function BlockPickerEasy() {
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

  const [predictedEasyBlock, setPredictedEasyBlock] = useState<{
    blockNumber: number;
    timestamp: number;
  } | null>(null);

  const [loadingEasyBloc, setLoadingEasyBlock] = useState<boolean>(false);

  const handleEasySubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoadingEasyBlock(true);
    const localDateTimeString = `${date} ${time}`;
    const localDateTime = new Date(localDateTimeString.replace(" ", "T"));
    const timestamp = localDateTime.getTime();
    const endpoint = "/other/predict-block-number";
    const { data } = await distributionPlanApiPost<number>({
      endpoint,
      body: { timestamp },
    });
    setLoadingEasyBlock(false);
    if (data) {
      setPredictedEasyBlock({
        blockNumber: data,
        timestamp,
      });
    } else {
      setPredictedEasyBlock(null);
    }
  };
  return (
    <div>
      <form onSubmit={handleEasySubmit}>
        <input
          type="date"
          name="easy-date"
          id="easy-date"
          value={date}
          required
          onChange={(e) => setDate(e.target.value)}
          className="tw-form-input tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-neutral-700/40 tw-text-white tw-font-light tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-neutral-700/40 placeholder:tw-text-neutral-500  focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 hover:tw-ring-neutral-700 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
        />
        <input
          type="time"
          name="easy-time"
          id="easy-time"
          value={time}
          required
          onChange={(e) => setTime(e.target.value)}
          className="tw-form-input tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-neutral-700/40 tw-text-white tw-font-light tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-neutral-700/40 placeholder:tw-text-neutral-500  focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 hover:tw-ring-neutral-700 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
        />
        <button type="submit">Get Block</button>
      </form>
      <div>
        {predictedEasyBlock && (
          <div>
            <p>Block number: {predictedEasyBlock.blockNumber}</p>
            <p>
              Date:
              {new Date(predictedEasyBlock.timestamp).toLocaleString("en-GB", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
            <div className="tw-inline-flex tw-space-x-2">
              <div>In:</div>{" "}
              <Countdown timestamp={predictedEasyBlock.timestamp} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
