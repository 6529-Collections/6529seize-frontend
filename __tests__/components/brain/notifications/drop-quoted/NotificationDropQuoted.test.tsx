import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NotificationDropQuoted from '../../../../../components/brain/notifications/drop-quoted/NotificationDropQuoted';
import { useRouter } from 'next/router';

jest.mock('next/router', () => ({ useRouter: jest.fn() }));

jest.mock('../../../../../components/waves/drops/Drop', () => ({
  __esModule: true,
  default: (props: any) => (
    <div>
      <button onClick={() => props.onReplyClick(11)}>reply</button>
      <button onClick={() => props.onQuoteClick({ wave: { id: 'q' }, serial_no: 22 } as any)}>quote</button>
    </div>
  ),
  DropLocation: {
    MY_STREAM: 'MY_STREAM',
    WAVE: 'WAVE'
  }
}));

describe('NotificationDropQuoted', () => {
  const push = jest.fn();
  (useRouter as jest.Mock).mockReturnValue({ push });

  const notification: any = { related_drops: [{ wave: { id: 'w' }, serial_no: 5 }] };

  it('navigates on reply click', async () => {
    const user = userEvent.setup();
    render(
      <NotificationDropQuoted notification={notification} activeDrop={null} onReply={jest.fn()} onQuote={jest.fn()} />
    );
    await user.click(screen.getByText('reply'));
    expect(push).toHaveBeenCalledWith('/my-stream?wave=w&serialNo=11/');
  });

  it('navigates on quote click', async () => {
    const user = userEvent.setup();
    render(
      <NotificationDropQuoted notification={notification} activeDrop={null} onReply={jest.fn()} onQuote={jest.fn()} />
    );
    await user.click(screen.getByText('quote'));
    expect(push).toHaveBeenCalledWith('/my-stream?wave=q&serialNo=22/');
  });
});
