import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NotificationsCauseFilter from '@/components/brain/notifications/NotificationsCauseFilter';
import { AuthContext } from '@/components/auth/Auth';
import { usePrefetchNotifications } from '@/hooks/useNotificationsQuery';

jest.mock('@/hooks/useNotificationsQuery');
const prefetch = jest.fn();
(usePrefetchNotifications as jest.Mock).mockReturnValue(prefetch);

const connectedProfile = { handle: 'tester' } as any;
const Wrapper: React.FC<{children: React.ReactNode}> = ({ children }) => (
  <AuthContext.Provider value={{ connectedProfile } as any}>{children}</AuthContext.Provider>
);

beforeAll(() => {
  HTMLElement.prototype.scrollTo = jest.fn();
});

describe('NotificationsCauseFilter', () => {
  it('calls setActiveFilter on click and prefetch on hover', async () => {
    const setActive = jest.fn();
    render(<NotificationsCauseFilter activeFilter={null} setActiveFilter={setActive} />, { wrapper: Wrapper });

    const buttons = screen.getAllByRole('button');
    await userEvent.hover(buttons[1]);
    expect(prefetch).toHaveBeenCalledWith({ identity: 'tester', cause: expect.any(Array) });

    await userEvent.click(buttons[2]);
    expect(setActive).toHaveBeenCalled();
  });
});
