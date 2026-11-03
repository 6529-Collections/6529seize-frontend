import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithAuth } from "@/__tests__/utils/testContexts";
import EditionPreference from "@/components/user/subscriptions/UserPageSubscriptionsEditionPreference";
import { commonApiPost } from "@/services/api/common-api";

jest.mock("@/services/api/common-api", () => ({ commonApiPost: jest.fn() }));
const post = jest.mocked(commonApiPost);
const details = {
  consolidation_key: "test-key",
  last_update: 0,
  balance: 1,
  automatic: true,
  subscribe_all_editions: false,
  subscription_eligibility_count: 2,
};

function setup({
  readonly = false,
  allEditions = false,
  loading = false,
} = {}) {
  const requestAuth = jest.fn().mockResolvedValue({ success: true });
  const refresh = jest.fn();
  const setToast = jest.fn();
  renderWithAuth(
    <EditionPreference
      profileKey="test-key"
      details={
        loading
          ? undefined
          : { ...details, subscribe_all_editions: allEditions }
      }
      readonly={readonly}
      refresh={refresh}
    />,
    { requestAuth, setToast }
  );
  return { requestAuth, refresh, setToast, user: userEvent.setup() };
}

describe("Edition Preference", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    post.mockResolvedValue({ subscribe_all_editions: true });
  });
  it("exposes the saved selection and eligibility without resubmitting it", async () => {
    const { requestAuth, user } = setup();
    expect(screen.getByText("Eligibility x2")).toBeVisible();
    await user.click(
      screen.getByRole("button", { name: /^Edition Preference/ })
    );
    expect(screen.getByRole("option", { name: "One edition" })).toHaveAttribute(
      "aria-selected",
      "true"
    );
    expect(
      screen.getByRole("option", { name: "One edition" })
    ).toHaveAccessibleDescription("You will receive only one edition");
    expect(
      screen.getByRole("option", { name: "All eligible" })
    ).toHaveAccessibleDescription(
      "You will receive all editions you are eligible for"
    );
    await user.click(screen.getByRole("option", { name: "One edition" }));
    expect(requestAuth).not.toHaveBeenCalled();
    expect(post).not.toHaveBeenCalled();
  });
  it("uses keyboard arrow selection and the existing authenticated API", async () => {
    const { refresh, user } = setup();
    await user.click(
      screen.getByRole("button", { name: /^Edition Preference/ })
    );
    await user.keyboard("{ArrowDown}{Enter}");
    await waitFor(() =>
      expect(
        screen.getByRole("button", {
          name: /^Edition Preference.*All eligible/,
        })
      ).toBeEnabled()
    );
    expect(post).toHaveBeenCalledWith({
      endpoint: "subscriptions/test-key/subscribe-all-editions",
      body: { subscribe_all_editions: true },
    });
    expect(refresh).toHaveBeenCalledTimes(1);
  });
  it("keeps the saved choice if authentication is rejected", async () => {
    const { requestAuth, user } = setup();
    requestAuth.mockResolvedValue({ success: false });
    await user.click(
      screen.getByRole("button", { name: /^Edition Preference/ })
    );
    await user.click(screen.getByRole("option", { name: "All eligible" }));
    expect(post).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: /^Edition Preference.*One edition/ })
    ).toBeEnabled();
  });
  it("switches All eligible back to One edition using the original false value", async () => {
    const { user, requestAuth, refresh } = setup({ allEditions: true });
    post.mockResolvedValue({ subscribe_all_editions: false });
    await user.click(
      screen.getByRole("button", { name: /^Edition Preference/ })
    );
    await user.click(screen.getByRole("option", { name: "One edition" }));
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /^Edition Preference.*One edition/ })
      ).toBeEnabled()
    );
    expect(requestAuth).toHaveBeenCalledTimes(1);
    expect(post).toHaveBeenCalledTimes(1);
    expect(post).toHaveBeenCalledWith({
      endpoint: "subscriptions/test-key/subscribe-all-editions",
      body: { subscribe_all_editions: false },
    });
    expect(refresh).toHaveBeenCalledTimes(1);
  });
  it("retains the saved edition preference and reports a failed update", async () => {
    const { user, setToast, refresh } = setup();
    post.mockRejectedValue(new Error("Unavailable"));
    await user.click(
      screen.getByRole("button", { name: /^Edition Preference/ })
    );
    await user.click(screen.getByRole("option", { name: "All eligible" }));
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /^Edition Preference.*One edition/ })
      ).toBeEnabled()
    );
    expect(setToast).toHaveBeenCalledWith(
      expect.objectContaining({ type: "error" })
    );
    expect(refresh).not.toHaveBeenCalled();
  });
  it("keeps visitors read-only", async () => {
    const { requestAuth, user } = setup({ readonly: true });
    const trigger = screen.getByRole("button", { name: /^Edition Preference/ });
    expect(trigger).toBeDisabled();
    await user.click(trigger);
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(requestAuth).not.toHaveBeenCalled();
    expect(post).not.toHaveBeenCalled();
  });
  it("waits for saved settings before allowing an update", () => {
    setup({ loading: true });
    expect(
      screen.getByRole("button", { name: /^Edition Preference/ })
    ).toBeDisabled();
    expect(post).not.toHaveBeenCalled();
  });
});
