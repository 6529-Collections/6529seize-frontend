import { PinnedWaveTouchSensor } from "@/components/brain/left-sidebar/waves/PinnedWaveTouchSensor";

function touchEvent(type: string, y: number) {
  return Object.assign(new Event(type, { cancelable: true }), {
    touches: [{ clientX: 100, clientY: y, identifier: 1 }],
  });
}

afterEach(() => {
  document.dispatchEvent(new Event("touchcancel"));
  jest.useRealTimers();
});

it("claims the first small vertical movement after a hold before lifting the row", () => {
  jest.useFakeTimers();
  const onStart = jest.fn();
  const onMove = jest.fn();
  new PinnedWaveTouchSensor({
    active: "wave",
    event: touchEvent("touchstart", 100),
    options: { delay: 200 },
    onStart,
    onMove,
    onAbort: jest.fn(),
    onCancel: jest.fn(),
    onEnd: jest.fn(),
  });

  jest.advanceTimersByTime(650);
  const firstMove = touchEvent("touchmove", 104);
  document.dispatchEvent(firstMove);
  expect(firstMove.defaultPrevented).toBe(true);
  expect(onStart).not.toHaveBeenCalled();
  expect(onMove).not.toHaveBeenCalled();

  const dragMove = touchEvent("touchmove", 110);
  document.dispatchEvent(dragMove);
  expect(dragMove.defaultPrevented).toBe(true);
  expect(onStart).toHaveBeenCalledTimes(1);
  expect(onMove).toHaveBeenCalledWith({ x: 100, y: 110 });
});
