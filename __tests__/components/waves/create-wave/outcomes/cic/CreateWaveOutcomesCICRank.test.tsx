import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreateWaveOutcomesCICRank from '@/components/waves/create-wave/outcomes/cic/CreateWaveOutcomesCICRank';
import { CreateWaveOutcomeConfigWinnersCreditValueType } from '@/types/waves.types';

jest.mock('@/components/waves/create-wave/outcomes/winners/CreateWaveOutcomesWinners', () => (props: any) => (
  <button data-testid="winners" onClick={() => props.setWinnersConfig({ creditValueType: CreateWaveOutcomeConfigWinnersCreditValueType.ABSOLUTE_VALUE, totalAmount: 10, winners: [{ value: 10 }] })}>set</button>
));

describe('CreateWaveOutcomesCICRank', () => {
  it('requires valid winners configuration before submit', async () => {
    const onOutcome = jest.fn();
    const user = userEvent.setup();
    render(
      <CreateWaveOutcomesCICRank onOutcome={onOutcome} onCancel={() => {}} />
    );
    await user.click(screen.getByText('Save'));
    expect(onOutcome).not.toHaveBeenCalled();

    await user.click(screen.getByTestId('winners')); // set valid config
    await user.click(screen.getByText('Save'));
    expect(onOutcome).toHaveBeenCalledWith(
      expect.objectContaining({
        winnersConfig: expect.objectContaining({ totalAmount: 10 }),
      })
    );
  });
});
