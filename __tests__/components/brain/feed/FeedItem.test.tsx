import { render, screen } from '@testing-library/react';
import React from 'react';
import FeedItem from '../../../../components/brain/feed/FeedItem';
import { ApiFeedItemType } from '../../../../generated/models/ApiFeedItemType';

jest.mock('../../../../components/brain/feed/items/drop-created/FeedItemDropCreated', () => ({
  __esModule: true,
  default: () => <div data-testid="drop-created" />
}));

jest.mock('../../../../components/brain/feed/items/drop-replied/FeedItemDropReplied', () => ({
  __esModule: true,
  default: () => <div data-testid="drop-replied" />
}));

jest.mock('../../../../components/brain/feed/items/wave-created/FeedItemWaveCreated', () => ({
  __esModule: true,
  default: () => <div data-testid="wave-created" />
}));

jest.mock('../../../../helpers/AllowlistToolHelpers', () => ({
  assertUnreachable: jest.fn(() => { throw new Error('unreachable'); })
}));

const baseProps = {
  showWaveInfo: true,
  activeDrop: null,
  onReply: jest.fn(),
  onQuote: jest.fn(),
  onDropContentClick: jest.fn(),
};

describe('FeedItem', () => {
  it('renders wave created item', () => {
    const item = { type: ApiFeedItemType.WaveCreated } as any;
    render(<FeedItem {...baseProps} item={item} />);
    expect(screen.getByTestId('wave-created')).toBeInTheDocument();
  });

  it('renders drop created item', () => {
    const item = { type: ApiFeedItemType.DropCreated } as any;
    render(<FeedItem {...baseProps} item={item} />);
    expect(screen.getByTestId('drop-created')).toBeInTheDocument();
  });

  it('renders drop replied item', () => {
    const item = { type: ApiFeedItemType.DropReplied } as any;
    render(<FeedItem {...baseProps} item={item} />);
    expect(screen.getByTestId('drop-replied')).toBeInTheDocument();
  });

  it('calls assertUnreachable for unknown item', () => {
    const { assertUnreachable } = require('../../../../helpers/AllowlistToolHelpers');
    const item = { type: 'OTHER' } as any;
    expect(() => render(<FeedItem {...baseProps} item={item} />)).toThrow('unreachable');
    expect(assertUnreachable).toHaveBeenCalledWith(item);
  });
});
