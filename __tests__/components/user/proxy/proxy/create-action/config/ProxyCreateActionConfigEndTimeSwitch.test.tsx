import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import Switch from '@/components/user/proxy/proxy/create-action/config/ProxyCreateActionConfigEndTimeSwitch';

describe('ProxyCreateActionConfigEndTimeSwitch', () => {
  it('toggles active state', async () => {
    const user = userEvent.setup();
    const setActive = jest.fn();
    render(<Switch isActive={false} setIsActive={setActive} />);
    const button = screen.getByRole('switch');
    await user.click(button);
    expect(setActive).toHaveBeenCalledWith(true);
  });

  it('applies active class when enabled', () => {
    const { container } = render(<Switch isActive={true} setIsActive={() => {}} />);
    const btn = container.querySelector('button');
    expect(btn?.className).toContain('tw-bg-primary-500');
  });
});
