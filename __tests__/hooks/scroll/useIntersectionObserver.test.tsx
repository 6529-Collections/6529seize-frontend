import { renderHook } from "@testing-library/react";
import { useIntersectionObserver } from "@/hooks/scroll/useIntersectionObserver";

let observerInstances: Array<{
  readonly callback: IntersectionObserverCallback;
  readonly options: IntersectionObserverInit;
  readonly observe: jest.Mock;
  readonly disconnect: jest.Mock;
}> = [];

beforeAll(() => {
  (global as any).IntersectionObserver = class {
    public readonly observe = jest.fn();
    public readonly disconnect = jest.fn();

    constructor(
      public readonly callback: IntersectionObserverCallback,
      public readonly options: IntersectionObserverInit
    ) {
      observerInstances.push(this);
    }
  };
});

beforeEach(() => {
  observerInstances = [];
});

test("calls callback on intersection", () => {
  const ref = { current: document.createElement("div") };
  const cb = jest.fn();

  renderHook(() =>
    useIntersectionObserver(
      ref,
      { rootMargin: "0px", threshold: 0, freezeOnceVisible: false },
      cb
    )
  );

  expect(observerInstances[0]?.observe).toHaveBeenCalledWith(ref.current);

  observerInstances[0]?.callback(
    [{ isIntersecting: true } as IntersectionObserverEntry],
    {} as IntersectionObserver
  );

  expect(cb).toHaveBeenCalled();
});

test("rebinds the observer when the root changes", () => {
  const ref = { current: document.createElement("div") };
  const cb = jest.fn();
  const nextRoot = document.createElement("section");

  const { rerender } = renderHook(
    ({ root }: { root: Element | null }) =>
      useIntersectionObserver(
        ref,
        {
          root,
          rootMargin: "0px",
          threshold: 0,
          freezeOnceVisible: false,
        },
        cb
      ),
    {
      initialProps: {
        root: null,
      },
    }
  );

  expect(observerInstances).toHaveLength(1);
  expect(observerInstances[0]?.options.root).toBeNull();

  rerender({ root: nextRoot });

  expect(observerInstances).toHaveLength(2);
  expect(observerInstances[0]?.disconnect).toHaveBeenCalledTimes(1);
  expect(observerInstances[1]?.options.root).toBe(nextRoot);
  expect(observerInstances[1]?.observe).toHaveBeenCalledWith(ref.current);
});
