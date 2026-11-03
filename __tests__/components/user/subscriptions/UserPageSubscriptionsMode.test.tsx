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

const getMode = () =>
  screen.getByRole("switch", { name: "Automatic subscription mode" });

describe("UserPageSubscriptionsMode", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    post.mockResolvedValue({ automatic: true });
  });

  it("keeps the original UTC timestamp with the Mode toggle", () => {
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
    expect(getMode()).toBeChecked();
    expect(getMode()).toBeDisabled();
    expect(getMode()).toHaveAccessibleDescription("Feb 20, 2026, 23:01 UTC");
    expect(screen.getByText("Feb 20, 2026, 23:01 UTC")).toBeVisible();
    expect(screen.queryByText(/since/)).not.toBeInTheDocument();
  });

  it("shows both original labels and a valid Manual value when last_update is zero", () => {
    const { requestAuth } = setup();
    expect(screen.getByText("Manual", { exact: true })).toBeVisible();
    expect(screen.getByText("Automatic", { exact: true })).toBeVisible();
    expect(getMode()).not.toBeChecked();
    expect(getMode()).toBeEnabled();
    expect(screen.queryByText("Loading settings")).not.toBeInTheDocument();
    expect(screen.queryByText(/UTC/)).not.toBeInTheDocument();
    expect(requestAuth).not.toHaveBeenCalled();
    expect(post).not.toHaveBeenCalled();
  });

  it("uses native keyboard toggling and the existing authenticated API", async () => {
    const { user, refresh, requestAuth } = setup();
    await user.tab();
    expect(getMode()).toHaveFocus();
    await user.keyboard(" ");
    await waitFor(() => expect(getMode()).toBeEnabled());
    expect(getMode()).toBeChecked();
    expect(requestAuth).toHaveBeenCalledTimes(1);
    expect(post).toHaveBeenCalledWith({
      endpoint: "subscriptions/p1/subscription-mode",
      body: { automatic: true },
    });
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("keeps the owner's original explanation associated with the toggle at its Upcoming Drops location", () => {
    renderWithAuth(
      <>
        <UserPageSubscriptionsMode
          profileKey="p1"
          details={details}
          readonly={false}
          refresh={jest.fn()}
        />
        <span id="profile-subscriptions-upcoming-description">
          You have to opt-in to each specific drop
        </span>
      </>
    );
    expect(getMode()).toHaveAccessibleDescription(
      "You have to opt-in to each specific drop"
    );
    expect(
      screen.getAllByText("You have to opt-in to each specific drop")
    ).toHaveLength(1);
  });

  it("switches Automatic back to Manual using the original false value", async () => {
    const { user, refresh, requestAuth } = setup({ automatic: true });
    post.mockResolvedValue({ automatic: false });
    await user.click(getMode());
    await waitFor(() => expect(getMode()).toBeEnabled());
    expect(getMode()).not.toBeChecked();
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
    await user.click(getMode());
    expect(getMode()).toBeDisabled();
    expect(getMode()).not.toBeChecked();
    await user.click(getMode());
    expect(requestAuth).toHaveBeenCalledTimes(1);
    expect(post).not.toHaveBeenCalled();
    finishAuth({ success: true });
    await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
    expect(post).toHaveBeenCalledTimes(1);
  });

  it("keeps the saved value when authentication is rejected", async () => {
    const { user, requestAuth, refresh } = setup();
    requestAuth.mockResolvedValue({ success: false });
    await user.click(getMode());
    await waitFor(() => expect(getMode()).toBeEnabled());
    expect(getMode()).not.toBeChecked();
    expect(post).not.toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();
  });

  it.each(["authentication", "API"])(
    "retains the saved value and reports a failed %s update",
    async (failure) => {
      const { user, requestAuth, setToast, refresh } = setup();
      if (failure === "authentication")
        requestAuth.mockRejectedValue(new Error("Unavailable"));
      else post.mockRejectedValue(new Error("Unavailable"));
      await user.click(getMode());
      await waitFor(() => expect(getMode()).toBeEnabled());
      expect(getMode()).not.toBeChecked();
      expect(setToast).toHaveBeenCalledWith(
        expect.objectContaining({ type: "error" })
      );
      expect(refresh).not.toHaveBeenCalled();
    }
  );

  it("uses the saved value returned by the API", async () => {
    const { user, refresh } = setup();
    post.mockResolvedValue({ automatic: false });
    await user.click(getMode());
    await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
    expect(getMode()).not.toBeChecked();
  });

  it.each([{ readonly: true }, { loading: true }])(
    "disables editing for %j",
    async (state) => {
      const { user, requestAuth } = setup(state);
      expect(getMode()).toBeDisabled();
      await user.click(getMode());
      expect(requestAuth).not.toHaveBeenCalled();
      expect(post).not.toHaveBeenCalled();
    }
  );
});
