import React from 'react';
import { render, screen } from '@testing-library/react';
import MyStream from '../../../../components/brain/my-stream/MyStream';

jest.mock('../../../../components/brain/feed/FeedWrapper', () => ({ __esModule: true, default: jest.fn(() => <div data-testid="wrapper" />) }));

const FeedWrapperMock = require('../../../../components/brain/feed/FeedWrapper').default as jest.Mock;

describe('MyStream', () => {
  beforeEach(() => {
    FeedWrapperMock.mockClear();
  });

  it('passes props to FeedWrapper', () => {
    const onReply = jest.fn();
    const onQuote = jest.fn();
    const onBottom = jest.fn();
    const items = [{ id: '1' }] as any;
    render(
      <MyStream
        onReply={onReply}
        onQuote={onQuote}
        activeDrop={null}
        items={items}
        isFetching={false}
        onBottomIntersection={onBottom}
      />
    );
    expect(screen.getByTestId('wrapper')).toBeInTheDocument();
    const props = FeedWrapperMock.mock.calls[0][0];
    expect(props).toEqual(
      expect.objectContaining({
        items,
        loading: false,
        showWaveInfo: true,
        activeDrop: null,
        onBottomIntersection: onBottom,
        onReply,
        onQuote,
        onDropContentClick: undefined,
      })
    );
  });

  it('forwards onDropContentClick', () => {
    const onDropContentClick = jest.fn();
    render(
      <MyStream
        onReply={jest.fn()}
        onQuote={jest.fn()}
        activeDrop={null}
        items={[]}
        isFetching={true}
        onBottomIntersection={jest.fn()}
        onDropContentClick={onDropContentClick}
      />
    );
    const props = FeedWrapperMock.mock.calls[0][0];
    expect(props).toEqual(expect.objectContaining({ onDropContentClick }));
  });
});
