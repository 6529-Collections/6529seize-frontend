import CommonSwitch from '@/components/utils/switch/CommonSwitch';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('CommonSwitch', () => {
  it('renders and toggles', async () => {
    const user = userEvent.setup();
    const setIsOn = jest.fn();
    render(<CommonSwitch label="Test" isOn={false} setIsOn={setIsOn} />);
    const button = screen.getByRole('switch');
    expect(button).toHaveClass('tw-bg-iron-700');
    await user.click(button);
    expect(setIsOn).toHaveBeenCalledWith(true);
  });
});
