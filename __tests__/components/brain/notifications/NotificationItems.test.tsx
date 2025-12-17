import { render } from '@testing-library/react';
const NotificationItem = jest.fn((_props: unknown) => <div data-testid="item" />);

jest.mock('@/components/brain/notifications/NotificationItem', () => ({ __esModule: true, default: NotificationItem }));

import NotificationItems from '@/components/brain/notifications/NotificationItems';
import React from 'react';

describe('NotificationItems', () => {
  it('renders all notifications with props', () => {
    const items = [{ id: '1', cause: 'DROP_REPLIED' }, { id: '2', cause: 'DROP_VOTED' }] as unknown[];
    const active = { id: 'active' } as unknown;
    const onReply = jest.fn();
    const onQuote = jest.fn();
    const onClick = jest.fn();

    render(
      <NotificationItems
        items={items as never[]}
        activeDrop={active as never}
        onReply={onReply}
        onQuote={onQuote}
        onDropContentClick={onClick}
      />
    );

    expect(NotificationItem).toHaveBeenCalledTimes(2);
    const firstCall = NotificationItem.mock.calls.at(0);
    expect(firstCall?.[0]).toEqual(
      expect.objectContaining({
        notification: items[0],
        activeDrop: active,
        onReply,
        onQuote,
        onDropContentClick: onClick,
      })
    );
  });
});
