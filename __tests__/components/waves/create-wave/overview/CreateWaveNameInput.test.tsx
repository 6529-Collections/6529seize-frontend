import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreateWaveNameInput from '@/components/waves/create-wave/overview/CreateWaveNameInput';
import { CREATE_WAVE_VALIDATION_ERROR } from '@/helpers/waves/create-wave.validation';

beforeAll(() => {
  // Mock ResizeObserver used in CommonAnimationHeight. Implementing the real
  // constructor + method signatures makes it a structurally valid
  // `typeof ResizeObserver`, so no cast is needed.
  global.ResizeObserver = class ResizeObserverMock {
    constructor(_callback: ResizeObserverCallback) {}
    observe(_target: Element, _options?: ResizeObserverOptions): void {}
    unobserve(_target: Element): void {}
    disconnect(): void {}
  };
});

describe('CreateWaveNameInput', () => {
  it('calls onChange when typing', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<CreateWaveNameInput name="" errors={[]} onChange={onChange} />);
    await user.type(screen.getByLabelText('Wave Name *'), 'Wave');
    expect(onChange).toHaveBeenCalled();
  });

  it('shows error message when name required', () => {
    render(<CreateWaveNameInput name="" errors={[CREATE_WAVE_VALIDATION_ERROR.NAME_REQUIRED]} onChange={jest.fn()} />);
    expect(screen.getByText('Name is required')).toBeInTheDocument();
  });
});
