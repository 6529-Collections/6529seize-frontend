import { AuthContext } from "@/components/auth/Auth";
import NotificationsCauseFilter from "@/components/brain/notifications/NotificationsCauseFilter";
import { ApiNotificationCause } from "@/generated/models/ApiNotificationCause";
import useIsMobileLayoutViewport from "@/hooks/useIsMobileLayoutViewport";
import { usePrefetchNotifications } from "@/hooks/useNotificationsQuery";
import type { ReactNode } from "react";
import { useState } from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { NotificationFilter } from "@/components/brain/notifications/NotificationsCauseFilter";

jest.mock("@/hooks/useNotificationsQuery");
jest.mock("@/hooks/useIsMobileLayoutViewport");

const prefetch = jest.fn();
const connectedProfile = { handle: "tester" } as any;
const mockedUseIsMobileLayoutViewport = jest.mocked(useIsMobileLayoutViewport);

function Wrapper({ children }: { readonly children: ReactNode }) {
  return (
    <AuthContext.Provider value={{ connectedProfile } as any}>
      {children}
    </AuthContext.Provider>
  );
}

function FilterHarness({
  onChange = () => undefined,
}: {
  readonly onChange?: (filter: NotificationFilter | null) => void;
}) {
  const [activeFilter, setActiveFilter] = useState<NotificationFilter | null>(
    null
  );
  return (
    <NotificationsCauseFilter
      activeFilter={activeFilter}
      setActiveFilter={(filter) => {
        setActiveFilter(filter);
        onChange(filter);
      }}
    />
  );
}

describe("NotificationsCauseFilter", () => {
  beforeEach(() => {
    (usePrefetchNotifications as jest.Mock).mockReturnValue(prefetch);
    prefetch.mockClear();
    mockedUseIsMobileLayoutViewport.mockReturnValue(false);
  });

  it("combines multiple selected categories and resets them with All", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<FilterHarness onChange={onChange} />, { wrapper: Wrapper });

    await user.click(
      screen.getByRole("button", { name: "Filter notifications: All" })
    );
    await user.click(
      screen.getByRole("menuitemcheckbox", { name: "Mentions" })
    );
    expect(
      screen.getByRole("button", { name: "Filter notifications: Mentions" })
    ).toBeInTheDocument();

    await user.click(screen.getByRole("menuitemcheckbox", { name: "Replies" }));
    expect(
      screen.getByRole("button", {
        name: "Filter notifications: 2 selected",
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("menuitemcheckbox", { name: "Mentions" })
    ).toHaveAttribute("aria-checked", "true");
    expect(
      screen.getByRole("menuitemcheckbox", { name: "Replies" })
    ).toHaveAttribute("aria-checked", "true");
    expect(onChange).toHaveBeenLastCalledWith({
      title: "2 selected",
      cause: [
        ApiNotificationCause.IdentityMentioned,
        ApiNotificationCause.DropQuoted,
        ApiNotificationCause.DropReplied,
      ],
    });

    await user.click(screen.getByRole("menuitemcheckbox", { name: "All" }));
    expect(
      screen.getByRole("button", { name: "Filter notifications: All" })
    ).toBeInTheDocument();
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it("prefetches a category on hover", async () => {
    const user = userEvent.setup();
    render(<FilterHarness />, { wrapper: Wrapper });

    await user.click(
      screen.getByRole("button", { name: "Filter notifications: All" })
    );
    await user.hover(
      screen.getByRole("menuitemcheckbox", { name: "Subscriptions" })
    );

    expect(prefetch).toHaveBeenCalledWith({
      identity: "tester",
      cause: [ApiNotificationCause.SubscriptionCoverage],
      pages: 1,
    });
  });

  it("renders the wider type dropdown without a preferences action", () => {
    render(<FilterHarness />, { wrapper: Wrapper });

    expect(
      screen.getByRole("heading", { name: "Notifications" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Filter notifications: All" })
        .parentElement
    ).toHaveClass("tw-w-36", "sm:tw-w-56");
    expect(
      screen.queryByRole("button", { name: "Profile Preferences" })
    ).not.toBeInTheDocument();
  });

  it("keeps mobile multi-selection open and restores focus after dismissal", async () => {
    mockedUseIsMobileLayoutViewport.mockReturnValue(true);
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<FilterHarness onChange={onChange} />, { wrapper: Wrapper });

    const trigger = screen.getByRole("button", {
      name: "Filter notifications: All",
    });
    expect(trigger).toHaveAttribute("aria-haspopup", "dialog");

    await user.click(trigger);

    const dialog = screen.getByRole("dialog", {
      name: "Filter notifications",
    });
    expect(
      within(dialog).getByRole("group", { name: "Filter notifications" })
    ).toBeInTheDocument();
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();

    await user.click(
      within(dialog).getByRole("checkbox", { name: "Mentions" })
    );
    expect(dialog).toBeInTheDocument();
    expect(trigger).toHaveAccessibleName("Filter notifications: Mentions");

    await user.click(
      within(dialog).getByRole("checkbox", { name: "Reactions" })
    );
    expect(dialog).toBeInTheDocument();
    expect(trigger).toHaveAccessibleName("Filter notifications: 2 selected");
    expect(
      within(dialog).getByRole("checkbox", { name: "Mentions" })
    ).toBeChecked();
    expect(
      within(dialog).getByRole("checkbox", { name: "Reactions" })
    ).toBeChecked();

    await user.click(within(dialog).getByRole("button", { name: "Close" }));
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    expect(trigger).toHaveFocus();

    await user.click(trigger);
    const reopenedDialog = screen.getByRole("dialog", {
      name: "Filter notifications",
    });
    expect(
      within(reopenedDialog).getByRole("checkbox", { name: "Mentions" })
    ).toBeChecked();

    await user.click(
      within(reopenedDialog).getByRole("checkbox", { name: /^All/ })
    );
    expect(reopenedDialog).toBeInTheDocument();
    expect(trigger).toHaveAccessibleName("Filter notifications: All");
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it("closes the active presentation when crossing the layout boundary", async () => {
    mockedUseIsMobileLayoutViewport.mockReturnValue(true);
    const user = userEvent.setup();
    const { rerender } = render(<FilterHarness />, { wrapper: Wrapper });

    const trigger = screen.getByRole("button", {
      name: "Filter notifications: All",
    });
    await user.click(trigger);
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    mockedUseIsMobileLayoutViewport.mockReturnValue(false);
    rerender(<FilterHarness />);

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveAttribute("aria-haspopup", "menu");
    expect(trigger).toHaveFocus();
  });
});
