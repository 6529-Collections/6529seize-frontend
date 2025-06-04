import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrainLeftSidebarViewChange } from '../../../../components/brain/left-sidebar/BrainLeftSidebarViewChange';
import { AuthContext } from '../../../../components/auth/Auth';
import { useRouter } from 'next/router';
import { useUnreadNotifications } from '../../../../hooks/useUnreadNotifications';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, onClick, className }: any) => (
    <a href={href} onClick={onClick} className={className}>
      {children}
    </a>
  ),
}));
jest.mock('next/router', () => ({ useRouter: jest.fn() }));
jest.mock('../../../../hooks/useUnreadNotifications');

const mockedUseRouter = useRouter as jest.Mock;
const mockedUseUnreadNotifications = useUnreadNotifications as jest.Mock;

const baseAuth = { connectedProfile: { handle: 'alice' } } as any;

function renderSidebar(route: string, unread = false) {
  const push = jest.fn((path: string, _as?: any, _opts?: any) => {
    router.pathname = path;
  });
  const router = { pathname: route, push } as any;
  mockedUseRouter.mockReturnValue(router);
  mockedUseUnreadNotifications.mockReturnValue({ haveUnreadNotifications: unread });

  const utils = render(
    <AuthContext.Provider value={baseAuth}>
      <BrainLeftSidebarViewChange />
    </AuthContext.Provider>
  );
  return { push, router, ...utils };
}

describe('BrainLeftSidebarViewChange', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('highlights "My Stream" link when on /my-stream', () => {
    renderSidebar('/my-stream');
    const links = screen.getAllByRole('link');
    expect(links[0].className).toContain('tw-text-iron-300');
    expect(links[1].className).toContain('tw-text-iron-400');
  });

  it('highlights "Notifications" link and shows unread dot', () => {
    renderSidebar('/my-stream/notifications', true);
    const links = screen.getAllByRole('link');
    expect(links[1].className).toContain('tw-text-iron-300');
    expect(links[0].className).toContain('tw-text-iron-400');
    expect(document.querySelector('.tw-bg-red')).toBeInTheDocument();
  });

  it('navigates to notifications with shallow routing on click', async () => {
    const user = userEvent.setup();
    const { push } = renderSidebar('/my-stream');
    await user.click(screen.getByRole('link', { name: /notifications/i }));
    expect(push).toHaveBeenCalledWith('/my-stream/notifications', undefined, { shallow: true });
  });
});
