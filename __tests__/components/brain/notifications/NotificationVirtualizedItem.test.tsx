import { act, cleanup, render } from "@testing-library/react";
import NotificationVirtualizedItem from "@/components/brain/notifications/NotificationVirtualizedItem";

const observe = jest.fn();
const disconnect = jest.fn();
const resizeObserve = jest.fn();
const resizeUnobserve = jest.fn();
const resizeDisconnect = jest.fn();
let intersectionCallback: (entries: IntersectionObserverEntry[]) => void;
let intersectionOptions: IntersectionObserverInit;
let resizeCallback: (entries: ResizeObserverEntry[]) => void;

beforeAll(() => {
  globalThis.IntersectionObserver = class {
    constructor(
      callback: IntersectionObserverCallback,
      options?: IntersectionObserverInit
    ) {
      intersectionCallback = callback;
      intersectionOptions = options ?? {};
    }

    readonly root = null;
    readonly rootMargin = "";
    readonly thresholds = [];
    disconnect = disconnect;
    observe = observe;
    takeRecords = jest.fn();
    unobserve = jest.fn();
  };

  globalThis.ResizeObserver = class {
    constructor(callback: ResizeObserverCallback) {
      resizeCallback = callback;
    }

    disconnect = resizeDisconnect;
    observe = resizeObserve;
    unobserve = resizeUnobserve;
  };
});

afterEach(() => {
  cleanup();
  jest.clearAllMocks();
});

function emitResize(element: Element, height: number) {
  resizeCallback([
    {
      target: element,
      borderBoxSize: [{ blockSize: height }],
      contentRect: { height },
    } as unknown as ResizeObserverEntry,
  ]);
}

it("replaces a far-off row with a height-preserving placeholder", () => {
  const scrollRoot = document.createElement("div");
  const { container, queryByText } = render(
    <NotificationVirtualizedItem
      domId="notification-1"
      forceRender={false}
      scrollContainerRef={{ current: scrollRoot }}
    >
      <div>Notification content</div>
    </NotificationVirtualizedItem>
  );
  const row = container.firstElementChild as HTMLElement;

  act(() => emitResize(row, 240));
  act(() =>
    intersectionCallback([
      { isIntersecting: false } as IntersectionObserverEntry,
    ])
  );

  expect(queryByText("Notification content")).toBeNull();
  expect(row).toHaveAttribute("data-notification-placeholder", "true");
  expect(row.style.height).toBe("240px");
  expect(intersectionOptions).toEqual({
    root: scrollRoot,
    rootMargin: "1200px 0px",
    threshold: 0,
  });
});

it("keeps the active reply row rendered outside the viewport", () => {
  const { container, getByText } = render(
    <NotificationVirtualizedItem
      domId="notification-1"
      forceRender
      scrollContainerRef={{ current: document.createElement("div") }}
    >
      <div>Active notification</div>
    </NotificationVirtualizedItem>
  );
  const row = container.firstElementChild as HTMLElement;

  act(() => emitResize(row, 180));
  act(() =>
    intersectionCallback([
      { isIntersecting: false } as IntersectionObserverEntry,
    ])
  );

  expect(getByText("Active notification")).toBeInTheDocument();
  expect(row).not.toHaveAttribute("data-notification-placeholder");
});

it("measures immediately before hiding when resize data is not ready", () => {
  const { container } = render(
    <NotificationVirtualizedItem
      domId="notification-1"
      forceRender={false}
      scrollContainerRef={{ current: document.createElement("div") }}
    >
      <div>Notification content</div>
    </NotificationVirtualizedItem>
  );
  const row = container.firstElementChild as HTMLElement;
  jest.spyOn(row, "getBoundingClientRect").mockReturnValue({
    height: 210,
  } as DOMRect);

  act(() =>
    intersectionCallback([
      { isIntersecting: false } as IntersectionObserverEntry,
    ])
  );

  expect(row.style.height).toBe("210px");
  expect(row).toHaveAttribute("data-notification-placeholder", "true");
});
