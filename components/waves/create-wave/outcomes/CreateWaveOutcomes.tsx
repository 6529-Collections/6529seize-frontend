import CreateWaveOutcomeTypes from "./CreateWaveOutcomeTypes";
import CreateWaveOutcomesManual from "./manual/CreateWaveOutcomesManual";
import CreateWaveOutcomesRep from "./rep/CreateWaveOutcomesRep";
import CreateWaveOutcomesCIC from "./cic/CreateWaveOutcomesCIC";
import CreateWaveOutcomesRows from "./winners/rows/CreateWaveOutcomesRows";
import type {
  CreateWaveDatesConfig,
  CreateWaveOutcomeConfig,
} from "@/types/waves.types";
import { CreateWaveOutcomeType } from "@/types/waves.types";
import CommonAnimationHeight from "@/components/utils/animation/CommonAnimationHeight";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import type { CREATE_WAVE_VALIDATION_ERROR } from "@/helpers/waves/create-wave.validation";
import CreateWaveApprovalMaxWinners from "./CreateWaveApprovalMaxWinners";
import CreateWaveOutcomeWarning from "./CreateWaveOutcomeWarning";

import type { JSX } from "react";

export default function WavesOutcome({
  outcomes,
  outcomeType,
  waveType,
  errors,
  dates,
  maxWinners,
  setOutcomeType,
  setOutcomes,
  setMaxWinners,
}: {
  readonly outcomes: CreateWaveOutcomeConfig[];
  readonly outcomeType: CreateWaveOutcomeType | null;
  readonly waveType: ApiWaveType;
  readonly errors: CREATE_WAVE_VALIDATION_ERROR[];
  readonly dates: CreateWaveDatesConfig;
  readonly maxWinners: number | null;
  readonly setOutcomeType: (outcomeType: CreateWaveOutcomeType | null) => void;
  readonly setOutcomes: (outcomes: CreateWaveOutcomeConfig[]) => void;
  readonly setMaxWinners: (maxWinners: number | null) => void;
}) {
  const isApproveWave = waveType === ApiWaveType.Approve;

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
      </div>
    </div>
  );
}
