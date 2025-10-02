import { render, screen, fireEvent } from '@testing-library/react';
import AveragingIntervalInput from '@/components/waves/create-wave/voting/components/AveragingIntervalInput';
import { MIN_MINUTES } from '@/components/waves/create-wave/voting/types';

describe('AveragingIntervalInput', () => {
  const onIntervalChange = jest.fn();
  const onUnitChange = jest.fn();

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('enforces minimum on blur when value is empty', () => {
    render(
      <AveragingIntervalInput
        value=""
        unit="minutes"
        onIntervalChange={onIntervalChange}
        onUnitChange={onUnitChange}
      />
    );
    const input = screen.getByTestId('averaging-interval-input');
    fireEvent.blur(input);
    expect(onIntervalChange).toHaveBeenCalledWith(String(MIN_MINUTES));
  });

  it('does not change value when valid', () => {
    render(
      <AveragingIntervalInput
        value="10"
        unit="minutes"
        onIntervalChange={onIntervalChange}
        onUnitChange={onUnitChange}
      />
    );
    const input = screen.getByTestId('averaging-interval-input');
    fireEvent.blur(input);
    expect(onIntervalChange).not.toHaveBeenCalled();
  });

  it('handles Enter key by blurring and validating', () => {
    render(
      <AveragingIntervalInput
        value="3"
        unit="minutes"
        onIntervalChange={onIntervalChange}
        onUnitChange={onUnitChange}
      />
    );
    const input = screen.getByTestId('averaging-interval-input');
    fireEvent.keyDown(input, { key: 'Enter' });
    fireEvent.blur(input);
    expect(onIntervalChange).toHaveBeenCalledWith(String(MIN_MINUTES));
  });
});
