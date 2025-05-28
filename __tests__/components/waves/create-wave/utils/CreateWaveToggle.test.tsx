import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreateWaveToggle from '../../../../../components/waves/create-wave/utils/CreateWaveToggle';

describe('CreateWaveToggle', () => {
  it('renders label when displayLabel is true', () => {
    render(<CreateWaveToggle enabled={false} onChange={jest.fn()} label="Enable" displayLabel />);
    expect(screen.getByText('Enable')).toBeInTheDocument();
  });

  it('triggers onChange with new state', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<CreateWaveToggle enabled={false} onChange={onChange} label="Toggle" />);
    await user.click(screen.getByRole('switch'));
    expect(onChange).toHaveBeenCalledWith(true);
  });
});
