import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreateWaveDatesEndDateSelectPeriodItem from '../../../../../../components/waves/create-wave/dates/end-date/CreateWaveDatesEndDateSelectPeriodItem';
import { Period } from '../../../../../../helpers/Types';

describe('CreateWaveDatesEndDateSelectPeriodItem', () => {
  it('calls onPeriodSelect when clicked', async () => {
    const onSelect = jest.fn();
    const user = userEvent.setup();
    render(
      <CreateWaveDatesEndDateSelectPeriodItem
        period={Period.DAYS}
        activePeriod={null}
        onPeriodSelect={onSelect}
      />
    );
    await user.click(screen.getByRole('listitem'));
    expect(onSelect).toHaveBeenCalledWith(Period.DAYS);
  });

  it('shows active state when selected', () => {
    const { container } = render(
      <CreateWaveDatesEndDateSelectPeriodItem
        period={Period.DAYS}
        activePeriod={Period.DAYS}
        onPeriodSelect={() => {}}
      />
    );
    const li = screen.getByRole('listitem');
    expect(li.querySelector('svg')).toBeInTheDocument();
    const span = container.querySelector('span');
    expect(span?.className).toContain('tw-font-semibold');
  });
});
