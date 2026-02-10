import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TimeWeightedVoting from '@/components/waves/create-wave/voting/TimeWeightedVoting';
const renderComponent = (config: {
  enabled: boolean;
  averagingInterval: number;
  averagingIntervalUnit: 'minutes' | 'hours';
}, onChange = jest.fn()) =>
  render(<TimeWeightedVoting config={config} onChange={onChange} />);

describe('TimeWeightedVoting', () => {
  const baseConfig = {
    enabled: true,
    averagingInterval: 60,
    averagingIntervalUnit: 'minutes' as const,
  };

  it('toggles enabled state', async () => {
    const onChange = jest.fn();
    renderComponent({ ...baseConfig, enabled: false, averagingIntervalUnit: 'minutes' as const }, onChange);
    await userEvent.click(screen.getByTestId('time-weighted-toggle'));
    expect(onChange).toHaveBeenCalledWith({ averagingInterval: 60, enabled: true, averagingIntervalUnit: 'minutes' });
  });

  it('caps interval at maximum value', async () => {
    const onChange = jest.fn();
    renderComponent({ enabled: true, averagingInterval: 1200, averagingIntervalUnit: 'minutes' as const }, onChange);
    const input = screen.getByTestId('averaging-interval-input') as HTMLInputElement;
    await userEvent.clear(input);
    await userEvent.type(input, '2000');
    expect(onChange).toHaveBeenLastCalledWith({ enabled: true, averagingInterval: 1440, averagingIntervalUnit: 'minutes' });
    expect(input.value).toBe('1440');
  });

  it('changes unit and converts value', async () => {
    const onChange = jest.fn();
    renderComponent(baseConfig, onChange);
    await userEvent.selectOptions(screen.getByTestId('time-unit-selector'), ['hours']);
    expect(onChange).toHaveBeenCalledWith({ enabled: true, averagingInterval: 1, averagingIntervalUnit: 'hours' });
    expect((screen.getByTestId('averaging-interval-input') as HTMLInputElement).value).toBe('1');
  });

  it('does not render input when disabled', () => {
    renderComponent({ enabled: false, averagingInterval: 60, averagingIntervalUnit: 'minutes' as const });
    expect(screen.queryByTestId('averaging-interval-input')).toBeNull();
  });

  it('shows validation error for low interval', () => {
    renderComponent({ enabled: true, averagingInterval: 2, averagingIntervalUnit: 'minutes' as const });
    const input = screen.getByTestId('averaging-interval-input');
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });
});
