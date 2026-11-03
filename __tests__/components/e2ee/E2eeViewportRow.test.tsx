import { act, fireEvent, render, screen } from "@testing-library/react";
import { E2eeViewportRow } from "@/components/e2ee/conversation/E2eeViewportRow";

it("exposes native mounted list items and retains a focused row outside the viewport", () => {
  const original = globalThis.IntersectionObserver;
  let callback: IntersectionObserverCallback | undefined;
  const observer = {
    observe: jest.fn(),
    disconnect: jest.fn(),
  } as unknown as IntersectionObserver;
  Object.defineProperty(globalThis, "IntersectionObserver", {
    configurable: true,
    writable: true,
    value: jest.fn((notify: IntersectionObserverCallback) => {
      callback = notify;
      return observer;
    }),
  });
  try {
    const { container, unmount } = render(
      <ol aria-label="Messages">
        <E2eeViewportRow
          messageId="message"
          scrollRef={{ current: null }}
          position={2}
          setSize={5}
          restoreAnchor={() => false}
        >
          <button>Message action</button>
        </E2eeViewportRow>
      </ol>
    );
    const row = container.querySelector("li")!;
    const enter = (visible: boolean) =>
      act(() =>
        callback?.(
          [
            {
              isIntersecting: visible,
              target: row,
              intersectionRatio: Number(visible),
              boundingClientRect: row.getBoundingClientRect(),
              intersectionRect: row.getBoundingClientRect(),
              rootBounds: null,
              time: 0,
            },
          ],
          observer
        )
      );
    expect(screen.queryByRole("listitem")).toBeNull();
    enter(true);
    expect(screen.getByRole("listitem").tagName).toBe("LI");
    expect(row).toHaveAttribute("aria-posinset", "2");
    expect(row).toHaveAttribute("aria-setsize", "5");
    const action = screen.getByRole("button", { name: "Message action" });
    fireEvent.focus(action);
    enter(false);
    expect(action).toBeInTheDocument();
    fireEvent.blur(action, { relatedTarget: document.body });
    expect(screen.queryByRole("listitem")).toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
    unmount();
  } finally {
    Object.defineProperty(globalThis, "IntersectionObserver", {
      configurable: true,
      writable: true,
      value: original,
    });
  }
});
