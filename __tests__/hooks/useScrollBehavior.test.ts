import { act, renderHook } from '@testing-library/react';
import { useScrollBehavior } from '@/hooks/useScrollBehavior';

const mockScrollTo = jest.fn();

const createMockScrollContainer = (options: {
  scrollTop?: number;
  scrollHeight?: number;
  clientHeight?: number;
} = {}) => {
  const element = document.createElement('div');

  Object.defineProperties(element, {
    scrollTop: {
      value: options.scrollTop ?? 0,
      writable: true,
    },
    scrollHeight: {
      value: options.scrollHeight ?? 1000,
      writable: true,
    },
    clientHeight: {
      value: options.clientHeight ?? 500,
      writable: true,
    },
  });

  element.scrollTo = mockScrollTo;

  return element as HTMLDivElement;
};

class MockResizeObserver implements ResizeObserver {
  public readonly callback: ResizeObserverCallback;
  public readonly observe = jest.fn();
  public readonly unobserve = jest.fn();
  public readonly disconnect = jest.fn();

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
    resizeObservers.push(this);
  }
}

type MockIntersectionObserverInstance = {
  callback: IntersectionObserverCallback;
  observe: jest.Mock;
  disconnect: jest.Mock;
  takeRecords: jest.Mock;
};

let resizeObservers: MockResizeObserver[] = [];
let intersectionObservers: MockIntersectionObserverInstance[] = [];

const originalRAF = (globalThis as any).requestAnimationFrame;
const originalCAF = (globalThis as any).cancelAnimationFrame;
const originalResizeObserver = (globalThis as any).ResizeObserver;
const originalMutationObserver = (globalThis as any).MutationObserver;
const originalIntersectionObserver = (globalThis as any).IntersectionObserver;

const mockIntersectionObserver = jest.fn();

beforeEach(() => {
  mockScrollTo.mockReset();
  mockIntersectionObserver.mockReset();
  resizeObservers = [];
  intersectionObservers = [];

  (globalThis as any).requestAnimationFrame = jest
    .fn((cb: FrameRequestCallback) => {
      cb(0);
      return 1;
    });

  (globalThis as any).cancelAnimationFrame = jest.fn();

  (globalThis as any).ResizeObserver = MockResizeObserver;

  (globalThis as any).MutationObserver = jest.fn(() => ({
    observe: jest.fn(),
    disconnect: jest.fn(),
    takeRecords: jest.fn(() => []),
  }));

  mockIntersectionObserver.mockImplementation(
    (callback: IntersectionObserverCallback) => {
      const instance: MockIntersectionObserverInstance = {
        callback,
        observe: jest.fn(),
        disconnect: jest.fn(),
        takeRecords: jest.fn(() => []),
      };
      intersectionObservers.push(instance);
      return instance as unknown as IntersectionObserver;
    }
  );

  (globalThis as any).IntersectionObserver = mockIntersectionObserver;
});

afterEach(() => {
  jest.clearAllMocks();
  resizeObservers = [];
  intersectionObservers = [];
});

afterAll(() => {
  if (originalRAF) {
    (globalThis as any).requestAnimationFrame = originalRAF;
  } else {
    delete (globalThis as any).requestAnimationFrame;
  }

  if (originalCAF) {
    (globalThis as any).cancelAnimationFrame = originalCAF;
  } else {
    delete (globalThis as any).cancelAnimationFrame;
  }

  if (originalResizeObserver) {
    (globalThis as any).ResizeObserver = originalResizeObserver;
  } else {
    delete (globalThis as any).ResizeObserver;
  }

  if (originalMutationObserver) {
    (globalThis as any).MutationObserver = originalMutationObserver;
  } else {
    delete (globalThis as any).MutationObserver;
  }

  if (originalIntersectionObserver) {
    (globalThis as any).IntersectionObserver = originalIntersectionObserver;
  } else {
    delete (globalThis as any).IntersectionObserver;
  }
});

const setupHook = (options: {
  container?: HTMLDivElement;
  anchor?: HTMLDivElement | null;
} = {}) => {
  const container = options.container ?? createMockScrollContainer();
  const anchor = options.anchor ?? null;

  const { result } = renderHook(() => {
    const hook = useScrollBehavior();
    hook.scrollContainerRef.current = container;
    if (anchor) {
      hook.bottomAnchorRef.current = anchor;
    }
    return hook;
  });

  return { result, container, anchor };
};

const triggerResize = (element: HTMLDivElement) => {
  resizeObservers.forEach((observer) =>
    observer.callback(
      [{ target: element } as unknown as ResizeObserverEntry],
      observer as unknown as ResizeObserver
    )
  );
};

describe('useScrollBehavior', () => {
  it('initializes pinned at the bottom', () => {
    const { result } = setupHook();

    expect(result.current.isAtBottom).toBe(true);
    expect(result.current.scrollIntent).toBe('pinned');
    expect(result.current.shouldPinToBottom).toBe(true);
  });

  it('scrollToVisualBottom pins and scrolls to origin', () => {
    const container = createMockScrollContainer({ scrollTop: -150 });
    const { result } = setupHook({ container });

    act(() => {
      result.current.scrollToVisualBottom();
    });

    expect(mockScrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
    expect(result.current.scrollIntent).toBe('pinned');
  });

  it('scrollToVisualTop scrolls to the visual top and marks reading intent', () => {
    const container = createMockScrollContainer({ scrollHeight: 900, clientHeight: 400 });
    const { result } = setupHook({ container });

    act(() => {
      result.current.scrollToVisualTop();
    });

    expect(mockScrollTo).toHaveBeenCalledWith({ top: -(900 - 400), behavior: 'smooth' });
    expect(result.current.scrollIntent).toBe('reading');
  });

  it('handleScroll marks reading intent when user leaves the bottom', () => {
    const container = createMockScrollContainer();
    const { result } = setupHook({ container });

    act(() => {
      result.current.handleScroll();
    });

    act(() => {
      container.scrollTop = -200;
      result.current.handleScroll();
    });

    expect(result.current.isAtBottom).toBe(false);
    expect(result.current.scrollIntent).toBe('reading');
  });

  it('handleScroll detects when the user reaches the top', () => {
    const container = createMockScrollContainer();
    const { result } = setupHook({ container });

    act(() => {
      container.scrollTop = -(container.scrollHeight - container.clientHeight);
      result.current.handleScroll();
    });

    expect(result.current.isAtTop).toBe(true);
  });

  it('maintains visual offset when content grows while reading', () => {
    const container = createMockScrollContainer({ scrollTop: -200 });
    const { result } = setupHook({ container });

    act(() => {
      result.current.handleScroll();
    });

    act(() => {
      container.scrollHeight = 1100;
      triggerResize(container);
    });

    expect(container.scrollTop).toBe(-300);
    expect(result.current.scrollIntent).toBe('reading');
  });

  it('sticks to bottom when content grows while pinned', () => {
    const container = createMockScrollContainer({ scrollTop: 0 });
    const { result } = setupHook({ container });

    act(() => {
      result.current.handleScroll();
    });

    act(() => {
      container.scrollHeight = 1200;
      triggerResize(container);
    });

    expect(container.scrollTop).toBe(0);
    expect(result.current.shouldPinToBottom).toBe(true);
  });

  it('updates bottom state via intersection observer', () => {
    const container = createMockScrollContainer();
    const anchor = document.createElement('div');
    const { result } = setupHook({ container, anchor });

    expect(mockIntersectionObserver).toHaveBeenCalled();
    expect(intersectionObservers).toHaveLength(1);

    const instance = intersectionObservers[0];

    act(() => {
      instance.callback([
        { isIntersecting: true } as unknown as IntersectionObserverEntry,
      ], instance as unknown as IntersectionObserver);
    });

    expect(result.current.isAtBottom).toBe(true);
    expect(result.current.scrollIntent).toBe('pinned');

    act(() => {
      instance.callback([
        { isIntersecting: false } as unknown as IntersectionObserverEntry,
      ], instance as unknown as IntersectionObserver);
    });

    expect(result.current.isAtBottom).toBe(false);
  });
});
