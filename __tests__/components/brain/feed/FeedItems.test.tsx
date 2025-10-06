import { render, screen } from '@testing-library/react';
import React from 'react';
import FeedItems from '@/components/brain/feed/FeedItems';
import { ApiFeedItemType } from '@/generated/models/ApiFeedItemType';

jest.mock('@/components/brain/feed/FeedItem', () => ({
  __esModule: true,
  default: ({ item }: any) => <div data-testid="feed-item" data-type={item.type} />
}));

jest.mock('@/helpers/waves/drop.helpers', () => ({
  getFeedItemKey: jest.fn(({ item, index }) => `${item.type}-${index}`),
}));

jest.mock('@/components/utils/animation/CommonChangeAnimation', () => ({
  __esModule: true,
  default: ({ children }: any) => <div data-testid="anim">{children}</div>
}));

describe('FeedItems', () => {
  const items = [
    { type: ApiFeedItemType.DropCreated, serial_no: 1, item: {} },
    { type: ApiFeedItemType.WaveCreated, serial_no: 2, item: {} },
  ] as any[];

  it('renders each feed item with wrapper and id', () => {
    render(
      <FeedItems
        items={items}
        showWaveInfo={false}
        activeDrop={null}
        onReply={jest.fn()}
        onQuote={jest.fn()}
      />
    );
    const rendered = screen.getAllByTestId('feed-item');
    expect(rendered).toHaveLength(2);
    expect(rendered[0]).toHaveAttribute('data-type', items[0].type);
    const divWrapper = document.getElementById(`feed-item-${items[0].serial_no}`);
    expect(divWrapper).toBeInTheDocument();
  });
});
