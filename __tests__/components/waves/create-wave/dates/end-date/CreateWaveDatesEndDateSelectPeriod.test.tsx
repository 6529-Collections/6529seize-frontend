import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import CreateWaveDatesEndDateSelectPeriod from '../../../../../../components/waves/create-wave/dates/end-date/CreateWaveDatesEndDateSelectPeriod';
import { Period } from '../../../../../../helpers/Types';
import { CREATE_WAVE_VALIDATION_ERROR } from '../../../../../../helpers/waves/create-wave.validation';

let clickAwayCb: (e:any) => void; let escapeCb: () => void;

jest.mock('react-use', () => ({
  useClickAway: (_ref: any, cb: any) => { clickAwayCb = cb; },
  useKeyPressEvent: (key: string, cb: () => void) => { if(key==='Escape') escapeCb = cb; },
}));

jest.mock('../../../../../../components/waves/create-wave/dates/end-date/CreateWaveDatesEndDateSelectPeriodItem', () => (props: any) => (
  <li data-testid={`item-${props.period}`} onClick={() => props.onPeriodSelect(props.period)}></li>
));

describe('CreateWaveDatesEndDateSelectPeriod', () => {
  it('opens and selects period', async () => {
    const onSelect = jest.fn();
    const user = userEvent.setup();
    render(<CreateWaveDatesEndDateSelectPeriod activePeriod={null} errors={[]} onPeriodSelect={onSelect} />);

    await user.click(screen.getByRole('button'));
    expect(screen.getByTestId(`item-${Period.MINUTES}`)).toBeInTheDocument();
    await user.click(screen.getByTestId(`item-${Period.DAYS}`));
    expect(onSelect).toHaveBeenCalledWith(Period.DAYS);
    await waitFor(() => expect(screen.queryByTestId(`item-${Period.MINUTES}`)).toBeNull());
  });

  it('closes on escape and click away', async () => {
    const user = userEvent.setup();
    render(<CreateWaveDatesEndDateSelectPeriod activePeriod={null} errors={[]} onPeriodSelect={jest.fn()} />);
    await user.click(screen.getByRole('button'));
    expect(screen.getByTestId(`item-${Period.MINUTES}`)).toBeInTheDocument();
    escapeCb();
    await waitFor(() => expect(screen.queryByTestId(`item-${Period.MINUTES}`)).toBeNull());
    await user.click(screen.getByRole('button'));
    clickAwayCb({ target: document.body });
    await waitFor(() => expect(screen.queryByTestId(`item-${Period.MINUTES}`)).toBeNull());
  });

  it('shows error text when required', () => {
    render(
      <CreateWaveDatesEndDateSelectPeriod
        activePeriod={null}
        errors={[CREATE_WAVE_VALIDATION_ERROR.END_DATE_REQUIRED]}
        onPeriodSelect={jest.fn()}
      />
    );
    expect(screen.getByText('Please choose period')).toBeInTheDocument();
  });
});

