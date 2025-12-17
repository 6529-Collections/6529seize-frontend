import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NotificationDropReplied from '@/components/brain/notifications/drop-replied/NotificationDropReplied';
import { ApiNotificationCause } from '@/generated/models/ApiNotificationCause';

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
  default: ({ author, children }: { author: { handle: string }; children: React.ReactNode }) => (
    <div data-testid="header">
      <span>{author.handle}</span>
      {children}
    </div>
  ),
}));

jest.mock('@/components/brain/notifications/NotificationsFollowBtn', () => ({
  __esModule: true,
  default: () => <div data-testid="follow" />
}));

jest.mock('@/components/waves/drops/Drop', () => ({
  __esModule: true,
  DropLocation: { MY_STREAM: 'MY_STREAM' },
  default: (props: { onReplyClick: (n: number) => void; onQuoteClick: (q: unknown) => void }) => (
    <button data-testid="drop" onClick={() => {
      props.onReplyClick(5);
      props.onQuoteClick({ wave: { id: 'w2' }, serial_no: 7 });
    }} />
  )
}));

jest.mock('@/helpers/waves/drop.helpers', () => ({
  convertApiDropToExtendedDrop: (drop: unknown) => ({ ...drop as object, type: 'FULL', stableKey: 'k', stableHash: 'h' }),
  DropSize: { FULL: 'FULL' },
}));

const notification = {
  id: 1,
  cause: ApiNotificationCause.DropReplied,
  created_at: Date.now(),
  read_at: null,
  related_identity: { handle: 'id' },
  related_drops: [
    { id: '1', wave: { id: 'w1' }, author: { handle: 'a1', pfp: '' }, serial_no: 1 },
    { id: '2', wave: { id: 'w2' }, author: { handle: 'user', pfp: '' }, serial_no: 2 }
  ],
  additional_context: { reply_drop_id: '1', replied_drop_id: '2', replied_drop_part: 'p' }
} as never;

describe('NotificationDropReplied', () => {
  beforeEach(() => {
    push.mockClear();
  });

  it('renders author handle and triggers navigation callbacks', async () => {
    const user = userEvent.setup();
    render(
      <NotificationDropReplied
        notification={notification}
        activeDrop={null}
        onReply={jest.fn()}
        onQuote={jest.fn()}
      />
    );
    expect(screen.getByText('user')).toBeInTheDocument();
    await user.click(screen.getByTestId('drop'));
    expect(push).toHaveBeenCalledWith('/waves?wave=w2&serialNo=5');
    expect(push).toHaveBeenCalledWith('/waves?wave=w2&serialNo=7');
  });
});
