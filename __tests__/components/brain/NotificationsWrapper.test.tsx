import React from 'react';
import { render, screen } from '@testing-library/react';
import NotificationsWrapper from '../../../components/brain/notifications/NotificationsWrapper';
import { useRouter } from 'next/navigation';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
  usePathname: jest.fn(),
}));
jest.mock('../../../components/brain/notifications/NotificationItems', () => (props: any) => {
  // expose callbacks
  return (
    <div data-testid="items" onClick={() => {
      props.onReply({ drop: { id: 'd' }, partId: 'p' });
      props.onQuote({ drop: { id: 'd2' }, partId: 'q' });
      props.onDropContentClick({ wave: { id: 'w' }, serial_no: 1 } as any);
    }} />
  );
});

const push = jest.fn();
(useRouter as jest.Mock).mockReturnValue({ push });

describe('NotificationsWrapper', () => {
  it('shows loading spinner and handles actions', () => {
    const setActive = jest.fn();
    render(
      <NotificationsWrapper items={[]} loading={true} activeDrop={null} setActiveDrop={setActive} />
    );
    expect(screen.getByText(/Loading notifications/)).toBeInTheDocument();
  });

  it('delegates callbacks to router and state setter', () => {
    const setActive = jest.fn();
    render(
      <NotificationsWrapper items={[]} loading={false} activeDrop={null} setActiveDrop={setActive} />
    );
    screen.getByTestId('items').click();
    expect(setActive).toHaveBeenCalledTimes(2);
    expect(push).toHaveBeenCalledWith('/my-stream?wave=w&serialNo=1/');
  });
});
