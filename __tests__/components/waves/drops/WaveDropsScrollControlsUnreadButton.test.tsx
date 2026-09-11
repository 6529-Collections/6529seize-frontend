import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { WaveDropsScrollControlsUnreadButton } from "@/components/waves/drops/WaveDropsScrollControlsUnreadButton";

describe("WaveDropsScrollControlsUnreadButton", () => {
  it("keeps both unread actions visible and operable without hover", async () => {
    const user = userEvent.setup();
    const onScrollToUnread = jest.fn();
    const onDismissUnread = jest.fn();

    render(
      <WaveDropsScrollControlsUnreadButton
        unreadDividerSerialNo={42}
        unreadCount={3}
        isPointingUp={false}
        isCombined={false}
        combinedWidthClassName="tw-w-20"
        roundedClassName="tw-rounded-full"
        onScrollToUnread={onScrollToUnread}
        onDismissUnread={onDismissUnread}
      />
    );

    const unreadButton = screen.getByRole("button", {
      name: "Scroll to first unread message",
    });
    expect(unreadButton).toHaveClass(
      "tw-opacity-50",
      "desktop-hover:hover:tw-opacity-100",
      "touch-only:tw-opacity-100"
    );
    expect(unreadButton).not.toHaveClass("hover:tw-opacity-100");

    const dismissButton = screen.getByRole("button", { name: "Dismiss" });
    expect(dismissButton).toHaveClass(
      "tw-opacity-0",
      "desktop-hover:group-hover:tw-opacity-50",
      "touch-only:tw-opacity-100"
    );

    await user.click(unreadButton);
    expect(onScrollToUnread).toHaveBeenCalledWith(42);

    await user.click(dismissButton);
    expect(onDismissUnread).toHaveBeenCalledTimes(1);
  });
});
