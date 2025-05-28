import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { useVirtualizedWaves } from '../../hooks/useVirtualizedWaves';
import { ScrollPositionProvider } from '../../contexts/ScrollPositionContext';

const wrapper: React.FC<{children: React.ReactNode}> = ({ children }) => (
  <ScrollPositionProvider>{children}</ScrollPositionProvider>
);

describe('useVirtualizedWaves', () => {
  it('calculates virtual items and updates scroll position', () => {
    const scrollContainer = document.createElement('div');
    Object.defineProperty(scrollContainer, 'clientHeight', { value: 100 });
    const listContainer = document.createElement('div');
    Object.defineProperty(listContainer, 'offsetTop', { value: 0 });
    const items = Array.from({ length: 10 }, (_, i) => i);
    const scrollRef = { current: scrollContainer } as React.RefObject<HTMLDivElement>;
    const listRef = { current: listContainer } as React.RefObject<HTMLDivElement>;

    const { result, rerender } = renderHook(
      () => useVirtualizedWaves(items, 'k', scrollRef, listRef, 50, 0),
      { wrapper }
    );
    expect(result.current.totalHeight).toBe(10 * 50 + 40);
    expect(result.current.virtualItems.length).toBe(3);

    act(() => {
      scrollContainer.scrollTop = 120;
      scrollContainer.dispatchEvent(new Event('scroll'));
    });
    
    // Rerender the same hook to get updated state
    rerender();
    expect(result.current.virtualItems[0].index).toBe(2); // start index advanced
  });
});
