import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreateWaveOutcomesRows from '@/components/waves/create-wave/outcomes/winners/rows/CreateWaveOutcomesRows';
import { ApiWaveType } from '@/generated/models/ApiWaveType';
import { CREATE_WAVE_VALIDATION_ERROR } from '@/helpers/waves/create-wave.validation';
import { CreateWaveOutcomeConfig, CreateWaveOutcomeType } from '@/types/waves.types';

jest.mock('@/components/waves/create-wave/outcomes/winners/rows/CreateWaveOutcomesRow', () => {
  return function MockRow(props: any) {
    return (
      <div data-testid="row">
        <button onClick={props.removeOutcome}>remove</button>
      </div>
    );
  };
});

const sampleOutcomes: CreateWaveOutcomeConfig[] = [
  { type: CreateWaveOutcomeType.REP, title: 'a', credit: null, category: null, maxWinners: null, winnersConfig: null },
  { type: CreateWaveOutcomeType.NIC, title: 'b', credit: null, category: null, maxWinners: null, winnersConfig: null },
];

function setup(overrides: Partial<{ outcomes: CreateWaveOutcomeConfig[]; errors: CREATE_WAVE_VALIDATION_ERROR[] }> = {}) {
  const setOutcomes = jest.fn();
  const outcomes = overrides.outcomes ?? [...sampleOutcomes];
  const errors = overrides.errors ?? [];
  render(
    <CreateWaveOutcomesRows
      waveType={ApiWaveType.Rank}
      errors={errors}
      outcomes={outcomes}
      setOutcomes={setOutcomes}
    />
  );
  return { setOutcomes, outcomes };
}

describe('CreateWaveOutcomesRows', () => {
  it('renders no outcomes message with optional error styling', () => {
    setup({ outcomes: [], errors: [CREATE_WAVE_VALIDATION_ERROR.OUTCOMES_REQUIRED] });
    const msg = screen.getByText('No outcomes added');
    expect(msg).toHaveClass('tw-text-error');
  });

  it('removes outcome when child triggers remove', async () => {
    const user = userEvent.setup();
    const { setOutcomes, outcomes } = setup();
    const buttons = screen.getAllByText('remove');
    await user.click(buttons[0]);
    expect(setOutcomes).toHaveBeenCalledWith([outcomes[1]]);
  });
});
