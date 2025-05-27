import React from 'react';
import { render, screen } from '@testing-library/react';
import FeedItem from '../../../../components/brain/feed/FeedItem';
import { ApiFeedItemType } from '../../../../generated/models/ApiFeedItemType';

jest.mock('../../../../components/brain/feed/items/wave-created/FeedItemWaveCreated', () => (props: any) => <div data-testid="wave" {...props} />);
jest.mock('../../../../components/brain/feed/items/drop-created/FeedItemDropCreated', () => (props: any) => <div data-testid="drop-created" {...props} />);
jest.mock('../../../../components/brain/feed/items/drop-replied/FeedItemDropReplied', () => (props: any) => <div data-testid="drop-replied" {...props} />);

describe('FeedItem', () => {
  const base = { showWaveInfo: false, activeDrop: null, onReply: jest.fn(), onQuote: jest.fn() };

  it('renders wave created item', () => {
    render(<FeedItem {...base} item={{ type: ApiFeedItemType.WaveCreated } as any } />);
    expect(screen.getByTestId('wave')).toBeInTheDocument();
  });

  it('renders drop created item', () => {
    render(<FeedItem {...base} item={{ type: ApiFeedItemType.DropCreated } as any } />);
    expect(screen.getByTestId('drop-created')).toBeInTheDocument();
  });

  it('renders drop replied item', () => {
    render(<FeedItem {...base} item={{ type: ApiFeedItemType.DropReplied } as any } />);
    expect(screen.getByTestId('drop-replied')).toBeInTheDocument();
  });
});
