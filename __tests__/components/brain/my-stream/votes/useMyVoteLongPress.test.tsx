import { act, fireEvent, render, screen } from "@testing-library/react";
import { useLayoutEffect } from "react";
import { useMyVoteLongPress } from "@/components/brain/my-stream/votes/useMyVoteLongPress";
import { DEFAULT_LONG_PRESS_DURATION_MS } from "@/hooks/useLongPressInteraction";

function HoldTarget({
  enabled = true,
  onSelect,
  onActivate,
  afterDisabledCommit,
}: {
  readonly enabled?: boolean;
  readonly onSelect: () => void;
  readonly onActivate?: () => void;
  readonly afterDisabledCommit?: () => void;
}) {
  const handlers = useMyVoteLongPress(enabled, onSelect);
  useLayoutEffect(() => {
    if (!enabled) afterDisabledCommit?.();
  }, [enabled, afterDisabledCommit]);
  return (
    <div {...handlers}>
      <button type="button" data-my-vote-open onClick={onActivate}>
        Artwork
      </button>
    </div>
  );
}

function pointer(type: string, pointerType = "touch") {
  const event = new Event(type, { bubbles: true });
  Object.assign(event, {
    pointerType,
    isPrimary: true,
    clientX: 20,
    clientY: 20,
  });
  fireEvent(screen.getByRole("button", { name: "Artwork" }), event);
}

beforeEach(() => {
  jest.useFakeTimers();
});
afterEach(() => {
  jest.useRealTimers();
});

it("selects an eligible hold but cancels before the disabling commit yields to timers", () => {
  const onSelect = jest.fn();
  const { rerender } = render(<HoldTarget onSelect={onSelect} />);
  pointer("pointerdown");
  act(() => jest.advanceTimersByTime(DEFAULT_LONG_PRESS_DURATION_MS));
  expect(onSelect).toHaveBeenCalledTimes(1);
  pointer("pointercancel");
  pointer("pointerdown");
  rerender(
    <HoldTarget
      enabled={false}
      onSelect={onSelect}
      afterDisabledCommit={() =>
        jest.advanceTimersByTime(DEFAULT_LONG_PRESS_DURATION_MS)
      }
    />
  );
  expect(onSelect).toHaveBeenCalledTimes(1);
});

it.each(["pointerup", "pointercancel"])(
  "preserves keyboard activation after a held gesture ends with %s",
  (event) => {
    const onActivate = jest.fn();
    render(<HoldTarget onSelect={jest.fn()} onActivate={onActivate} />);
    pointer("pointerdown");
    act(() => jest.advanceTimersByTime(DEFAULT_LONG_PRESS_DURATION_MS));
    pointer(event);
    fireEvent.click(screen.getByRole("button", { name: "Artwork" }), {
      detail: 0,
    });
    expect(onActivate).toHaveBeenCalledTimes(1);
  }
);

it("preserves mouse context menus and suppresses them only during a touch hold", () => {
  const onSelect = jest.fn();
  const { rerender } = render(<HoldTarget onSelect={onSelect} />);
  const artwork = screen.getByRole("button", { name: "Artwork" });
  const contextMenu = () => {
    const event = new MouseEvent("contextmenu", {
      bubbles: true,
      cancelable: true,
    });
    fireEvent(artwork, event);
    return event.defaultPrevented;
  };
  pointer("pointerdown", "mouse");
  expect(contextMenu()).toBe(false);
  pointer("pointerdown");
  expect(contextMenu()).toBe(true);
  act(() => jest.advanceTimersByTime(DEFAULT_LONG_PRESS_DURATION_MS));
  rerender(<HoldTarget enabled={false} onSelect={onSelect} />);
  expect(contextMenu()).toBe(true);
  pointer("pointercancel");
  expect(contextMenu()).toBe(false);
});
