import CreateWaveOutcomeTypes from "./CreateWaveOutcomeTypes";
import CreateWaveOutcomesManual from "./manual/CreateWaveOutcomesManual";
import CreateWaveOutcomesRep from "./rep/CreateWaveOutcomesRep";
import CreateWaveOutcomesCIC from "./cic/CreateWaveOutcomesCIC";
import CreateWaveOutcomesRows from "./winners/rows/CreateWaveOutcomesRows";
import type {
  CreateWaveDatesConfig,
  CreateWaveDisplayConfig,
  CreateWaveOutcomeConfig,
} from "@/types/waves.types";
import { CreateWaveOutcomeType } from "@/types/waves.types";
import CommonAnimationHeight from "@/components/utils/animation/CommonAnimationHeight";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import type { CREATE_WAVE_VALIDATION_ERROR } from "@/helpers/waves/create-wave.validation";
import CreateWaveApprovalMaxWinners from "./CreateWaveApprovalMaxWinners";
import CreateWaveOutcomeWarning from "./CreateWaveOutcomeWarning";

import type { JSX } from "react";

function ShowOutcomesToggle({
  display,
  disabled,
  onChange,
}: {
  readonly display: CreateWaveDisplayConfig;
  readonly disabled: boolean;
  readonly onChange: (display: CreateWaveDisplayConfig) => void;
}) {
  return (
    <label
      className={`tw-flex tw-items-center tw-justify-between tw-gap-4 tw-rounded-lg tw-border tw-border-solid tw-border-white/5 tw-bg-iron-900 tw-px-4 tw-py-3 ${
        disabled ? "tw-opacity-60" : ""
      }`}
    >
      <span className="tw-text-sm tw-font-medium tw-text-iron-200">
        Show outcomes
      </span>
      <input
        type="checkbox"
        checked={display.outcomesVisible}
        disabled={disabled}
        onChange={(event) =>
          onChange({
            ...display,
            outcomesVisible: event.target.checked,
          })
        }
        className="tw-form-checkbox tw-size-5 tw-rounded tw-border-iron-600 tw-bg-iron-950 tw-text-primary-500 focus:tw-ring-primary-400 disabled:tw-cursor-not-allowed"
      />
    </label>
  );
}

export default function WavesOutcome({
  outcomes,
  outcomeType,
  waveType,
  errors,
  dates,
  display,
  maxWinners,
  setOutcomeType,
  setOutcomes,
  setDisplay,
  setMaxWinners,
}: {
  readonly outcomes: CreateWaveOutcomeConfig[];
  readonly outcomeType: CreateWaveOutcomeType | null;
  readonly waveType: ApiWaveType;
  readonly errors: CREATE_WAVE_VALIDATION_ERROR[];
  readonly dates: CreateWaveDatesConfig;
  readonly display: CreateWaveDisplayConfig;
  readonly maxWinners: number | null;
  readonly setOutcomeType: (outcomeType: CreateWaveOutcomeType | null) => void;
  readonly setOutcomes: (outcomes: CreateWaveOutcomeConfig[]) => void;
  readonly setDisplay: (display: CreateWaveDisplayConfig) => void;
  readonly setMaxWinners: (maxWinners: number | null) => void;
}) {
  const isApproveWave = waveType === ApiWaveType.Approve;
  const isPerpetualRanking =
    waveType === ApiWaveType.Rank && (dates.ongoingRanking ?? false);

  const onOutcome = (outcome: CreateWaveOutcomeConfig) => {
    setOutcomes([...outcomes, outcome]);
    setOutcomeType(null);
  };

  const onCancel = () => {
    setOutcomeType(null);
  };

  const components: Record<CreateWaveOutcomeType, JSX.Element> = {
    [CreateWaveOutcomeType.MANUAL]: (
      <CreateWaveOutcomesManual
        onOutcome={onOutcome}
        onCancel={onCancel}
        waveType={waveType}
      />
    ),
    [CreateWaveOutcomeType.REP]: (
      <CreateWaveOutcomesRep
        onOutcome={onOutcome}
        onCancel={onCancel}
        waveType={waveType}
      />
    ),
    [CreateWaveOutcomeType.NIC]: (
      <CreateWaveOutcomesCIC
        onOutcome={onOutcome}
        onCancel={onCancel}
        waveType={waveType}
      />
    ),
  };

  if (isPerpetualRanking) {
    return (
      <div className="tw-mx-auto tw-w-full">
        <p className="tw-mb-0 tw-text-xl tw-font-semibold tw-text-white">
          Outcomes
        </p>
        <div className="tw-mt-3 tw-space-y-4">
          <div className="tw-rounded-lg tw-border tw-border-solid tw-border-primary-500/30 tw-bg-primary-500/10 tw-p-4 tw-shadow-inner">
            <p className="tw-mb-1 tw-text-sm tw-font-semibold tw-text-iron-50">
              Outcome is leaderboard position
            </p>
            <p className="tw-mb-0 tw-text-xs tw-text-iron-300">
              This wave ranks continuously &mdash; no winners are announced and
              the wave never ends, so there are no outcome awards to configure.
              The live leaderboard is the outcome and stays visible to viewers.
            </p>
          </div>
          <ShowOutcomesToggle
            display={display}
            disabled
            onChange={setDisplay}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="tw-mx-auto tw-w-full">
      <p className="tw-mb-0 tw-text-xl tw-font-semibold tw-text-white">
        Choose outcome type
      </p>
      <div className="tw-mt-3 tw-space-y-6">
        {isApproveWave && (
          <div className="tw-space-y-4">
            <CreateWaveApprovalMaxWinners
              maxWinners={maxWinners}
              setMaxWinners={setMaxWinners}
            />
            <CreateWaveOutcomeWarning
              waveType={waveType}
              dates={dates}
              maxWinners={maxWinners}
            />
          </div>
        )}
        <CreateWaveOutcomeTypes
          outcomeType={outcomeType}
          setOutcomeType={setOutcomeType}
        />
        <div>
          {/* <h3 className="tw-mb-2 tw-text-base tw-font-semibold tw-text-white">Title for created outcome cards</h3> */}
          <CommonAnimationHeight>
            {outcomeType ? (
              components[outcomeType]
            ) : (
              <CreateWaveOutcomesRows
                waveType={waveType}
                errors={errors}
                outcomes={outcomes}
                setOutcomes={setOutcomes}
              />
            )}
          </CommonAnimationHeight>
        </div>
        <ShowOutcomesToggle
          display={display}
          disabled={false}
          onChange={setDisplay}
        />
      </div>
    </div>
  );
}
