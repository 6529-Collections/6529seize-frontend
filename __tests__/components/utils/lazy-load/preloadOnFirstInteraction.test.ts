type PreloadOnFirstInteraction = (task: () => void) => void;

// The helper keeps shared module state (registered tasks, installed listeners,
// whether the visitor has already interacted), so every test gets a fresh copy.
function freshHelper(): PreloadOnFirstInteraction {
  let helper!: PreloadOnFirstInteraction;
  jest.isolateModules(() => {
    helper =
      require("@/components/utils/lazy-load/preloadOnFirstInteraction").preloadOnFirstInteraction;
  });
  return helper;
}

const FIRST_INTERACTION_EVENTS = [
  "pointerdown",
  "keydown",
  "touchstart",
  "focusin",
  "scroll",
];

// scroll does not bubble: it only reaches a window listener in the capture phase.
const fire = (type: string) =>
  document.body.dispatchEvent(new Event(type, { bubbles: type !== "scroll" }));

afterEach(() => {
  // Drop any listener a test left installed, then restore the spies.
  fire("pointerdown");
  jest.restoreAllMocks();
});

describe("preloadOnFirstInteraction", () => {
  it.each(FIRST_INTERACTION_EVENTS)(
    "runs the task once, on the first %s",
    (type) => {
      const preloadOnFirstInteraction = freshHelper();
      const task = jest.fn();

      preloadOnFirstInteraction(task);
      expect(task).not.toHaveBeenCalled();

      fire(type);
      expect(task).toHaveBeenCalledTimes(1);

      fire(type);
      fire("pointerdown");
      expect(task).toHaveBeenCalledTimes(1);
    }
  );

  it("counts a lone Ctrl press, so Ctrl+K usually finds its chunk cached", () => {
    const preloadOnFirstInteraction = freshHelper();
    const task = jest.fn();
    preloadOnFirstInteraction(task);

    window.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Control", ctrlKey: true })
    );

    expect(task).toHaveBeenCalledTimes(1);
  });

  it("does nothing for events that are not an interaction", () => {
    const preloadOnFirstInteraction = freshHelper();
    const task = jest.fn();
    preloadOnFirstInteraction(task);

    fire("pointermove");
    fire("mousemove");
    fire("resize");
    fire("visibilitychange");

    expect(task).not.toHaveBeenCalled();
  });

  it("listens passively and in the capture phase, then removes every listener after the first interaction", () => {
    const add = jest.spyOn(window, "addEventListener");
    const remove = jest.spyOn(window, "removeEventListener");
    const preloadOnFirstInteraction = freshHelper();
    preloadOnFirstInteraction(jest.fn());

    const added = add.mock.calls.filter(([type]) =>
      FIRST_INTERACTION_EVENTS.includes(type)
    );
    expect(added.map(([type]) => type).sort()).toEqual(
      [...FIRST_INTERACTION_EVENTS].sort()
    );
    for (const [, , options] of added) {
      expect(options).toEqual({ capture: true, passive: true });
    }
    expect(remove).not.toHaveBeenCalled();

    fire("scroll");

    const removed = remove.mock.calls.filter(([type]) =>
      FIRST_INTERACTION_EVENTS.includes(type)
    );
    expect(removed.map(([type]) => type).sort()).toEqual(
      [...FIRST_INTERACTION_EVENTS].sort()
    );
    // The same handler that was added, with the same capture flag, or the
    // browser would keep the listener.
    for (const [type, handler, options] of removed) {
      expect(options).toEqual({ capture: true });
      expect(added.find(([addedType]) => addedType === type)?.[1]).toBe(
        handler
      );
    }
  });

  it("installs one set of listeners however many tasks register, and runs each distinct task once", () => {
    const add = jest.spyOn(window, "addEventListener");
    const preloadOnFirstInteraction = freshHelper();
    const first = jest.fn();
    const second = jest.fn();

    preloadOnFirstInteraction(first);
    preloadOnFirstInteraction(second);
    preloadOnFirstInteraction(first);

    const added = add.mock.calls.filter(([type]) =>
      FIRST_INTERACTION_EVENTS.includes(type)
    );
    expect(added).toHaveLength(FIRST_INTERACTION_EVENTS.length);

    fire("keydown");

    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
  });

  it("runs a task that registers after the first interaction straight away, without new listeners", () => {
    const preloadOnFirstInteraction = freshHelper();
    preloadOnFirstInteraction(jest.fn());
    fire("pointerdown");

    const add = jest.spyOn(window, "addEventListener");
    const late = jest.fn();
    preloadOnFirstInteraction(late);

    expect(late).toHaveBeenCalledTimes(1);
    expect(add).not.toHaveBeenCalled();
  });
});
