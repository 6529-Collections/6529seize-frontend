import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreateWaveOutcomesWinnersRows from '../../../../../../components/waves/create-wave/outcomes/winners/CreateWaveOutcomesWinnersRows';
import { CreateWaveOutcomeConfigWinner, CreateWaveOutcomeConfigWinnersCreditValueType, CreateWaveOutcomeType } from '../../../../../../types/waves.types';

const sampleWinners: CreateWaveOutcomeConfigWinner[] = [{ value: 1 }, { value: 2 }];

function setup(props: Partial<{winners: CreateWaveOutcomeConfigWinner[]}> = {}) {
  const setWinners = jest.fn();
  const winners = props.winners ?? [...sampleWinners];
  render(
    <CreateWaveOutcomesWinnersRows
      creditValueType={CreateWaveOutcomeConfigWinnersCreditValueType.ABSOLUTE_VALUE}
      winners={winners}
      isError={false}
      outcomeType={CreateWaveOutcomeType.REP}
      setWinners={setWinners}
    />
  );
  return { setWinners, winners };
}

describe('CreateWaveOutcomesWinnersRows', () => {
  it('updates winner value on input change', async () => {
    const user = userEvent.setup();
    const { setWinners, winners } = setup();
    const inputs = screen.getAllByRole('textbox');
    await user.clear(inputs[0]);
    await user.type(inputs[0], '5');
    expect(setWinners).toHaveBeenCalled();
  });

  it('removes winner when remove button clicked', async () => {
    const user = userEvent.setup();
    const { setWinners } = setup();
    const removeButtons = screen.getAllByRole('button', { name: /remove/i });
    await user.click(removeButtons[0]);
    expect(setWinners).toHaveBeenCalledWith([{ value: 2 }]);
  });
});
