import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreateWaveOutcomeTypes from '@/components/waves/create-wave/outcomes/CreateWaveOutcomeTypes';
import { CreateWaveOutcomeType } from '@/types/waves.types';

jest.mock('@/components/waves/create-wave/outcomes/CreateWaveOutcomeTypesItem', () => (props: any) => (
  <button data-testid="item" onClick={() => props.setOutcomeType(props.outcomeType)}>{props.label}</button>
));

describe('CreateWaveOutcomeTypes', () => {
  it('renders all outcome type items and handles click', async () => {
    const user = userEvent.setup();
    const setOutcomeType = jest.fn();
    render(
      <CreateWaveOutcomeTypes outcomeType={null} setOutcomeType={setOutcomeType} />
    );
    const items = screen.getAllByTestId('item');
    expect(items).toHaveLength(Object.values(CreateWaveOutcomeType).length);
    await user.click(items[0]);
    expect(setOutcomeType).toHaveBeenCalledWith(Object.values(CreateWaveOutcomeType)[0]);
  });
});
