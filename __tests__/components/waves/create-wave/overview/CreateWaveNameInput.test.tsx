import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreateWaveNameInput from '../../../../../components/waves/create-wave/overview/CreateWaveNameInput';
import { CREATE_WAVE_VALIDATION_ERROR } from '../../../../../helpers/waves/create-wave.validation';

beforeAll(() => {
  // Mock ResizeObserver used in CommonAnimationHeight
  // @ts-ignore
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

describe('CreateWaveNameInput', () => {
  it('calls onChange when typing', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<CreateWaveNameInput name="" errors={[]} onChange={onChange} />);
    await user.type(screen.getByLabelText('Name'), 'Wave');
    expect(onChange).toHaveBeenCalled();
  });

  it('shows error message when name required', () => {
    render(<CreateWaveNameInput name="" errors={[CREATE_WAVE_VALIDATION_ERROR.NAME_REQUIRED]} onChange={jest.fn()} />);
    expect(screen.getByText('Name is required')).toBeInTheDocument();
  });
});
