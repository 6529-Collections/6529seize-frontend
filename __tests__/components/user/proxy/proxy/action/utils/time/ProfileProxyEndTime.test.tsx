import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProfileProxyEndTime from '@/components/user/proxy/proxy/action/utils/time/ProfileProxyEndTime';
import { AuthContext } from '@/components/auth/Auth';

jest.mock('@/helpers/Helpers', () => ({ getTimeUntil: () => 'in 1 hour' }));
jest.mock('@/components/utils/icons/PencilIcon', () => ({ __esModule: true, default: () => <svg data-testid="pencil" />, PencilIconSize: { SMALL: 'SMALL' }}));

describe('ProfileProxyEndTime', () => {
  const action = { end_time: Date.now() + 3600_000 } as any;
  const proxy = { created_by: { id: '1' } } as any;

  it('shows edit button for owner', async () => {
    const onEdit = jest.fn();
    const user = userEvent.setup();
    render(
      <AuthContext.Provider value={{ connectedProfile: { id: '1' } } as any}>
        <ProfileProxyEndTime profileProxy={proxy} profileProxyAction={action} onEndTimeEdit={onEdit} />
      </AuthContext.Provider>
    );
    expect(screen.getByText('in 1 hour')).toBeInTheDocument();
    await user.click(screen.getByRole('button'));
    expect(onEdit).toHaveBeenCalled();
  });

  it('hides edit button for non owner', () => {
    render(
      <AuthContext.Provider value={{ connectedProfile: { id: '2' } } as any}>
        <ProfileProxyEndTime profileProxy={proxy} profileProxyAction={action} onEndTimeEdit={jest.fn()} />
      </AuthContext.Provider>
    );
    expect(screen.queryByRole('button')).toBeNull();
  });
});
