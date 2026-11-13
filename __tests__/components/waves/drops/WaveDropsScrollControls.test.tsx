import { act, fireEvent, render, screen } from "@testing-library/react";
import { useRef, useState } from "react";

import UnreadDivider from "@/components/drops/view/UnreadDivider";
import { WaveDropsScrollControls } from "@/components/waves/drops/WaveDropsScrollControls";

const UNREAD_SERIAL_NO = 42;
const JUMP_LABEL = "Scroll to first unread message";

function renderControls() {
  const onScrollToUnread = jest.fn();
  const onDismissUnread = jest.fn();

  function Chat() {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [boundary, setBoundary] = useState<number | null>(UNREAD_SERIAL_NO);
    const [revision, setRevision] = useState(0);

    return (
      <>
        <button type="button" onClick={() => setRevision(revision + 1)}>
          Replace divider
        </button>
        <div ref={scrollContainerRef} data-testid="chat-scroll">
          {boundary !== null && (
            <UnreadDivider key={revision} serialNo={boundary} />
          )}
          <div id={`drop-${UNREAD_SERIAL_NO}`}>First unread drop</div>
        </div>
        <WaveDropsScrollControls
          unreadDividerSerialNo={boundary}
          scrollContainerRef={scrollContainerRef}
          onScrollToUnread={onScrollToUnread}
          onDismissUnread={() => {
            onDismissUnread();
            setBoundary(null);
          }}
          isAtBottom
          scrollToBottom={jest.fn()}
          newMessagesCount={0}
        />
      </>
    );
  }

  render(<Chat />);
  const scrollContainer = screen.getByTestId("chat-scroll");
  const unreadDrop = screen.getByText("First unread drop");
  jest
    .spyOn(scrollContainer, "getBoundingClientRect")
    .mockReturnValue(new DOMRect(0, 0, 400, 200));
  const unreadDropRect = jest.spyOn(unreadDrop, "getBoundingClientRect");

  async function moveDivider(top: number) {
    const divider = screen.getByText("New Messages").parentElement!;
    jest
      .spyOn(divider, "getBoundingClientRect")
      .mockReturnValue(new DOMRect(0, top, 400, 20));
    unreadDropRect.mockReturnValue(new DOMRect(0, top + 20, 400, 30));
    // A chat update can change layout while the reader does nothing.
    await act(async () => {
      scrollContainer.append(document.createElement("span"));
    });
  }

  return { moveDivider, onDismissUnread, onScrollToUnread };
}

describe("WaveDropsScrollControls unread jump", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("keeps the jump available through a partial and a brief full appearance", async () => {
    const { moveDivider, onDismissUnread, onScrollToUnread } = renderControls();
    await moveDivider(-70);
    expect(screen.getByRole("button", { name: JUMP_LABEL })).toBeVisible();

    await moveDivider(-10);
    act(() => jest.advanceTimersByTime(350));
    expect(screen.getByRole("button", { name: JUMP_LABEL })).toBeVisible();

    await moveDivider(40);
    act(() => jest.advanceTimersByTime(150));
    expect(screen.getByRole("button", { name: JUMP_LABEL })).toBeVisible();
    await moveDivider(-70);
    act(() => jest.advanceTimersByTime(350));

    expect(onDismissUnread).not.toHaveBeenCalled();
    expect(screen.getByText("New Messages")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: JUMP_LABEL }));
    expect(onScrollToUnread).toHaveBeenCalledWith(UNREAD_SERIAL_NO);
  });

  it("clears the marker after a fully visible divider is seen and leaves view", async () => {
    const { moveDivider, onDismissUnread } = renderControls();
    await moveDivider(-70);
    await moveDivider(40);
    act(() => jest.advanceTimersByTime(300));

    expect(screen.queryByRole("button", { name: JUMP_LABEL })).toBeNull();
    expect(screen.getByText("New Messages")).toBeInTheDocument();
    await moveDivider(-70);

    expect(onDismissUnread).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("New Messages")).toBeNull();
  });

  it("starts a fresh visibility interval after returning to the tab", async () => {
    const visibility = jest.spyOn(document, "visibilityState", "get");
    try {
      const { moveDivider, onDismissUnread } = renderControls();
      await moveDivider(-70);
      await moveDivider(40);
      act(() => jest.advanceTimersByTime(200));

      visibility.mockReturnValue("hidden");
      fireEvent(document, new Event("visibilitychange"));
      act(() => jest.advanceTimersByTime(400));

      visibility.mockReturnValue("visible");
      fireEvent(document, new Event("visibilitychange"));
      act(() => jest.advanceTimersByTime(200));
      expect(screen.getByRole("button", { name: JUMP_LABEL })).toBeVisible();
      await moveDivider(-70);

      expect(onDismissUnread).not.toHaveBeenCalled();
    } finally {
      visibility.mockRestore();
    }
  });

  it("starts a fresh visibility interval when chat replaces the divider", async () => {
    const { moveDivider } = renderControls();
    await moveDivider(-70);
    await moveDivider(40);
    act(() => jest.advanceTimersByTime(200));

    fireEvent.click(screen.getByRole("button", { name: "Replace divider" }));
    await moveDivider(40);
    act(() => jest.advanceTimersByTime(200));
    expect(screen.getByRole("button", { name: JUMP_LABEL })).toBeVisible();
    act(() => jest.advanceTimersByTime(100));
    expect(screen.queryByRole("button", { name: JUMP_LABEL })).toBeNull();
  });
});
