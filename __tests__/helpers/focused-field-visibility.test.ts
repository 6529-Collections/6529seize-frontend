import { observeFocusedField } from "@/helpers/focused-field-visibility";

describe("observeFocusedField", () => {
  let frames: Map<number, FrameRequestCallback>;
  let nextFrame: number;
  let onResize: ResizeObserverCallback;
  let observer: ResizeObserver;

  beforeEach(() => {
    frames = new Map();
    nextFrame = 0;
    jest
      .spyOn(globalThis, "requestAnimationFrame")
      .mockImplementation((callback) => {
        frames.set(++nextFrame, callback);
        return nextFrame;
      });
    jest.spyOn(globalThis, "cancelAnimationFrame").mockImplementation((id) => {
      frames.delete(id);
    });
    observer = {
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    };
    jest.spyOn(globalThis, "ResizeObserver").mockImplementation((callback) => {
      onResize = callback;
      return observer;
    });
  });

  afterEach(() => {
    document.body.replaceChildren();
    jest.restoreAllMocks();
  });

  const paint = () => {
    const pending = [...frames.values()];
    frames.clear();
    pending.forEach((callback) => callback(0));
  };

  it.each(["input", "textarea"] as const)(
    "reveals a focused %s on the next layout frame without a settle timer",
    (tag) => {
      const container = document.createElement("div");
      const input = document.createElement(tag);
      input.scrollIntoView = jest.fn();
      container.append(input);
      document.body.append(container);
      const tracking = observeFocusedField(container);
      input.focus();
      onResize([], observer);
      onResize([], observer);
      expect(input.scrollIntoView).not.toHaveBeenCalled();
      paint();
      expect(input.scrollIntoView).toHaveBeenCalledTimes(1);
      expect(input.scrollIntoView).toHaveBeenCalledWith({
        block: "nearest",
        inline: "nearest",
      });

      onResize([], observer);
      tracking.disconnect();
      paint();
      input.blur();
      input.focus();
      paint();
      expect(input.scrollIntoView).toHaveBeenCalledTimes(1);
      expect(observer.disconnect).toHaveBeenCalledTimes(1);
    }
  );

  it("leaves focus outside the tracked dialog alone", () => {
    const container = document.createElement("div");
    const outside = document.createElement("input");
    outside.scrollIntoView = jest.fn();
    document.body.append(container, outside);
    const tracking = observeFocusedField(container);
    outside.focus();
    onResize([], observer);
    paint();
    expect(outside.scrollIntoView).not.toHaveBeenCalled();
    tracking.disconnect();
  });
});
