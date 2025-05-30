import { render, screen } from '@testing-library/react';
import React from 'react';
import NotificationDropVoted, { getNotificationVoteColor } from '../../../../../components/brain/notifications/drop-voted/NotificationDropVoted';

jest.mock('next/link', () => ({ __esModule: true, default: ({ children, href }: any) => <a href={href}>{children}</a> }));
jest.mock('../../../../../components/waves/drops/Drop', () => ({
  __esModule: true,
  DropLocation: { MY_STREAM: 'MY_STREAM' },
  default: (props: any) => {
    props.onReplyClick(5);
    props.onQuoteClick({ wave: { id: 'w1' }, serial_no: 6 } as any);
    return <div data-testid="drop" />;
  },
}));
jest.mock('../../../../../components/brain/notifications/NotificationsFollowBtn', () => ({ __esModule: true, default: () => <div data-testid="follow" /> }));
jest.mock('../../../../../helpers/image.helpers', () => ({ getScaledImageUri: (u: string) => `scaled-${u}`, ImageScale: { W_AUTO_H_50: '50' } }));

const push = jest.fn();
jest.mock('next/router', () => ({ useRouter: () => ({ push }) }));

describe('getNotificationVoteColor', () => {
  it('returns correct class based on vote', () => {
    expect(getNotificationVoteColor(1)).toBe('tw-text-green');
    expect(getNotificationVoteColor(-1)).toBe('tw-text-red');
    expect(getNotificationVoteColor(0)).toBe('tw-text-iron-500');
  });
});

describe('NotificationDropVoted', () => {
  const baseNotification: any = {
    related_identity: { handle: 'alice', pfp: 'pic.png' },
    additional_context: { vote: 3 },
    created_at: new Date().toISOString(),
    related_drops: [{ id: 'd1', wave: { id: 'w1' }, serial_no: 7 }],
  };

  it('renders profile image and triggers router pushes', () => {
    render(<NotificationDropVoted notification={baseNotification} activeDrop={null} onReply={jest.fn()} onQuote={jest.fn()} />);
    expect(screen.getByRole('img')).toHaveAttribute('src', 'scaled-pic.png');
    expect(push).toHaveBeenCalledWith('/my-stream?wave=w1&serialNo=5/');
    expect(push).toHaveBeenCalledWith('/my-stream?wave=w1&serialNo=6/');
  });

  it('renders fallback when no pfp', () => {
    render(<NotificationDropVoted notification={{ ...baseNotification, related_identity: { handle: 'bob', pfp: null } }} activeDrop={null} onReply={jest.fn()} onQuote={jest.fn()} />);
    expect(screen.getAllByTestId('drop')[0]).toBeInTheDocument();
    expect(screen.getByText('bob')).toBeInTheDocument();
  });
});
