import { useState } from "react";
import { WaveType } from "../../../../../types/waves.types";
import CreateWaveDatesEndDateSelectPeriod from "./CreateWaveDatesEndDateSelectPeriod";
import { Period } from "../../../../../helpers/Types";

export default function CreateWaveDatesEndDate({
  waveType,
}: {
  readonly waveType: WaveType;
}) {
  const endDateIsOptional = waveType !== WaveType.RANK;
  const [time, setTime] = useState<number | null>(null);
  const [period, setPeriod] = useState<Period | null>(null);
  const onTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseInt(e.target.value);
    setTime(typeof newTime === "number" ? newTime : null);
  };
  const onPeriodSelect = (newPeriod: Period) => {
    setPeriod(endDateIsOptional && newPeriod === period ? null : newPeriod);
  };
  return (
    <div className="tw-col-span-full">
      <p className="tw-mb-0 tw-text-xl tw-font-bold tw-text-iron-50">
        Period{" "}
        {endDateIsOptional && (
          <span className="tw-text-base tw-font-semibold tw-text-iron-400">
            (optional)
          </span>
        )}
      </p>
      <div className="tw-mt-3 tw-grid tw-grid-cols-2 tw-gap-x-4 tw-gap-y-4">
        <input
          type="number"
          value={time ?? undefined}
          onChange={onTimeChange}
          className="tw-form-input tw-block tw-w-full tw-text-base tw-rounded-lg tw-border-0 tw-appearance-none tw-text-white tw-border-iron-600 focus:tw-border-blue-500 tw-peer
      tw-pl-4 tw-pr-4 tw-bg-iron-900 hover:tw-bg-iron-800 focus:tw-bg-iron-900 tw-font-medium tw-caret-primary-300 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-600 placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-transition tw-duration-300 tw-ease-out"
          placeholder="Set time"
        />
        <CreateWaveDatesEndDateSelectPeriod
          activePeriod={period}
          onPeriodSelect={onPeriodSelect}
        />
      </div>
    </div>
  );
}
