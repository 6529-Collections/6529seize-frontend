import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GroupsSidebarToggle from '@/components/groups/sidebar/GroupsSidebarToggle';

jest.mock('react-redux', () => ({ useSelector: jest.fn() }));

const { useSelector: useSelectorMock } = jest.requireMock('react-redux');

describe('GroupsSidebarToggle', () => {
  it('highlights button when group selected and closed', async () => {
    (useSelectorMock as jest.Mock).mockReturnValue('g1');
    const setOpen = jest.fn();
    render(<GroupsSidebarToggle open={false} setOpen={setOpen} />);
    const button = screen.getByRole('button');
    expect(button.className).toContain('tw-text-primary-400');
    await userEvent.click(button);
    expect(setOpen).toHaveBeenCalledWith(true);
  });

  it('shows default color when open or no group selected', () => {
    (useSelectorMock as jest.Mock).mockReturnValue(null);
    const { rerender } = render(<GroupsSidebarToggle open={false} setOpen={jest.fn()} />);
    let button = screen.getByRole('button');
    expect(button.className).toContain('tw-text-iron-400');
    rerender(<GroupsSidebarToggle open={true} setOpen={jest.fn()} />);
    button = screen.getByRole('button');
    expect(button.className).toContain('tw-text-iron-400');
  });
});
