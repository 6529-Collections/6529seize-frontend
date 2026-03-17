import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ChatItemHrefButtons from "@/components/waves/ChatItemHrefButtons";
import { LinkPreviewProvider } from "@/components/waves/LinkPreviewContext";
import useHasTouchInput from "@/hooks/useHasTouchInput";
import useIsMobileDevice from "@/hooks/isMobileDevice";

jest.mock("@/hooks/useHasTouchInput");
jest.mock("@/hooks/isMobileDevice");

const writeText = jest.fn().mockResolvedValue(undefined);
Object.assign(navigator, {
  clipboard: { writeText },
});

const useHasTouchInputMock = useHasTouchInput as jest.Mock;
const useIsMobileDeviceMock = useIsMobileDevice as jest.Mock;

describe("ChatItemHrefButtons", () => {
  beforeEach(() => {
    useHasTouchInputMock.mockReturnValue(false);
    useIsMobileDeviceMock.mockReturnValue(false);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("copies link to clipboard", () => {
    render(<ChatItemHrefButtons href="https://a" />);
    const button = screen.getByRole("button");
    fireEvent.click(button);
    expect(writeText).toHaveBeenCalledWith("https://a");
  });

  it("renders external link when no relative href", () => {
    render(<ChatItemHrefButtons href="https://a" />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "https://a");
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("uses relative href when provided", () => {
    render(<ChatItemHrefButtons href="https://a" relativeHref="/local" />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/local");
    expect(link).not.toHaveAttribute("target");
  });

  it("renders and triggers preview toggle action from context", () => {
    const onToggle = jest.fn();
    render(
      <LinkPreviewProvider
        previewToggle={{
          canToggle: true,
          isHidden: false,
          isLoading: false,
          label: "Hide link previews",
          onToggle,
        }}
      >
        <ChatItemHrefButtons href="https://a" />
      </LinkPreviewProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Hide link previews" }));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("opens the overlay menu and keeps copy action available", () => {
    render(
      <div className="tw-group/link-card tw-relative">
        <ChatItemHrefButtons href="https://a" layout="overlay" />
      </div>
    );

    fireEvent.click(screen.getByRole("button", { name: "Link actions" }));
    fireEvent.click(screen.getByRole("button", { name: "Copy link" }));

    expect(writeText).toHaveBeenCalledWith("https://a");
  });

  it("dismisses the overlay menu without activating the underlying card", () => {
    const onCardClick = jest.fn();

    render(
      <div className="tw-group/link-card tw-relative">
        <button type="button" onClick={onCardClick}>
          Preview card
        </button>
        <ChatItemHrefButtons href="https://a" layout="overlay" />
      </div>
    );

    fireEvent.click(screen.getByRole("button", { name: "Link actions" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Dismiss link actions" })
    );

    expect(
      screen.queryByRole("button", { name: "Copy link" })
    ).not.toBeInTheDocument();
    expect(onCardClick).not.toHaveBeenCalled();
  });

  it("reports overlay action activity when the menu opens and closes", () => {
    const onCardActionsActiveChange = jest.fn();

    render(
      <div className="tw-group/link-card tw-relative">
        <LinkPreviewProvider
          onCardActionsActiveChange={onCardActionsActiveChange}
        >
          <ChatItemHrefButtons href="https://a" layout="overlay" />
        </LinkPreviewProvider>
      </div>
    );

    const trigger = screen.getByRole("button", { name: "Link actions" });

    fireEvent.click(trigger);

    const actionSurfaceId = onCardActionsActiveChange.mock.calls[0]?.[0];
    expect(onCardActionsActiveChange).toHaveBeenNthCalledWith(
      1,
      actionSurfaceId,
      true
    );

    fireEvent.click(trigger);

    expect(onCardActionsActiveChange).toHaveBeenNthCalledWith(
      2,
      actionSurfaceId,
      false
    );
  });

  it("reports overlay action activity when focus enters and leaves the trigger", () => {
    const onCardActionsActiveChange = jest.fn();

    render(
      <div>
        <div className="tw-group/link-card tw-relative">
          <LinkPreviewProvider
            onCardActionsActiveChange={onCardActionsActiveChange}
          >
            <ChatItemHrefButtons href="https://a" layout="overlay" />
          </LinkPreviewProvider>
        </div>
        <button type="button">Outside</button>
      </div>
    );

    const trigger = screen.getByRole("button", { name: "Link actions" });
    const outsideButton = screen.getByRole("button", { name: "Outside" });

    fireEvent.focus(trigger);

    const actionSurfaceId = onCardActionsActiveChange.mock.calls[0]?.[0];
    expect(onCardActionsActiveChange).toHaveBeenNthCalledWith(
      1,
      actionSurfaceId,
      true
    );

    fireEvent.blur(trigger, { relatedTarget: outsideButton });

    expect(onCardActionsActiveChange).toHaveBeenNthCalledWith(
      2,
      actionSurfaceId,
      false
    );
  });

  it("reports overlay actions as inactive when the component unmounts while active", () => {
    const onCardActionsActiveChange = jest.fn();

    const { unmount } = render(
      <div className="tw-group/link-card tw-relative">
        <LinkPreviewProvider
          onCardActionsActiveChange={onCardActionsActiveChange}
        >
          <ChatItemHrefButtons href="https://a" layout="overlay" />
        </LinkPreviewProvider>
      </div>
    );

    fireEvent.focus(screen.getByRole("button", { name: "Link actions" }));

    const actionSurfaceId = onCardActionsActiveChange.mock.calls[0]?.[0];

    unmount();

    expect(onCardActionsActiveChange).toHaveBeenNthCalledWith(
      2,
      actionSurfaceId,
      false
    );
  });

  it("moves focus to the first overlay action when opened from keyboard", async () => {
    const user = userEvent.setup();

    render(
      <div className="tw-group/link-card tw-relative">
        <LinkPreviewProvider
          previewToggle={{
            canToggle: true,
            isHidden: false,
            isLoading: false,
            label: "Hide link previews",
            onToggle: jest.fn(),
          }}
        >
          <ChatItemHrefButtons href="https://a" layout="overlay" />
        </LinkPreviewProvider>
      </div>
    );

    const trigger = screen.getByRole("button", { name: "Link actions" });
    trigger.focus();

    await user.keyboard("{Enter}");

    expect(
      screen.getByRole("button", { name: "Hide link previews" })
    ).toHaveFocus();
  });

  it("moves pointer-opened overlay menus into the tab sequence", async () => {
    const user = userEvent.setup();

    render(
      <div>
        <div className="tw-group/link-card tw-relative">
          <ChatItemHrefButtons href="https://a" layout="overlay" />
        </div>
        <button type="button">Outside</button>
      </div>
    );

    await user.click(screen.getByRole("button", { name: "Link actions" }));

    expect(screen.getByRole("button", { name: "Copy link" })).toHaveFocus();

    await user.tab();
    expect(screen.getByRole("link", { name: "Open link" })).toHaveFocus();

    await user.tab();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Outside" })).toHaveFocus();
      expect(
        screen.queryByRole("button", { name: "Copy link" })
      ).not.toBeInTheDocument();
    });
  });

  it("skips disabled overlay actions when moving keyboard focus into the menu", async () => {
    const user = userEvent.setup();

    render(
      <div className="tw-group/link-card tw-relative">
        <LinkPreviewProvider
          previewToggle={{
            canToggle: false,
            isHidden: false,
            isLoading: false,
            label: "Hide link previews",
            onToggle: jest.fn(),
          }}
        >
          <ChatItemHrefButtons href="https://a" layout="overlay" />
        </LinkPreviewProvider>
      </div>
    );

    const trigger = screen.getByRole("button", { name: "Link actions" });
    trigger.focus();

    await user.keyboard("{Enter}");

    expect(
      screen.getByRole("button", { name: "Hide link previews" })
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "Copy link" })).toHaveFocus();
  });

  it("reports overlay actions as inactive after pointer-driven trigger close", () => {
    const onCardActionsActiveChange = jest.fn();

    render(
      <div className="tw-group/link-card tw-relative">
        <LinkPreviewProvider
          onCardActionsActiveChange={onCardActionsActiveChange}
        >
          <ChatItemHrefButtons href="https://a" layout="overlay" />
        </LinkPreviewProvider>
      </div>
    );

    const trigger = screen.getByRole("button", { name: "Link actions" });

    fireEvent.pointerDown(trigger);
    fireEvent.mouseDown(trigger);
    fireEvent.focus(trigger);
    fireEvent.click(trigger);

    const actionSurfaceId = onCardActionsActiveChange.mock.calls[0]?.[0];
    expect(onCardActionsActiveChange).toHaveBeenNthCalledWith(
      1,
      actionSurfaceId,
      true
    );

    fireEvent.pointerDown(trigger);
    fireEvent.mouseDown(trigger);
    fireEvent.focus(trigger);
    fireEvent.click(trigger);

    expect(onCardActionsActiveChange).toHaveBeenNthCalledWith(
      2,
      actionSurfaceId,
      false
    );
  });

  it("returns focus to the trigger after a keyboard-activated overlay action", async () => {
    const user = userEvent.setup();

    render(
      <div className="tw-group/link-card tw-relative">
        <ChatItemHrefButtons href="https://a" layout="overlay" />
      </div>
    );

    const trigger = screen.getByRole("button", { name: "Link actions" });
    trigger.focus();

    await user.keyboard("{Enter}");
    expect(screen.getByRole("button", { name: "Copy link" })).toHaveFocus();

    await user.keyboard("{Enter}");

    await waitFor(() => {
      expect(trigger).toHaveFocus();
    });
  });

  it("returns focus to the trigger when escape closes the overlay menu", async () => {
    const user = userEvent.setup();

    render(
      <div className="tw-group/link-card tw-relative">
        <ChatItemHrefButtons href="https://a" layout="overlay" />
      </div>
    );

    const trigger = screen.getByRole("button", { name: "Link actions" });
    trigger.focus();

    await user.keyboard("{Enter}");
    expect(screen.getByRole("button", { name: "Copy link" })).toHaveFocus();

    fireEvent.keyDown(window, { key: "Escape" });

    await waitFor(() => {
      expect(trigger).toHaveFocus();
    });
  });

  it("closes the overlay menu when keyboard focus tabs past the last action", async () => {
    const user = userEvent.setup();
    const onCardActionsActiveChange = jest.fn();

    render(
      <div>
        <div className="tw-group/link-card tw-relative">
          <LinkPreviewProvider
            onCardActionsActiveChange={onCardActionsActiveChange}
          >
            <ChatItemHrefButtons href="https://a" layout="overlay" />
          </LinkPreviewProvider>
        </div>
        <button type="button">Outside</button>
      </div>
    );

    const trigger = screen.getByRole("button", { name: "Link actions" });
    trigger.focus();

    const actionSurfaceId = onCardActionsActiveChange.mock.calls[0]?.[0];

    await user.keyboard("{Enter}");
    expect(screen.getByRole("button", { name: "Copy link" })).toHaveFocus();

    await user.tab();
    expect(screen.getByRole("link", { name: "Open link" })).toHaveFocus();

    await user.tab();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Outside" })).toHaveFocus();
      expect(
        screen.queryByRole("button", { name: "Copy link" })
      ).not.toBeInTheDocument();
    });

    expect(onCardActionsActiveChange).toHaveBeenLastCalledWith(
      actionSurfaceId,
      false
    );
  });

  it("keeps the overlay trigger visible on touch devices", () => {
    useHasTouchInputMock.mockReturnValue(true);

    render(
      <div className="tw-group/link-card tw-relative">
        <ChatItemHrefButtons href="https://a" layout="overlay" />
      </div>
    );

    expect(screen.getByRole("button", { name: "Link actions" })).toBeVisible();
  });
});
