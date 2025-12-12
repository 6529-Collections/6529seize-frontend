import { render } from '@testing-library/react';
import React from 'react';
jest.mock('next/link', () => ({ __esModule: true, default: ({ href, children }: any) => <a href={href}>{children}</a> }));
jest.mock('@/components/brain/notifications/NotificationsFollowBtn', () => () => <div data-testid="follow"/>);
jest.mock('@/components/waves/drops/Drop', () => ({
  __esModule: true,
  default: (props: any) => {
    props.onReplyClick(1);
    props.onQuoteClick({ wave: { id: 'w' }, serial_no: 2 });
    return <div data-testid="drop"/>;
  },
  DropLocation: { MY_STREAM: 'MY_STREAM' },
}));
const mockUseRouter = jest.fn(() => ({ push: jest.fn() }));
jest.mock('next/navigation', () => ({
  useRouter: mockUseRouter,
  useSearchParams: jest.fn(),
  usePathname: jest.fn(),
}));
jest.mock('@/hooks/useDeviceInfo', () => ({
  __esModule: true,
  default: () => ({ isApp: false }),
}));

import NotificationIdentityMentioned from '@/components/brain/notifications/identity-mentioned/NotificationIdentityMentioned';

const notification = {
  id: 1,
  cause: 0,
  created_at: 0,
  read_at: null,
  related_identity: { handle: 'me' },
  related_drops: [
    {
      id: 'd',
      drop_type: 'chat',
      wave: { id: 'wave' },
      serial_no: 5,
      author: { handle: 'alice', pfp: null },
      created_at: '',
      title: '',
      parts: [],
      metadata: [],
      reply_to: null,
    },
  ],
};

describe('NotificationIdentityMentioned', () => {
  it('calls navigation on drop actions', () => {
    const push = jest.fn();
    (mockUseRouter as jest.Mock).mockReturnValue({ push });
    render(
      <NotificationIdentityMentioned notification={notification as any} activeDrop={null} onReply={jest.fn()} onQuote={jest.fn()} />
    );
    expect(push).toHaveBeenCalledWith('/waves?wave=wave&serialNo=1/');
    expect(push).toHaveBeenCalledWith('/waves?wave=w&serialNo=2/');
  });
});
