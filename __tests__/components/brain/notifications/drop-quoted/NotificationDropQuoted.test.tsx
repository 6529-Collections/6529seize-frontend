import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NotificationDropQuoted from '@/components/brain/notifications/drop-quoted/NotificationDropQuoted';

const push = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
  useSearchParams: jest.fn(),
  usePathname: jest.fn(),
}));

jest.mock('@/hooks/useDeviceInfo', () => ({
  __esModule: true,
  default: () => ({ isApp: false }),
}));

jest.mock('@/components/brain/notifications/subcomponents/NotificationHeader', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="notification-header">{children}</div>,
}));

jest.mock('@/components/brain/notifications/NotificationsFollowBtn', () => ({
  __esModule: true,
  default: () => <div data-testid="follow-btn" />,
}));

jest.mock('@/components/waves/drops/Drop', () => ({
  __esModule: true,
  default: (props: { onReplyClick: (n: number) => void; onQuoteClick: (q: unknown) => void }) => (
    <div>
      <button onClick={() => props.onReplyClick(11)}>reply</button>
      <button onClick={() => props.onQuoteClick({ wave: { id: 'q' }, serial_no: 22 })}>quote</button>
    </div>
  ),
  DropLocation: {
    MY_STREAM: 'MY_STREAM',
    WAVE: 'WAVE'
  }
}));

jest.mock('@/helpers/waves/drop.helpers', () => ({
  convertApiDropToExtendedDrop: (drop: unknown) => ({ ...drop as object, type: 'FULL', stableKey: 'k', stableHash: 'h' }),
  DropSize: { FULL: 'FULL' },
}));

describe('NotificationDropQuoted', () => {
  beforeEach(() => {
    push.mockClear();
  });

  const notification = { 
    related_drops: [{ wave: { id: 'w' }, serial_no: 5, author: { handle: 'alice' } }],
    created_at: Date.now()
  } as never;

  it('navigates on reply click', async () => {
    const user = userEvent.setup();
    render(
      <NotificationDropQuoted notification={notification} activeDrop={null} onReply={jest.fn()} onQuote={jest.fn()} />
    );
    await user.click(screen.getByText('reply'));
    expect(push).toHaveBeenCalledWith('/waves?wave=w&serialNo=11');
  });

  it('navigates on quote click', async () => {
    const user = userEvent.setup();
    render(
      <NotificationDropQuoted notification={notification} activeDrop={null} onReply={jest.fn()} onQuote={jest.fn()} />
    );
    await user.click(screen.getByText('quote'));
    expect(push).toHaveBeenCalledWith('/waves?wave=q&serialNo=22');
  });
});
