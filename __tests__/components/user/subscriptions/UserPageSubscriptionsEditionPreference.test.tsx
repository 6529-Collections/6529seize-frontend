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
const getEditions = () =>
  screen.getByRole("switch", { name: "All eligible editions" });

describe("Edition Preference", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    post.mockResolvedValue({ subscribe_all_editions: true });
  });

  it.each([false, true])(
    "exposes both labels, eligibility and the original owner explanation for saved allEditions=%s",
    (allEditions) => {
      const { requestAuth } = setup({ allEditions });
      expect(screen.getByText("Eligibility x2")).toBeVisible();
      expect(screen.getByText("One edition", { exact: true })).toBeVisible();
      expect(screen.getByText("All eligible", { exact: true })).toBeVisible();
      if (allEditions) expect(getEditions()).toBeChecked();
      else expect(getEditions()).not.toBeChecked();
      expect(getEditions()).toHaveAccessibleDescription(
        `Eligibility x2 ${allEditions ? "You will receive all editions you are eligible for" : "You will receive only one edition"}`
      );
      expect(requestAuth).not.toHaveBeenCalled();
      expect(post).not.toHaveBeenCalled();
    }
  );

  it("uses native keyboard toggling and the existing authenticated API", async () => {
    const { refresh, user, requestAuth } = setup();
    await user.tab();
    expect(getEditions()).toHaveFocus();
    await user.keyboard(" ");
    await waitFor(() => expect(getEditions()).toBeEnabled());
    expect(getEditions()).toBeChecked();
    expect(requestAuth).toHaveBeenCalledTimes(1);
    expect(post).toHaveBeenCalledWith({
      endpoint: "subscriptions/test-key/subscribe-all-editions",
      body: { subscribe_all_editions: true },
    });
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("switches All eligible back to One edition with the original false payload", async () => {
    const { user, requestAuth, refresh } = setup({ allEditions: true });
    post.mockResolvedValue({ subscribe_all_editions: false });
    await user.click(getEditions());
    await waitFor(() => expect(getEditions()).toBeEnabled());
    expect(getEditions()).not.toBeChecked();
    expect(requestAuth).toHaveBeenCalledTimes(1);
    expect(post).toHaveBeenCalledWith({
      endpoint: "subscriptions/test-key/subscribe-all-editions",
      body: { subscribe_all_editions: false },
    });
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("prevents duplicate changes while authentication is pending", async () => {
    const { user, requestAuth, refresh } = setup();
    let finishAuth!: (result: { success: boolean }) => void;
    requestAuth.mockReturnValue(
      new Promise<{ success: boolean }>((resolve) => {
        finishAuth = resolve;
      })
    );
    await user.click(getEditions());
    expect(getEditions()).toBeDisabled();
    expect(getEditions()).not.toBeChecked();
    await user.click(getEditions());
    expect(requestAuth).toHaveBeenCalledTimes(1);
    expect(post).not.toHaveBeenCalled();
    finishAuth({ success: true });
    await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
    expect(post).toHaveBeenCalledTimes(1);
  });

  it("keeps the saved preference if authentication is rejected", async () => {
    const { requestAuth, user, refresh } = setup();
    requestAuth.mockResolvedValue({ success: false });
    await user.click(getEditions());
    await waitFor(() => expect(getEditions()).toBeEnabled());
    expect(getEditions()).not.toBeChecked();
    expect(post).not.toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();
  });

  it("retains the saved preference and reports a failed update", async () => {
    const { user, setToast, refresh } = setup();
    post.mockRejectedValue(new Error("Unavailable"));
    await user.click(getEditions());
    await waitFor(() => expect(getEditions()).toBeEnabled());
    expect(getEditions()).not.toBeChecked();
    expect(setToast).toHaveBeenCalledWith(
      expect.objectContaining({ type: "error" })
    );
    expect(refresh).not.toHaveBeenCalled();
  });

  it("uses the saved preference returned by the API", async () => {
    const { user, refresh } = setup();
    post.mockResolvedValue({ subscribe_all_editions: false });
    await user.click(getEditions());
    await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
    expect(getEditions()).not.toBeChecked();
  });

  it("keeps visitors read-only and explanations owner-only", async () => {
    const { requestAuth, user } = setup({ readonly: true });
    expect(getEditions()).toBeDisabled();
    await user.click(getEditions());
    expect(requestAuth).not.toHaveBeenCalled();
    expect(post).not.toHaveBeenCalled();
    expect(screen.queryByText(/You will receive/)).not.toBeInTheDocument();
    expect(screen.getByText("One edition", { exact: true })).toBeVisible();
    expect(screen.getByText("All eligible", { exact: true })).toBeVisible();
  });

  it("waits for saved settings before allowing updates", () => {
    setup({ loading: true });
    expect(getEditions()).toBeDisabled();
    expect(screen.getByText("Loading settings")).toBeVisible();
    expect(post).not.toHaveBeenCalled();
  });
});
