import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SidebarLayoutApp from '@/components/utils/sidebar/SidebarLayoutApp';

jest.mock('@/components/groups/sidebar/GroupsSidebarApp', () => ({
  __esModule: true,
  default: ({ open }: any) => <div data-testid="sidebar">{open ? 'open' : 'closed'}</div>,
}));

jest.mock('@/components/groups/sidebar/GroupsSidebarAppToggle', () => ({
  __esModule: true,
  default: ({ open, setOpen }: any) => (
    <button data-testid="toggle" onClick={() => setOpen(!open)}>toggle</button>
  ),
}));

describe('SidebarLayoutApp', () => {
  it('toggles sidebar open state when toggle clicked', async () => {
    render(
      <SidebarLayoutApp>
        <div data-testid="child" />
      </SidebarLayoutApp>
    );

    expect(screen.getByTestId('sidebar')).toHaveTextContent('closed');
    await userEvent.click(screen.getByTestId('toggle'));
    expect(screen.getByTestId('sidebar')).toHaveTextContent('open');
  });
});
