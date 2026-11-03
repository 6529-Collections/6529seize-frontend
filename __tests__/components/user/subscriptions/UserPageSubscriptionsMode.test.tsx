import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithAuth } from "@/__tests__/utils/testContexts";
import UserPageSubscriptionsMode from "@/components/user/subscriptions/UserPageSubscriptionsMode";
import { commonApiPost } from "@/services/api/common-api";

jest.mock("@/services/api/common-api", () => ({ commonApiPost: jest.fn() }));
const post = jest.mocked(commonApiPost);
const details = {
  automatic: false,
  consolidation_key: "p1",
  last_update: 0,
  balance: 0,
  subscribe_all_editions: false,
  subscription_eligibility_count: 1,
};

function setup({ readonly = false, loading = false, automatic = false } = {}) {
  const requestAuth = jest.fn().mockResolvedValue({ success: true });
  const setToast = jest.fn();
  const refresh = jest.fn();
  renderWithAuth(
    <UserPageSubscriptionsMode
      profileKey="p1"
      details={loading ? undefined : { ...details, automatic }}
      readonly={readonly}
      refresh={refresh}
    />,
    { requestAuth, setToast }
  );
  return { requestAuth, setToast, refresh, user: userEvent.setup() };
}

describe("UserPageSubscriptionsMode", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    post.mockResolvedValue({ automatic: true });
  });

  it("shows the original UTC timestamp with the inline Mode value", () => {
    renderWithAuth(
      <UserPageSubscriptionsMode
        profileKey="p1"
        layout="inline"
        details={{
          ...details,
          automatic: true,
          last_update: Date.parse("2026-02-20T23:01:00Z"),
        }}
        readonly
        refresh={jest.fn()}
      />
    );
    const mode = screen.getByRole("button", { name: "Mode Automatic" });
    expect(mode).toHaveAccessibleDescription("Feb 20, 2026, 23:01 UTC");
    expect(screen.getByText("Feb 20, 2026, 23:01 UTC")).toBeVisible();
    expect(screen.queryByText(/since/)).not.toBeInTheDocument();
  });

  it("shows the original choices and descriptions without resubmitting the saved choice", async () => {
    const { user, requestAuth } = setup();
    await user.click(screen.getByRole("button", { name: /^Mode Manual/ }));
    expect(screen.getByRole("option", { name: "Manual" })).toHaveAttribute(
      "aria-selected",
      "true"
    );
    expect(
      screen.getByRole("option", { name: "Manual" })
    ).toHaveAccessibleDescription("You have to opt-in to each specific drop");
    expect(
      screen.getByRole("option", { name: "Automatic" })
    ).toHaveAccessibleDescription(
      "Automatic airdrops of all eligible drops unless you opt-out"
    );
    await user.click(screen.getByRole("option", { name: "Manual" }));
    expect(requestAuth).not.toHaveBeenCalled();
    expect(post).not.toHaveBeenCalled();
  });

  it("commits the keyboard choice only on Enter through the existing authenticated API", async () => {
    const { user, refresh } = setup();
    await user.tab();
    expect(screen.getByRole("button", { name: /^Mode Manual/ })).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(screen.getByRole("listbox")).toBeVisible();
    await user.keyboard("{ArrowDown}");
    expect(post).not.toHaveBeenCalled();
    await user.keyboard("{Enter}");
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /^Mode Automatic/ })
      ).toBeEnabled()
    );
    expect(post).toHaveBeenCalledWith({
      endpoint: "subscriptions/p1/subscription-mode",
      body: { automatic: true },
    });
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("dismisses with Escape and restores focus without changing mode", async () => {
    const { user } = setup();
    const trigger = screen.getByRole("button", { name: /^Mode Manual/ });
    await user.click(trigger);
    await user.keyboard("{ArrowDown}{Escape}");
    await waitFor(() => expect(trigger).toHaveFocus());
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(post).not.toHaveBeenCalled();
  });

  it("can reopen with Enter after opening with the mouse", async () => {
    const { user } = setup();
    const trigger = screen.getByRole("button", { name: /^Mode Manual/ });
    await user.click(trigger);
    await user.keyboard("{Escape}");
    await waitFor(() => expect(trigger).toHaveFocus());
    await user.keyboard("{Enter}");
    expect(screen.getByRole("listbox")).toBeVisible();
    expect(screen.getByRole("option", { name: "Manual" })).toHaveAttribute(
      "aria-selected",
      "true"
    );
    expect(post).not.toHaveBeenCalled();
  });

  it("switches Automatic back to Manual using the original false value", async () => {
    const { user, refresh, requestAuth } = setup({ automatic: true });
    post.mockResolvedValue({ automatic: false });
    await user.click(screen.getByRole("button", { name: /^Mode Automatic/ }));
    await user.click(screen.getByRole("option", { name: "Manual" }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /^Mode Manual/ })).toBeEnabled()
    );
    expect(requestAuth).toHaveBeenCalledTimes(1);
    expect(post).toHaveBeenCalledTimes(1);
    expect(post).toHaveBeenCalledWith({
      endpoint: "subscriptions/p1/subscription-mode",
      body: { automatic: false },
    });
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("prevents another update while authentication is pending", async () => {
    const { user, requestAuth, refresh } = setup();
    let finishAuth!: (result: { success: boolean }) => void;
    requestAuth.mockReturnValue(
      new Promise<{ success: boolean }>((resolve) => {
        finishAuth = resolve;
      })
    );
    const trigger = screen.getByRole("button", { name: /^Mode Manual/ });
    await user.click(trigger);
    await user.click(screen.getByRole("option", { name: "Automatic" }));
    expect(trigger).toBeDisabled();
    await user.click(trigger);
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(requestAuth).toHaveBeenCalledTimes(1);
    expect(post).not.toHaveBeenCalled();
    finishAuth({ success: true });
    await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
    expect(post).toHaveBeenCalledTimes(1);
  });

  it("keeps the saved choice if authentication is rejected", async () => {
    const { user, requestAuth } = setup();
    requestAuth.mockResolvedValue({ success: false });
    await user.click(screen.getByRole("button", { name: /^Mode Manual/ }));
    await user.click(screen.getByRole("option", { name: "Automatic" }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /^Mode Manual/ })).toBeEnabled()
    );
    expect(post).not.toHaveBeenCalled();
  });

  it("keeps the saved choice and reports an API failure", async () => {
    const { user, setToast, refresh } = setup();
    post.mockRejectedValue(new Error("Unavailable"));
    await user.click(screen.getByRole("button", { name: /^Mode Manual/ }));
    await user.click(screen.getByRole("option", { name: "Automatic" }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /^Mode Manual/ })).toBeEnabled()
    );
    expect(setToast).toHaveBeenCalledWith(
      expect.objectContaining({ type: "error" })
    );
    expect(refresh).not.toHaveBeenCalled();
  });

  it.each([{ readonly: true }, { loading: true }])(
    "disables editing for %j",
    async (state) => {
      const { user, requestAuth } = setup(state);
      const trigger = screen.getByRole("button", { name: /^Mode/ });
      expect(trigger).toBeDisabled();
      await user.click(trigger);
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
      expect(requestAuth).not.toHaveBeenCalled();
    }
  );
});
