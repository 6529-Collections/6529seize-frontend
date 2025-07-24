import { renderHook } from '@testing-library/react';
import { useIntersectionObserver } from '../../../hooks/scroll/useIntersectionObserver';

let observeTarget: Element | null = null;
let callback: any;

beforeAll(() => {
  (global as any).IntersectionObserver = class {
    constructor(cb: any, public options: any) { callback = cb; }
    observe(target: Element) { observeTarget = target; }
    disconnect() {}
  };
});

test('calls callback on intersection', () => {
  const ref = { current: document.createElement('div') };
  const cb = jest.fn();
  renderHook(() => useIntersectionObserver(ref, { rootMargin: '0px', threshold: 0, freezeOnceVisible: false }, cb));
  expect(observeTarget).toBe(ref.current);
  callback([{ isIntersecting: true } as any]);
  expect(cb).toHaveBeenCalled();
});
