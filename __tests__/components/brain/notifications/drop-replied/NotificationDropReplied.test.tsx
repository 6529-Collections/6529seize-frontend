import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NotificationDropReplied from '../../../../../components/brain/notifications/drop-replied/NotificationDropReplied';
import { ApiNotificationCause } from '../../../../../generated/models/ApiNotificationCause';
import { useRouter } from 'next/router';

jest.mock('next/router', () => ({ useRouter: jest.fn() }));

jest.mock('../../../../../components/waves/drops/Drop', () => ({
  __esModule: true,
  DropLocation: { MY_STREAM: 'MY_STREAM' },
  default: (props: any) => (
    <button data-testid="drop" onClick={() => {
      props.onReplyClick(5);
      props.onQuoteClick({ wave: { id: 'w2' }, serial_no: 7 } as any);
    }} />
  )
}));

jest.mock('../../../../../components/brain/notifications/NotificationsFollowBtn', () => ({
  __esModule: true,
  default: () => <div data-testid="follow" />
}));

const push = jest.fn();
(useRouter as jest.Mock).mockReturnValue({ push });

const notification: any = {
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
};

describe('NotificationDropReplied', () => {
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
    expect(push).toHaveBeenCalledWith('/my-stream?wave=w2&serialNo=5/');
    expect(push).toHaveBeenCalledWith('/my-stream?wave=w2&serialNo=7/');
  });
});
