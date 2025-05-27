import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useSelector } from 'react-redux';
import GroupsSidebarAppToggle from '../../../../components/groups/sidebar/GroupsSidebarAppToggle';

jest.mock('react-redux', () => ({ useSelector: jest.fn() }));

const { useSelector: useSelectorMock } = jest.requireMock('react-redux');

describe('GroupsSidebarAppToggle', () => {
  it('highlights button when group selected and closed', async () => {
    (useSelectorMock as jest.Mock).mockReturnValue('g1');
    const setOpen = jest.fn();
    render(<GroupsSidebarAppToggle open={false} setOpen={setOpen} />);
    const button = screen.getByLabelText('Toggle groups sidebar');
    expect(button.className).toContain('tw-text-primary-400');
    await userEvent.click(button);
    expect(setOpen).toHaveBeenCalledWith(true);
  });

  it('shows default color when open or no group selected', () => {
    (useSelectorMock as jest.Mock).mockReturnValue(null);
    const { rerender } = render(<GroupsSidebarAppToggle open={false} setOpen={jest.fn()} />);
    let button = screen.getByLabelText('Toggle groups sidebar');
    expect(button.className).toContain('tw-bg-iron-950');
    rerender(<GroupsSidebarAppToggle open={true} setOpen={jest.fn()} />);
    button = screen.getByLabelText('Toggle groups sidebar');
    expect(button.className).toContain('tw-bg-iron-950');
  });
});
