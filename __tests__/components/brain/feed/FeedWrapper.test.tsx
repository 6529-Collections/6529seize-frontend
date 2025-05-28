import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import FeedWrapper from '../../../../components/brain/feed/FeedWrapper';

// Mock FeedItems to capture props
const FeedItemsMock = jest.fn((_: any) => <div data-testid="feed-items" />);
jest.mock('../../../../components/brain/feed/FeedItems', () => ({
  __esModule: true,
  default: (props: any) => FeedItemsMock(props),
}));

// Mock FeedScrollContainer to expose props and trigger onScrollUpNearTop
const FeedScrollContainerMock = jest.fn();
jest.mock('../../../../components/brain/feed/FeedScrollContainer', () => {
  const React = require('react');
  return {
    FeedScrollContainer: React.forwardRef(({ children, onScrollUpNearTop, isFetchingNextPage, className }: any, ref: React.Ref<HTMLDivElement>) => {
      FeedScrollContainerMock({ onScrollUpNearTop, isFetchingNextPage, className });
      return (
        <div data-testid="scroll" ref={ref} data-fetching={String(isFetchingNextPage)} data-class={className} onClick={() => onScrollUpNearTop()}>
          {children}
        </div>
      );
    }),
  };
});

// Mock layout hook to provide style
jest.mock('../../../../components/brain/my-stream/layout/LayoutContext', () => ({
  useLayout: () => ({ myStreamFeedStyle: { color: 'red' } }),
}));

const baseProps = {
  items: [{ type: 'item' } as any],
  loading: true,
  showWaveInfo: true,
  activeDrop: null,
  onBottomIntersection: jest.fn(),
  onReply: jest.fn(),
  onQuote: jest.fn(),
};

describe('FeedWrapper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('passes props to children and handles scroll near top', () => {
    const { container } = render(<FeedWrapper {...baseProps} />);

    // style from useLayout applied
    expect(container.firstChild).toHaveAttribute('style', 'color: red;');

    // FeedScrollContainer receives props
    expect(FeedScrollContainerMock).toHaveBeenCalledWith(
      expect.objectContaining({
        onScrollUpNearTop: expect.any(Function),
        isFetchingNextPage: true,
        className: expect.stringContaining('tw-px-2'),
      })
    );

    // Clicking scroll container triggers onBottomIntersection
    fireEvent.click(screen.getByTestId('scroll'));
    expect(baseProps.onBottomIntersection).toHaveBeenCalledWith(true);

    // FeedItems called with correct props
    expect(FeedItemsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        items: baseProps.items,
        showWaveInfo: true,
        activeDrop: null,
        onReply: baseProps.onReply,
        onQuote: baseProps.onQuote,
      })
    );
  });
});

