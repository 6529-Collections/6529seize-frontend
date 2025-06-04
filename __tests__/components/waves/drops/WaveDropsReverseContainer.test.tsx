import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { WaveDropsReverseContainer } from '../../../../components/waves/drops/WaveDropsReverseContainer';
import { useIntersectionObserver } from '../../../../hooks/scroll/useIntersectionObserver';

jest.mock('../../../../hooks/scroll/useIntersectionObserver');

const mockUseIntersectionObserver = useIntersectionObserver as jest.Mock;

function setup(props?: any) {
  const onTopIntersection = jest.fn();
  const onUserScroll = jest.fn();
  const utils = render(
    <WaveDropsReverseContainer
      ref={React.createRef()}
      onTopIntersection={onTopIntersection}
      isFetchingNextPage={false}
      hasNextPage={true}
      onUserScroll={onUserScroll}
    >
      <div>child</div>
    </WaveDropsReverseContainer>
  );
  return { ...utils, onTopIntersection, onUserScroll };
}

describe('WaveDropsReverseContainer', () => {
  beforeEach(() => {
    mockUseIntersectionObserver.mockImplementation((ref, opts, cb) => {
      cb({ isIntersecting: true } as any);
    });
    jest.spyOn(window, 'requestAnimationFrame').mockImplementation((cb: any) => {
      cb();
      return 1 as any;
    });
  });

  it('calls onTopIntersection when sentinel visible', () => {
    const { onTopIntersection } = setup();
    expect(onTopIntersection).toHaveBeenCalled();
  });

  it('invokes onUserScroll on scroll', () => {
    const { container, onUserScroll } = setup();
    const scrollDiv = container.firstChild as HTMLElement;
    Object.defineProperty(scrollDiv, 'scrollTop', { value: -10, writable: true });
    fireEvent.scroll(scrollDiv);
    expect(onUserScroll).toHaveBeenCalledWith('up', false);
  });
});
