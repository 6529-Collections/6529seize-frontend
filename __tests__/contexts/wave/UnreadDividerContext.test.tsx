import {
  UnreadDividerProvider,
  useUnreadDivider,
  useUnreadDividerOptional,
} from "@/contexts/wave/UnreadDividerContext";
import {
  act,
  fireEvent,
  render,
  renderHook,
  screen,
} from "@testing-library/react";
import type { ReactNode } from "react";

function createWrapper(initialSerialNo: number | null) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <UnreadDividerProvider initialSerialNo={initialSerialNo}>
        {children}
      </UnreadDividerProvider>
    );
  };
}

function renderUnreadDividerHook() {
  return renderHook(useUnreadDivider);
}

describe("UnreadDividerContext", () => {
  describe("useUnreadDivider", () => {
    it("throws when used outside provider", () => {
      const consoleError = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      expect(renderUnreadDividerHook).toThrow(
        "useUnreadDivider must be used within an UnreadDividerProvider"
      );

      consoleError.mockRestore();
    });

    it("returns initial serial number", () => {
      const { result } = renderHook(() => useUnreadDivider(), {
        wrapper: createWrapper(42),
      });

      expect(result.current.unreadDividerSerialNo).toBe(42);
    });

    it("returns null when initialSerialNo is null", () => {
      const { result } = renderHook(() => useUnreadDivider(), {
        wrapper: createWrapper(null),
      });

      expect(result.current.unreadDividerSerialNo).toBeNull();
    });

    it("updates serial number when setUnreadDividerSerialNo is called", () => {
      const { result } = renderHook(() => useUnreadDivider(), {
        wrapper: createWrapper(null),
      });

      act(() => {
        result.current.setUnreadDividerSerialNo(99);
      });

      expect(result.current.unreadDividerSerialNo).toBe(99);
    });

    it("clears serial number when set to null", () => {
      const { result } = renderHook(() => useUnreadDivider(), {
        wrapper: createWrapper(42),
      });

      act(() => {
        result.current.setUnreadDividerSerialNo(null);
      });

      expect(result.current.unreadDividerSerialNo).toBeNull();
    });
  });

  describe("useUnreadDividerOptional", () => {
    it("returns null when used outside provider", () => {
      const { result } = renderHook(() => useUnreadDividerOptional());
      expect(result.current).toBeNull();
    });

    it("returns context when used inside provider", () => {
      const { result } = renderHook(() => useUnreadDividerOptional(), {
        wrapper: createWrapper(42),
      });

      expect(result.current?.unreadDividerSerialNo).toBe(42);
    });
  });
});

describe("unread position for a Wave visit", () => {
  const locationBeforeTest = window.location.href;
  const historyBeforeTest: unknown = window.history.state;
  const waveId = "wave-1";

  function Divider() {
    const { unreadDividerSerialNo, setUnreadDividerSerialNo } =
      useUnreadDivider();
    return (
      <button type="button" onClick={() => setUnreadDividerSerialNo(null)}>
        {unreadDividerSerialNo ?? "No divider"}
      </button>
    );
  }

  const chat = (
    initialSerialNo: number | null,
    viewerKey = "profile-1",
    entryUrl = `/waves/${waveId}?`
  ) => (
    <UnreadDividerProvider
      initialSerialNo={initialSerialNo}
      historyScope={{ waveId, viewerKey, entryUrl }}
    >
      <Divider />
    </UnreadDividerProvider>
  );

  beforeEach(() => {
    window.history.replaceState({ otherState: true }, "", `/waves/${waveId}`);
  });

  afterEach(() => {
    window.history.replaceState(historyBeforeTest, "", locationBeforeTest);
  });

  it("keeps the first available position across remounts until the reader dismisses it", () => {
    const original = render(chat(null));
    expect(screen.getByRole("button", { name: "No divider" })).toBeVisible();
    original.rerender(chat(501));
    expect(screen.getByRole("button", { name: "501" })).toBeVisible();
    original.rerender(chat(520));
    expect(screen.getByRole("button", { name: "501" })).toBeVisible();
    expect(window.history.state).toMatchObject({ otherState: true });
    original.unmount();

    const reloaded = render(chat(null));
    fireEvent.click(screen.getByRole("button", { name: "501" }));
    reloaded.rerender(chat(520));
    expect(screen.getByRole("button", { name: "No divider" })).toBeVisible();
    reloaded.unmount();

    render(chat(520));
    expect(screen.getByRole("button", { name: "No divider" })).toBeVisible();
  });

  it("restores the current divider and dismissal when a same-wave entry loses its key", () => {
    const view = render(chat(501));
    const nextEntry = `/waves/${waveId}?tab=chat`;
    window.history.replaceState({ otherState: true }, "", nextEntry);
    view.rerender(chat(null, "profile-1", nextEntry));
    expect(screen.getByRole("button", { name: "501" })).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "501" }));
    const backToChat = `/waves/${waveId}?`;
    window.history.replaceState(null, "", backToChat);
    view.rerender(chat(520, "profile-1", backToChat));
    expect(screen.getByRole("button", { name: "No divider" })).toBeVisible();
    expect(window.history.state).toMatchObject({
      waveChatUnreadDivider: { serialNo: null },
    });
  });

  it("repairs dropped history state after a commit with the same Wave URL", () => {
    const view = render(chat(501));
    window.history.replaceState({ otherState: true }, "");
    view.rerender(chat(501));

    expect(window.history.state).toMatchObject({
      otherState: true,
      waveChatUnreadDivider: { serialNo: 501 },
    });
    fireEvent.click(screen.getByRole("button", { name: "501" }));
    window.history.replaceState({ otherState: true }, "");
    view.rerender(chat(501));

    expect(screen.getByRole("button", { name: "No divider" })).toBeVisible();
    expect(window.history.state).toMatchObject({
      otherState: true,
      waveChatUnreadDivider: { serialNo: null },
    });
  });

  it("starts fresh for a different viewer or a new history entry", () => {
    render(chat(501)).unmount();

    const otherViewer = render(chat(null, "profile-2"));
    expect(screen.getByRole("button", { name: "No divider" })).toBeVisible();
    otherViewer.unmount();

    window.history.replaceState(null, "", `/waves/${waveId}`);
    render(chat(520));
    expect(screen.getByRole("button", { name: "520" })).toBeVisible();
  });
});
