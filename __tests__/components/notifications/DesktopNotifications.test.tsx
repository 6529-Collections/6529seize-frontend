import {
  act,
  createEvent,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import DesktopNotifications from "@/components/notifications/inbox/DesktopNotifications";

jest.mock("next/dynamic", () => ({
  __esModule: true,
  default: () =>
    function MockInbox({ onClose }: { onClose: () => void }) {
      return (
        <>
          <button onClick={onClose}>Close notifications</button>
          <a href="/notifications">View all notifications</a>
        </>
      );
    },
}));

function advance(milliseconds: number) {
  act(() => {
    jest.advanceTimersByTime(milliseconds);
  });
}
function setup() {
  const result = render(
    <DesktopNotifications collapsed unread pathname="/waves" />
  );
  return {
    ...result,
    bell: screen.getByRole("link", { name: "Notifications" }),
  };
}
function enter(element: HTMLElement, pointerType = "mouse") {
  const event = createEvent.pointerOver(element);
  Object.defineProperty(event, "pointerType", { value: pointerType });
  fireEvent(element, event);
}
function leave(element: HTMLElement) {
  const event = createEvent.pointerOut(element, {
    relatedTarget: document.body,
  });
  Object.defineProperty(event, "pointerType", { value: "mouse" });
  fireEvent(element, event);
}
const panel = () => screen.queryByRole("region", { name: "Notifications" });

beforeEach(() => {
  jest.useFakeTimers();
});
afterEach(() => {
  jest.useRealTimers();
});

test("bell is a direct link; brief mouse passes and touch do not open the preview", () => {
  const { bell } = setup();
  expect(bell).toHaveAttribute("href", "/notifications");
  enter(bell);
  advance(99);
  expect(panel()).not.toBeInTheDocument();
  leave(bell);
  advance(200);
  expect(panel()).not.toBeInTheDocument();
  enter(bell, "touch");
  advance(200);
  expect(panel()).not.toBeInTheDocument();
});

test("100ms hover opens without moving focus; the 200ms grace period bridges the portal", () => {
  const { bell } = setup();
  enter(bell);
  advance(100);
  expect(panel()).toBeInTheDocument();
  expect(panel()).not.toHaveFocus();
  leave(bell);
  advance(150);
  enter(panel()!);
  advance(200);
  expect(panel()).toBeInTheDocument();
  leave(panel()!);
  advance(199);
  expect(panel()).toBeInTheDocument();
  advance(1);
  expect(panel()).not.toBeInTheDocument();
});

test("ArrowDown enters the preview, keyboard focus keeps it open, and Escape returns to the link", () => {
  const { bell } = setup();
  bell.focus();
  fireEvent.keyDown(bell, { key: "ArrowDown" });
  expect(panel()).toHaveFocus();
  leave(panel()!);
  advance(200);
  expect(panel()).toBeInTheDocument();
  fireEvent.keyDown(document, { key: "Escape" });
  expect(panel()).not.toBeInTheDocument();
  expect(bell).toHaveFocus();
});

test("close button returns focus and blur out of the preview dismisses it", () => {
  const { bell } = setup();
  fireEvent.keyDown(bell, { key: "ArrowDown" });
  fireEvent.click(screen.getByRole("button", { name: "Close notifications" }));
  expect(panel()).not.toBeInTheDocument();
  expect(bell).toHaveFocus();
  fireEvent.keyDown(bell, { key: "ArrowDown" });
  fireEvent.blur(panel()!, { relatedTarget: document.body });
  expect(panel()).not.toBeInTheDocument();
});

test("outside pointer dismisses; clicking the bell cancels pending hover and closes an open preview", () => {
  const { bell } = setup();
  enter(bell);
  fireEvent.click(bell);
  advance(100);
  expect(panel()).not.toBeInTheDocument();
  fireEvent.keyDown(bell, { key: "ArrowDown" });
  fireEvent.pointerDown(document.body);
  expect(panel()).not.toBeInTheDocument();
  fireEvent.keyDown(bell, { key: "ArrowDown" });
  fireEvent.click(bell);
  expect(panel()).not.toBeInTheDocument();
});

test("unmount cancels pending hover work", () => {
  const { bell, unmount } = setup();
  enter(bell);
  unmount();
  advance(100);
  expect(panel()).not.toBeInTheDocument();
});

test.each([false, true])(
  "route changes close the preview and cancel hover intent (already open: %s)",
  (alreadyOpen) => {
    const { bell, rerender } = setup();
    enter(bell);
    advance(alreadyOpen ? 100 : 50);
    rerender(
      <DesktopNotifications collapsed unread pathname="/notifications" />
    );
    advance(200);
    expect(panel()).not.toBeInTheDocument();
    rerender(<DesktopNotifications collapsed unread pathname="/waves" />);
    expect(panel()).not.toBeInTheDocument();
    enter(screen.getByRole("link", { name: "Notifications" }));
    advance(100);
    expect(panel()).toBeInTheDocument();
  }
);

test("mouse focus on a preview action does not keep it open after leaving", () => {
  const { bell } = setup();
  enter(bell);
  advance(100);
  const action = screen.getByRole("link", { name: "View all notifications" });
  fireEvent.pointerDown(action);
  action.focus();
  leave(panel()!);
  advance(200);
  expect(panel()).not.toBeInTheDocument();
});

test("keyboard opening cancels a previously scheduled mouse close", () => {
  const { bell } = setup();
  enter(bell);
  advance(100);
  leave(bell);
  advance(199);
  fireEvent.keyDown(bell, { key: "ArrowDown" });
  expect(panel()).toHaveFocus();
  advance(200);
  expect(panel()).toBeInTheDocument();
  expect(panel()).toHaveFocus();
});
