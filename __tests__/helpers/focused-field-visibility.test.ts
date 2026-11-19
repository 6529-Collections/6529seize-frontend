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
        behavior: "instant",
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

  it("does not scroll an input already visible during keyboard resize frames", () => {
    const container = document.createElement("div");
    const input = document.createElement("input");
    input.scrollIntoView = jest.fn();
    container.getBoundingClientRect = () => new DOMRect(0, 80, 400, 350);
    input.getBoundingClientRect = () => new DOMRect(20, 150, 300, 44);
    container.append(input);
    document.body.append(container);
    const tracking = observeFocusedField(container);
    input.focus();
    for (let frame = 0; frame < 12; frame++) {
      onResize([], observer);
      paint();
    }
    expect(input.scrollIntoView).not.toHaveBeenCalled();
    input.getBoundingClientRect = () => new DOMRect(20, 410, 300, 44);
    onResize([], observer);
    paint();
    expect(input.scrollIntoView).toHaveBeenCalledTimes(1);
    tracking.disconnect();
  });

  it("reveals a field clipped by an inner editor even when the outer sheet fits it", () => {
    const container = document.createElement("div");
    const editor = document.createElement("div");
    const input = document.createElement("input");
    input.scrollIntoView = jest.fn();
    editor.style.overflowY = "auto";
    jest.spyOn(globalThis, "getComputedStyle").mockReturnValue(
      Object.assign(getComputedStyle(editor), { overflowY: "auto" })
    );
    container.getBoundingClientRect = () => new DOMRect(0, 0, 400, 600);
    editor.getBoundingClientRect = () => new DOMRect(0, 200, 400, 300);
    input.getBoundingClientRect = () => new DOMRect(20, 130, 300, 44);
    editor.append(input);
    container.append(editor);
    document.body.append(container);
    const tracking = observeFocusedField(container);
    input.focus();
    paint();
    expect(input.scrollIntoView).toHaveBeenCalledTimes(1);
    tracking.disconnect();
  });

  it("tracks reply content growth when opted in and cancels pending reveals on cleanup", () => {
    const container = document.createElement("div");
    const content = document.createElement("div");
    const input = document.createElement("textarea");
    input.scrollIntoView = jest.fn();
    content.append(input);
    container.append(content);
    document.body.append(container);
    const tracking = observeFocusedField(container, {
      observeContentResize: true,
    });

    expect(observer.observe).toHaveBeenCalledTimes(2);
    expect(observer.observe).toHaveBeenNthCalledWith(1, container);
    expect(observer.observe).toHaveBeenNthCalledWith(2, content);
    input.focus();
    onResize([], observer);
    onResize([], observer);
    expect(frames.size).toBe(1);
    paint();
    expect(input.scrollIntoView).toHaveBeenCalledTimes(1);

    onResize([], observer);
    tracking.disconnect();
    paint();
    expect(frames.size).toBe(0);
    expect(input.scrollIntoView).toHaveBeenCalledTimes(1);
  });
});
