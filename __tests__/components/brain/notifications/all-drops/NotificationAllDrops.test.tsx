import { render, screen } from '@testing-library/react';
import React from 'react';
import NotificationAllDrops from '@/components/brain/notifications/all-drops/NotificationAllDrops';
import { useRouter } from 'next/navigation';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({ push: jest.fn() })),
  useSearchParams: jest.fn(),
  usePathname: jest.fn(),
}));

const DropMock = jest.fn(() => <div data-testid="drop" />);
jest.mock('@/components/waves/drops/Drop', () => ({
  __esModule: true,
  default: (props: any) => { DropMock(props); return <div data-testid="drop" />; },
  DropLocation: {
    MY_STREAM: "MY_STREAM",
    WAVE: "WAVE",
  }
}));

const baseNotification: any = {
  related_identity: { handle: 'alice', pfp: null },
  related_drops: [{ id: 'd', wave: { id: 'w' }, author:{handle:'alice'}, serial_no:1, parts:[], metadata:[] }],
  additional_context: {},
  created_at: 1,
};

describe('NotificationAllDrops', () => {
  it('renders vote text', () => {
    const n = { ...baseNotification, additional_context: { vote: 2 } };
    render(<NotificationAllDrops notification={n} activeDrop={null} onReply={jest.fn()} onQuote={jest.fn()} />);
    expect(screen.getByText('+2')).toBeInTheDocument();
  });

  it('uses router in reply and quote handlers', () => {
    render(<NotificationAllDrops notification={baseNotification} activeDrop={null} onReply={jest.fn()} onQuote={jest.fn()} />);
    const props = DropMock.mock.calls[0][0];
    props.onReplyClick(5);
    props.onQuoteClick({ wave:{ id:'w' }, serial_no:6 } as any);
    const router = (useRouter as jest.Mock).mock.results[0].value;
    expect(router.push).toHaveBeenCalledWith('/waves?wave=w&serialNo=5/');
    expect(router.push).toHaveBeenCalledWith('/waves?wave=w&serialNo=6/');
  });
});
