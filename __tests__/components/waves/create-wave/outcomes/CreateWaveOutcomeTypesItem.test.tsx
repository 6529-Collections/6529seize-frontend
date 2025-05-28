import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreateWaveOutcomeTypesItem from '../../../../../components/waves/create-wave/outcomes/CreateWaveOutcomeTypesItem';
import { CreateWaveOutcomeType } from '../../../../../types/waves.types';

describe('CreateWaveOutcomeTypesItem', () => {
  it('applies active classes when selected', () => {
    render(
      <CreateWaveOutcomeTypesItem
        outcomeType={CreateWaveOutcomeType.MANUAL}
        label="Manual"
        selectedOutcomeType={CreateWaveOutcomeType.MANUAL}
        setOutcomeType={jest.fn()}
      />
    );
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('tw-ring-primary-400');
  });

  it('calls setOutcomeType on click', async () => {
    const user = userEvent.setup();
    const setOutcomeType = jest.fn();
    render(
      <CreateWaveOutcomeTypesItem
        outcomeType={CreateWaveOutcomeType.REP}
        label="Rep"
        selectedOutcomeType={null}
        setOutcomeType={setOutcomeType}
      />
    );
    await user.click(screen.getByRole('button'));
    expect(setOutcomeType).toHaveBeenCalledWith(CreateWaveOutcomeType.REP);
  });
});
