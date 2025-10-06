import { render, fireEvent } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import React, { createRef } from 'react';
import { FeedScrollContainer } from '@/components/brain/feed/FeedScrollContainer';

beforeAll(() => {
  class IntersectionObserverMock implements IntersectionObserver {
    readonly root: Element | Document | null = null;
    readonly rootMargin = '';
    readonly thresholds = [] as ReadonlyArray<number>;

    constructor(public callback: IntersectionObserverCallback) {}

    disconnect(): void {}

    observe(): void {}

    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }

    unobserve(): void {}
  }

  (globalThis as typeof globalThis & {
    IntersectionObserver: typeof IntersectionObserver;
  }).IntersectionObserver = IntersectionObserverMock as unknown as typeof IntersectionObserver;
});

afterAll(() => {
  delete (globalThis as Record<string, unknown>).IntersectionObserver;
});

jest.useFakeTimers();

describe('FeedScrollContainer', () => {
  function setup(childrenCount = 35) {
    const onUp = jest.fn();
    const onDown = jest.fn();
    const ref = createRef<HTMLDivElement>();
    const children = Array.from({ length: childrenCount }, (_, i) => (
      <div key={i} id={`feed-item-${i}`}>item {i}</div>
    ));
    const { container } = render(
      <FeedScrollContainer
        ref={ref}
        onScrollUpNearTop={onUp}
        onScrollDownNearBottom={onDown}
        className="test-container"
      >
        {children}
      </FeedScrollContainer>
    );
    const wrapper = container.querySelector('.test-container') as HTMLDivElement;
    if (!wrapper) throw new Error('wrapper not found');
    Object.defineProperty(wrapper, 'clientHeight', { value: 300 });
    Object.defineProperty(wrapper, 'scrollHeight', { value: 1000, writable: true });
    Object.defineProperty(wrapper, 'getBoundingClientRect', {
      value: () => ({ top: 100, bottom: 400 } as DOMRect)
    });
    const items = Array.from(wrapper.querySelectorAll('[id^="feed-item-"]')) as HTMLDivElement[];
    items.forEach((el, idx) => {
      Object.defineProperty(el, 'getBoundingClientRect', {
        value: () => ({ top: idx * 20, bottom: idx * 20 + 10 } as DOMRect)
      });
    });
    return { wrapper, onUp, onDown };
  }

  it('calls onScrollUpNearTop when scrolling up near the top', () => {
    const { wrapper, onUp } = setup(31);
    wrapper.scrollTop = 200;
    act(() => {
      fireEvent.scroll(wrapper, { currentTarget: wrapper });
      jest.runAllTimers();
    });
    wrapper.scrollTop = 50;
    act(() => {
      fireEvent.scroll(wrapper, { currentTarget: wrapper });
      jest.runAllTimers();
    });
    expect(onUp).toHaveBeenCalled();
  });

  it('calls onScrollDownNearBottom when scrolling down near the bottom', () => {
    const { wrapper, onDown } = setup(10);
    wrapper.scrollTop = 0;
    act(() => {
      fireEvent.scroll(wrapper, { currentTarget: wrapper });
      jest.runAllTimers();
    });
    wrapper.scrollTop = 701;
    act(() => {
      fireEvent.scroll(wrapper, { currentTarget: wrapper });
      jest.runAllTimers();
    });
    expect(onDown).toHaveBeenCalled();
  });
});
