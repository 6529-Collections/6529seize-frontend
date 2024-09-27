import CreateWaveOutcomeTypes from "./CreateWaveOutcomeTypes";
import CreateWaveOutcomesManual from "./manual/CreateWaveOutcomesManual";
import CreateWaveOutcomesRep from "./rep/CreateWaveOutcomesRep";
import CreateWaveOutcomesCIC from "./cic/CreateWaveOutcomesCIC";
import CreateWaveOutcomesRows from "./winners/rows/CreateWaveOutcomesRows";
import {
  CreateWaveDatesConfig,
  CreateWaveOutcomeConfig,
  CreateWaveOutcomeType,
} from "../../../../types/waves.types";
import CommonAnimationHeight from "../../../utils/animation/CommonAnimationHeight";
import { WaveType } from "../../../../generated/models/WaveType";
import { CREATE_WAVE_VALIDATION_ERROR } from "../../../../helpers/waves/create-wave.helpers";

export default function WavesOutcome({
  outcomes,
  outcomeType,
  waveType,
  errors,
  dates,
  setOutcomeType,
  setOutcomes,
}: {
  readonly outcomes: CreateWaveOutcomeConfig[];
  readonly outcomeType: CreateWaveOutcomeType | null;
  readonly waveType: WaveType;
  readonly errors: CREATE_WAVE_VALIDATION_ERROR[];
  readonly dates: CreateWaveDatesConfig;
  readonly setOutcomeType: (outcomeType: CreateWaveOutcomeType | null) => void;
  readonly setOutcomes: (outcomes: CreateWaveOutcomeConfig[]) => void;
}) {
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
        dates={dates}
        waveType={waveType}
      />
    ),
    [CreateWaveOutcomeType.REP]: (
      <CreateWaveOutcomesRep
        onOutcome={onOutcome}
        onCancel={onCancel}
        dates={dates}
        waveType={waveType}
      />
    ),
    [CreateWaveOutcomeType.NIC]: (
      <CreateWaveOutcomesCIC
        onOutcome={onOutcome}
        onCancel={onCancel}
        dates={dates}
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
