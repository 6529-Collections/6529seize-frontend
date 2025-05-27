import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GroupsSidebarApp from '../../../../components/groups/sidebar/GroupsSidebarApp';

jest.mock('../../../../components/groups/sidebar/GroupsSidebar', () => () => (
  <div data-testid="sidebar" />
));

describe('GroupsSidebarApp', () => {
  it('renders sidebar when open and handles close', async () => {
    const onClose = jest.fn();
    render(<GroupsSidebarApp open={true} onClose={onClose} />);
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    await userEvent.click(screen.getByLabelText('Close sidebar'));
    expect(onClose).toHaveBeenCalled();
  });

  it('does not render when closed', () => {
    const { queryByLabelText } = render(<GroupsSidebarApp open={false} onClose={jest.fn()} />);
    expect(queryByLabelText('Close sidebar')).toBeNull();
  });
});
