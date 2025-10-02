import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CommonSwitch from '@/components/utils/switch/CommonSwitch';

describe('CommonSwitch', () => {
  it('renders and toggles', async () => {
    const user = userEvent.setup();
    const setIsOn = jest.fn();
    render(<CommonSwitch label="Test" isOn={false} setIsOn={setIsOn} />);
    const button = screen.getByRole('switch');
    expect(button).toHaveClass('tw-bg-neutral-700');
    await user.click(button);
    expect(setIsOn).toHaveBeenCalledWith(true);
  });
});
