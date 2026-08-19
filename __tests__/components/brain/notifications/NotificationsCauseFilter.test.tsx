import { AuthContext } from "@/components/auth/Auth";
import NotificationsCauseFilter from "@/components/brain/notifications/NotificationsCauseFilter";
import { ApiNotificationCause } from "@/generated/models/ApiNotificationCause";
import { usePrefetchNotifications } from "@/hooks/useNotificationsQuery";
import type { ReactNode } from "react";
import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { NotificationFilter } from "@/components/brain/notifications/NotificationsCauseFilter";

jest.mock("@/hooks/useNotificationsQuery");
jest.mock("@/components/header/ProfilePreferencesSettings", () => ({
  __esModule: true,
  default: ({ isOpen }: { readonly isOpen: boolean }) =>
    isOpen ? (
      <div role="dialog" aria-label="Profile Preferences modal" />
    ) : null,
}));

const prefetch = jest.fn();
const connectedProfile = { handle: "tester" } as any;

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

  it("opens Profile Preferences from the notification heading", async () => {
    const user = userEvent.setup();
    render(<FilterHarness />, { wrapper: Wrapper });

    expect(
      screen.getByRole("heading", { name: "Notifications" })
    ).toBeInTheDocument();
    const preferencesButton = screen.getByRole("button", {
      name: "Profile Preferences",
    });
    expect(preferencesButton).toHaveClass(
      "tw-border",
      "tw-border-iron-800",
      "tw-bg-iron-950"
    );
    await user.click(preferencesButton);

    expect(
      screen.getByRole("dialog", { name: "Profile Preferences modal" })
    ).toBeInTheDocument();
  });
});
