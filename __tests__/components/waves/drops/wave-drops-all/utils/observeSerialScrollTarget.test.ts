import { observeSerialScrollTarget } from "@/components/waves/drops/wave-drops-all/utils/observeSerialScrollTarget";

type Callback = () => void;

class FakeObserver {
  static readonly instances: FakeObserver[] = [];
  readonly observed = new Set<Element>();
  disconnected = false;
  constructor(readonly callback: Callback) {
    FakeObserver.instances.push(this);
  }
  observe(element: Element) {
    this.observed.add(element);
  }
  unobserve(element: Element) {
    this.observed.delete(element);
  }
  disconnect() {
    this.disconnected = true;
    this.observed.clear();
  }
  fire() {
    this.callback();
  }
}
class FakeIntersectionObserver extends FakeObserver {
  static readonly created: FakeIntersectionObserver[] = [];
  constructor(callback: Callback) {
    super(callback);
    FakeIntersectionObserver.created.push(this);
  }
}
class FakeResizeObserver extends FakeObserver {
  static readonly created: FakeResizeObserver[] = [];
  constructor(callback: Callback) {
    super(callback);
    FakeResizeObserver.created.push(this);
  }
}

const originalIntersectionObserver = globalThis.IntersectionObserver;
const originalResizeObserver = globalThis.ResizeObserver;

function setup() {
  const parent = document.createElement("div");
  const container = document.createElement("div");
  const content = document.createElement("div");
  const target = document.createElement("div");
  target.id = "drop-20";
  content.appendChild(target);
  container.appendChild(content);
  parent.appendChild(container);
  document.body.appendChild(parent);
  const onTarget = jest.fn();
  const onRelease = jest.fn();
  const anchor = observeSerialScrollTarget({
    container,
    target,
    onTarget,
    onRelease,
  });
  const resize = FakeResizeObserver.created.at(-1);
  const visibility = FakeIntersectionObserver.created.at(-1);
  if (!resize || !visibility) throw new Error("Observers were not created");
  return {
    anchor,
    container,
    content,
    onRelease,
    onTarget,
    parent,
    resize,
    target,
    visibility,
  };
}

beforeEach(() => {
  jest.useFakeTimers();
  FakeIntersectionObserver.created.length = 0;
  FakeResizeObserver.created.length = 0;
  Object.defineProperty(globalThis, "IntersectionObserver", {
    configurable: true,
    value: FakeIntersectionObserver,
  });
  Object.defineProperty(globalThis, "ResizeObserver", {
    configurable: true,
    value: FakeResizeObserver,
  });
});

afterEach(() => {
  document.body.innerHTML = "";
  jest.useRealTimers();
  Object.defineProperty(globalThis, "IntersectionObserver", {
    configurable: true,
    value: originalIntersectionObserver,
  });
  Object.defineProperty(globalThis, "ResizeObserver", {
    configurable: true,
    value: originalResizeObserver,
  });
});

it("re-checks the row when it crosses the edge of the view", () => {
  const { onTarget, target, visibility } = setup();

  visibility.fire();

  expect(onTarget).toHaveBeenCalledWith(target);
});

it("re-checks the row when the list content resizes, which can move it past the view in one frame", () => {
  const { content, onTarget, resize, target } = setup();
  expect(resize.observed.has(content)).toBe(true);

  resize.fire();

  expect(onTarget).toHaveBeenCalledTimes(1);
  expect(onTarget).toHaveBeenCalledWith(target);
});

it("re-checks the row once a scroll settles", () => {
  const { container, onTarget, target } = setup();

  container.dispatchEvent(new Event("scroll"));
  jest.advanceTimersByTime(100);
  container.dispatchEvent(new Event("scroll"));
  jest.advanceTimersByTime(119);
  expect(onTarget).not.toHaveBeenCalled();

  jest.advanceTimersByTime(1);
  expect(onTarget).toHaveBeenCalledTimes(1);
  expect(onTarget).toHaveBeenCalledWith(target);
});

it("observes list content added after the jump", async () => {
  const { container, resize } = setup();
  const later = document.createElement("div");

  container.appendChild(later);
  await Promise.resolve();

  expect(resize.observed.has(later)).toBe(true);
});

it("follows the row when hydration replaces its node", async () => {
  const { content, onTarget, target, visibility } = setup();
  const replacement = document.createElement("div");
  replacement.id = "drop-20";

  content.replaceChild(replacement, target);
  await Promise.resolve();

  expect(onTarget).toHaveBeenLastCalledWith(replacement);
  expect(visibility.observed.has(replacement)).toBe(true);
  expect(visibility.observed.has(target)).toBe(false);
});

it("stops on reader input and leaves no observers, listeners or timers", () => {
  const { anchor, container, onRelease, onTarget, parent, resize, visibility } =
    setup();
  container.dispatchEvent(new Event("scroll"));

  parent.dispatchEvent(new Event("pointerdown"));

  expect(anchor.isActive()).toBe(false);
  expect(onRelease).toHaveBeenCalledTimes(1);
  expect(resize.disconnected).toBe(true);
  expect(visibility.disconnected).toBe(true);
  jest.advanceTimersByTime(1_000);
  container.dispatchEvent(new Event("scroll"));
  jest.advanceTimersByTime(1_000);
  resize.fire();
  expect(onTarget).not.toHaveBeenCalled();
  parent.dispatchEvent(new Event("keydown"));
  expect(onRelease).toHaveBeenCalledTimes(1);
});
