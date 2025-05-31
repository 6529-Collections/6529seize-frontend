import { render } from '@testing-library/react';
const NotificationItem = jest.fn(() => <div data-testid="item" />);
const CommonChangeAnimation = jest.fn(({ children }) => <div data-testid="anim">{children}</div>);

jest.mock('../../../../components/brain/notifications/NotificationItem', () => ({ __esModule: true, default: NotificationItem }));
jest.mock('../../../../components/utils/animation/CommonChangeAnimation', () => ({ __esModule: true, default: CommonChangeAnimation }));

import NotificationItems from '../../../../components/brain/notifications/NotificationItems';
import React from 'react';

describe('NotificationItems', () => {
  it('renders all notifications with props', () => {
    const items = [{ id: '1', cause: 'DROP_REPLIED' }, { id: '2', cause: 'DROP_VOTED' }] as any;
    const active = { id: 'active' } as any;
    const onReply = jest.fn();
    const onQuote = jest.fn();
    const onClick = jest.fn();

    render(
      <NotificationItems
        items={items}
        activeDrop={active}
        onReply={onReply}
        onQuote={onQuote}
        onDropContentClick={onClick}
      />
    );

    expect(CommonChangeAnimation).toHaveBeenCalledTimes(2);
    expect(NotificationItem).toHaveBeenCalledTimes(2);
    expect(NotificationItem.mock.calls[0][0]).toEqual(
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
